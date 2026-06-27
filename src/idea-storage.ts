/**
 * idea-storage.ts — Idea/suggestion storage extension for the Elon orchestrator.
 *
 * Captures worthwhile-but-out-of-scope tangents into `.app/IDEAS.md`, surfaces
 * proactive reminders when a new user request relates to a parked idea, and
 * supports on-demand listing + lifecycle (promote/reject/note). Mirrors the
 * layered enforcement model of `dot-agreement`: advisory prose in
 * `skill://elon` (insufficient alone) plus this hard `before_agent_start` hook
 * as the load-bearing layer (SPEC §2.1, §7, §12).
 *
 * Ownership invariants (SPEC §4): the extension is READ-ONLY on disk. It reads
 * `.app/IDEAS.md` via `node:fs` (hook/command code is not a tool call and is not
 * subject to any agent tool gate). Writes to `.app/IDEAS.md` are owned by
 * DocWorm (Elon's enforced `write` scope stays `.app/PROJECT.md`-only).
 * Command handlers never touch the filesystem — they only steer Elon via
 * `pi.sendMessage`, who delegates the actual append/update to DocWorm (U8).
 *
 * Ships DORMANT unless the project opts in (`optedIn`, reused from
 * enforce-orchestrator.ts), and the reminder hook fires only for the
 * interactive root (`ctx.hasUI === true`). Every hook/command body is wrapped
 * in try/catch so an extension failure can never break a turn.
 *
 * Pure functions (`parseIdeas`, `matchIdeas`, `remindersEnabled`,
 * `buildIdeaInjection`) are exported for unit testing without an LLM.
 *
 * Loading note (SPEC §3.1 / F1.2): SDK TYPES are imported with top-level
 * `import type` (erased at runtime — Node v26 cannot strip types from `.ts`
 * under `node_modules`, so `node --test` loads this module cleanly). This module
 * consumes NO SDK runtime value (it works off the `pi` argument + Node built-ins
 * only), so there are no dynamic imports. Zero runtime dependencies.
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { optedIn } from "./enforce-orchestrator.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** customType namespace — matches the existing `elon-ko-gate:` convention (U6). */
const IDEA_REMINDER_CUSTOM_TYPE = "elon-ko-gate:idea-reminder";
const IDEA_STEER_CUSTOM_TYPE = "elon-ko-gate:idea-steer";

/** `# Ideas` / `## Ideas` section header in `.app/IDEAS.md`. */
// Tolerant of any ATX heading level: SPEC §5.1's file grammar uses `# Ideas`
// (a dedicated file's top heading) while §5.4's parser regex pins `## Ideas`;
// accepting both resolves that contradiction and is robust to human edits (NFR3).
const IDEAS_SECTION_RE = /^#{1,6}\s+Ideas\s*$/;

/** Any markdown heading — its appearance closes the `## Ideas` section. */
const HEADING_RE = /^#{1,6}\s+\S/;

/** Opening fence of an idea block: a triple-backtick line whose info string is `idea`. */
const IDEA_FENCE_OPEN_RE = /^```\s*idea\s*$/;

/** Closing fence of any block: a bare triple-backtick line. */
const FENCE_CLOSE_RE = /^```\s*$/;

/** A metadata `key: value` line (SPEC §5.2/§5.4). */
const META_RE = /^\s*([a-z_]+)\s*:\s*(.*?)\s*$/;

/** The `--- notes ---` subsection marker (SPEC §5.2). */
const NOTES_MARKER_RE = /^---\s*notes\s*---\s*$/;

/** A note line: `- <ISO-8601> — <text>` (em/en/hyphen separator tolerant). */
const NOTE_LINE_RE = /^\s*-\s+(\S+)\s*[—–-]\s*(.*)$/;

/**
 * Hardcoded English stopword set (SPEC §7.3). The feature words `idea` and
 * `park` are themselves stopwords so capture-phrases ("park this idea") do not
 * self-match parked ideas. ~40 tokens; trivially tunable post-hoc without a
 * contract change.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
	"a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "for", "with",
	"is", "are", "be", "it", "this", "that", "we", "should", "would", "can",
	"will", "do", "does", "idea", "park", "add", "make", "etc", "i", "you", "as",
	"at", "by", "if", "so", "our", "your", "they",
]);

const VALID_STATUS: ReadonlySet<string> = new Set([
	"parked", "promoted", "rejected", "superseded",
]);

const REQUIRED_FIELDS = ["id", "created", "source", "title", "tags", "status"] as const;

/**
 * Shape of every message this extension injects / steers with. Matches the
 * `Pick<CustomMessage, "customType"|"content"|"display"|"details"|"attribution">`
 * surface required by `pi.sendMessage` and the `before_agent_start` `{message}`
 * return. `display:false` keeps it out of the editable pending-queue UI;
 * `attribution:"user"` is the only runtime option (U7 — system-attributed is
 * unreachable via any ExtensionAPI call).
 */
type InjectedMessage = {
	customType: string;
	content: string;
	display: false;
	attribution: "user";
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdeaRecord {
	id: string; // "IDEA-NNN"
	created: string; // ISO-8601
	source: string;
	title: string;
	tags: string[]; // parsed, lowercased
	status: "parked" | "promoted" | "rejected" | "superseded";
	promotedTo?: string;
	promotedAt?: string;
	supersededBy?: string;
	body: string;
	notes: { ts: string; text: string }[];
}

// ---------------------------------------------------------------------------
// Parser (SPEC §5.4) — tolerant, never throws, mirrors mostRecentPendingAsk
// ---------------------------------------------------------------------------

/**
 * Read-only parse of `.app/IDEAS.md`. Returns ALL idea blocks (any status) in
 * document order. Missing/unreadable/corrupt file → `[]`. A block missing a
 * required field or with an unparseable status is skipped (not fatal). NEVER
 * throws — the whole body is guarded so a torn read degrades to `[]` (the U4
 * fail-safe: no reminders injected, capture delegations still work).
 */
export function parseIdeas(ideasMdPath: string): IdeaRecord[] {
	if (!existsSync(ideasMdPath)) return [];
	let text: string;
	try {
		text = readFileSync(ideasMdPath, "utf8");
	} catch {
		return [];
	}
	try {
		return parseIdeasText(text);
	} catch {
		return [];
	}
}

/** Pure core: parse IDEAS.md text into records. Exported for direct testing. */
export function parseIdeasText(text: string): IdeaRecord[] {
	const records: IdeaRecord[] = [];
	const lines = text.split(/\r?\n/);

	let inSection = false;
	let i = 0;
	while (i < lines.length) {
		const line = lines[i]!;

		if (!inSection) {
			if (IDEAS_SECTION_RE.test(line)) inSection = true;
			i++;
			continue;
		}
		// Inside the section: another heading closes it (mirror HEADING_RE).
		if (HEADING_RE.test(line)) {
			inSection = false;
			i++;
			continue;
		}
		// An opening idea fence begins a block.
		if (IDEA_FENCE_OPEN_RE.test(line)) {
			const blockLines: string[] = [];
			i++;
			while (i < lines.length && !FENCE_CLOSE_RE.test(lines[i]!)) {
				blockLines.push(lines[i]!);
				i++;
			}
			// Consume the closing fence if present.
			if (i < lines.length) i++;
			const rec = parseIdeaBlock(blockLines);
			if (rec) records.push(rec);
			continue;
		}
		i++;
	}

	return records;
}

/** Parse one fenced block's interior lines into a record, or null if invalid. */
function parseIdeaBlock(blockLines: string[]): IdeaRecord | null {
	// 1. Metadata: consecutive `key: value` lines until the first blank line.
	const meta = new Map<string, string>();
	let idx = 0;
	for (; idx < blockLines.length; idx++) {
		const ln = blockLines[idx]!;
		if (ln.trim() === "") break;
		const m = META_RE.exec(ln);
		if (!m) continue; // skip non-metadata lines inside the metadata run
		meta.set(m[1]!, m[2]!);
	}
	// Skip the blank separator between metadata and body.
	if (idx < blockLines.length && blockLines[idx]!.trim() === "") idx++;

	// Required-field + status validation (SPEC §5.4 step 5): skip, never throw.
	for (const field of REQUIRED_FIELDS) {
		if (!meta.has(field)) return null;
	}
	const rawStatus = meta.get("status")!;
	if (!VALID_STATUS.has(rawStatus)) return null;

	// 2/3. Body until `--- notes ---` marker or end; notes subsection after.
	const bodyLines: string[] = [];
	const notes: { ts: string; text: string }[] = [];
	let inNotes = false;
	for (; idx < blockLines.length; idx++) {
		const ln = blockLines[idx]!;
		if (NOTES_MARKER_RE.test(ln)) {
			inNotes = true;
			continue;
		}
		if (inNotes) {
			const m = NOTE_LINE_RE.exec(ln);
			if (m) notes.push({ ts: m[1]!, text: m[2]! });
			continue; // non-note lines inside the notes section are ignored
		}
		bodyLines.push(ln);
	}

	const status = rawStatus as IdeaRecord["status"];
	const rec: IdeaRecord = {
		id: meta.get("id")!,
		created: meta.get("created")!,
		source: meta.get("source")!,
		title: meta.get("title")!,
		tags: meta
			.get("tags")!
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter((t) => t.length > 0),
		status,
		body: bodyLines.join("\n").replace(/\n+$/, ""),
		notes,
	};
	if (status === "promoted") {
		if (meta.has("promoted_to")) rec.promotedTo = meta.get("promoted_to");
		if (meta.has("promoted_at")) rec.promotedAt = meta.get("promoted_at");
	}
	if (status === "superseded" && meta.has("superseded_by")) {
		rec.supersededBy = meta.get("superseded_by");
	}
	return rec;
}

// ---------------------------------------------------------------------------
// Tokenizer + matcher (SPEC §7.3) — pure, dependency-free, boring/debuggable
// ---------------------------------------------------------------------------

/** Lowercase, split on any non-[a-z0-9], drop stopwords. */
function tokenize(s: string): string[] {
	const out: string[] = [];
	const matches = s.toLowerCase().match(/[a-z0-9]+/g);
	if (matches) {
		for (const tok of matches) {
			if (!STOPWORDS.has(tok)) out.push(tok);
		}
	}
	return out;
}

/**
 * Pure. Token-set intersection after stopword removal, between the request and
 * each parked idea's `title ∪ tags`. overlap ≥ 1 qualifies; rank overlap-desc
 * then created-asc (older first); cap 2/turn (R3.1). No network, no embeddings,
 * no subprocess (AC12).
 *
 * Spec-defect note (resolved per the SPEC §7.3 prose "Decision", reported): the
 * §7.3 pseudocode line `idea.tags.map(t => t)` is a no-op identity that would
 * add kebab-case tags as whole strings (e.g. `"dark-mode"`) which `tokenize`'d
 * request sub-tokens could never match. The surrounding prose decision states
 * "the tokenizer splits both request and tag strings identically, so
 * `dark-mode` → {dark, mode}". This implementation follows that prose decision
 * — tags are tokenized identically — which is the self-consistent, intended
 * (higher-recall) behavior. Tag sub-tokens also pass stopword filtering.
 */
export function matchIdeas(request: string, parked: IdeaRecord[]): IdeaRecord[] {
	const reqTokens = tokenize(request);
	const scored = parked
		.map((idea) => {
			const ideaTokens = new Set<string>([
				...tokenize(idea.title),
				...idea.tags.flatMap((t) => tokenize(t)),
			]);
			const overlap = reqTokens.filter((t) => ideaTokens.has(t)).length;
			return { idea, overlap };
		})
		.filter((s) => s.overlap >= 1)
		.sort(
			(a, b) => b.overlap - a.overlap || a.idea.created.localeCompare(b.idea.created),
		);
	return scored.slice(0, 2).map((s) => s.idea);
}

// ---------------------------------------------------------------------------
// Opt-out reader (SPEC §9) — env ▸ file ▸ default ON; fail-safe ON
// ---------------------------------------------------------------------------

/**
 * Whether proactive reminders are enabled. Precedence:
 *   OMP_IDEA_REMINDERS=0 → off; =1 → on (env wins)
 *   .omp/elon.json {ideas:{reminders:false}} → off
 *   default → ON (when opted-in). Malformed/absent → ON (fail-safe).
 * `/ideas` and capture do NOT consult this (SPEC §6.3) — only the reminder hook.
 */
export function remindersEnabled(cwd: string): boolean {
	const env = process.env.OMP_IDEA_REMINDERS;
	if (env === "0") return false; // explicit off (escape hatch)
	if (env === "1") return true; // explicit on
	try {
		const p = join(cwd, ".omp", "elon.json");
		if (!existsSync(p)) return true; // default ON
		const parsed: unknown = JSON.parse(readFileSync(p, "utf8"));
		if (typeof parsed !== "object" || parsed === null) return true;
		const obj = parsed as Record<string, unknown>;
		const ideas = obj.ideas;
		if (typeof ideas !== "object" || ideas === null) return true;
		const r = (ideas as Record<string, unknown>).reminders;
		return r !== false; // false → off; anything else (incl. absent) → ON
	} catch {
		return true; // malformed → default ON (fail-safe)
	}
}

// ---------------------------------------------------------------------------
// Injection / steering message builders
// ---------------------------------------------------------------------------

/** Build the proactive-reminder injection message for ≤2 hits (SPEC §7.2). */
export function buildIdeaInjection(hits: IdeaRecord[]): InjectedMessage {
	const lines = hits
		.map((h) => `- [${h.id}] "${h.title}" (tags: ${h.tags.join(", ")})`)
		.join("\n");
	return {
		customType: IDEA_REMINDER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`The current user request may relate to these previously parked ideas:\n${lines}\n\n` +
			`If genuinely relevant, surface at most a one-line pointer per idea (≤2 total) to the ` +
			`user, e.g. "Note: this overlaps parked idea IDEA-NNN — <title> (/idea promote to start it).". ` +
			`If not relevant, do not mention them. Never fabricate ideas not listed here.`,
	};
}

/** `/idea <text>` → steer Elon to ack + delegate a `status=parked` append (§6.1). */
function buildIdeaCaptureMessage(text: string): InjectedMessage {
	const t = text.trim();
	if (!t) {
		return {
			customType: IDEA_STEER_CUSTOM_TYPE,
			display: false,
			attribution: "user",
			content:
				`The user invoked the /idea command with no text. Ask them what idea to capture, then ` +
				`delegate appending it to DocWorm (op:append, source:"/idea"). Elon does NOT write ` +
				`.app/IDEAS.md — his write scope is .app/PROJECT.md only.`,
		};
	}
	return {
		customType: IDEA_STEER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`The user invoked the /idea command with: "${t}". Acknowledge capture now (one line), then ` +
			`delegate appending a new status=parked block to DocWorm via task(agent="docworm", op:append, ` +
			`{ source:"/idea", title:<derived ≤80 chars>, body:"${t}", tags:<derived ≤5 lowercase kebab-case> }). ` +
			`On DocWorm's returned IDEA-NNN, confirm to the user: "📌 Parked as IDEA-NNN: <title>". ` +
			`Elon does NOT write .app/IDEAS.md (his write scope is .app/PROJECT.md only).`,
	};
}

/** `/idea promote IDEA-NNN` → steer a promotion delegation (SPEC §10.2). */
function buildIdeaPromoteMessage(rest: string): InjectedMessage {
	return {
		customType: IDEA_STEER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`The user ran "/idea promote ${rest}". This is a promotion request (SPEC §10.2). Resolve the ` +
			`target IDEA-NNN (it must exist and be status=parked; otherwise report the error with NO state ` +
			`change). If a FULL workflow is active (a .app/REQ.md exists and PROJECT.md ## Current Phase is ` +
			`in flight), record a Pending Ask to confirm context-switch — NEVER clobber REQ.md. Otherwise ` +
			`delegate DocWorm op:update_status { id, status:"promoted", promotedTo:".app/REQ.md", ` +
			`promotedAt:<now UTC> } (block KEPT in .app/IDEAS.md for audit), then delegate ReqGuru to seed ` +
			`a fresh .app/REQ.md from the idea. Elon does NOT write .app/IDEAS.md.`,
	};
}

/** `/idea reject IDEA-NNN` → steer an update_status=rejected delegation (§10.3). */
function buildIdeaRejectMessage(rest: string): InjectedMessage {
	return {
		customType: IDEA_STEER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`The user ran "/idea reject ${rest}". Delegate DocWorm op:update_status ` +
			`{ id:<IDEA-NNN>, status:"rejected" } (block KEPT; re-openable later via parked). Confirm to ` +
			`the user. Elon does NOT write .app/IDEAS.md.`,
	};
}

/** `/idea note IDEA-NNN: <text>` → steer an append_note delegation (§6.5/§6.7). */
function buildIdeaNoteMessage(rest: string): InjectedMessage {
	return {
		customType: IDEA_STEER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`The user ran "/idea note ${rest}" (format: "IDEA-NNN: <text>"). Delegate DocWorm ` +
			`op:append_note { id:<IDEA-NNN>, note:<text> } to append "- <now UTC> — <text>" to that ` +
			`block's --- notes --- section (creating it if absent). Confirm to the user. Elon does NOT ` +
			`write .app/IDEAS.md.`,
	};
}

/** `/ideas` / `/ideas all` → on-demand listing (SPEC §6.3). Pure over records. */
function buildIdeaListMessage(ideas: IdeaRecord[], all: boolean): InjectedMessage {
	const rows = ideas
		.filter((i) => all || i.status === "parked")
		.map((i) => {
			const tags = i.tags.join(", ");
			if (i.status === "parked") return `${i.id} — ${i.title} [${tags}]`;
			let badge: string = i.status;
			if (i.status === "promoted") badge = `promoted→${i.promotedTo ?? ".app/REQ.md"}`;
			else if (i.status === "superseded") badge = `superseded→${i.supersededBy ?? "?"}`;
			return `${i.id} — ${i.title} [${tags}] (${badge})`;
		});
	const body = rows.length > 0 ? rows.join("\n") : all ? "(no ideas recorded)" : "(no parked ideas)";
	return {
		customType: IDEA_STEER_CUSTOM_TYPE,
		display: false,
		attribution: "user",
		content:
			`On-demand idea listing (from /ideas${all ? " all" : ""}). Present this list to the user ` +
			`verbatim:\n\n${body}`,
	};
}

// ---------------------------------------------------------------------------
// Factory (SPEC §3.2, §7.1, §6)
// ---------------------------------------------------------------------------

export default function ideaStorage(pi: ExtensionAPI): void {
	pi.setLabel("Idea/suggestion storage (opt-in)");

	// Reminder hook (SPEC §7.1) — the load-bearing enforcement layer. Fires only
	// on user turns (hasUI), only when opted in, only when reminders enabled.
	pi.on("before_agent_start", (event, ctx) => {
		try {
			if (!ctx.hasUI) return; // user turns only (U5); subagents are headless
			if (!optedIn(ctx.cwd)) return; // dormancy parity (dot-agreement.ts:141)
			if (!remindersEnabled(ctx.cwd)) return; // opt-out (§9)
			const parked = parseIdeas(join(ctx.cwd, ".app", "IDEAS.md")).filter(
				(i) => i.status === "parked",
			);
			const hits = matchIdeas(event.prompt, parked); // ≤2, overlap≥1
			if (hits.length === 0) return;
			return { message: buildIdeaInjection(hits) }; // F2.2 mechanism
		} catch {
			return; // advisory safety: never break a turn
		}
	});

	// `/idea` — capture + lifecycle steering (SPEC §6.1). NEVER writes the fs (U8).
	pi.registerCommand("idea", {
		description: "Capture or manage an idea/suggestion parked in .app/IDEAS.md.",
		handler: async (args, ctx) => {
			try {
				if (!optedIn(ctx.cwd)) return; // dormancy parity
				const a = (args ?? "").trim();
				const lower = a.toLowerCase();
				let msg: InjectedMessage;
				if (lower.startsWith("promote ")) {
					msg = buildIdeaPromoteMessage(a.slice("promote ".length).trim());
				} else if (lower.startsWith("reject ")) {
					msg = buildIdeaRejectMessage(a.slice("reject ".length).trim());
				} else if (lower.startsWith("note ")) {
					msg = buildIdeaNoteMessage(a.slice("note ".length).trim());
				} else {
					msg = buildIdeaCaptureMessage(a);
				}
				pi.sendMessage(msg, { deliverAs: "nextTurn", triggerTurn: true });
			} catch {
				// Never break the user's turn (the runner also catches).
			}
		},
	});

	// `/ideas` — on-demand listing (SPEC §6.3). Reads via fs; never writes.
	// Independent of the opt-out (REQ error case): opted-out users can still list.
	pi.registerCommand("ideas", {
		description: "List parked ideas from .app/IDEAS.md (use `/ideas all` for audit).",
		handler: async (args, ctx) => {
			try {
				if (!optedIn(ctx.cwd)) return; // dormancy parity
				const all = (args ?? "").trim().toLowerCase() === "all";
				const ideas = parseIdeas(join(ctx.cwd, ".app", "IDEAS.md"));
				pi.sendMessage(buildIdeaListMessage(ideas, all), {
					deliverAs: "nextTurn",
					triggerTurn: true,
				});
			} catch {
				// Never break the user's turn.
			}
		},
	});
}
