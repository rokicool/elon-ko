// enforce-orchestrator.test.ts — unit tests for the gate's opt-in MARKER logic
// (optedIn), using Node's BUILT-IN test runner (node:test + node:assert). No
// new deps.
//
// These tests exercise the per-project marker file only. The env short-circuits
// (OMP_BYPASS_ORCHESTRATOR / OMP_ENABLE_ORCHESTRATOR) are read once at module
// load; the test environment leaves them unset, so optedIn() reaches the marker
// branch.

import { describe, test } from "node:test";
import { equal, ok } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Node's built-in TS loader requires the explicit ".ts" extension (extensionless
// specifiers fail with ERR_MODULE_NOT_FOUND); tsconfig sets
// allowImportingTsExtensions so tsc accepts it too.
import enforceGate, { optedIn } from "./enforce-orchestrator.ts";

const MARKER = "elon.json";

function withTmpProject(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "omp-gate-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("optedIn: dormant when no marker present", () => {
  withTmpProject((dir) => {
    equal(optedIn(dir), false);
  });
});

test("optedIn: ON when .omp/elon.json has {enabled:true}", () => {
  withTmpProject((dir) => {
    mkdirSync(join(dir, ".omp"), { recursive: true });
    writeFileSync(join(dir, ".omp", MARKER), '{"enabled": true}\n');
    equal(optedIn(dir), true);
  });
});

test("optedIn: dormant when enabled is false", () => {
  withTmpProject((dir) => {
    mkdirSync(join(dir, ".omp"), { recursive: true });
    writeFileSync(join(dir, ".omp", MARKER), '{"enabled": false}\n');
    equal(optedIn(dir), false);
  });
});

test("optedIn: dormant when marker is malformed JSON (fail-safe)", () => {
  withTmpProject((dir) => {
    mkdirSync(join(dir, ".omp"), { recursive: true });
    writeFileSync(join(dir, ".omp", MARKER), "{not json");
    equal(optedIn(dir), false);
  });
});

test("optedIn: dormant when marker lacks the enabled field", () => {
  withTmpProject((dir) => {
    mkdirSync(join(dir, ".omp"), { recursive: true });
    writeFileSync(join(dir, ".omp", MARKER), '{"foo": 1}\n');
    equal(optedIn(dir), false);
  });
});

test("optedIn: ignores the legacy orchestrator.json name (clean cutover to elon.json)", () => {
  withTmpProject((dir) => {
    mkdirSync(join(dir, ".omp"), { recursive: true });
    // legacy filename only -> must stay dormant; the gate no longer reads it.
    writeFileSync(join(dir, ".omp", "orchestrator.json"), '{"enabled": true}\n');
    equal(optedIn(dir), false);
  });
});

// ─── tool_call handler: ROOT_ALLOWED permit + adversarial blocked control ───
// These exercise the REAL default export (the registered tool_call handler),
// proving the gate is ACTIVE (not dormant) and that ROOT_ALLOWED grants hold.
// Drives optedIn via the marker path (env short-circuits left unset at load).

function installGate(): (
  event: { toolName?: unknown; input?: unknown },
  ctx: { hasUI: boolean; cwd: string },
) => Promise<unknown> {
  let handler: ((event: unknown, ctx: unknown) => Promise<unknown>) | null = null;
  enforceGate({
    setLabel: () => {},
    on: (
      event: string,
      cb: (event: unknown, ctx: unknown) => Promise<unknown>,
    ) => {
      if (event === "tool_call") handler = cb;
    },
    sendMessage: () => {},
  } as never);
  if (!handler) throw new Error("tool_call handler was not registered");
  return handler;
}

function optedInCtx(): { ctx: { hasUI: true; cwd: string }; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "omp-gate-handler-"));
  mkdirSync(join(dir, ".omp"), { recursive: true });
  writeFileSync(join(dir, ".omp", MARKER), '{"enabled": true}\n');
  return {
    ctx: { hasUI: true, cwd: dir },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test("handler: ROOT_ALLOWED tools PERMITTED — read, ask, todo, job (T1), irc (grant)", async () => {
  const handler = installGate();
  const { ctx, cleanup } = optedInCtx();
  try {
    for (const tool of ["read", "ask", "todo", "job", "irc"]) {
      equal(await handler({ toolName: tool, input: {} }, ctx), undefined, `${tool} PERMITTED (no block)`);
    }
  } finally {
    cleanup();
  }
});

test("handler: edit BLOCKED — gate is active, not dormant (adversarial control)", async () => {
  const handler = installGate();
  const { ctx, cleanup } = optedInCtx();
  try {
    const res = (await handler({ toolName: "edit", input: {} }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    ok(res && res.block === true, "edit is BLOCKED");
    ok(typeof res.reason === "string" && res.reason.length > 0, "block carries a reason");
  } finally {
    cleanup();
  }
});

// ─── handler bash §2.1: structured git allowlist matrix (A1 / C-001) ────────
// Drives the REAL tool_call handler. ALLOW ⇒ result === undefined; BLOCK ⇒
// result.block === true with a non-empty reason containing a keyword naming the
// rejection class. Reuses installGate() + optedInCtx() from above.

type GateResult = { block?: boolean; reason?: string } | undefined;

/** Drive the gate with a tool/input pair against an opted-in root ctx. */
async function runGate(
  toolName: string,
  input: Record<string, unknown>,
): Promise<GateResult> {
  const handler = installGate();
  const { ctx, cleanup } = optedInCtx();
  try {
    return (await handler({ toolName, input }, ctx)) as GateResult;
  } finally {
    cleanup();
  }
}

describe("handler bash §2.1: ALLOW rows", () => {
  const CASES: ReadonlyArray<readonly [string, string]> = [
    ["git status", "subcommand ok, no paths"],
    ["git log", "subcommand ok, no paths"],
    ["git diff", "subcommand ok, no paths"],
    ["git diff .app/SPEC.md", "single .app/ path"],
    ["git add .app/PROJECT.md", "single .app/ path"],
    ["git add .app/REQ.md .app/PROJECT.md", "multiple .app/ paths"],
    ['git commit -m "[PROTO] Update SPEC.md"', "multi-word message value skipped"],
    ['git commit .app/PROJECT.md -m "[PROTO] x"', "explicit path + skipped message"],
  ];
  for (const [cmd, label] of CASES) {
    test(`ALLOW — ${label}: \`${cmd}\``, async () => {
      equal(await runGate("bash", { command: cmd }), undefined, "ALLOW ⇒ undefined");
    });
  }
});

describe("handler bash §2.1: BLOCK rows", () => {
  // [command, reasonKeyword, label]
  const CASES: ReadonlyArray<readonly [string, string, string]> = [
    ["git status; rm -rf /", "metachar", "; chaining"],
    ["git log && npm run build", "metachar", "& chaining"],
    ["git diff | cat", "metachar", "pipe"],
    ['git commit -m "$(whoami)"', "metachar", "$ substitution"],
    ["git status > out.txt", "metachar", "> redirect"],
    ["git status`whoami`", "metachar", "backtick"],
    ["git reset --hard", "reset", "bad subcommand: reset"],
    ["git push --force", "push", "bad subcommand: push"],
    ["git checkout main", "checkout", "bad subcommand: checkout"],
    ["npm run build", "git commands", "first token ≠ git"],
    ["git add .", "not under .app", "path '.' is the cwd"],
    ["git add src/foo.ts", "not under .app", "path outside .app/"],
    ["git add -A", "mass-stage", "mass-stage flag -A"],
    ["git commit -a -m x", "mass-stage", "mass-stage flag -a"],
    ["git add .app/../etc/passwd", "escapes", ".. escapes .app/"],
  ];
  for (const [cmd, kw, label] of CASES) {
    test(`BLOCK — ${label}: \`${cmd}\``, async () => {
      const res = await runGate("bash", { command: cmd });
      const reason = res?.reason;
      ok(res !== undefined && res.block === true, `expected BLOCK for \`${cmd}\``);
      ok(typeof reason === "string" && reason.length > 0, "block carries a non-empty reason");
      ok(
        typeof reason === "string" && reason.includes(kw),
        `reason must contain "${kw}" (got: ${JSON.stringify(reason)})`,
      );
    });
  }
});

describe("handler write §2.2: path-scoping matrix (A2 / C-002 / C-013)", () => {
  const ALLOW: ReadonlyArray<readonly [string, string]> = [
    [".app/PROJECT.md", "bare relative"],
    ["./.app/PROJECT.md", "leading ./"],
    [".app/PROJECT.md/", "trailing /"],
    ["/abs/path/.app/PROJECT.md", "absolute"],
    ["a/b/.app/PROJECT.md", "nested under dirs"],
  ];
  const BLOCK: ReadonlyArray<readonly [string, string]> = [
    ["leak.app/PROJECT.md", "no separator before .app"],
    ["foo.app/PROJECT.md", "no separator (foo prefix)"],
    [".app/REQ.md", "wrong artifact"],
  ];
  for (const [p, label] of ALLOW) {
    test(`ALLOW — ${label}: \`${p}\``, async () => {
      equal(await runGate("write", { path: p }), undefined, "ALLOW ⇒ undefined");
    });
  }
  for (const [p, label] of BLOCK) {
    test(`BLOCK — ${label}: \`${p}\``, async () => {
      const res = await runGate("write", { path: p });
      const reason = res?.reason;
      ok(res !== undefined && res.block === true, `expected BLOCK for \`${p}\``);
      ok(typeof reason === "string" && reason.length > 0, "block carries a non-empty reason");
      ok(
        typeof reason === "string" && reason.includes(".app/PROJECT.md"),
        `reason must reference .app/PROJECT.md (got: ${JSON.stringify(reason)})`,
      );
    });
  }
});
