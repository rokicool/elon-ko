/**
 * enforce-orchestrator.ts — Hard enforcement that the interactive root session
 * operates as Elon (the orchestrator seat) and cannot implement directly.
 *
 * Why this exists: AGENTS.md / PROTO.md / skill bodies are prompt-level and
 * ignorable in principle. The only mechanisms the model CANNOT bypass in
 * oh-my-pi are (a) agent-definition `tools:`/`spawns:` frontmatter (which
 * governs subagents) and (b) an extension `tool_call` handler returning
 * `{ block: true, reason }` (which governs the root session). This extension
 * is (b): it restricts the root session to Elon's contract.
 *
 * Enforcement surface (interactive root only — `ctx.hasUI === true`, AND the
 * project has opted in — see "Opt-in" below):
 *   - read, ask, todo, job, irc                         -> allowed
 *   - task                                              -> allowed only when
 *                                                          agent ∈ TEAM
 *   - write                                             -> allowed only for
 *                                                          .app/PROJECT.md
 *   - bash                                              -> allowed only for
 *                                                          `git ...` commands
 *   - everything else (edit, ast_edit, debug, browser,
 *     eval, web_search, find, search, lsp, ...)         -> blocked
 *
 * Subagents are headless (`ctx.hasUI === false`) so this guard never fires
 * inside them — they are restricted instead by their own agent-definition
 * frontmatter (shipped by the `elon-ko-agents` marketplace plugin).
 *
 * Opt-in (disabled by default): the gate registers in every project that
 * installs this plugin, but the handler early-returns (imposes nothing) unless
 * the project opts in. Precedence (highest wins):
 *   OMP_BYPASS_ORCHESTRATOR=1  -> fully OFF (escape hatch; registers nothing)
 *   OMP_ENABLE_ORCHESTRATOR=1  -> ON (env opt-in, no marker needed)
 *   <cwd>/.omp/elon.json {"enabled":true} -> ON (project marker)
 *   otherwise                  -> DORMANT
 *
 * Advisory framing (BLEND): the bundled APPEND_SYSTEM (Elon role framing) is
 * re-injected once per session at `session_start` as an advisory custom message
 * (`display:false`, queued for the next turn). A project-local
 * `<cwd>/.omp/APPEND_SYSTEM.md` overrides the bundled default. This is advisory
 * only — no oh-my-pi ExtensionAPI call yields a true system-attributed block
 * (`MessageAttribution` is `"user" | "agent"`; `getSystemPrompt()` is read-only;
 * `appendEntry` is not sent to the LLM). Hard enforcement is this gate + the
 * agent frontmatter, never the prompt alone.
 *
 * Loading: provided via `package.json#omp.extensions` (the `elon-ko-gate`
 * plugin). Discovered by the `omp-plugins` provider when the package is loaded
 * through its own `extensions:` entry (npm/git install or `omp plugin link`).
 */

// `import type` is erased at runtime, so this runs under omp regardless of
// whether the package is resolvable for standalone type-checking.
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BYPASS = process.env.OMP_BYPASS_ORCHESTRATOR === "1";
const ENABLE = process.env.OMP_ENABLE_ORCHESTRATOR === "1";

/** Agents Elon (the root) is permitted to spawn. */
const TEAM = [
  "reqguru",
  "drpe",
  "leaddev",
  "validator",
  "docworm",
  "hr",
  "wrapper",
  "debugger",
] as const;

/** Tools the root orchestrator may call unconditionally (static lookup). */
const ROOT_ALLOWED: Record<string, true> = { read: true, ask: true, todo: true, job: true, irc: true };

/** Directory of this module — sibling assets (bundled APPEND_SYSTEM) live here. */
const MODULE_DIR = (() => {
  try {
    return fileURLToPath(new URL(".", import.meta.url));
  } catch {
    return "";
  }
})();

/**
 * Bundled default Elon framing (APPEND_SYSTEM.md), shipped as the sibling asset
 * `append-system.default.md`. Read once at load; advisory only.
 */
const BUNDLED_APPEND_SYSTEM: string | undefined = (() => {
  if (!MODULE_DIR) return undefined;
  try {
    return readFileSync(join(MODULE_DIR, "append-system.default.md"), "utf8");
  } catch {
    return undefined;
  }
})();

/** Build the `{ block: true, reason }` result shared by every denial path. */
function block(reason: string) {
  return { block: true as const, reason };
}

/**
 * Tokenize a command into argv with minimal shell-style quote handling:
 * single/double quotes group a run (including spaces) into one token, and the
 * quote characters themselves are stripped. Called only AFTER the step-2 global
 * metacharacter rejection, so by construction a quoted region can hold only
 * benign characters (no `; & | $ ` > < \ \n` — those were rejected wholesale).
 *
 * Why not plain `split(/\s+/)` (SPEC §2.1 step 3)? That hint assumes step 2
 * "removed every quote char", but step 2's metachar set omits `"` and `'`, so a
 * multi-word commit message like `git commit -m "[PROTO] Update x"` would split
 * into stray tokens and be mis-read as out-of-`.app/` paths (false BLOCK).
 * Quote-aware tokenization honors the SPEC's behavioral contract: §2.1 table
 * (multi-word messages ALLOW) and AC-2 (an out-of-`.app/` path always BLOCKs,
 * including one trailing a message — `git commit -m msg src/x.ts`). DISCREPANCY
 * vs the literal step-3 hint, resolved in favor of the acceptance criteria.
 */
function tokenize(cmd: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote: '"' | "'" | null = null;
  let hasTok = false;
  const flush = (): void => {
    if (hasTok) {
      out.push(cur);
      cur = "";
      hasTok = false;
    }
  };
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null; // closing quote — stripped, not emitted
      } else {
        cur += ch;
        hasTok = true;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch; // opening quote — token begins (even if "")
      hasTok = true;
    } else if (/\s/.test(ch)) {
      flush();
    } else {
      cur += ch;
      hasTok = true;
    }
  }
  flush();
  return out;
}

/**
 * Whether the gate is ACTIVE in the given project root. Precedence:
 * BYPASS (off) ▸ ENABLE (on) ▸ project marker ▸ dormant. A malformed or absent
 * marker is dormant (fail-safe).
 */
export function optedIn(cwd: string): boolean {
  if (BYPASS) return false;
  if (ENABLE) return true;
  const markerPath = join(cwd, ".omp", "elon.json");
  if (!existsSync(markerPath)) return false;
  try {
    const parsed: unknown = JSON.parse(readFileSync(markerPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null || !("enabled" in parsed)) {
      return false;
    }
    return (parsed as { enabled?: unknown }).enabled === true;
  } catch {
    return false;
  }
}

export default function enforceOrchestrator(pi: ExtensionAPI): void {
  if (BYPASS) {
    // Escape hatch active: register nothing, impose no restrictions.
    return;
  }

  pi.setLabel("Orchestrator enforcement (opt-in)");

  // Advisory framing: re-inject APPEND_SYSTEM once per session. A project-local
  // <cwd>/.omp/APPEND_SYSTEM.md overrides the bundled default. Wrapped so a
  // read/send failure can never break the session — it is advisory only.
  pi.on("session_start", async (_event, ctx) => {
    try {
      let text = BUNDLED_APPEND_SYSTEM;
      const overridePath = join(ctx.cwd, ".omp", "APPEND_SYSTEM.md");
      if (existsSync(overridePath)) text = readFileSync(overridePath, "utf8");
      if (!text) return;
      pi.sendMessage(
        {
          customType: "elon-ko-gate:append-system",
          content: text,
          display: false,
          attribution: "user",
        },
        { deliverAs: "nextTurn", triggerTurn: false },
      );
    } catch {
      // Advisory injection must never break the session.
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    // Only the interactive root session is gated. Subagents run headless
    // (ctx.hasUI === false) and are restricted by their own agent frontmatter.
    if (!ctx.hasUI) return;
    // Disabled by default: impose nothing unless the project opted in (§5).
    if (!optedIn(ctx.cwd)) return;

    const tool = String(event.toolName ?? "");
    const input = (event.input ?? {}) as Record<string, unknown>;

    if (ROOT_ALLOWED[tool]) return;

    if (tool === "task") {
      const agent = String(input.agent ?? "").toLowerCase().trim();
      if ((TEAM as readonly string[]).includes(agent)) return;
      const passedAgent = agent || "(none)";
      return block(
        `The root orchestrator may only spawn team agents (${TEAM.join(", ")}). ` +
          `You passed agent="${passedAgent}". Delegate through the pipeline; do not implement directly.`,
      );
    }

    if (tool === "write") {
      const raw = String(input.path ?? "");
      // Normalize: collapse repeated slashes, drop a trailing slash, strip a leading "./".
      const norm = raw.replace(/\/+/g, "/").replace(/\/$/, "").replace(/^\.\//, "");
      // Allow ONLY the protocol status artifact, where ".app" is a real directory
      // component (start-of-string, or preceded by "/"). Rejects "X.app/PROJECT.md".
      if (norm === ".app/PROJECT.md" || norm.endsWith("/.app/PROJECT.md")) return;
      return block(
        `The root orchestrator may only write .app/PROJECT.md (got "${raw}"). ` +
          `All other file creation belongs to a team agent — spawn one via task(agent="<name>").`,
      );
    }

    if (tool === "bash") {
      // ── A1: structured git-allowlist gate (decision #2). Steps run in order;
      //    the FIRST failure returns block(...). Allows only
      //    `git add|commit|status|diff|log` whose path args resolve under .app/,
      //    and rejects any shell metacharacter anywhere in the command.
      const command = String(input.command ?? "").trim();

      // 1. Reject empty.
      if (!command) {
        return block(
          "The root orchestrator may only run git commands for protocol artifact commits (got an empty command).",
        );
      }

      // 2. Global metacharacter rejection — FIRST, before any prefix test. Any of
      //    ; & | $ ` > < newline \ anywhere (incl. inside a would-be commit message)
      //    ⇒ block. No chaining, subshells, redirects, or escapes.
      if (/[;&|$`><\n\\]/.test(command)) {
        return block(
          "The root orchestrator may run only a single git command — no shell " +
            "metacharacters (; & | $ ` > < newline \\) are permitted.",
        );
      }

      // 3. Tokenize with minimal quote handling (see tokenize()). Plain split(/\s+/)
      //    would mis-split a quoted multi-word commit message into stray path tokens;
      //    step 2 already removed every chaining/escape char, so the only quoting left
      //    to honor is benign "…"/'…' grouping.
      const argv = tokenize(command);

      // 4. First-token + subcommand allowlist.
      if (argv[0] !== "git") {
        return block(
          `The root orchestrator may only run git commands (got "${argv[0]}"). ` +
            "All other commands belong to a team agent.",
        );
      }
      const SUB: Record<string, true> = {
        add: true, commit: true, status: true, diff: true, log: true,
      };
      const sub = argv[1];
      if (!SUB[sub]) {
        return block(
          `The root orchestrator may only run git add|commit|status|diff|log (got "${sub ?? "(none)"}").`,
        );
      }

      // 5. Mass-stage flag rejection — the long forms and any short flag (single "-",
      //    not "--") whose character set intersects {a,A,u,p}: covers -a -A -u -p and
      //    clusters like -am, -Au, -vp. Runs BEFORE option-value skipping, so "-p" is
      //    blocked even for `git log` (intentional per the spec's "intersects" rule).
      const args = argv.slice(2);
      for (const tok of args) {
        if (tok === "--all" || tok === "--update" || tok === "--patch") {
          return block(
            `The root orchestrator may not use git mass-stage flag "${tok}"; stage .app/ paths explicitly.`,
          );
        }
        if (/^-[^-]/.test(tok) && /[aApPu]/.test(tok)) {
          return block(
            `The root orchestrator may not use git short flag "${tok}" (intersects the mass-stage set {a,A,u,p}); stage .app/ paths explicitly.`,
          );
        }
      }

      // 6–7. Option-value skipping + path scoping. Iterate argv[2..]; the token right
      //      after a bare value-taking option is a value (skip), not a path. The
      //      =-attached form (-m=msg, --message=msg) carries its value inline, so it
      //      produces no separate token to skip.
      const VALUE_OPTS: Record<string, true> = {
        "-m": true, "--message": true, "-F": true, "--file": true,
        "-c": true, "-C": true, "--author": true, "--date": true,
        "--reedit-message": true, "--reuse-message": true, "-S": true,
      };
      let paths = 0;
      let skipNext = false;
      for (const tok of args) {
        if (skipNext) {
          skipNext = false;
          continue;
        }
        if (VALUE_OPTS[tok]) {
          skipNext = true;
          continue;
        }
        // =-attached value option → inline value, not a path.
        if (tok.startsWith("-") && tok.includes("=") && VALUE_OPTS[tok.slice(0, tok.indexOf("="))]) {
          continue;
        }
        // Any other flag is not a path; mass-stage already rejected the dangerous ones.
        if (tok.startsWith("-")) continue;

        // Path argument — normalize, then scope to .app/.
        const norm = tok.replace(/\/+/g, "/").replace(/\/$/, "").replace(/^\.\//, "");
        if (/(^|\/)\.\.(\/|$)/.test(norm)) {
          return block(
            `Path argument "${tok}" escapes .app/ via ".."; the root orchestrator may only touch paths under .app/.`,
          );
        }
        if (norm !== ".app" && !norm.startsWith(".app/")) {
          return block(
            `Path argument "${tok}" is not under .app/; the root orchestrator may only commit protocol artifacts under .app/.`,
          );
        }
        paths++;
      }

      // 8. `add` requires ≥1 explicit .app/ path (reject flag-only `git add`).
      if (sub === "add" && paths < 1) {
        return block(
          "git add requires at least one explicit .app/ path argument (mass-stage flags are rejected).",
        );
      }

      // 9. All checks pass — allow.
      return;
    }

    // Everything else (edit, ast_edit, ast_grep, debug, browser, eval,
    // web_search, find, search, lsp, resolve, ...) is out of scope for
    // the orchestrator seat.
    return block(
      `Tool "${tool}" is not available to the root orchestrator (Elon). ` +
        `Delegate the work to a team agent via task(agent="<name>", context="skill://<name>").`,
    );
  });
}
