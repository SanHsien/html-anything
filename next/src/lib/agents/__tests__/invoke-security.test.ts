import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvokeOpts } from "../invoke";

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock("cross-spawn", () => ({ default: spawnMock }));
vi.mock("../detect", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../detect")>();
  return { ...actual, resolveOnPath: () => "C:\\fake\\codex.cmd" };
});
vi.mock("@/lib/templates/loader", () => ({
  loadSkill: () => ({ zhName: "test", aspectHint: "test", body: "test" }),
}));
vi.mock("@/lib/templates/shared", () => ({
  assemblePrompt: () => "safe prompt",
}));

import { POST } from "../../../app/api/convert/route";

function compileTimeCwdBoundary(): InvokeOpts {
  return {
    agent: "codex",
    prompt: "test",
    // @ts-expect-error HTTP callers must never regain control of the spawn cwd.
    cwd: "C:\\attacker-controlled",
  };
}
void compileTimeCwdBoundary;

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdin: PassThrough;
    stdout: PassThrough;
    stderr: PassThrough;
    kill: ReturnType<typeof vi.fn>;
  };
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn();
  return child;
}

describe("agent invocation path boundary", () => {
  beforeEach(() => spawnMock.mockReset());

  it("ignores a request cwd and spawns only from the server working directory", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const request = new Request("http://localhost/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent: "codex",
        templateId: "test-template",
        content: "test content",
        cwd: "C:\\attacker-controlled",
      }),
    }) as NextRequest;

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledOnce();
    expect(spawnMock.mock.calls[0]?.[2]).toMatchObject({
      cwd: process.cwd(),
      shell: false,
    });

    child.emit("close", 0);
    await response.text();
  });
});
