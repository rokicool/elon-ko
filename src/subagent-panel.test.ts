// subagent-panel.test.ts — focused regression test for the macOS Option+S
// panel toggle, using Node's built-in test runner. Mirrors dot-agreement.test.ts.
//
// Root cause under test: on default macOS terminals (Ghostty / Terminal.app,
// Option NOT treated as Alt), Option+S emits the *composed* char "ß" (U+00DF).
// pi-tui's parseKey() returns null for that byte, so CustomEditor.handleInput
// sets canonical=undefined and skips the ENTIRE extension-shortcut dispatch
// block — registerShortcut("alt+s") can therefore never fire for it and the
// panel stays unreachable (the recurring "still not available" bug). The fix
// adds a raw terminal-input listener (ctx.ui.onTerminalInput) that catches the
// composed byte and toggles the overlay directly.
//
// These tests pin (a) the pure helper, (b) the parseKey root cause, and
// (c) the end-to-end "ß -> overlay opens" behavior through a stub ExtensionAPI.

import { test } from "node:test";
import { equal, ok } from "node:assert";
import { parseKey } from "@oh-my-pi/pi-tui";

import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import subagentPanel, { macosOptionComposedFor, matchesOptionToggle } from "./subagent-panel.ts";

// ---------------------------------------------------------------------------
// Pure helper
// ---------------------------------------------------------------------------

test("macosOptionComposedFor: default Alt+S resolves to the macOS composed ß", () => {
	// The plugin's TOGGLE_KEY is the lowercased display chord ("Alt+S" -> "alt+s").
	equal(macosOptionComposedFor("alt+s"), "ß");
	equal(macosOptionComposedFor("Alt+S".toLowerCase()), "ß");
	// Other single-letter alt toggles resolve to their macOS glyph...
	equal(macosOptionComposedFor("alt+p"), "π");
	// ...dead-key letters (e/i/k/n/u emit combining marks) are intentionally omitted...
	equal(macosOptionComposedFor("alt+e"), undefined);
	// ...and modifier combos / named keys have no single composed byte.
	equal(macosOptionComposedFor("ctrl+alt+s"), undefined);
	equal(macosOptionComposedFor("escape"), undefined);
});

// ---------------------------------------------------------------------------
// Root cause: the shortcut path is structurally blind to the composed byte
// ---------------------------------------------------------------------------

test("root cause: parseKey(ß) is null — registerShortcut cannot match Option+S on default macOS", () => {
	// parseKey returning null means CustomEditor.handleInput computes canonical=
	// undefined and skips the WHOLE `if (canonical !== undefined)` block, which is
	// the only place extension shortcuts (#customMatchKeys) are consulted. No
	// registerShortcut keyId — not "alt+s", not "ß" itself — can ever fire here.
	equal(parseKey("ß"), null);
});

// ---------------------------------------------------------------------------
// Behavioral fixture
// ---------------------------------------------------------------------------

interface Fixture {
	api: ExtensionAPI;
	ctx: ExtensionContext;
	startHandler?: (e: unknown, ctx: ExtensionContext) => void;
	shutdownHandler?: () => void;
	terminalInputHandler?: (data: string) => unknown;
	customCalls: number;
	registeredKey?: string;
	overlayComponent?: { handleInput: (data: string) => void };  // the focused overlay Component, if a factory was invoked
	overlayInputCalls: string[];                                  // every data the overlay's handleInput received
}

function makeFixture(): Fixture {
	const f: Fixture = { api: undefined as never, ctx: undefined as never, customCalls: 0, overlayInputCalls: [] };
	f.api = {
		setLabel: () => {},
		on: (event: string, handler: (...a: unknown[]) => unknown) => {
			if (event === "session_start") f.startHandler = handler as Fixture["startHandler"];
			if (event === "session_shutdown") f.shutdownHandler = handler as Fixture["shutdownHandler"];
		},
		registerShortcut: (key: string) => {
			f.registeredKey = key;
		},
		events: { on: () => () => {} },
	} as unknown as ExtensionAPI;
	f.ctx = {
		hasUI: true,
		cwd: "/tmp",
		ui: {
			onTerminalInput: (handler: (data: string) => unknown) => {
				f.terminalInputHandler = handler;
				return () => {
					f.terminalInputHandler = undefined;
				};
			},
			custom: (factory: ((...args: unknown[]) => unknown) | undefined) => {
				f.customCalls++;
				if (typeof factory === "function") {
					const stubTui = { terminal: { rows: 24 } };
					const comp = factory(stubTui, undefined, undefined, () => {}) as
						| { handleInput?: (data: string) => void }
						| undefined;
					if (comp && typeof comp.handleInput === "function") {
						const real = comp.handleInput.bind(comp);
						f.overlayComponent = {
							handleInput: (data: string) => {
								f.overlayInputCalls.push(data);
								real(data);
							},
						};
						// Re-point the component the plugin keeps a reference to via the
						// factory return: the plugin stores the returned Component as the
						// overlay component, so swap its handleInput to the spy.
						comp.handleInput = f.overlayComponent.handleInput;
					}
				}
				return Promise.resolve(undefined);
			},
			setWidget: () => {},
			setStatus: () => {},
		},
	} as unknown as ExtensionContext;
	return f;
}

// ---------------------------------------------------------------------------
// Behavioral: activate wires BOTH the alt-shortcut AND the macOS listener
// ---------------------------------------------------------------------------

test("activate wires both the alt-shortcut and the macOS composed-byte listener", () => {
	const f = makeFixture();
	subagentPanel(f.api);
	try {
		ok(f.startHandler, "session_start handler registered");
		f.startHandler!(undefined, f.ctx);
		// Alt-aware terminals (ESC+s / Kitty alt) still get the shortcut.
		equal(f.registeredKey, "alt+s");
		// macOS default terminals get the raw-input fallback.
		ok(f.terminalInputHandler, "onTerminalInput listener installed");
	} finally {
		f.shutdownHandler?.(); // clears the 1s sweep interval so the run exits
	}
});

// ---------------------------------------------------------------------------
// Behavioral: the Option+S byte (ß) opens the overlay and is consumed
// ---------------------------------------------------------------------------

test("Option+S byte (ß) opens the overlay and is consumed; other input passes through", () => {
	const f = makeFixture();
	subagentPanel(f.api);
	try {
		f.startHandler!(undefined, f.ctx);

		const before = f.customCalls;
		// The exact string a default macOS terminal delivers for Option+S.
		const result = f.terminalInputHandler!("ß");
		equal(JSON.stringify(result), JSON.stringify({ consume: true }), "ß is consumed");
		equal(f.customCalls, before + 1, "overlay (ctx.ui.custom) opened on ß");

		// Plain "s" and empty input must pass through untouched.
		equal(f.terminalInputHandler!("s"), undefined);
		equal(f.terminalInputHandler!(""), undefined);
	} finally {
		f.shutdownHandler?.();
	}
});

// ---------------------------------------------------------------------------
// Pure matcher: every recognized Option+<letter> byte encoding (SPEC §8.1)
// ---------------------------------------------------------------------------

test("matchesOptionToggle: recognizes every Option+S encoding family and rejects collisions", () => {
	const cases: Array<{ id: string; data: string; letter: string; composed: string | undefined; expected: boolean }> = [
		// F1 — raw composed glyph (v2.1.2 regression path).
		{ id: "TC-1",   data: "ß",                 letter: "s", composed: "ß", expected: true },
		// F2 — structured codepoint 223 (ß) under modifyOtherKeys / Kitty CSI-u (ghostty 1.3.x #9406).
		{ id: "TC-2a",  data: "\x1b[27;1;223~",     letter: "s", composed: "ß", expected: true },
		{ id: "TC-2b",  data: "\x1b[27;2;223~",     letter: "s", composed: "ß", expected: true },
		{ id: "TC-3",   data: "\x1b[223;1u",        letter: "s", composed: "ß", expected: true },
		{ id: "TC-3b",  data: "\x1b[223;3u",        letter: "s", composed: "ß", expected: true },
		// F3 — alt-prefix ESC + s (macos-option-as-alt=true).
		{ id: "TC-4",   data: "\x1bs",             letter: "s", composed: "ß", expected: true },
		// F4 — structured codepoint 115 (s) WITH Alt.
		{ id: "TC-5a",  data: "\x1b[27;3;115~",     letter: "s", composed: "ß", expected: true },
		{ id: "TC-5b",  data: "\x1b[115;3u",        letter: "s", composed: "ß", expected: true },
		// Collisions that must NOT toggle (plain s / unrelated).
		{ id: "TC-7a",  data: "s",                 letter: "s", composed: "ß", expected: false },
		{ id: "TC-7b",  data: "\x1b[115;1u",        letter: "s", composed: "ß", expected: false },
		{ id: "TC-7c",  data: "\x1b[115u",          letter: "s", composed: "ß", expected: false },
		{ id: "TC-7d-up",data: "\x1b[A",            letter: "s", composed: "ß", expected: false },
		{ id: "TC-7d-a", data: "a",                letter: "s", composed: "ß", expected: false },
		// Generalization: Alt+P -> π (codepoint 960).
		{ id: "TC-9a",  data: "π",                 letter: "p", composed: "π", expected: true },
		{ id: "TC-9b",  data: "\x1b[27;1;960~",     letter: "p", composed: "π", expected: true },
	];
	for (const c of cases) {
		equal(matchesOptionToggle(c.data, c.letter, c.composed), c.expected, `${c.id}: matchesOptionToggle(${JSON.stringify(c.data)}, ${JSON.stringify(c.letter)}, ${JSON.stringify(c.composed)})`);
	}
});

// ---------------------------------------------------------------------------
// Behavioral: every recognized encoding drives the captured onTerminalInput
// handler, opens the overlay, and is consumed (SPEC §8.2: TC-1e, TC-2e, TC-4e)
// ---------------------------------------------------------------------------

test("every recognized Option+S byte opens the overlay and is consumed (TC-1e/TC-2e/TC-4e)", () => {
	const encodings: Array<{ id: string; data: string }> = [
		{ id: "TC-1e", data: "ß" },             // composed glyph
		{ id: "TC-2e", data: "\x1b[27;1;223~" }, // ghostty 1.3.x #9406 simulation (structured codepoint 223)
		{ id: "TC-4e", data: "\x1bs" },         // ESC+s alt-prefix
	];
	for (const enc of encodings) {
		const f = makeFixture();
		subagentPanel(f.api);
		try {
			f.startHandler!(undefined, f.ctx);
			const before = f.customCalls;
			const result = f.terminalInputHandler!(enc.data);
			equal(JSON.stringify(result), JSON.stringify({ consume: true }), `${enc.id}: ${JSON.stringify(enc.data)} is consumed`);
			equal(f.customCalls, before + 1, `${enc.id}: overlay opened (ctx.ui.custom called)`);
		} finally {
			f.shutdownHandler?.();
		}
	}
});

// ---------------------------------------------------------------------------
// TC-6 / OQ-2 resolution: the global onTerminalInput listener handles BOTH
// open and close, so the focused-overlay close path (SPEC §5.4) is redundant
// and is OMITTED. Ground truth: omp's TUI dispatches global input listeners
// BEFORE the focused component's handleInput, and {consume:true} short-
// circuits the whole pipeline (pi-tui/src/tui.ts #handleInput: the
// `for (const listener of this.#inputListeners)` loop runs first and `return`s
// on `result?.consume`; `this.#focusedComponent.handleInput(data)` runs only
// afterward). Therefore when the overlay is focused and the toggle byte
// arrives, the global listener fires first, calls toggleOverlay (which closes
// because overlayCloser is set), and consumes the byte — the focused overlay's
// handleInput never sees it. No second close path is needed.
// ---------------------------------------------------------------------------

test("TC-6: the global onTerminalInput listener closes the open overlay and pre-empts the focused overlay (§5.4 omitted)", () => {
	const f = makeFixture();
	subagentPanel(f.api);
	try {
		f.startHandler!(undefined, f.ctx);

		// Open: feed the structured codepoint-223 form (#9406 simulation).
		const openBefore = f.customCalls;
		const openResult = f.terminalInputHandler!("\x1b[27;1;223~");
		equal(JSON.stringify(openResult), JSON.stringify({ consume: true }), "open: structured ß is consumed");
		equal(f.customCalls, openBefore + 1, "open: overlay mounted (ctx.ui.custom called once)");
		ok(f.overlayComponent, "open: overlay component was created and captured");

		// Close: feed the SAME byte again. The global listener runs first, sees
		// the overlay is open (overlayCloser set) and closes it WITHOUT calling
		// ctx.ui.custom again — so customCalls must NOT increment.
		const closeBefore = f.customCalls;
		const closeResult = f.terminalInputHandler!("\x1b[27;1;223~");
		equal(JSON.stringify(closeResult), JSON.stringify({ consume: true }), "close: same byte is consumed by the global listener");
		equal(f.customCalls, closeBefore, "close: toggleOverlay early-returned on overlayCloser (no new ctx.ui.custom call)");

		// The decisive §5.4 fact: the focused overlay's handleInput NEVER received
		// the toggle byte, because the global listener consumed it first. If this
		// ever changes (omp reorders dispatch), this assertion fails and §5.4
		// must be re-evaluated.
		equal(f.overlayInputCalls.length, 0, "§5.4 guard: focused overlay handleInput never saw the toggle byte (global listener pre-empted it)");
	} finally {
		f.shutdownHandler?.();
	}
});

// ---------------------------------------------------------------------------
// Behavioral: collisions do NOT toggle through the handler either (SPEC §8.2)
// ---------------------------------------------------------------------------

test("plain s, Kitty text-mode s, and up-arrow do NOT toggle via the handler", () => {
	const f = makeFixture();
	subagentPanel(f.api);
	try {
		f.startHandler!(undefined, f.ctx);
		const before = f.customCalls;
		for (const data of ["s", "\x1b[115;1u", "\x1b[A", "a"]) {
			equal(f.terminalInputHandler!(data), undefined, `${JSON.stringify(data)} passes through`);
		}
		equal(f.customCalls, before, "no overlay opened on collision inputs");
	} finally {
		f.shutdownHandler?.();
	}
});
