import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCodeloadHost, isGitHubReposApi } from "./github-request";
import { buildGzipUstar } from "./ustar";
import { installFromGitHub } from "../install";
import { listPackages } from "../registry";

/**
 * Pins the extract step against GNU tar (Git for Windows `usr\bin\tar.exe`)
 * path handling:
 *
 * - a leading `C:` in an operand is read as a remote `host:path`
 *   ("Cannot connect to C: resolve failed");
 * - backslashes in an operand are unquoted as escapes, so a segment such as
 *   `\tom` or `\tmp` turns into a TAB and the path no longer exists.
 *
 * System32 bsdtar accepts both, and Linux CI has no drive letters, so a plain
 * "install succeeds" test cannot catch either regression on those hosts. The
 * argv test below pins the property directly on every host; the GNU tar test
 * reproduces the real failure where Git for Windows is installed.
 *
 * The archive is built in-process (no system tar), so the only tar invocation
 * is the one under test.
 */

const spawnCalls = vi.hoisted(() => [] as Array<{ cmd: string; args: string[]; cwd?: string }>);

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  const spawn = ((cmd: string, args: string[], opts: { cwd?: string }) => {
    spawnCalls.push({ cmd, args: [...args], cwd: opts?.cwd });
    return actual.spawn(cmd, args, opts);
  }) as typeof actual.spawn;
  return { ...actual, default: { ...actual, spawn }, spawn };
});

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

function skillTarball(): Buffer {
  const data = Buffer.from(SKILL_MD, "utf8");
  return buildGzipUstar([
    { name: "owner-repo-deadbeef/", size: 0, typeFlag: "5" },
    { name: "owner-repo-deadbeef/SKILL.md", size: data.length, typeFlag: "0", data },
  ]);
}

/** Directory holding a GNU tar binary on Windows (Git for Windows), or null. */
function findWindowsGnuTarDir(): string | null {
  if (process.platform !== "win32") return null;
  const roots = [process.env.ProgramFiles, process.env.ProgramW6432, process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs")];
  for (const root of roots) {
    if (!root) continue;
    const dir = path.join(root, "Git", "usr", "bin");
    const exe = path.join(dir, "tar.exe");
    if (!existsSync(exe)) continue;
    try {
      const out = execFileSync(exe, ["--version"], { encoding: "utf8", timeout: 10_000 });
      if (out.includes("GNU tar")) return dir;
    } catch {
      // not usable; try the next candidate
    }
  }
  return null;
}

const gnuTarDir = findWindowsGnuTarDir();

let tmpRoot: string;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(async () => {
  spawnCalls.length = 0;
  for (const key of ["PATH", "TEMP", "TMP", "TMPDIR"]) savedEnv[key] = process.env[key];
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-drive-path-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
});

afterEach(async () => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("marketplace extract with an absolute scratch path", () => {
  it("extracts a tarball without handing tar a drive-letter archive path", async () => {
    const result = await installFromGitHub("owner/repo", { fetchImpl: fetchWith(skillTarball()) });

    expect(result.package.skills).toEqual(["repo"]);
    expect(listPackages()).toHaveLength(1);
  }, 30_000);

  it("passes tar only relative, forward-slash operands so GNU tar cannot mangle them", async () => {
    await installFromGitHub("owner/repo", { fetchImpl: fetchWith(skillTarball()) });

    const tarCalls = spawnCalls.filter((c) => c.cmd === "tar");
    expect(tarCalls).toHaveLength(1);
    for (const arg of tarCalls[0].args) {
      expect(path.isAbsolute(arg), `absolute tar arg: ${arg}`).toBe(false);
      expect(arg, `backslash in tar arg: ${arg}`).not.toContain("\\");
      expect(arg, `drive/host colon in tar arg: ${arg}`).not.toMatch(/^[A-Za-z]:/);
    }
  }, 30_000);

  it.skipIf(!gnuTarDir)(
    "extracts with Git for Windows GNU tar when TEMP has \\tom and \\tmp segments (needs Git for Windows GNU tar; skipped elsewhere)",
    async () => {
      // Segments starting with t/n/b/digits are what GNU tar unquotes.
      const scratch = path.join(tmpRoot, "tom", "tmp", "0dir");
      await fs.mkdir(scratch, { recursive: true });
      process.env.TEMP = scratch;
      process.env.TMP = scratch;
      process.env.PATH = `${gnuTarDir}${path.delimiter}${process.env.PATH ?? ""}`;
      expect(os.tmpdir()).toBe(scratch);

      const result = await installFromGitHub("owner/repo", { fetchImpl: fetchWith(skillTarball()) });

      expect(result.package.skills).toEqual(["repo"]);
    },
    30_000,
  );
});
