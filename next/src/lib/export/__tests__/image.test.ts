import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadIframeAsImage, iframeToBlob, nodeToBlob } from "../image";

const { render, ready } = vi.hoisted(() => ({ render: vi.fn(), ready: vi.fn() }));
vi.mock("modern-screenshot", () => ({ domToBlob: render, waitUntilLoad: ready }));

function fixture(height = 300, width = 600) {
  const doc = document.implementation.createHTMLDocument("image regression");
  doc.body.innerHTML = '<main>short page<span id="tail">tail marker</span></main>';
  Object.defineProperty(doc, "readyState", { value: "complete" });
  Object.defineProperty(doc, "images", { value: [] });
  for (const element of [doc.body, doc.documentElement]) {
    Object.defineProperty(element, "scrollHeight", { value: height });
  }
  Object.defineProperty(doc.documentElement, "clientWidth", { value: width });
  const iframe = document.createElement("iframe");
  Object.defineProperty(iframe, "contentDocument", { value: doc });
  Object.defineProperty(iframe, "contentWindow", { value: window });
  iframe.style.height = "123px";
  doc.documentElement.style.overflow = "hidden";
  doc.body.style.overflow = "auto";
  return { iframe, doc };
}

async function settle<T>(promise: Promise<T>): Promise<T> {
  // Attach the rejection handler before advancing timers.
  const outcome = promise.then(value => ({ value }), error => ({ error }));
  await vi.runAllTimersAsync();
  const result = await outcome;
  if ("error" in result) throw result.error;
  return result.value;
}

function expectRestored({ iframe, doc }: ReturnType<typeof fixture>) {
  expect(iframe.style.height).toBe("123px");
  expect(doc.documentElement.style.overflow).toBe("hidden");
  expect(doc.body.style.overflow).toBe("auto");
}

beforeEach(() => {
  vi.useFakeTimers();
  render.mockReset().mockResolvedValue(new Blob(["complete image"]));
  ready.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("iframe image capture", () => {
  it.each([300, 8000])("captures the complete %i CSS-pixel page at the original scale", async height => {
    const page = fixture(height);
    await settle(iframeToBlob(page.iframe));
    expect(render).toHaveBeenCalledWith(page.doc.documentElement, expect.objectContaining({ height, scale: 2, width: 600 }));
    expect(page.doc.querySelector("#tail")?.textContent).toBe("tail marker");
    expectRestored(page);
  });

  it("rejects an oversized page without rendering or downloading a partial image", async () => {
    const page = fixture(8001);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click");
    await expect(settle(downloadIframeAsImage(page.iframe))).rejects.toThrow(/too large.*split|too large.*shorter/i);
    expect(render).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expectRestored(page);
  });

  it("honors a smaller explicit capture limit without cropping", async () => {
    const page = fixture(501);
    await expect(settle(iframeToBlob(page.iframe, { maxHeight: 500 }))).rejects.toThrow(/too large/i);
    expect(render).not.toHaveBeenCalled();
    expectRestored(page);
  });

  it("does not allow maxHeight to bypass the single-image safety limit", async () => {
    const page = fixture(8001);
    await expect(settle(iframeToBlob(page.iframe, { maxHeight: 20000 }))).rejects.toThrow(/too large/i);
    expectRestored(page);
  });

  it("rejects a page wider than the scaled image limit", async () => {
    const page = fixture(300, 8001);
    await expect(settle(iframeToBlob(page.iframe))).rejects.toThrow(/too large/i);
    expect(render).not.toHaveBeenCalled();
    expectRestored(page);
  });

  it("restores styles when the renderer rejects", async () => {
    const page = fixture();
    render.mockRejectedValue(new Error("renderer failed"));
    await expect(settle(iframeToBlob(page.iframe))).rejects.toThrow("renderer failed");
    expectRestored(page);
  });

  it("restores styles when reflow scheduling throws after resizing", async () => {
    const page = fixture();
    let calls = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      if (++calls === 5) throw new Error("reflow failed");
      callback(0);
      return 1;
    });
    await expect(settle(iframeToBlob(page.iframe))).rejects.toThrow("reflow failed");
    expectRestored(page);
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid scale %s before capture", async scale => {
    const page = fixture();
    await expect(settle(iframeToBlob(page.iframe, { scale }))).rejects.toThrow(/scale.*positive.*finite/i);
    expect(render).not.toHaveBeenCalled();
    expectRestored(page);
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid maxHeight %s before capture", async maxHeight => {
    const page = fixture();
    await expect(settle(iframeToBlob(page.iframe, { maxHeight }))).rejects.toThrow(/maxHeight.*positive.*finite/i);
    expect(render).not.toHaveBeenCalled();
    expectRestored(page);
  });

  it("validates standalone node scale too", async () => {
    await expect(nodeToBlob(document.createElement("div"), { scale: 0 })).rejects.toThrow(/scale.*positive.*finite/i);
    expect(render).not.toHaveBeenCalled();
  });
});
