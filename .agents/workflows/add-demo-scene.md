---
description: Add or remove a demo scene from the visual results section
---

## Adding a scene

1. **Find the scene path.** Determine the `example_id/orbit_group/orbit_index` for the new scene. Consult `docs/finding_interesting_scenes.md` for how to discover scenes by label.

2. **Edit the demo list.** Add a line to `scripts/demo_rendering_names.txt`:
```
example_id/orbit_group/orbit_index  -- Short description
```

3. **Download the videos.** Run from the project root:
```bash
bash scripts/download_renderings.sh
```
This downloads all 5 models × 3 output types for the new entry.

4. **Update `js/video-player.js`.** Add a new entry to the `SCENES` array with the scene's `id`, `label`, `thumbSrc`, and path components.

5. **Update `gallery-renderings.html`.** Add the new scene ID to the inline `SCENE_IDS` array and update the subtitle text to reflect the new count.

6. **Rebuild and verify:**
```bash
bash build.sh
open index.html
```
Navigate to Visual Results and verify the new scene appears in the scene selector.

## Removing a scene

1. Remove the line from `scripts/demo_rendering_names.txt`.
2. Delete the corresponding video directories:
```bash
rm -rf videos/{nstm,nstm_hires,full_attn,token_mem,lact_nvs}/EXAMPLE_ID/
```
3. Remove the entry from the `SCENES` array in `js/video-player.js`.
4. Remove the ID from `SCENE_IDS` in `gallery-renderings.html` and update the subtitle.
5. Rebuild and verify.
