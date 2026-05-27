#!/usr/bin/env bash
# download_renderings.sh — Download, compress & transfer video renderings from CNS.
#
# Usage:
#   bash download_renderings.sh                     # Full run
#   bash download_renderings.sh --test              # Test with first 2 entries only
#   bash download_renderings.sh --discover-only     # Only list files, don't download
#
# Pipeline:
#   1. Read demo_rendering_names.txt for (example/orbit_group/orbit_index) combos
#   2. Download from CNS → cloudtop /tmp/nstm_renders/raw/     (8 threads)
#   3. Compress on cloudtop → /tmp/nstm_renders/compressed/    (30 threads, CRF 23)
#   4. SCP compressed files → local ./videos/                  (8 threads)
#
# Restartability: Each phase skips files that already exist. Re-run safely at any time.
#   To force re-discovery, delete /tmp/nstm_renders/_manifest/

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
CLOUDTOP="gabor.c.googlers.com"
CNS_BASE="/cns/vz-d/home/stargate-dataset-pii/e=1:kid=73303:mkey=stargate-dataset-pii:rs=6.3:mdb=stargate-dataset-pii-cns-readonly/tachyon/gaborcsapo/ttl=180d/rendered_videos/batch_20260312"

# Demo rendering entries file (one per line: example/orbit_group/orbit_index -- comment)
DEMO_FILE="$(cd "$(dirname "$0")" && pwd)/demo_rendering_names.txt"

# CNS model directory suffixes → local folder names
declare -a MODEL_CNS=(
  "memaux_1sttgt"
  "memaux_1sttgt_512x512_input_fix"
  "cut3r_1sttgt"
  "lvsm_do"
  "lact_1sttgt_v4"
)
declare -a MODEL_LOCAL=(
  "nstm"
  "nstm_hires"
  "token_mem"
  "full_attn"
  "lact_nvs"
)

# Output types to download (without .mp4)
ALLOWED_OUTPUT_TYPES=("input" "memory" "rendered")

# Parallelism
DOWNLOAD_THREADS=8
COMPRESS_THREADS=30
SCP_THREADS=8

# CRF for compression
CRF=23

# Working directories
REMOTE_RAW="/tmp/nstm_renders/raw"
REMOTE_COMPRESSED="/tmp/nstm_renders/compressed"
LOCAL_TMP="/tmp/nstm_renders"
LOCAL_DEST="./videos"

# Ensure common tool paths are available
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Flags
TEST_MODE=false
TEST_LIMIT=2
DISCOVER_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --test) TEST_MODE=true; echo "🧪 TEST MODE: limiting to ${TEST_LIMIT} entries" ;;
    --discover-only) DISCOVER_ONLY=true; echo "🔍 DISCOVER ONLY: will list files then stop" ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
log() { echo -e "\033[1;34m▸\033[0m $*" >&2; }
warn() { echo -e "\033[1;33m⚠\033[0m $*" >&2; }
ok() { echo -e "\033[1;32m✓\033[0m $*" >&2; }
err() { echo -e "\033[1;31m✗\033[0m $*" >&2; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Phase 0: Preflight
# ─────────────────────────────────────────────────────────────────────────────
log "Phase 0: Preflight checks"

if [[ ! -f "$DEMO_FILE" ]]; then
  err "Demo file not found: ${DEMO_FILE}"
fi

if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$CLOUDTOP" "echo ok" &>/dev/null; then
  err "Cannot SSH to ${CLOUDTOP}. Check gcert / VPN."
fi
ok "SSH connection verified"

mkdir -p "$LOCAL_TMP"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 0b: Clean old videos from destination (first run only)
# ─────────────────────────────────────────────────────────────────────────────
CLEAN_MARKER="${LOCAL_TMP}/_cleaned_dest"
if [[ ! -f "$CLEAN_MARKER" ]]; then
  log "Cleaning old video content from ${LOCAL_DEST}/"
  for model in "${MODEL_LOCAL[@]}"; do
    if [[ -d "${LOCAL_DEST}/${model}" ]]; then
      rm -rf "${LOCAL_DEST}/${model}"
      log "  Removed ${LOCAL_DEST}/${model}/"
    fi
  done
  # Remove legacy directories/files from old rendering structure
  rm -rf "${LOCAL_DEST}/inputs" 2>/dev/null || true
  rm -f "${LOCAL_DEST}/manifest.json" 2>/dev/null || true
  touch "$CLEAN_MARKER"
  ok "Old content cleaned"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 1: Parse demo_rendering_names.txt → build file manifest
# ─────────────────────────────────────────────────────────────────────────────
log "Phase 1: Building file manifest from demo_rendering_names.txt"

MANIFEST_DIR="${LOCAL_TMP}/_manifest"
mkdir -p "$MANIFEST_DIR"
FILE_MANIFEST="${MANIFEST_DIR}/file_manifest.txt"

# Parse entries: strip comments (after --), blank lines, leading/trailing whitespace
ENTRIES=()
while IFS= read -r line; do
  # Strip comment
  entry="${line%%--*}"
  # Trim whitespace
  entry="$(echo "$entry" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$entry" ]] && continue
  ENTRIES+=("$entry")
done < "$DEMO_FILE"

if $TEST_MODE; then
  ENTRIES=("${ENTRIES[@]:0:$TEST_LIMIT}")
  warn "TEST MODE: limited to ${#ENTRIES[@]} entries"
fi

log "  ${#ENTRIES[@]} demo entries:"
for e in "${ENTRIES[@]}"; do log "    $e"; done

# Build manifest: one line per file to download
# Format: cns_model|local_model|example|orbit_group|orbit_index|output_type
> "$FILE_MANIFEST"
for entry in "${ENTRIES[@]}"; do
  # entry format: example/orbit_group/orbit_index
  IFS='/' read -r example orbit_group orbit_index <<< "$entry"
  for i in "${!MODEL_CNS[@]}"; do
    cns_model="${MODEL_CNS[$i]}"
    local_model="${MODEL_LOCAL[$i]}"
    for output_type in "${ALLOWED_OUTPUT_TYPES[@]}"; do
      echo "${cns_model}|${local_model}|${example}|${orbit_group}|${orbit_index}|${output_type}" >> "$FILE_MANIFEST"
    done
  done
done

TOTAL_FILES=$(wc -l < "$FILE_MANIFEST" | tr -d ' ')
ok "File manifest: ${TOTAL_FILES} files (${#ENTRIES[@]} entries × ${#MODEL_CNS[@]} models × ${#ALLOWED_OUTPUT_TYPES[@]} output types)"

if $DISCOVER_ONLY; then
  log "Manifest:"
  while IFS='|' read -r cm lm ex og oi ot; do
    echo "  ${lm}/${ex}/${og}/${oi}/${ot}.mp4"
  done < "$FILE_MANIFEST"
  ok "Discovery complete. Run without --discover-only to proceed."
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Download from CNS → cloudtop (8 parallel threads)
# ─────────────────────────────────────────────────────────────────────────────
log "Phase 2: Download from CNS → cloudtop (${DOWNLOAD_THREADS} threads)"

# Build download list: cns_path | remote_raw_dir | remote_raw_file
DOWNLOAD_LIST="${MANIFEST_DIR}/download_list.txt"
> "$DOWNLOAD_LIST"

while IFS='|' read -r cns_model local_model example orbit_group orbit_index output_type; do
  raw_dir="${REMOTE_RAW}/${local_model}/${example}/${orbit_group}/${orbit_index}"
  raw_file="${raw_dir}/${output_type}.mp4"
  cns_path="${CNS_BASE}_${cns_model}/${example}/${orbit_group}/${orbit_index}/${output_type}.mp4"
  echo "${cns_path}|${raw_dir}|${raw_file}" >> "$DOWNLOAD_LIST"
done < "$FILE_MANIFEST"

# Upload download list to cloudtop
log "  Uploading download list..."
scp -q "$DOWNLOAD_LIST" "${CLOUDTOP}:/tmp/nstm_dl_list.txt"

# Create download worker on cloudtop
ssh "$CLOUDTOP" "cat > /tmp/nstm_dl_worker.sh" << 'WORKER_EOF'
#!/bin/bash
line="$1"
IFS='|' read -r cns_path raw_dir raw_file <<< "$line"
if [[ -f "$raw_file" ]]; then
  exit 0
fi
mkdir -p "$raw_dir"
if fileutil cp "$cns_path" "$raw_file" 2>/dev/null; then
  echo "✓ $(echo "$raw_file" | sed 's|/tmp/nstm_renders/raw/||')"
else
  echo "✗ FAILED: $(echo "$cns_path" | sed 's|.*/batch_20260312_||')" >&2
  exit 1
fi
WORKER_EOF
ssh "$CLOUDTOP" "chmod +x /tmp/nstm_dl_worker.sh"

log "  Running parallel downloads on cloudtop..."
ssh "$CLOUDTOP" "cat /tmp/nstm_dl_list.txt | xargs -I{} -P${DOWNLOAD_THREADS} bash /tmp/nstm_dl_worker.sh '{}'" 2>&1 || true

ok "Phase 2 complete"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Compress on cloudtop with ffmpeg CRF 23 (30 parallel threads)
# ─────────────────────────────────────────────────────────────────────────────
log "Phase 3: Compress on cloudtop (CRF ${CRF}, ${COMPRESS_THREADS} threads)"

# Build compress list: raw_file | compressed_file
COMPRESS_LIST="${MANIFEST_DIR}/compress_list.txt"
> "$COMPRESS_LIST"

while IFS='|' read -r cns_model local_model example orbit_group orbit_index output_type; do
  rel_path="${local_model}/${example}/${orbit_group}/${orbit_index}/${output_type}.mp4"
  raw_file="${REMOTE_RAW}/${rel_path}"
  compressed_file="${REMOTE_COMPRESSED}/${rel_path}"
  echo "${raw_file}|${compressed_file}" >> "$COMPRESS_LIST"
done < "$FILE_MANIFEST"

# Upload compress list
scp -q "$COMPRESS_LIST" "${CLOUDTOP}:/tmp/nstm_compress_list.txt"

# Create compress worker on cloudtop
ssh "$CLOUDTOP" "cat > /tmp/nstm_compress_worker.sh" << CMPEOF
#!/bin/bash
line="\$1"
IFS='|' read -r raw_file compressed_file <<< "\$line"

if [[ -f "\$compressed_file" ]]; then
  exit 0
fi
if [[ ! -f "\$raw_file" ]]; then
  echo "✗ MISSING: \$(echo "\$raw_file" | sed 's|/tmp/nstm_renders/raw/||')" >&2
  exit 0
fi

compressed_dir="\$(dirname "\$compressed_file")"
mkdir -p "\$compressed_dir"
tmp_file="\${compressed_file}.tmp.mp4"

if ffmpeg -y -i "\$raw_file" -c:v libx264 -crf ${CRF} -preset medium -an \
   -movflags +faststart "\$tmp_file" </dev/null 2>/dev/null; then
  mv "\$tmp_file" "\$compressed_file"
  in_sz=\$(stat -c%s "\$raw_file" 2>/dev/null || echo 0)
  out_sz=\$(stat -c%s "\$compressed_file" 2>/dev/null || echo 0)
  ratio=0
  [[ "\$in_sz" -gt 0 ]] && ratio=\$(( out_sz * 100 / in_sz ))
  echo "✓ \$(echo "\$compressed_file" | sed 's|/tmp/nstm_renders/compressed/||') (\${ratio}% of original)"
else
  rm -f "\$tmp_file"
  echo "✗ COMPRESS FAILED: \$(echo "\$raw_file" | sed 's|/tmp/nstm_renders/raw/||')" >&2
fi
CMPEOF
ssh "$CLOUDTOP" "chmod +x /tmp/nstm_compress_worker.sh"

log "  Running parallel compression on cloudtop..."
ssh "$CLOUDTOP" "cat /tmp/nstm_compress_list.txt | xargs -I{} -P${COMPRESS_THREADS} bash /tmp/nstm_compress_worker.sh '{}'" 2>&1 || true

ok "Phase 3 complete"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 4: SCP compressed files → local ./videos/ (8 parallel threads)
# ─────────────────────────────────────────────────────────────────────────────
log "Phase 4: SCP compressed files → local ${LOCAL_DEST}/ (${SCP_THREADS} threads)"

SCP_LIST="${MANIFEST_DIR}/scp_list.txt"
> "$SCP_LIST"

while IFS='|' read -r cns_model local_model example orbit_group orbit_index output_type; do
  rel_path="${local_model}/${example}/${orbit_group}/${orbit_index}/${output_type}.mp4"
  echo "$rel_path" >> "$SCP_LIST"
done < "$FILE_MANIFEST"

# SCP worker script (macOS-compatible — no export -f)
SCP_WORKER="${MANIFEST_DIR}/scp_worker.sh"
cat > "$SCP_WORKER" << SCPEOF
#!/bin/bash
rel_path="\$1"
local_file="${LOCAL_DEST}/\${rel_path}"
local_dir="\$(dirname "\$local_file")"

if [[ -f "\$local_file" ]]; then
  exit 0
fi

mkdir -p "\$local_dir"
remote_file="${REMOTE_COMPRESSED}/\${rel_path}"

if scp -q "${CLOUDTOP}:\${remote_file}" "\$local_file" 2>/dev/null; then
  echo "✓ \${rel_path}"
else
  echo "✗ SCP FAILED: \${rel_path}" >&2
fi
SCPEOF
chmod +x "$SCP_WORKER"

cat "$SCP_LIST" | xargs -I{} -P"$SCP_THREADS" bash "$SCP_WORKER" "{}"

ok "Phase 4 complete"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════════════════"
ok "All phases complete!"
echo ""

TOTAL_OUT=$(find "$LOCAL_DEST" -name '*.mp4' -path '*/orbit_*/*' 2>/dev/null | wc -l | tr -d ' ')
log "Output files in ${LOCAL_DEST}/: ${TOTAL_OUT}"

log "Directory structure:"
for model in "${MODEL_LOCAL[@]}"; do
  count=$(find "${LOCAL_DEST}/${model}" -name '*.mp4' -path '*/orbit_*/*' 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$count" -gt 0 ]]; then
    log "  ${model}/: ${count} videos"
  fi
done

echo ""
ok "Done! Compressed videos are in ${LOCAL_DEST}/"
