#!/usr/bin/env bash
# elon-ko installer — pure local copy (no network, no marketplace, no pinning).
# Usage: ./install.sh [target-repo] [--no-proto] [--dry-run]
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET=""
DRY_RUN=0
WITH_PROTO=1

for arg in "$@"; do
  case "$arg" in
    --no-proto) WITH_PROTO=0 ;;
    --dry-run)  DRY_RUN=1 ;;
    -h|--help)
      echo "Usage: ./install.sh [target-repo] [--no-proto] [--dry-run]"
      echo "  Copies elon-ko content (agents, skills, RULES.md, PROTO.md) into <target-repo> (default: cwd)."
      exit 0 ;;
    *) TARGET="$arg" ;;
  esac
done

[ -n "$TARGET" ] || TARGET="$PWD"
if [ ! -d "$TARGET" ]; then
  echo "error: target directory not found: $TARGET" >&2
  exit 1
fi
TARGET="$(cd "$TARGET" && pwd)"

# Refuse to run inside the elon-ko repo itself (both source markers present).
if [ -f "$SRC/.omp/agents/leaddev.md" ] && grep -q '^# elon-ko$' "$SRC/README.md" 2>/dev/null; then
  if [ "$TARGET" = "$SRC" ]; then
    echo "error: refusing to install elon-ko into itself — pass a target repo: ./install.sh /path/to/project" >&2
    exit 1
  fi
fi

run() { # run <dir> <action-desc> <cmd...>
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  would $2"
  else
    mkdir -p "$1"
    "${@:3}"
    echo "  $2"
  fi
}
copy() { # copy <dest-dir> <src> <dest-file>
  run "$1" "copy $(basename "$2") -> ${3#"$TARGET"/}" cp "$2" "$3"
}

echo "Installing elon-ko into: $TARGET$([ "$DRY_RUN" -eq 1 ] && echo ' (dry run)')"

if [ -f "$TARGET/.omp/RULES.md" ] && [ "$DRY_RUN" -eq 0 ]; then
  echo "  note: <target>/.omp/RULES.md already exists — it will be overwritten." >&2
fi

# Agents
for f in "$SRC"/.omp/agents/*.md; do
  copy "$TARGET/.omp/agents" "$f" "$TARGET/.omp/agents/$(basename "$f")"
done

# Skills
for d in "$SRC"/.agents/skills/*/; do
  name="$(basename "$d")"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  would copy skill $name -> .agents/skills/$name/"
  else
    mkdir -p "$TARGET/.agents/skills/$name"
    cp -R "$d." "$TARGET/.agents/skills/$name/"
    echo "  copy skill $name -> .agents/skills/$name/"
  fi
done

# Rules (sticky, auto-loaded)
copy "$TARGET/.omp" "$SRC/scaffold/RULES.md" "$TARGET/.omp/RULES.md"

# Protocol reference (optional)
if [ "$WITH_PROTO" -eq 1 ]; then
  copy "$TARGET/.omp" "$SRC/scaffold/PROTO.md" "$TARGET/.omp/PROTO.md"
fi

if [ "$DRY_RUN" -eq 0 ]; then
  echo ""
  echo "Done. Verify with:  omp read skill://elon   (run in $TARGET)"
  echo "Note: .omp/RULES.md is auto-loaded by omp as a sticky always-apply rule"
  echo "(survives compaction, reaches task subagents)."
fi
