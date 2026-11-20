import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvokeEvent } from "../invoke";

const { spawnMock, probeMock } = vi.hoisted(() => ({ spawnMock: vi.fn(), probeMock: vi.fn() }));

vi.mock("cross-spawn", () => ({ default: spawnMock }));
vi.mock("../detect", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../detect")>();
  return {
    ...actual,
    resolveOnPath: (name: string) => `C:\\fake\\${name}.cmd`,
    resolveOpenclawAgentId: probeMock,
  };
});

import { invokeAgent, STDERR_FLUSH_BYTES } from "../invoke";

// Bound on a single buffered stderr event; the implementation flushes earlier.
const MAX_STDERR_EVENT = 128 * 1024;

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdin: PassThrough;
    stdout: PassThrough;
    stderr: PassThrough;
    kill: ReturnType<typeof vi.fn>;
    pid: number | undefined;
    exitCode: number | null;
    signalCode: NodeJS.Signals | null;
  };
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn();
  child.pid = undefined;
  child.exitCode = null;
  child.signalCode = null;
  return child;
}

async function drain(stream: ReadableStream<InvokeEvent>): Promise<InvokeEvent[]> {
  const events: InvokeEvent[] = [];
  const reader = stream.getReader();
  for (;;) {
    const r = await reader.read();
    if (r.done) return events;
    events.push(r.value);
  }
}

describe("invokeAgent lifecycle", () => {
  beforeEach(() => {
    spawnMock.mockReset();
    probeMock.mockReset();
    delete process.env.OPENCLAW_BIN;
    delete process.env.CODEX_BIN;
  });

  it("does not spawn openclaw when the request is aborted during the agent-id probe", async () => {
    let finishProbe!: (id: string) => void;
    probeMock.mockReturnValue(new Promise<string>((resolve) => (finishProbe = resolve)));
    spawnMock.mockImplementation(() => fakeChild());
    const controller = new AbortController();

    const stream = invokeAgent({ agent: "openclaw", prompt: "p", signal: controller.signal });
    const reader = stream.getReader();
    const first = reader.read();
    await vi.waitFor(() => expect(probeMock).toHaveBeenCalledOnce());

    controller.abort();
    finishProbe("main");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(spawnMock).not.toHaveBeenCalled();
    // The stream must also end; a spawned-but-unwatched child would keep it open.
    expect((await first).done).toBe(true);
  });

  it("does not spawn when the signal is already aborted", async () => {
    spawnMock.mockImplementation(() => fakeChild());
    const controller = new AbortController();
    controller.abort();

    const events = drain(invokeAgent({ agent: "codex", prompt: "p", signal: controller.signal }));
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(spawnMock).not.toHaveBeenCalled();
    expect(await events).toEqual([]);
  });

  it("flushes codex stderr that never ends a line instead of buffering it until exit", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const events: InvokeEvent[] = [];
    const reader = invokeAgent({ agent: "codex", prompt: "p" }).getReader();
    const pump = (async () => {
      for (;;) {
        const r = await reader.read();
        if (r.done) return;
        events.push(r.value);
      }
    })();
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledOnce());

    // Progress-bar style output: carriage returns only, no newline.
    child.stderr.write("\rprogress ".repeat((MAX_STDERR_EVENT * 2) / 10));
    await vi.waitFor(() => expect(events.some((e) => e.type === "stderr")).toBe(true));
    const before = events.filter((e) => e.type === "stderr");

    child.emit("close", 0);
    await pump;

    expect(before.length).toBeGreaterThan(0);
    for (const e of events) {
      if (e.type === "stderr") expect(e.text.length).toBeLessThanOrEqual(MAX_STDERR_EVENT);
    }
  });

  it("does not leak a redacted codex response body when a long diagnostic line is force-flushed", async () => {
    const child = fakeChild();
    spawnMock.mockReturnValue(child);
    const events: InvokeEvent[] = [];
    const reader = invokeAgent({ agent: "codex", prompt: "p" }).getReader();
    const pump = (async () => {
      for (;;) {
        const r = await reader.read();
        if (r.done) return;
        events.push(r.value);
      }
    })();
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledOnce());

    const diag =
      "ERROR codex_models_manager::manager: failed to refresh available models: 401; body: ";
    child.stderr.write(diag + "SECRET".repeat(MAX_STDERR_EVENT / 3));
    child.stderr.write("SECRET-TAIL\nnext line\n");
    await vi.waitFor(() =>
      expect(events.some((e) => e.type === "stderr" && e.text.includes("next line"))).toBe(true),
    );
    child.emit("close", 1);
    await pump;

    const stderr = events.filter((e) => e.type === "stderr").map((e) => (e as { text: string }).text).join("");
    expect(stderr).not.toContain("SECRET");
    expect(stderr).toContain("<redacted>");
    expect(stderr).toContain("next line\n");
  });

  const MARKER = "codex_models_manager::manager: failed to refresh available models";
  it.each([1, 20, 40, MARKER.length - 1, MARKER.length + 3, MARKER.length + 12])(
    "does not leak the body when the diagnostic straddles the forced-flush cut (marker starts %i chars before it)",
    async (before) => {
      const child = fakeChild();
      spawnMock.mockReturnValue(child);
      const events: InvokeEvent[] = [];
      const reader = invokeAgent({ agent: "codex", prompt: "p" }).getReader();
      const pump = (async () => {
        for (;;) {
          const r = await reader.read();
          if (r.done) return;
          events.push(r.value);
        }
      })();
      await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledOnce());

      // No newline before the diagnostic, so the forced flush cuts at 64 KiB.
      const pad = "x".repeat(STDERR_FLUSH_BYTES - before);
      const line = `${pad}${MARKER}: 401; body: SECRET${"y".repeat(STDERR_FLUSH_BYTES)}\nnext line\n`;
      // Deliver in small chunks as well as boundaries a pipe could produce.
      for (let i = 0; i < line.length; i += 4096) child.stderr.write(line.slice(i, i + 4096));
      await vi.waitFor(() =>
        expect(events.some((e) => e.type === "stderr" && e.text.includes("next line"))).toBe(true),
      );
      child.emit("close", 1);
      await pump;

      const stderr = events.filter((e) => e.type === "stderr").map((e) => (e as { text: string }).text).join("");
      expect(stderr).not.toContain("SECRET");
      expect(stderr).toContain("next line\n");
    },
  );
});
