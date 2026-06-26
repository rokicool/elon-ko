// enforce-orchestrator.test.ts — unit tests for the gate's opt-in MARKER logic
// (optedIn), using Node's BUILT-IN test runner (node:test + node:assert). No
// new deps.
//
// These tests exercise the per-project marker file only. The env short-circuits
// (OMP_BYPASS_ORCHESTRATOR / OMP_ENABLE_ORCHESTRATOR) are read once at module
// load; the test environment leaves them unset, so optedIn() reaches the marker
// branch.

import { test } from "node:test";
import { equal } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Node's built-in TS loader requires the explicit ".ts" extension (extensionless
// specifiers fail with ERR_MODULE_NOT_FOUND); tsconfig sets
// allowImportingTsExtensions so tsc accepts it too.
import { optedIn } from "./enforce-orchestrator.ts";

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
