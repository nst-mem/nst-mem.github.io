#!/bin/bash
# reduce_gallery.sh — Move demoted scenes to data_gallery_archive/
# using round-robin assignment across 5 categories.
# Compatible with macOS bash 3.x (no associative arrays).
set -euo pipefail

cd "$(dirname "$0")/.."

ARCHIVE="data_gallery_archive"

# Collect all 390 scene IDs from general_nvs/ours (sorted numerically)
ALL_SCENES=($(ls data_gallery/general_nvs/ours/ | sed 's/_[0-9]*.mp4//' | sort -n | uniq))
TOTAL=${#ALL_SCENES[@]}
echo "Total scenes: $TOTAL"

# Round-robin into 5 buckets and save to files
mkdir -p scratch
> scratch/scenes_general_nvs.txt
> scratch/scenes_ablations.txt
> scratch/scenes_stress_t4.txt
> scratch/scenes_stress_t30.txt
> scratch/scenes_stress_t60.txt

for i in "${!ALL_SCENES[@]}"; do
  bucket=$((i % 5))
  case $bucket in
    0) echo "${ALL_SCENES[$i]}" >> scratch/scenes_general_nvs.txt ;;
    1) echo "${ALL_SCENES[$i]}" >> scratch/scenes_ablations.txt ;;
    2) echo "${ALL_SCENES[$i]}" >> scratch/scenes_stress_t4.txt ;;
    3) echo "${ALL_SCENES[$i]}" >> scratch/scenes_stress_t30.txt ;;
    4) echo "${ALL_SCENES[$i]}" >> scratch/scenes_stress_t60.txt ;;
  esac
done

echo "Bucket sizes:"
echo "  general_nvs: $(wc -l < scratch/scenes_general_nvs.txt)"
echo "  ablations:   $(wc -l < scratch/scenes_ablations.txt)"
echo "  stress_t4:   $(wc -l < scratch/scenes_stress_t4.txt)"
echo "  stress_t30:  $(wc -l < scratch/scenes_stress_t30.txt)"
echo "  stress_t60:  $(wc -l < scratch/scenes_stress_t60.txt)"

# Function: for a given category folder, keep only the scenes listed in the
# keep-file and archive the rest.
archive_category() {
  local category="$1"
  local keep_file="$2"

  echo "Processing $category..."

  for model_dir in data_gallery/"$category"/*/; do
    local model_name=$(basename "$model_dir")
    local archive_dir="$ARCHIVE/$category/$model_name"
    mkdir -p "$archive_dir"

    local moved=0
    for f in "$model_dir"*.mp4; do
      [ -f "$f" ] || continue
      local fname=$(basename "$f")
      local scene_id=$(echo "$fname" | sed 's/_[0-9]*.mp4//')
      # Check if scene_id is in the keep file
      if ! grep -qx "$scene_id" "$keep_file"; then
        mv "$f" "$archive_dir/"
        ((moved++)) || true
      fi
    done
    echo "  $model_name: archived $moved files"
  done
}

# Execute archiving for each category
archive_category "general_nvs"   scratch/scenes_general_nvs.txt
archive_category "ablations"     scratch/scenes_ablations.txt
archive_category "stress_test_t4"  scratch/scenes_stress_t4.txt
archive_category "stress_test_t30" scratch/scenes_stress_t30.txt
archive_category "stress_test_t60" scratch/scenes_stress_t60.txt

echo ""
echo "=== Results ==="
echo "Remaining in data_gallery/:"
du -sh data_gallery/general_nvs/ data_gallery/ablations/ data_gallery/natural_memory/ data_gallery/stress_test_t4/ data_gallery/stress_test_t30/ data_gallery/stress_test_t60/
du -sh data_gallery/
echo ""
echo "Archived to $ARCHIVE/:"
du -sh "$ARCHIVE"/
echo ""
echo "Scene ID lists saved to scratch/scenes_*.txt"
echo "Done!"
