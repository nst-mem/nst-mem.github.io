#!/bin/bash
# test_360_videos.sh — Assert the served 360-rotation demo videos are all in place.
# CLI pass/fail. Run from repo root: bash scripts/tests/test_360_videos.sh
cd "$(dirname "$0")/../.."

SCENES=(
  ft_202307_20230707_00017_01
  ft_202307_20230709_00007_02
  ft_202307_20230714_00032_02
  lg_202307_20230705_00015_02
  lg_202307_20230716_00018_02
  lg_202307_20230719_00007_01
  lg_202307_20230720_00036_02
)
MODELS=(nstm nstm_hires token_mem full_attn lact_nvs)
MEM_MODELS=(nstm nstm_hires)

pass=0
fail=0
check() { # path
  if [ -f "$1" ]; then pass=$((pass+1)); else echo "FAIL missing: $1"; fail=$((fail+1)); fi
}

for S in "${SCENES[@]}"; do
  for M in "${MODELS[@]}"; do
    d="videos/$M/$S/360_rotation/orbit_1"
    check "$d/input.mp4"
    check "$d/rendered.mp4"
  done
  for M in "${MEM_MODELS[@]}"; do
    check "videos/$M/$S/360_rotation/orbit_1/memory.mp4"
  done
done

echo "RESULT: $pass passed, $fail failed  (expected 84 passed)"
[ "$fail" -eq 0 ] && [ "$pass" -eq 84 ] && exit 0 || exit 1
