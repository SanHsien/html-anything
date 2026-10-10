import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";

type SeedOptions = {
  html: string;
  content?: string;
  locale?: "en" | "zh-CN";
};

const STORE_KEY = "html-everything-store";

const plainHtml = `<!doctype html>
<html>
  <head><title>Plain Export</title></head>
  <body><main><h1>Plain Export</h1><p>No video frames here.</p></main></body>
</html>`;

const hyperframesHtml = `<!doctype html>
<html>
  <head>
    <title>Sample Reel</title>
    <style>body { margin: 0; background: #101827; color: white; }</style>
  </head>
  <body class="deck-shell" style="font-family: Inter, sans-serif;">
    <section class="frame active" data-duration="2000" data-transition="fade">
      <h1>Opening Frame</h1>
      <!-- frame:1 duration:2000 transition:fade -->
    </section>
    <section class="frame" data-duration="3000" data-transition="cut">
      <h1>Closing Frame</h1>
      <!-- frame:2 duration:3000 transition:cut -->
    </section>
    <!-- HYPERFRAMES_META: {"frames":[{"i":1,"duration":2000,"transition":"fade","scene":"Opening"},{"i":2,"duration":3000,"transition":"cut","scene":"Closing"}]} -->
  </body>
</html>`;

async function seedStore(page: Page, opts: SeedOptions) {
  const now = 1_700_000_000_000;
  const task = {
    id: "task_export_ui",
    name: "Export UI fixture",
    content: opts.content ?? "Export UI fixture",
    format: "html",
    templateId: "video-hyperframes",
    html: opts.html,
    status: "done",
    log: [],
    stats: { outputBytes: opts.html.length, deltaCount: 1 },
    createdAt: now,
    updatedAt: now,
  };

  await page.addInitScript(
    ({ key, taskFixture, locale }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            tasks: [taskFixture],
            activeTaskId: taskFixture.id,
            selectedAgent: "test-agent",
            agentModels: {},
            welcomeAck: true,
            sidebarCollapsed: false,
            locale,
            layoutMode: "split",
          },
          version: 5,
        }),
      );
    },
    {
      key: STORE_KEY,
      taskFixture: task,
      locale: opts.locale ?? "en",
    },
  );
}

test.describe("Export menu", () => {
  test("rejects oversized PNG without a partial download or success toast", async ({ page }) => {
    await seedStore(page, {
      html: '<!doctype html><html><body style="margin:0"><main style="height:8100px">PNG-160-smoke<span style="display:block;position:absolute;top:8050px">PNG-160-tail</span></main></body></html>',
      content: "PNG-160-smoke",
    });
    await page.goto("/");
    const preview = page.frameLocator('iframe[title="preview"]');
    await expect(preview.getByText("PNG-160-tail")).toBeAttached();
    const downloads: string[] = [];
    page.on("download", download => downloads.push(download.suggestedFilename()));
    await page.getByRole("button", { name: /export/i }).click();
    await page.getByTestId("export-menu").getByRole("button", { name: /\.png hi-res image/ }).click();
    await expect(page.getByText(/Image is too large for a complete PNG/)).toBeVisible();
    await expect(page.getByText(/Image downloaded/)).toHaveCount(0);
    expect(downloads).toEqual([]);
    await expect(page.getByRole("button", { name: /export/i })).toBeEnabled();

    // Reuse the same fixture to prove a complete, safe-sized PNG includes its tail.
    await preview.locator("main").evaluate(main => {
      main.style.height = "1000px";
      const tail = main.querySelector("span")!;
      tail.style.cssText = "display:block;position:absolute;top:990px;height:10px;width:100%;background:rgb(255,0,0)";
    });
    const expectedImage = await preview.locator("body").evaluate(body => {
      const doc = body.ownerDocument;
      const tail = body.querySelector("span")!.getBoundingClientRect();
      return {
        height: Math.max(body.scrollHeight, (body as HTMLElement).offsetHeight, doc.documentElement.scrollHeight, doc.documentElement.offsetHeight, doc.documentElement.clientHeight) * 2,
        tailY: Math.floor((tail.top + tail.height / 2) * 2),
      };
    });
    await page.getByRole("button", { name: /export/i }).click();
    const downloaded = page.waitForEvent("download");
    await page.getByTestId("export-menu").getByRole("button", { name: /\.png hi-res image/ }).click();
    const download = await downloaded;
    const png = await readFile((await download.path())!);
    expect(png.readUInt32BE(20)).toBe(expectedImage.height);
    const tailPixel = await page.evaluate(async ({ base64, tailY }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 1, tailY, 1, 1, 0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }, { base64: png.toString("base64"), tailY: expectedImage.tailY });
    expect(tailPixel).toEqual([255, 0, 0, 255]);
  });

  test("keeps Remotion hidden for regular HTML exports", async ({ page }) => {
    await seedStore(page, { html: plainHtml });

    await page.goto("/");
    const exportButton = page.getByRole("button", { name: /export/i });
    await expect(exportButton).toBeEnabled();

    await exportButton.click();
    const menu = page.getByTestId("export-menu");

    await expect(menu.getByText("Copy to platform")).toBeVisible();
    await expect(menu.getByRole("button", { name: /HTML source/ })).toBeVisible();
    await expect(menu.getByRole("button", { name: /\.html single file/ })).toBeVisible();
    await expect(menu.getByText(/Hyperframes/)).toHaveCount(0);
    await expect(menu.getByRole("button", { name: /Remotion project/ })).toHaveCount(0);
  });

  test("exports a Hyperframes Remotion project zip from the UI", async ({ page }) => {
    await seedStore(page, { html: hyperframesHtml });

    await page.goto("/");
    await page.getByRole("button", { name: /export/i }).click();
    const menu = page.getByTestId("export-menu");

    await expect(menu.getByText("Hyperframes · 2 frames")).toBeVisible();
    const remotionButton = menu.getByRole("button", { name: /Remotion project \(\.zip\)/ });
    await expect(remotionButton).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await remotionButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^sample-reel-remotion-\d+\.zip$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const zip = await JSZip.loadAsync(await readFile(downloadPath!));

    expect(Object.keys(zip.files).sort()).toEqual(
      expect.arrayContaining([
        "README.md",
        "hyperframes.html",
        "hyperframes.meta.json",
        "package.json",
        "public/frames/frame-01.html",
        "public/frames/frame-02.html",
        "remotion.config.ts",
        "src/Frame.tsx",
        "src/Root.tsx",
        "src/Video.tsx",
        "src/index.ts",
        "tsconfig.json",
      ]),
    );

    const rootTsx = await zip.file("src/Root.tsx")!.async("string");
    const videoTsx = await zip.file("src/Video.tsx")!.async("string");
    const frameTsx = await zip.file("src/Frame.tsx")!.async("string");
    const frameOne = await zip.file("public/frames/frame-01.html")!.async("string");
    const readme = await zip.file("README.md")!.async("string");

    expect(rootTsx).toContain("durationInFrames={138}");
    expect(frameTsx).toContain('staticFile(src)');
    expect(videoTsx).toContain("TransitionSeries.Transition");
    expect(videoTsx).toContain("presentation={fade()}");
    expect(videoTsx).toContain('durationInFrames: 60, transition: "fade", scene: "Opening"');
    expect(videoTsx).toContain('durationInFrames: 90, transition: "cut", scene: "Closing"');
    expect(frameOne).toContain('<section class="frame active" data-duration="2000">');
    expect(frameOne).toContain("Opening Frame");
    expect(readme).toContain("2 frames");
    expect(readme).toContain("Cross-fades use");

    await expect(page.getByText(/Remotion project zipped/)).toBeVisible();
  });

  test("shows the Hyperframes export affordance in Chinese locale", async ({ page }) => {
    await seedStore(page, { html: hyperframesHtml, locale: "zh-CN" });

    await page.goto("/");
    await page.getByRole("button", { name: /导出/ }).click();
    const menu = page.getByTestId("export-menu");

    await expect(menu.getByText("Hyperframes · 共 2 帧")).toBeVisible();
    await expect(menu.getByRole("button", { name: /Remotion 项目 \(\.zip\)/ })).toBeVisible();
  });
});
