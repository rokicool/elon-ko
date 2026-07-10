#!/usr/bin/env bash
#
# validate-plugins.sh — structural integrity check for BOTH oh-my-pi plugins
# shipped from this repo:
#
#   Plugin A  elon-ko-gate          extension-package (package.json#omp.extensions)
#   Plugin B  elon-ko-agents     marketplace (.omp-plugin/marketplace.json)
#
# Run anywhere; needs only bash + jq. The TypeScript typecheck (Plugin A) is a
# separate step (`npm run typecheck`), not part of this script — it needs the
# toolchain. This script checks file presence, manifest shape, and agent/skill
# coverage so a broken tree never reaches `omp plugin install`.
#
#   usage: bash scripts/validate-plugins.sh
#   exit:  0 = all checks passed, 1 = one or more checks failed
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v jq >/dev/null 2>&1 || { echo "✘ jq is required (not on PATH)" >&2; exit 1; }

ERRS="$(mktemp)"
trap 'rm -f "$ERRS"' EXIT

err()  { echo "✘ $*" >&2; printf '%s\n' "$*" >>"$ERRS"; }
ok()   { echo "✔ $*"; }
note() { echo "  $*"; }

have() { [ -e "$1" ]; }   # exists (file or dir)

# ──────────────────────────────────────────────────────────────────────────────
# Plugin A — elon-ko-gate (extension-package)
# ──────────────────────────────────────────────────────────────────────────────
echo "== Plugin A: elon-ko-gate (extension-package) =="

if have package.json && jq -e . package.json >/dev/null 2>&1; then
  ok "package.json is valid JSON"
else
  err "package.json missing or invalid JSON"
fi

# omp.extensions must be a non-empty array of existing files.
if jq -e '.omp.extensions | type == "array" and length > 0' package.json >/dev/null 2>&1; then
  ok "package.json#omp.extensions is a non-empty array"
  while IFS= read -r ext; do
    [ -n "$ext" ] || continue
    if have "$ext"; then ok "extension entry exists: $ext"; else err "extension entry missing: $ext"; fi
  done < <(jq -r '.omp.extensions[]' package.json)
else
  err "package.json#omp.extensions must be a non-empty array of paths"
fi

# Sibling asset the extension reads at load (src/enforce-orchestrator.ts:89).
if have src/append-system.default.md; then ok "bundled asset present: src/append-system.default.md"
else err "missing src/append-system.default.md (loaded by the extension at runtime)"; fi

# Shipped rule (alwaysApply).
if have rules/ro-definition-of-done.md; then
  ok "rule present: rules/ro-definition-of-done.md"
  if head -n1 rules/ro-definition-of-done.md | grep -q '^---'; then
    ok "rule has YAML frontmatter"
  else
    err "rules/ro-definition-of-done.md missing '---' frontmatter opener"
  fi
else
  err "missing rules/ro-definition-of-done.md"
fi

# ──────────────────────────────────────────────────────────────────────────────
# Plugin B — elon-ko-agents (marketplace)
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "== Plugin B: elon-ko-agents (marketplace) =="

MP=".omp-plugin/marketplace.json"
if have "$MP" && jq -e . "$MP" >/dev/null 2>&1; then
  ok "$MP is valid JSON"
else
  err "$MP missing or invalid JSON"
fi

PROOT="$(jq -r '.metadata.pluginRoot // "."' "$MP" 2>/dev/null)"
if have "$PROOT"; then ok "metadata.pluginRoot resolves: $PROOT"
else err "metadata.pluginRoot directory missing: $PROOT"; fi

NPLUG="$(jq -r '.plugins | length' "$MP" 2>/dev/null)"
if [ "${NPLUG:-0}" -gt 0 ] 2>/dev/null; then ok "plugins listed: $NPLUG"
else err "no plugins listed in $MP (.plugins[] is empty)"; fi

# Per-plugin checks: source dir resolves, every named agent file exists and has
# required frontmatter, every skill dir carries a SKILL.md.
while IFS=$'\t' read -r pname psource; do
  [ -n "$pname" ] || { err "found a plugin entry with no name"; continue; }

  # Resolve the plugin source against metadata.pluginRoot.
  rel="${psource#./}"
  pdir="$PROOT/$rel"
  if have "$pdir"; then ok "plugin '$pname' source resolves: $pdir"
  else err "plugin '$pname' source dir missing: $pdir (source=$psource, pluginRoot=$PROOT)"; continue; fi

  # Agents declared in the marketplace entry must each have a definition file.
  declared="$(jq -r --arg p "$pname" '.plugins[]|select(.name==$p)|(.agents//[])[]' "$MP" 2>/dev/null)"
  for a in $declared; do
    af="$pdir/agents/$a.md"
    if have "$af"; then ok "agent '$a' -> $af"
    else err "plugin '$pname' declares agent '$a' but $af is missing"; fi
  done

  # Every shipped agent .md must carry name + description frontmatter.
  shopt -s nullglob
  for af in "$pdir"/agents/*.md; do
    fm="$(awk 'NR==1&&/^---/{f=1;next} /^---/{exit} f' "$af")"
    base="$(basename "$af")"
    if printf '%s\n' "$fm" | grep -q '^name:'; then :; else err "$base: frontmatter missing 'name'"; fi
    if printf '%s\n' "$fm" | grep -q '^description:'; then :; else err "$base: frontmatter missing 'description'"; fi
  done

  # Every skill dir must contain SKILL.md.
  found_skills=0
  for sd in "$pdir"/skills/*/; do
    [ -d "$sd" ] || continue
    found_skills=$((found_skills + 1))
    sn="$(basename "$sd")"
    if have "$sd/SKILL.md"; then ok "skill '$sn' -> ${sd}SKILL.md"
    else err "skill '$sn' missing SKILL.md in $sd"; fi
  done
  [ "$found_skills" -gt 0 ] && note "plugin '$pname': $found_skills skill(s)"
  shopt -u nullglob
done < <(jq -r '.plugins[] | "\(.name)\t\(.source)"' "$MP" 2>/dev/null)

# ──────────────────────────────────────────────────────────────────────────────
# Plugin B — roster & tool-agreement (source-of-truth, SPEC §3.2 Steps A–I)
# Parses scaffold/PROTO.md's ```elon-ko-roster block and asserts every consumer
# (gate TEAM, mess-transport TEAM, skill://elon registry, marketplace, each
# agent's frontmatter tools/spawns, each skill <allowed>/<forbidden>, and the
# .omp/ + .agents/ dev-session mirrors) agrees with it. Drift ⇒ err.
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "== Plugin B: roster & tool-agreement (source-of-truth) =="

# Canonical sort+dedup of a comma-csv into a sorted-unique comma-joined string.
norm_csv() { printf '%s\n' "$1" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | sort -u | paste -sd',' -; }
# Collect quoted lowercase names from a `const TEAM = [ … ] as const;` array
# (handles single- and multi-line forms).
team_names() { awk '/const TEAM = \[/{p=1} p{print} p&&/\] as const;/{p=0}' "$1" | grep -oE '"[a-z]+"' | tr -d '"' | sort -u | paste -sd',' -; }

ROSTER_FILE="scaffold/PROTO.md"
ROSTER_TMP="$(mktemp)"
trap 'rm -f "$ERRS" "$ROSTER_TMP"' EXIT

# ── Step A: parse the canonical roster from PROTO.md's ```elon-ko-roster block ──
if [ ! -f "$ROSTER_FILE" ]; then
  err "missing $ROSTER_FILE — the canonical roster source of truth"
else
  awk '/^```elon-ko-roster$/{f=1;next} f&&/^```$/{f=0;next} f' "$ROSTER_FILE" | grep -v '^#' > "$ROSTER_TMP"
  rcount="$(grep -c . "$ROSTER_TMP")"
  if [ "${rcount:-0}" -lt 1 ]; then
    err "$ROSTER_FILE: no \`\`\`elon-ko-roster block found (or it is empty)"
  else
    ok "PROTO.md roster parsed: $rcount entity/entities declared"
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      fc="$(printf '%s' "$line" | awk -F'|' '{print NF}')"
      [ "$fc" -eq 7 ] || err "PROTO.md roster: malformed line (expected 7 |-fields, got $fc): $line"
    done < "$ROSTER_TMP"
  fi
fi

# Steps B–I only run when a roster was parsed (else Step A already errored).
if [ -s "$ROSTER_TMP" ]; then

# ── Step B: gate TEAM (who Elon may spawn) == roster { spawner ∋ elon } ──
gate_team="$(team_names src/enforce-orchestrator.ts)"
exp=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; sp="$(printf '%s' "$line" | cut -d'|' -f3)"
  case ",$sp," in *",elon,"*) exp="${exp:+$exp,}$name";; esac
done < "$ROSTER_TMP"
exp="$(norm_csv "$exp")"
[ "$gate_team" = "$exp" ] && ok "gate TEAM == roster Elon-spawnable set: $exp" || err "gate TEAM ($gate_team) != roster Elon-spawnable set ($exp)"

# ── Step C: mess-transport TEAM == roster { mess==yes, name!=elon }; main addressable ──
mess_team="$(team_names src/mess-transport.ts)"
exp=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; mess="$(printf '%s' "$line" | cut -d'|' -f7)"
  [ "$name" = "elon" ] && continue
  [ "$mess" = "yes" ] && exp="${exp:+$exp,}$name"
done < "$ROSTER_TMP"
exp="$(norm_csv "$exp")"
[ "$mess_team" = "$exp" ] && ok "mess-transport TEAM == roster mess-capable (non-elon): $exp" || err "mess-transport TEAM ($mess_team) != roster mess-capable set ($exp)"
if grep -qE 'ADDRESSABLE.*"main"' src/mess-transport.ts; then ok "mess-transport ADDRESSABLE includes 'main' (Elon)"
else err "mess-transport ADDRESSABLE does not include 'main'"; fi

# ── Step D: skill://elon <agent_registry> == 9 non-elon roster agents ──
registry="$(awk '/<agent_registry>/{f=1;next} f&&/<\/agent_registry>/{f=0;next} f' plugins/agents/skills/elon/SKILL.md | grep -oE '<agent name="[A-Za-z]+"' | sed -E 's/.*name="([A-Za-z]+)".*/\1/' | tr 'A-Z' 'a-z' | sort -u | paste -sd',' -)"
exp=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; [ "$name" = "elon" ] && continue
  exp="${exp:+$exp,}$name"
done < "$ROSTER_TMP"
exp="$(norm_csv "$exp")"
[ "$registry" = "$exp" ] && ok "skill://elon <agent_registry> lists all 9 roster agents: $exp" || err "skill://elon <agent_registry> ($registry) != 9 roster agents ($exp)"

# ── Step E: marketplace roster == 9 non-elon agents; count=9; description tags ──
mp_agents="$(jq -r '.plugins[0].agents | sort | join(",")' "$MP" 2>/dev/null)"
mp_count="$(jq -r '.plugins[0].count' "$MP" 2>/dev/null)"
mp_desc="$(jq -r '.plugins[0].description' "$MP" 2>/dev/null)"
[ "$mp_agents" = "$exp" ] && ok "marketplace agents == roster: $exp" || err "marketplace agents ($mp_agents) != 9 roster agents ($exp)"
[ "$mp_count" = "9" ] && ok "marketplace count = 9" || err "marketplace count ($mp_count) != 9"
case "$mp_desc" in *"9-agent"*"10 skills"*) ok "marketplace description embeds '9-agent' + '10 skills'";; *) err "marketplace description missing '9-agent'/'10 skills': $mp_desc";; esac

# ── Step F: each distributed agent's frontmatter tools: == roster tools ──
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; [ "$name" = "elon" ] && continue
  rt="$(norm_csv "$(printf '%s' "$line" | cut -d'|' -f5)")"
  af="plugins/agents/agents/$name.md"
  if [ ! -f "$af" ]; then err "missing agent definition $af"; continue; fi
  ft="$(norm_csv "$(awk 'NR==1&&/^---/{f=1;next} /^---/{exit} f' "$af" | sed -n 's/^tools:[[:space:]]*//p' | head -1)")"
  [ "$ft" = "$rt" ] && ok "frontmatter tools agree: $name" || err "$name: frontmatter tools ($ft) != roster ($rt)"
done < "$ROSTER_TMP"

# ── Step G: each skill <allowed> == roster tools; <forbidden> ∩ tools == ∅ ──
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"
  rt="$(norm_csv "$(printf '%s' "$line" | cut -d'|' -f5)")"
  sf="plugins/agents/skills/$name/SKILL.md"
  if [ ! -f "$sf" ]; then err "missing skill $sf"; continue; fi
  al="$(awk '/<allowed>/{f=1;next} f&&/<\/allowed>/{f=0;next} f' "$sf" | grep -oE '<tool name="[A-Za-z0-9_-]+"' | sed -E 's/.*name="([A-Za-z0-9_-]+)".*/\1/' | sort -u | paste -sd',' -)"
  al="$(norm_csv "$al")"
  [ "$al" = "$rt" ] && ok "<allowed> agrees with tools: $name" || err "$name: skill <allowed> ($al) != roster tools ($rt)"
  forb="$(awk '/<forbidden>/{f=1;next} f&&/<\/forbidden>/{f=0;next} f' "$sf" | grep -oE '<tool name="[A-Za-z0-9_-]+"' | sed -E 's/.*name="([A-Za-z0-9_-]+)".*/\1/' | sort -u | paste -sd',' -)"
  if [ -n "$forb" ]; then
    inter="$(printf '%s\n%s\n' "$forb" "$rt" | tr ',' '\n' | grep -v '^$' | sort | uniq -d | paste -sd',' -)"
    [ -z "$inter" ] || err "$name: a granted tool appears in <forbidden> ($inter) — tools and forbidden must be disjoint"
  fi
done < "$ROSTER_TMP"

# ── Step H: frontmatter spawns: == roster spawns (where roster spawns != -) ──
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; rsp="$(printf '%s' "$line" | cut -d'|' -f4)"
  [ "$rsp" = "-" ] && continue
  af="plugins/agents/agents/$name.md"
  if [ ! -f "$af" ]; then err "missing $af for spawns check"; continue; fi
  fm_sp="$(awk 'NR==1&&/^---/{f=1;next} /^---/{exit} f' "$af" | sed -n 's/^spawns:[[:space:]]*//p' | head -1)"
  rs="$(norm_csv "$rsp")"; fs="$(norm_csv "$fm_sp")"
  [ "$fs" = "$rs" ] && ok "spawns agree: $name ($fs)" || err "$name: frontmatter spawns ($fs) != roster ($rs)"
done < "$ROSTER_TMP"

# ── Step I: dev-session mirrors byte-identical to plugins/ (SPEC §4.4) ──
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"; [ "$name" = "elon" ] && continue
  src="plugins/agents/agents/$name.md"; dst=".omp/agents/$name.md"
  if [ ! -f "$dst" ]; then err "agent mirror missing: $dst"
  elif cmp -s "$src" "$dst"; then ok "agent mirror byte-identical: $dst"
  else err "agent mirror drift: $dst != $src"; fi
done < "$ROSTER_TMP"
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="$(printf '%s' "$line" | cut -d'|' -f1)"
  src="plugins/agents/skills/$name/SKILL.md"; dst=".agents/skills/$name/SKILL.md"
  if [ ! -f "$dst" ]; then err "skill mirror missing: $dst"
  elif cmp -s "$src" "$dst"; then ok "skill mirror byte-identical: $dst"
  else err "skill mirror drift: $dst != $src"; fi
done < "$ROSTER_TMP"

fi   # end `[ -s "$ROSTER_TMP" ]` (Steps B–I guard)

# ──────────────────────────────────────────────────────────────────────────────
echo
nerr=0
[ -s "$ERRS" ] && nerr="$(grep -c . "$ERRS")"
if [ "$nerr" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
fi
echo "VALIDATION FAILED — $nerr error(s)"
exit 1
