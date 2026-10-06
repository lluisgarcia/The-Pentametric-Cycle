# Paper — Ὁ Πενταμετρικὸς Κύκλος (The Pentametric Cycle)

**A Nested Palindrome Encoding the Pythagorean Consonances**
Lluis Garcia Torcal, independent researcher, October 2026 · ORCID [0009-0007-8570-2536](https://orcid.org/0009-0007-8570-2536)
Archived preprint: [doi:10.5281/zenodo.23183108](https://doi.org/10.5281/zenodo.23183108)

This folder contains the manuscript, its LaTeX source, the figures, and the scripts that independently check every numerical and geometric claim in the paper.

## Contents

| File | Description |
|---|---|
| `pentametric_cycle.pdf` | The compiled paper (ready to read) |
| `pentametric_cycle.tex` | LaTeX source of the paper |
| `fig0_abstract.pdf` | Figure: graphical abstract (spiral with Lucas distances, and the palindrome ring) |
| `fig1_spiral.pdf` | Figure: Fibonacci spiral, Holden's orthogonal lines and the point P |
| `fig2_area.pdf` | Figure: the ±4/5 square identity and the ±2π/5 circle identity |
| `fig3_palindrome.pdf` | Figure: the 51-term Pentametric Palindrome H(n), n = 0…50 |
| `verify.py` | Checks the Pentametric Formula, the Interval Map, periodicity, palindromes, counts, the Pentametric–Lucas Theorem and its converse |
| `geo.py` | Checks the Fibonacci spiral geometry: collinearity of the centres, Holden's lines, the point P = (1/10, 3/10), the distances Lₖ/√10 and the complex form of the centres |
| `family.py` | Checks that all ten equivalent forms (F1)–(F10) of the formula, the side-length correction and the area defects agree |
| `figs.py` | Generates figures 1–3 (spiral, area identities, palindrome strip) |
| `figga.py` | Generates the graphical abstract |

## What the scripts check

All checks use exact integer and rational arithmetic (Python `fractions`), except the trigonometric forms, which are compared to a relative tolerance of 10⁻⁶.

- **`verify.py`**
  - 𝔓(n) is an integer for 0 ≤ n < 10,000.
  - The residue m = 4n² mod 10 only takes the values 0, 4 and 6.
  - H(n) has minimal period 25.
  - The palindrome statements hold.
  - The counts are 9 silences and 4 of each consonance per Vertebra, and 19 silences and 8 of each consonance per Palindrome.
  - 𝔓(Lₖ) = Fₖ² for k = 0…59.
  - For 1 ≤ n ≤ 200,000, 𝔓(n) is a perfect square exactly at the Lucas numbers.
- **`geo.py`**
  - The spiral is built with exact rational coordinates for k ≤ 16.
  - The odd-indexed and even-indexed centres lie on y = 3x and x + 3y = 1, and the two lines are perpendicular.
  - 10·|CₖP|² = Lₖ² for each centre.
  - Cₖ − P = iᵏ⁻¹·Lₖ·w.
- **`family.py`** checks forms (F1)–(F10), the quadratic-equation side correction and the ±2π/5 circle law for 0 ≤ n < 3000.

## Running the checks

Requires Python 3.8 or later. The three check scripts use only the standard library.

```bash
python3 verify.py
python3 geo.py
python3 family.py
```

`verify.py` takes a few seconds, because it scans n up to 200,000 for perfect squares. A successful run of `family.py` prints `failures: [(2, 'A11', 'none')] 1`. This single entry is expected: at n = 2 the discriminant of the quadratic side-correction is exactly 0 (𝔓(2) = 0), and floating-point rounding makes it a tiny negative number. In exact arithmetic the identity holds (see Corollary 3.3 in the paper).

## Regenerating the figures

```bash
pip install matplotlib numpy
python3 figs.py
python3 figga.py
```

## Building the PDF

The paper uses Unicode (polytonic Greek, 𝔓, ♪), so it must be compiled with **XeLaTeX**, not pdfLaTeX. Keep the four figure PDFs in the same folder as the `.tex` file.

```bash
latexmk -xelatex pentametric_cycle.tex
```

or run `xelatex pentametric_cycle.tex` twice, so that the table of contents and cross-references resolve.

**Fonts required:** Latin Modern Roman, Latin Modern Math, GFS Porson (for the Greek) and DejaVu Sans (for ♪). All four are included in TeX Live and MiKTeX, or are freely available.

**LaTeX packages:** amsmath, amsthm, mathtools, fontspec, unicode-math, graphicx, booktabs, tabularx, enumitem, forest, xcolor, hyperref, titlesec, caption and tcolorbox. All of them are part of a standard TeX Live or MiKTeX installation.

## Related material in this repository

The GeoGebra constructions (`Geometry/`), spreadsheets (`Tables/`, `Csv/`) and images (`Images/`) referenced in the paper are in the parent folder. Table 2 of the paper maps each formula to the spreadsheet sheet and columns where it was first built.

## Attribution

The orthogonal-lines property of the centres of Fibonacci squares, with distances proportional to the Lucas numbers, is a classical result:

- H. L. Holden, *Fibonacci Tiles*, The Fibonacci Quarterly 13(1) (1975), 45–49.
- V. E. Hoggatt, Jr. and K. Alladi, *Generalized Fibonacci Tiling*, The Fibonacci Quarterly 13(2) (1975), 137–144.
- T. Gardiner, *68.15 The Fibonacci spiral*, The Mathematical Gazette 68(444) (1984), 120.

The Pentametric Formula and its family of forms, the Pentametric Cycle and its nomenclature, the Pentametric–Lucas Theorem and its converse, the area and circle identities, and the conjecture on simple forms at Lucas positions are the author's contribution.

An AI assistant (Claude, by Anthropic) helped write the manuscript and independently checked the proofs and numerical results.
