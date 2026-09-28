import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isCodeloadHost, isGitHubReposApi } from "./github-request";
import { buildGzipUstar } from "./ustar";
import { installFromGitHub } from "../install";
import { listPackages } from "../registry";

/**
 * Verify the in-process tarball preflight rejects entries that a downstream
 * `tar -xzf` would happily extract — symlinks/hardlinks targeting parent
 * paths, absolute paths, `..` segments, and decompressed-size blow-ups.
 *
 * These cases can't be built with the system `tar -czf` because it normalises
 * away most of the dangerous shapes, so we hand-roll the tar archive bytes
 * (POSIX ustar 512-byte header format) and gzip them.
 */

function fakeFetchWithTarball(tarball: Buffer): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    if (isGitHubReposApi(input)) {
      return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
    }
    if (isCodeloadHost(input)) {
      return new Response(new Uint8Array(tarball), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-preflight-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
});

afterEach(async () => {
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("tarball preflight", () => {
  it("rejects hardlink entries (typeFlag 1) — the system tar would otherwise resolve the link target", async () => {
    const tar = buildGzipUstar([
      { name: "wrapper/", size: 0, typeFlag: "5" },
      { name: "wrapper/target", size: 4, typeFlag: "0", data: Buffer.from("data") },
      { name: "wrapper/SKILL.md", size: 0, typeFlag: "1", linkName: "wrapper/target" },
    ]);
    await expect(
      installFromGitHub("owner/hardlink", { fetchImpl: fakeFetchWithTarball(tar) }),
    ).rejects.toMatchObject({ code: "forbidden_entry_type" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects entries with absolute paths", async () => {
    const tar = buildGzipUstar([
      { name: "/etc/passwd", size: 4, typeFlag: "0", data: Buffer.from("data") },
    ]);
    await expect(
      installFromGitHub("owner/abs", { fetchImpl: fakeFetchWithTarball(tar) }),
    ).rejects.toMatchObject({ code: "unsafe_path" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects entries containing '..' segments", async () => {
    const tar = buildGzipUstar([
      { name: "wrapper/../escape", size: 4, typeFlag: "0", data: Buffer.from("data") },
    ]);
    await expect(
      installFromGitHub("owner/traversal", { fetchImpl: fakeFetchWithTarball(tar) }),
    ).rejects.toMatchObject({ code: "unsafe_path" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects gzip-bomb tarballs whose decompressed size exceeds the cap", async () => {
    // Highly-compressible: 200 MB of zero bytes gzips to <500 KB but
    // decompression overshoots the 96 MB cap so the preflight aborts before
    // any extraction touches disk.
    const huge = Buffer.alloc(200 * 1024 * 1024);
    const gz = zlib.gzipSync(huge);
    // Sanity-check that we actually built a bomb: compressed under the 32 MB
    // download cap, decompressed over the 96 MB preflight cap.
    expect(gz.byteLength).toBeLessThan(32 * 1024 * 1024);
    const bomb: typeof fetch = (async () =>
      new Response(new Uint8Array(gz), { status: 200 })) as typeof fetch;
    await expect(
      installFromGitHub("owner/bomb#main", { fetchImpl: bomb }),
    ).rejects.toMatchObject({ code: "tarball_uncompressed_too_large" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects tarballs that fail to gunzip", async () => {
    const garbage = Buffer.from("not gzip data at all");
    const bad: typeof fetch = (async () =>
      new Response(new Uint8Array(garbage), { status: 200 })) as typeof fetch;
    await expect(
      installFromGitHub("owner/corrupt#main", { fetchImpl: bad }),
    ).rejects.toMatchObject({ code: "tarball_corrupt" });
    expect(listPackages()).toHaveLength(0);
  });

  it("accepts a well-formed single-skill tarball through the preflight + extract pipeline", async () => {
    // Build via the system `tar` so the archive shape matches what GitHub
    // produces, then run end-to-end. This is the happy-path smoke test that
    // confirms the new preflight isn't over-eager.
    const wrapper = path.join(tmpRoot, "fixtures", "happy");
    await fs.mkdir(wrapper, { recursive: true });
    await fs.writeFile(
      path.join(wrapper, "SKILL.md"),
      `---\nname: x\nzh_name: X\nen_name: X\nemoji: "✅"\ndescription: x\ncategory: article\nscenario: marketing\naspect_hint: a\ntags: ["x"]\n---\nbody\n`,
      "utf8",
    );
    const tarballPath = path.join(tmpRoot, "fixtures", "happy.tar.gz");
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("tar", ["-czf", tarballPath, "-C", path.dirname(wrapper), path.basename(wrapper)]);
      proc.on("error", reject);
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`tar exit ${code}`))));
    });
    const tar = await fs.readFile(tarballPath);

    const result = await installFromGitHub("owner/happy", { fetchImpl: fakeFetchWithTarball(tar) });
    expect(result.package.schemaVersion).toBe(1);
    expect(listPackages()).toHaveLength(1);
  });
});
