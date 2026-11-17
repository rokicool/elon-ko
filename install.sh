#!/usr/bin/env bash
# elon-ko installer — fetches distribution files from GitHub and copies them in.
# Usage: ./install.sh [target-repo] [--no-proto] [--dry-run] [--version vX.Y.Z]
# Pipeable: curl -fsSL https://raw.githubusercontent.com/rokicool/elon-ko/main/install.sh | bash -s -- <target>
# Env overrides (mainly for testing): ELON_KO_REPO (default rokicool/elon-ko),
# ELON_KO_ARCHIVE (full tarball URL, bypasses tag resolution).
set -euo pipefail

REPO="${ELON_KO_REPO:-rokicool/elon-ko}"
ARCHIVE_URL="${ELON_KO_ARCHIVE:-}"
TARGET=""
DRY_RUN=0
WITH_PROTO=1
VERSION=""
EXPECT_VALUE=0

for arg in "$@"; do
  if [ "$EXPECT_VALUE" -eq 1 ]; then
    VERSION="$arg"; EXPECT_VALUE=0; continue
  fi
  case "$arg" in
    --no-proto) WITH_PROTO=0 ;;
    --dry-run)  DRY_RUN=1 ;;
    --version)  EXPECT_VALUE=1 ;;
    -h|--help)
      echo "Usage: [curl …install.sh |] bash -s -- [target-repo] [--no-proto] [--dry-run] [--version vX.Y.Z]"
      echo "  Fetches elon-ko from GitHub ($REPO; latest stable release, or --version to pin)"
      echo "  and copies agents, skills, RULES.md, PROTO.md into <target-repo> (default: cwd)."
      echo "  Env: ELON_KO_REPO, ELON_KO_ARCHIVE (full tarball URL override)."
      exit 0 ;;
    *) TARGET="$arg" ;;
  esac
done
[ "$EXPECT_VALUE" -eq 0 ] || { echo "error: --version requires a value (e.g. --version v4.1.1)" >&2; exit 1; }

[ -n "$TARGET" ] || TARGET="$PWD"
if [ ! -d "$TARGET" ]; then
  echo "error: target directory not found: $TARGET" >&2
  exit 1
fi
TARGET="$(cd "$TARGET" && pwd)"

if [ -z "$VERSION" ] && [ -z "$ARCHIVE_URL" ]; then
  echo "Resolving latest release of $REPO ..."
  VERSION="$(curl -fsSL --max-time 15 "https://api.github.com/repos/${REPO}/releases/latest" \
    | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)" || VERSION=""
  if [ -z "$VERSION" ]; then
    echo "error: could not resolve the latest release tag for ${REPO}" >&2
    echo "       (GitHub API unreachable or rate-limited). Retry later, or pin explicitly:" >&2
    echo "       ... | bash -s -- <target> --version v4.1.1" >&2
    exit 1
  fi
fi
[ -n "$ARCHIVE_URL" ] || ARCHIVE_URL="https://codeload.github.com/${REPO}/tar.gz/refs/tags/${VERSION}"
echo "Source: ${REPO} @ ${VERSION:-$ARCHIVE_URL}"

# Fetch + extract to a temp dir.
TMPDIR_EXTRACT="$(mktemp -d "${TMPDIR:-/tmp}/elon-ko-install.XXXXXX")"
cleanup() { rm -rf "$TMPDIR_EXTRACT"; }
trap cleanup EXIT
# Dry-run still fetches (read-only, temp dir) so the plan lists real files; it writes nothing.
curl -fsSL --max-time 60 "$ARCHIVE_URL" -o "$TMPDIR_EXTRACT/src.tar.gz"
mkdir -p "$TMPDIR_EXTRACT/src"
tar -xzf "$TMPDIR_EXTRACT/src.tar.gz" -C "$TMPDIR_EXTRACT/src"
set -- "$TMPDIR_EXTRACT/src"/*/
[ -d "$1" ] || { echo "error: tarball has no root directory" >&2; exit 1; }
SRC="${1%/}"

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

# Safety: refuse to install into an elon-ko checkout (would clobber its own scaffold layout).
if [ -f "$TARGET/.omp/agents/leaddev.md" ] && grep -q '^# elon-ko$' "$TARGET/README.md" 2>/dev/null; then
  echo "error: refusing to install elon-ko into an elon-ko checkout — pass a different target: ./install.sh /path/to/project" >&2
  exit 1
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
