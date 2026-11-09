import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isCodeloadHost, isGitHubReposApi } from "./github-request";
import { buildGzipUstar } from "./ustar";
import { installFromGitHub } from "../install";
import { listPackages } from "../registry";

/**
 * Pins the extract step against GNU tar's `host:path` rule: a leading `C:` in
 * the archive operand is read as a remote host, so a Windows absolute path
 * handed to `tar -xzf` fails with "Cannot connect to C: resolve failed" when
 * Git for Windows' tar wins PATH. The archive here is built in-process (no
 * system tar), so the only tar invocation is the one under test.
 */

const SKILL_MD = `---\nname: x\nzh_name: X\nen_name: X\nemoji: "✅"\ndescription: x\ncategory: article\nscenario: marketing\naspect_hint: a\ntags: ["x"]\n---\nbody\n`;

function fetchWith(tarball: Buffer): typeof fetch {
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
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-drive-path-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
});

afterEach(async () => {
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("marketplace extract with an absolute scratch path", () => {
  it("extracts a tarball without handing tar a drive-letter archive path", async () => {
    const data = Buffer.from(SKILL_MD, "utf8");
    const tar = buildGzipUstar([
      { name: "owner-repo-deadbeef/", size: 0, typeFlag: "5" },
      { name: "owner-repo-deadbeef/SKILL.md", size: data.length, typeFlag: "0", data },
    ]);

    const result = await installFromGitHub("owner/repo", { fetchImpl: fetchWith(tar) });

    expect(result.package.skills).toEqual(["repo"]);
    expect(listPackages()).toHaveLength(1);
  });
});
