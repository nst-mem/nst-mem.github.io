---
description: Package the website into a zip for submission
---

// turbo-all

1. Rebuild `index.html` to ensure it's current:
```bash
bash build.sh
```

2. Run the packaging script:
```bash
bash scripts/package_website.sh
```
This creates `nstm_website.zip` in the project root, excluding all dev-only files (`scripts/`, `docs/`, `.agents/`, `sections/`, `build.sh`, etc.).

3. Verify the zip:
```bash
ls -lh nstm_website.zip
```
Check that the size is reasonable (typically 150-250 MB depending on video content).

4. Optionally, inspect the contents:
```bash
unzip -l nstm_website.zip | head -50
```
Confirm no dev-only files leaked through.
