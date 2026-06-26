#!/usr/bin/env bash
# package_website.sh — Zip the NSTM website for delivery, excluding dev-only files.
#
# Usage:  bash scripts/package_website.sh
# Output: nstm_website.zip in the project root

set -euo pipefail

# Resolve project root (parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
ZIP_NAME="nstm_website.zip"

# Remove any previous zip so we get a clean archive
rm -f "${PROJECT_ROOT}/${ZIP_NAME}"

cd "${PROJECT_ROOT}/.."

zip -r "${PROJECT_ROOT}/${ZIP_NAME}" "${PROJECT_NAME}" \
  -x "${PROJECT_NAME}/.agents/*" \
  -x "${PROJECT_NAME}/.git/*" \
  -x "${PROJECT_NAME}/.DS_Store" \
  -x "${PROJECT_NAME}/.gitignore" \
  -x "${PROJECT_NAME}/AGENTS.md" \
  -x "${PROJECT_NAME}/build.sh" \
  -x "${PROJECT_NAME}/sections/*" \
  -x "${PROJECT_NAME}/scripts/*" \
  -x "${PROJECT_NAME}/docs/*" \
  -x "${PROJECT_NAME}/nstm_website.zip"

echo ""
echo "✅ Created ${PROJECT_ROOT}/${ZIP_NAME}"
echo ""
# Show size
ls -lh "${PROJECT_ROOT}/${ZIP_NAME}"
