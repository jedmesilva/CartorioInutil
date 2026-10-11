---
name: Cartório progress, errors & seal
description: Product rules for upload feedback, user-facing errors, and document-stamp wording.
---

- Show only the active upload/authentication status; upload can show its percentage, then show the current processing update without repeated labels or explanatory filler.
- Keep operational failures generic and nontechnical in the client. Keep file-type and size validation actionable, and give users a simple next step for sharing failures.
- The circular seal repeats “100% INÚTIL” on both upper and lower arcs; the main heading is “AUTENTICADO” with “1º cartório oficial de / notas inúteis” beneath it.
- Put dynamic “DATA:” and “PROTOCOLO Nº:” fields below the main frame; show the date as DD/MM/YYYY and the protocol as six digits.
- Do not include a “Tabelião” line on this project's authentication stamp.
- Treat the user's attached 1080×688 SVG/HTML as the canonical stamp: transparent background, distressed serif ink, one rounded frame, the specified circular seal, and the original text layout.
- Use the original dark green on light backgrounds and an off-white ink variant on dark backgrounds; select per image or PDF page based on the sampled region beneath the seal.
- Do not add a paper card, extra frame/circle, or per-letter outline. Keep date and six-digit protocol dynamic, and omit the tabelião line.
- Apply the whole stamp with a subtle, consistent 8° counterclockwise tilt in both image and PDF output; leave the artwork itself unchanged.

**Why:** The supplied artwork is the accepted design and its geometry must remain intact. The user also asked for contrast-based ink color so the stamp stays readable on both dark and light uploads.

**How to apply:** Preserve the supplied geometry, wording, and ink texture in image and PDF output, then rotate the complete stamp by the same subtle angle. Choose between the original green and the light variant by measuring contrast against the placement region. For renderer compatibility, adapt text-on-path only when needed, keeping the arcs in the same positions and reading direction.
