---
name: Cartório progress, errors & seal
description: Product rules for upload feedback, user-facing errors, and document-stamp wording.
---

- Show only the active upload/authentication status; upload can show its percentage, then show the current processing update without repeated labels or explanatory filler.
- Keep operational failures generic and nontechnical in the client. Keep file-type and size validation actionable, and give users a simple next step for sharing failures.
- The circular seal wording is exactly “SELO OFICIAL DA INUTILIDADE”; do not add “DOU FÉ”.
- Split the seal wording into “SELO OFICIAL” on the upper arc and “DA INUTILIDADE” on the lower arc; keep both readable left-to-right, add side dots as separators, and balance the seal size with adjacent details.
- Do not include a “Tabelião” line on this project's authentication stamp.
- Preserve the green ink and use a light contrasting edge rather than switching the entire seal to a single alternate color; keep the SVG background transparent.

**Why:** The user said technical failure details confuse users and expose unnecessary information, explicitly corrected the seal copy, reported wide word gaps and an oversized seal, asked that neither text segment appear upside down, said a tabelião does not make sense on this project's stamp, and noted the green seal is hard to read on dark files. A contrasting edge works across images, PDFs, and mixed-tone areas without a visible backdrop.

**How to apply:** Preserve these constraints when changing Cartório upload/authentication UI, error handling, or the shared stamp generator. If the seal copy changes, recheck both arcs, reading direction, spacing, and separator placement; keep the tabelião line omitted and retain the transparent contrast treatment on all file formats.
