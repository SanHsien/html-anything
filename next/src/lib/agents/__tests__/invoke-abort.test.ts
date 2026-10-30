import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { invokeAgent, killProcessTree } from "../invoke";

describe("process tree termination on abort", () => {
  it.runIf(process.platform === "win32")(
    "terminates grandchild processes via invokeAgent abort signal",
    async () => {
      // Fixture agent binary: a .cmd shim (cross-spawn runs it through cmd.exe)
      // that launches a long-sleeping powershell grandchild and records its PID.
      const dir = mkdtempSync(join(tmpdir(), "invoke-abort-"));
      const pidFile = join(dir, "grandchild.pid");
      const fixture = join(dir, "fake-agent.cmd");
      const dollar = String.fromCharCode(36);
      const psCommand = `Set-Content -Path '${pidFile}' -Value ${dollar}PID; Start-Sleep -Seconds 60`;
      writeFileSync(fixture, `@echo off\r\npowershell.exe -NoProfile -Command "${psCommand}"\r\n`);

      const isAlive = (pid: number) => {
        try {
          process.kill(pid, 0);
          return true;
        } catch (e) {
          return (e as NodeJS.ErrnoException).code !== "ESRCH";
        }
      };

      let grandPid = NaN;
      const controller = new AbortController();
      try {
        const stream = invokeAgent({
          agent: "claude",
          prompt: "test",
          binOverride: fixture,
          signal: controller.signal,
        });
        const reader = stream.getReader();
        const firstEvent = await reader.read();
        expect(firstEvent.done).toBe(false);
        expect(firstEvent.value?.type).toBe("start");

        // Wait for the grandchild to report its PID.
        for (let i = 0; i < 60 && !existsSync(pidFile); i++) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        expect(existsSync(pidFile)).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        grandPid = parseInt(readFileSync(pidFile, "utf8").replace(/^\uFEFF/, "").trim(), 10);
        expect(Number.isInteger(grandPid)).toBe(true);
        expect(isAlive(grandPid)).toBe(true);

        controller.abort();

        // Drain until the stream closes.
        for (;;) {
          const r = await reader.read();
          if (r.done) break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(isAlive(grandPid)).toBe(false);
      } finally {
        controller.abort();
        if (Number.isInteger(grandPid) && isAlive(grandPid)) {
          try {
            process.kill(grandPid);
          } catch {}
        }
        rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
    },
    30000,
  );

  it("does not signal an already-exited child (PID may be recycled)", () => {
    const kill = vi.fn();
    const fakeChild = {
      pid: 99999,
      kill,
      exitCode: 0,
      signalCode: null as NodeJS.Signals | null,
    };
    killProcessTree(fakeChild);
    expect(kill).not.toHaveBeenCalled();

    // Also covers the signal-terminated case.
    killProcessTree({ ...fakeChild, exitCode: null, signalCode: "SIGKILL" });
    expect(kill).not.toHaveBeenCalled();
  });

  it.runIf(process.platform === "win32")(
    "does not run taskkill for an already-exited child on Windows",
    () => {
      // Fake exited child carrying a live PID (our own): if the guard were missing,
      // taskkill would kill this test worker, so the run fails loudly.
      const kill = vi.fn();
      killProcessTree({ pid: process.pid, kill, exitCode: 0, signalCode: null });
      // Had taskkill run against our own PID, this test process would be dead.
      expect(kill).not.toHaveBeenCalled();
    },
  );
});
