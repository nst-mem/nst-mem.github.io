#!/bin/bash
# copy_360_videos.sh — Copy the new 360-rotation demo videos from the dev download
# tree (imgrid_download/) into the served videos/ tree consumed by js/video-player.js.
#
# Source: imgrid_download/<srcModel>/360_rotation/<sceneId>/360_rotation/orbit_1/<file>
# Dest:   videos/<servedModel>/<sceneId>/360_rotation/orbit_1/<file>
#
# input.mp4 + rendered.mp4 for all 5 models; memory.mp4 only for the two memaux models.
# Idempotent (overwrites). Run from repo root: bash scripts/copy_360_videos.sh
set -e
cd "$(dirname "$0")/.."

SCENES=(
  ft_202307_20230707_00017_01
  ft_202307_20230709_00007_02
  ft_202307_20230714_00032_02
  lg_202307_20230705_00015_02
  lg_202307_20230716_00018_02
  lg_202307_20230719_00007_01
  lg_202307_20230720_00036_02
)

# src_model:dst_model:has_memory
MODELS=(
  "memaux_256x256:nstm:1"
  "memaux_512x512:nstm_hires:1"
  "cut3r:token_mem:0"
  "lvsm:full_attn:0"
  "lact:lact_nvs:0"
)

copied=0
for S in "${SCENES[@]}"; do
  for entry in "${MODELS[@]}"; do
    IFS=':' read -r src dst mem <<< "$entry"
    srcdir="imgrid_download/$src/360_rotation/$S/360_rotation/orbit_1"
    dstdir="videos/$dst/$S/360_rotation/orbit_1"
    mkdir -p "$dstdir"
    files="input.mp4 rendered.mp4"
    [ "$mem" = "1" ] && files="$files memory.mp4"
    for f in $files; do
      cp "$srcdir/$f" "$dstdir/$f"
      copied=$((copied+1))
    done
  done
done

echo "Copied $copied files into videos/*/<scene>/360_rotation/orbit_1/"
