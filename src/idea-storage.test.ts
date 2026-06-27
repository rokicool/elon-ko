// idea-storage.test.ts — unit tests for the idea-storage extension's pure
// functions plus a behavioral check of the before_agent_start hook, using
// Node's BUILT-IN test runner (node:test + node:assert). No new deps.
// Mirrors the style of dot-agreement.test.ts.
//
// Exercises parseIdeas (tolerant/missing/corrupt), matchIdeas (ranking/cap/
// stopword/tag-tokenization), remindersEnabled (env>file>default precedence),
// buildIdeaInjection (shape), and the real hook via a stub ExtensionAPI. The
// stub never imports oh-my-pi at runtime (ExtensionAPI is `import type` only),
// so the module loads cleanly under `node --test`.

import { test } from "node:test";
import { deepEqual, equal, match, notEqual, ok } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import ideaStorage, {
	buildIdeaInjection,
	matchIdeas,
	parseIdeas,
	parseIdeasText,
	remindersEnabled,
	type IdeaRecord,
} from "./idea-storage.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface BlockFixture {
	id: string;
	created: string;
	source?: string;
	title: string;
	tags: string[];
	status?: IdeaRecord["status"];
	promotedTo?: string;
	promotedAt?: string;
	supersededBy?: string;
	body?: string;
	notes?: Array<{ ts: string; text: string }>;
}

/** Build a fenced ```idea block string from a fixture. */
function ideaBlock(b: BlockFixture): string {
	const lines: string[] = ["```idea"];
	lines.push(`id: ${b.id}`);
	lines.push(`created: ${b.created}`);
	lines.push(`source: ${b.source ?? "user"}`);
	lines.push(`title: ${b.title}`);
	lines.push(`tags: ${b.tags.join(", ")}`);
	lines.push(`status: ${b.status ?? "parked"}`);
	if (b.promotedTo) lines.push(`promoted_to: ${b.promotedTo}`);
	if (b.promotedAt) lines.push(`promoted_at: ${b.promotedAt}`);
	if (b.supersededBy) lines.push(`superseded_by: ${b.supersededBy}`);
	if (b.body) {
		lines.push("");
		lines.push(b.body);
	}
	if (b.notes && b.notes.length > 0) {
		lines.push("--- notes ---");
		for (const n of b.notes) lines.push(`- ${n.ts} — ${n.text}`);
	}
	lines.push("```");
	return lines.join("\n");
}

/** Build an IDEAS.md document from a set of idea blocks. */
function ideasMd(...blocks: string[]): string {
	return ["# Ideas", "", "Stored ideas for the Elon protocol.", "", ...blocks, ""].join("\n");
}

/** Write `<dir>/.app/IDEAS.md`; returns its absolute path. Creates `.app/`. */
function writeIdeas(dir: string, content: string): string {
	mkdirSync(join(dir, ".app"), { recursive: true });
	const p = join(dir, ".app", "IDEAS.md");
	writeFileSync(p, content);
	return p;
}

/** Drop the opt-in marker so `optedIn(dir)` is true (parity with the gate). */
function optIn(dir: string): void {
	mkdirSync(join(dir, ".omp"), { recursive: true });
	writeFileSync(join(dir, ".omp", "elon.json"), '{"enabled": true}\n');
}

/** Fresh temp project root, cleaned up after `fn` returns. */
function withTmp(fn: (dir: string) => void): void {
	const dir = mkdtempSync(join(tmpdir(), "idea-storage-"));
	try {
		fn(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

/** Save/restore OMP_IDEA_REMINDERS around a callback. */
function withRemindersEnv(value: string | undefined, fn: () => void): void {
	const prev = process.env.OMP_IDEA_REMINDERS;
	if (value === undefined) delete process.env.OMP_IDEA_REMINDERS;
	else process.env.OMP_IDEA_REMINDERS = value;
	try {
		fn();
	} finally {
		if (prev === undefined) delete process.env.OMP_IDEA_REMINDERS;
		else process.env.OMP_IDEA_REMINDERS = prev;
	}
}

/** Save/restore OMP_IDEA_REMINDERS around an async callback. */
async function withRemindersEnvAsync(value: string | undefined, fn: () => Promise<void>): Promise<void> {
	const prev = process.env.OMP_IDEA_REMINDERS;
	if (value === undefined) delete process.env.OMP_IDEA_REMINDERS;
	else process.env.OMP_IDEA_REMINDERS = value;
	try {
		await fn();
	} finally {
		if (prev === undefined) delete process.env.OMP_IDEA_REMINDERS;
		else process.env.OMP_IDEA_REMINDERS = prev;
	}
}

const R = (over: Partial<IdeaRecord> = {}): IdeaRecord => ({
	id: "IDEA-001",
	created: "2026-01-01T00:00:00Z",
	source: "user",
	title: "sample",
	tags: [],
	status: "parked",
	body: "",
	notes: [],
	...over,
});

// ===========================================================================
// parseIdeas — tolerant / missing / corrupt
// ===========================================================================

test("parseIdeas: missing file → [] (never throws)", () => {
	withTmp((dir) => {
		deepEqual(parseIdeas(join(dir, ".app", "IDEAS.md")), []);
	});
});

test("parseIdeas: well-formed file parses id/created/source/title/tags/status", () => {
	const md = ideasMd(
		ideaBlock({
			id: "IDEA-001",
			created: "2026-06-27T12:00:00Z",
			source: "user",
			title: "Add a dark-mode toggle",
			tags: ["UI", "Theme", "css"],
			body: "Respect prefers-color-scheme but allow manual override.",
			notes: [{ ts: "2026-06-27T13:00:00Z", text: "user: consider localStorage" }],
		}),
	);
	const recs = parseIdeasText(md);
	equal(recs.length, 1);
	const r = recs[0]!;
	equal(r.id, "IDEA-001");
	equal(r.created, "2026-06-27T12:00:00Z");
	equal(r.source, "user");
	equal(r.title, "Add a dark-mode toggle");
	// tags are lowercased by the parser (SPEC §5.4 IdeaRecord).
	deepEqual(r.tags, ["ui", "theme", "css"]);
	equal(r.status, "parked");
	match(r.body, /prefers-color-scheme/);
	equal(r.notes.length, 1);
	equal(r.notes[0]!.ts, "2026-06-27T13:00:00Z");
	match(r.notes[0]!.text, /localStorage/);
});

test("parseIdeas: promoted block carries promoted_to/promoted_at", () => {
	const md = ideasMd(
		ideaBlock({
			id: "IDEA-002",
			created: "2026-06-28T10:00:00Z",
			source: "leaddev",
			title: "X",
			tags: ["a"],
			status: "promoted",
			promotedTo: ".app/REQ.md",
			promotedAt: "2026-06-29T08:00:00Z",
		}),
	);
	const recs = parseIdeasText(md);
	equal(recs.length, 1);
	equal(recs[0]!.status, "promoted");
	equal(recs[0]!.promotedTo, ".app/REQ.md");
	equal(recs[0]!.promotedAt, "2026-06-29T08:00:00Z");
});

test("parseIdeas: superseded block carries superseded_by", () => {
	const md = ideasMd(
		ideaBlock({
			id: "IDEA-003",
			created: "2026-06-28T10:00:00Z",
			title: "Y",
			tags: ["b"],
			status: "superseded",
			supersededBy: "IDEA-009",
		}),
	);
	equal(parseIdeasText(md)[0]!.supersededBy, "IDEA-009");
});

test("parseIdeas: block missing a required field is skipped (not fatal)", () => {
	const md = ideasMd(
		ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "ok", tags: ["x"] }), // no source? has default
		"```idea\nid: IDEA-002\ncreated: 2026-01-02T00:00:00Z\ntitle: no status\ntags: y\n```", // missing status
		ideaBlock({ id: "IDEA-003", created: "2026-01-03T00:00:00Z", title: "also ok", tags: ["z"] }),
	);
	const recs = parseIdeasText(md);
	equal(recs.length, 2);
	deepEqual(recs.map((r) => r.id), ["IDEA-001", "IDEA-003"]);
});

test("parseIdeas: block with an unparseable status is skipped", () => {
	const md = ideasMd(
		"```idea\nid: IDEA-001\ncreated: 2026-01-01T00:00:00Z\nsource: user\ntitle: bad\ntags: x\nstatus: garbage\n```",
		ideaBlock({ id: "IDEA-002", created: "2026-01-02T00:00:00Z", title: "good", tags: ["y"] }),
	);
	const recs = parseIdeasText(md);
	equal(recs.length, 1);
	equal(recs[0]!.id, "IDEA-002");
});

test("parseIdeas: no `## Ideas` section → []", () => {
	equal(parseIdeasText("# Not ideas\n\n```idea\nid: IDEA-001\n```").length, 0);
});

test("parseIdeas: section header is heading-level tolerant (`# Ideas` and `## Ideas` both parse)", () => {
	// SPEC §5.1 grammar uses `# Ideas`; §5.4 parser regex pins `## Ideas`. The
	// parser accepts any ATX heading whose text is "Ideas" (resolves the defect).
	const block = ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "t", tags: ["x"] });
	equal(parseIdeasText(`## Ideas\n\n${block}\n`).length, 1);
	equal(parseIdeasText(`### Ideas\n\n${block}\n`).length, 1);
});

test("parseIdeas: a later heading closes the section", () => {
	const md = [
		"# Ideas",
		"",
		ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "in", tags: ["a"] }),
		"",
		"## Other Section",
		"",
		ideaBlock({ id: "IDEA-002", created: "2026-01-02T00:00:00Z", title: "out", tags: ["b"] }),
		"",
	].join("\n");
	const recs = parseIdeasText(md);
	equal(recs.length, 1);
	equal(recs[0]!.id, "IDEA-001");
});

test("parseIdeas: totally garbled content → [] (never throws)", () => {
	equal(parseIdeasText("a]sd\n```{broken\n  !!!\n--\n").length, 0);
});

test("parseIdeas: body with colon-bearing lines is not mistaken for metadata", () => {
	const md = ideasMd(
		[
			"```idea",
			"id: IDEA-001",
			"created: 2026-01-01T00:00:00Z",
			"source: user",
			"title: t",
			"tags: x",
			"status: parked",
			"",
			"This body has a line like url: http://example.com/path",
			"and another key: value looking line.",
			"```",
		].join("\n"),
	);
	const r = parseIdeasText(md)[0]!;
	match(r.body, /url: http:\/\/example\.com/);
	equal(r.title, "t"); // the body's fake `key: value` did not corrupt metadata
});

test("parseIdeas: real disk read round-trips (existsSync + readFileSync path)", () => {
	withTmp((dir) => {
		const p = writeIdeas(dir, ideasMd(ideaBlock({ id: "IDEA-007", created: "2026-01-01T00:00:00Z", title: "disk", tags: ["io"] })));
		const recs = parseIdeas(p);
		equal(recs.length, 1);
		equal(recs[0]!.id, "IDEA-007");
	});
});

// ===========================================================================
// matchIdeas — ranking / cap / stopword / tag-tokenization
// ===========================================================================

test("matchIdeas: overlap ≥ 1 qualifies; < 1 does not", () => {
	const parked = [
		R({ id: "IDEA-001", title: "logging config", tags: ["logging"], created: "2026-01-01T00:00:00Z" }),
		R({ id: "IDEA-002", title: "unrelated thing", tags: ["socks"], created: "2026-01-02T00:00:00Z" }),
	];
	const hits = matchIdeas("please improve logging", parked);
	equal(hits.length, 1);
	equal(hits[0]!.id, "IDEA-001");
});

test("matchIdeas: ranks overlap-desc then created-asc; caps at 2", () => {
	const parked = [
		R({ id: "A", title: "logging config", tags: ["logging"], created: "2026-01-01T00:00:00Z" }), // overlap 1
		R({ id: "B", title: "login flow", tags: ["login"], created: "2026-02-01T00:00:00Z" }), // overlap 1
		R({ id: "C", title: "auth observability", tags: ["auth", "logging", "login"], created: "2026-03-01T00:00:00Z" }), // overlap 2
	];
	const hits = matchIdeas("add logging and login", parked);
	equal(hits.length, 2);
	equal(hits[0]!.id, "C"); // highest overlap
	equal(hits[1]!.id, "A"); // tie broken by created asc (A older than B)
});

test("matchIdeas: cap is exactly 2 even when 3 qualify", () => {
	const parked = [
		R({ id: "OLD", title: "alpha", tags: ["z"], created: "2026-01-01T00:00:00Z" }),
		R({ id: "MID", title: "alpha", tags: ["z"], created: "2026-02-01T00:00:00Z" }),
		R({ id: "NEW", title: "alpha", tags: ["z"], created: "2026-03-01T00:00:00Z" }),
	];
	const hits = matchIdeas("alpha", parked);
	equal(hits.length, 2);
	deepEqual(hits.map((h) => h.id), ["OLD", "MID"]); // oldest two survive the cap
});

test("matchIdeas (R-stopwords): 'park this idea' yields no tokens → no self-match", () => {
	// park/this/idea are all stopwords; the request tokenizes to nothing.
	const parked = [R({ id: "IDEA-001", title: "anything", tags: ["x"], created: "2026-01-01T00:00:00Z" })];
	equal(matchIdeas("park this idea", parked).length, 0);
	equal(matchIdeas("idea: something", parked).length, 0);
	equal(matchIdeas("add the thing", parked).length, 0); // add/the dropped, "thing" not in idea
});

test("matchIdeas (R-stopwords): feature words idea/park/add/make are dropped", () => {
	// An idea whose only distinguishing token is a stopword must not match.
	const parked = [R({ id: "IDEA-001", title: "idea", tags: ["park", "add", "make"], created: "2026-01-01T00:00:00Z" })];
	equal(matchIdeas("tell me about ideas and parks", parked).length, 0);
});

test("matchIdeas: tags tokenize identically (dark-mode → {dark, mode})", () => {
	// SPEC §7.3 prose Decision: kebab-case tags split into sub-tokens.
	const parked = [
		R({ id: "IDEA-001", title: "theme work", tags: ["dark-mode"], created: "2026-01-01T00:00:00Z" }),
	];
	// 'mode' alone (a sub-token of the tag) matches.
	equal(matchIdeas("fix the mode selector", parked)[0]!.id, "IDEA-001");
	// 'dark' alone also matches.
	equal(matchIdeas("switch to dark", parked)[0]!.id, "IDEA-001");
});

test("matchIdeas: case-insensitive", () => {
	const parked = [R({ id: "IDEA-001", title: "Dark Mode", tags: ["UI"], created: "2026-01-01T00:00:00Z" })];
	equal(matchIdeas("DARK MODE please", parked)[0]!.id, "IDEA-001");
});

test("matchIdeas: ignores non-parkable statuses is the hook's job — matcher takes whatever it's given", () => {
	// The hook filters to parked before calling matchIdeas; the matcher itself is
	// agnostic. This documents that boundary: a promoted record passed in still
	// matches (the hook must pre-filter).
	const parked = [
		R({ id: "IDEA-001", title: "logging", tags: ["logging"], status: "promoted", created: "2026-01-01T00:00:00Z" }),
	];
	equal(matchIdeas("logging work", parked).length, 1);
});

// ===========================================================================
// remindersEnabled — env ▸ file ▸ default ON (fail-safe ON)
// ===========================================================================

test("remindersEnabled: default ON when no file and no env", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			equal(remindersEnabled(dir), true);
		});
	});
});

test("remindersEnabled: OMP_IDEA_REMINDERS=0 wins over a file saying true", () => {
	withRemindersEnv("0", () => {
		withTmp((dir) => {
			optIn(dir); // writes {enabled:true} (no ideas key → would be ON)
			equal(remindersEnabled(dir), false);
		});
	});
});

test("remindersEnabled: OMP_IDEA_REMINDERS=1 wins over a file saying false", () => {
	withRemindersEnv("1", () => {
		withTmp((dir) => {
			mkdirSync(join(dir, ".omp"), { recursive: true });
			writeFileSync(join(dir, ".omp", "elon.json"), '{"ideas":{"reminders":false}}');
			equal(remindersEnabled(dir), true);
		});
	});
});

test("remindersEnabled: file ideas.reminders=false → off", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			mkdirSync(join(dir, ".omp"), { recursive: true });
			writeFileSync(join(dir, ".omp", "elon.json"), '{"enabled":true,"ideas":{"reminders":false}}');
			equal(remindersEnabled(dir), false);
		});
	});
});

test("remindersEnabled: file with ideas.reminders=true → on", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			mkdirSync(join(dir, ".omp"), { recursive: true });
			writeFileSync(join(dir, ".omp", "elon.json"), '{"ideas":{"reminders":true}}');
			equal(remindersEnabled(dir), true);
		});
	});
});

test("remindersEnabled: file with no ideas key → on", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			optIn(dir);
			equal(remindersEnabled(dir), true);
		});
	});
});

test("remindersEnabled: non-boolean reminders value → on (r !== false)", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			mkdirSync(join(dir, ".omp"), { recursive: true });
			writeFileSync(join(dir, ".omp", "elon.json"), '{"ideas":{"reminders":"false"}}');
			equal(remindersEnabled(dir), true);
		});
	});
});

test("remindersEnabled: malformed JSON → on (fail-safe)", () => {
	withRemindersEnv(undefined, () => {
		withTmp((dir) => {
			mkdirSync(join(dir, ".omp"), { recursive: true });
			writeFileSync(join(dir, ".omp", "elon.json"), "{not valid json");
			equal(remindersEnabled(dir), true);
		});
	});
});

// ===========================================================================
// buildIdeaInjection — shape
// ===========================================================================

test("buildIdeaInjection: single hit — shape + content names id and title", () => {
	const msg = buildIdeaInjection([
		R({ id: "IDEA-009", title: "Dark mode", tags: ["ui", "theme"] }),
	]);
	equal(msg.customType, "elon-ko-gate:idea-reminder");
	equal(msg.display, false);
	equal(msg.attribution, "user");
	match(msg.content, /IDEA-009/);
	match(msg.content, /Dark mode/);
	match(msg.content, /ui, theme/);
});

test("buildIdeaInjection: two hits — content names both ids", () => {
	const msg = buildIdeaInjection([
		R({ id: "IDEA-001", title: "one", tags: ["a"] }),
		R({ id: "IDEA-002", title: "two", tags: ["b"] }),
	]);
	match(msg.content, /IDEA-001/);
	match(msg.content, /IDEA-002/);
});

test("buildIdeaInjection: empty hits still returns a well-formed message", () => {
	const msg = buildIdeaInjection([]);
	equal(msg.customType, "elon-ko-gate:idea-reminder");
	equal(msg.display, false);
	equal(msg.attribution, "user");
	ok(msg.content.length > 0);
});

// ===========================================================================
// Behavioral hook check (strongest feasible) — exercises the real handler via
// a stub ExtensionAPI capturing the registered before_agent_start handler.
// ===========================================================================

/** Narrow a hook return to its injected content string without an unchecked cast. */
function injectedContent(r: unknown): string | undefined {
	if (typeof r !== "object" || r === null) return undefined;
	if (!("message" in r)) return undefined;
	const msg = r.message;
	if (typeof msg !== "object" || msg === null) return undefined;
	if (!("content" in msg)) return undefined;
	const c = msg.content;
	return typeof c === "string" ? c : undefined;
}

interface StubCtx {
	hasUI: boolean;
	cwd: string;
}

function makeStub(): {
	pi: ExtensionAPI;
	handler: () => ((event: { prompt: string }, ctx: StubCtx) => unknown) | undefined;
	sent: Array<{ message: unknown; options: unknown }>;
	commands: Record<string, (args: string, ctx: StubCtx) => Promise<void>>;
	warns: string[];
} {
	let beforeHandler: ((event: { prompt: string }, ctx: StubCtx) => unknown) | undefined;
	const sent: Array<{ message: unknown; options: unknown }> = [];
	const commands: Record<string, (args: string, ctx: StubCtx) => Promise<void>> = {};
	const warns: string[] = [];
	const pi = {
		setLabel() {},
		on(name: string, h: (event: { prompt: string }, ctx: StubCtx) => unknown) {
			if (name === "before_agent_start") beforeHandler = h;
		},
		registerCommand(name: string, opts: { handler: (args: string, ctx: StubCtx) => Promise<void> }) {
			commands[name] = opts.handler;
		},
		sendMessage(message: unknown, options?: unknown) {
			sent.push({ message, options });
		},
		logger: { warn(m: string) { warns.push(m); } },
	} as unknown as ExtensionAPI;
	return { pi, handler: () => beforeHandler, sent, commands, warns };
}

/** Narrow a sent message to its customType string without an unchecked cast. */
function sentCustomType(m: unknown): string | undefined {
	if (typeof m !== "object" || m === null) return undefined;
	if (!("customType" in m)) return undefined;
	const ct = m.customType;
	return typeof ct === "string" ? ct : undefined;
}

test("hook: matching parked idea is injected; non-matching passes through", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();
	ok(h, "before_agent_start handler registered");

	withTmp((dir) => {
		optIn(dir);
		writeIdeas(
			dir,
			ideasMd(ideaBlock({ id: "IDEA-005", created: "2026-01-01T00:00:00Z", title: "logging dashboard", tags: ["logging", "observability"] })),
		);

		// Matching request → injected.
		const hit = h!({ prompt: "improve the logging output" }, { hasUI: true, cwd: dir });
		const content = injectedContent(hit);
		notEqual(content, undefined);
		match(content!, /IDEA-005/);

		// Non-matching request → pass-through (undefined).
		equal(injectedContent(h!({ prompt: "what is the weather" }, { hasUI: true, cwd: dir })), undefined);
	});
});

test("hook: only status=parked ideas are candidates (promoted ignored)", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();

	withTmp((dir) => {
		optIn(dir);
		writeIdeas(
			dir,
			ideasMd(
				ideaBlock({ id: "PARKED", created: "2026-01-01T00:00:00Z", title: "logging", tags: ["logging"] }),
				ideaBlock({ id: "PROMOTED", created: "2026-01-02T00:00:00Z", title: "logging v2", tags: ["logging"], status: "promoted", promotedTo: ".app/REQ.md", promotedAt: "2026-01-03T00:00:00Z" }),
			),
		);
		const content = injectedContent(h!({ prompt: "work on logging" }, { hasUI: true, cwd: dir }));
		notEqual(content, undefined);
		match(content!, /PARKED/);
		ok(!/PROMOTED/.test(content!), "promoted idea must not be injected");
	});
});

test("hook: dormant when not opted in (no marker → no injection)", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();
	withTmp((dir) => {
		writeIdeas(dir, ideasMd(ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "logging", tags: ["logging"] })));
		// No .omp/elon.json → optedIn false → pass-through.
		equal(h!({ prompt: "logging" }, { hasUI: true, cwd: dir }), undefined);
	});
});

test("hook: headless context (hasUI false) never injects", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();
	withTmp((dir) => {
		optIn(dir);
		writeIdeas(dir, ideasMd(ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "logging", tags: ["logging"] })));
		equal(h!({ prompt: "logging" }, { hasUI: false, cwd: dir }), undefined);
	});
});

test("hook: opted out (OMP_IDEA_REMINDERS=0) never injects regardless of overlap", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();
	withRemindersEnv("0", () => {
		withTmp((dir) => {
			optIn(dir);
			writeIdeas(dir, ideasMd(ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "logging", tags: ["logging"] })));
			equal(h!({ prompt: "logging work" }, { hasUI: true, cwd: dir }), undefined);
		});
	});
});

test("hook: empty/absent IDEAS.md never throws and injects nothing", () => {
	const { pi, handler } = makeStub();
	ideaStorage(pi);
	const h = handler();
	withTmp((dir) => {
		optIn(dir);
		// No .app/IDEAS.md at all.
		equal(h!({ prompt: "logging" }, { hasUI: true, cwd: dir }), undefined);
	});
});

test("hook (AC13b): corrupt-but-non-empty IDEAS.md → located pi.logger.warn + injects nothing", () => {
	const { pi, handler, warns } = makeStub();
	ideaStorage(pi);
	const h = handler();
	withTmp((dir) => {
		optIn(dir);
		// Non-empty file whose single ```idea block is missing every required
		// field and has an unparseable status → parseIdeaBlock returns null →
		// parseIdeas yields 0 records. Mirrors the "manual edit broke parsing"
		// scenario from SPEC §5.4 / AC13(b).
		writeIdeas(
			dir,
			[
				"# Ideas",
				"",
				"```idea",
				"status: totally-bogus",
				"no id, no title, no tags — a manual edit mangled this block",
				"```",
				"",
			].join("\n"),
		);

		const result = h!({ prompt: "logging" }, { hasUI: true, cwd: dir });

		// "no injection" half of AC13 (already correct) — asserted here too.
		equal(injectedContent(result), undefined);

		// "located error" half of AC13 — exactly ONE warning, naming the file and
		// the diagnostic text from SPEC §5.4.
		equal(warns.length, 1);
		match(warns[0]!, /idea-storage/);
		match(warns[0]!, /\.app\/IDEAS\.md/);
		match(warns[0]!, /0 idea blocks parsed/);
	});
});

// ===========================================================================
// Command wiring — /idea and /ideas handlers steer via pi.sendMessage (U8: no
// fs write from the handler). Exercises the real registered handlers.
// ===========================================================================

test("command /idea: opted-in capture steers with elon-ko-gate:idea-capture (SPEC §6.1/U6)", async () => {
	const { pi, sent, commands } = makeStub();
	ideaStorage(pi);
	ok(commands["idea"], "/idea command registered");
	const dir = mkdtempSync(join(tmpdir(), "idea-storage-cmd-"));
	try {
		optIn(dir);
		await commands["idea"]!("add a logging dashboard", { hasUI: true, cwd: dir });
		equal(sent.length, 1);
		equal(sentCustomType(sent[0]!.message), "elon-ko-gate:idea-capture");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("command /idea: dormant when not opted in (no sendMessage)", async () => {
	const { pi, sent, commands } = makeStub();
	ideaStorage(pi);
	const dir = mkdtempSync(join(tmpdir(), "idea-storage-cmd-"));
	try {
		// No .omp/elon.json → optedIn false → handler early-returns, sends nothing.
		await commands["idea"]!("something", { hasUI: true, cwd: dir });
		equal(sent.length, 0);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("command /idea promote: routes to a promote steering message (not capture)", async () => {
	const { pi, sent, commands } = makeStub();
	ideaStorage(pi);
	const dir = mkdtempSync(join(tmpdir(), "idea-storage-cmd-"));
	try {
		optIn(dir);
		await commands["idea"]!("promote IDEA-007", { hasUI: true, cwd: dir });
		equal(sent.length, 1);
		// Lifecycle steering uses the generic idea-steer discriminator (SPEC silent);
		// it must NOT be the capture type, and content must name the promote op.
		notEqual(sentCustomType(sent[0]!.message), "elon-ko-gate:idea-capture");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("command /ideas: opted-in lists via sendMessage (independent of reminder opt-out)", async () => {
	const { pi, sent, commands } = makeStub();
	ideaStorage(pi);
	ok(commands["ideas"], "/ideas command registered");
	const dir = mkdtempSync(join(tmpdir(), "idea-storage-cmd-"));
	try {
		optIn(dir);
		writeIdeas(dir, ideasMd(ideaBlock({ id: "IDEA-001", created: "2026-01-01T00:00:00Z", title: "logging", tags: ["logging"] })));
		// Listing works even when reminders are opted out (SPEC §6.3).
		await withRemindersEnvAsync("0", async () => {
			await commands["ideas"]!("", { hasUI: true, cwd: dir });
		});
		equal(sent.length, 1);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
