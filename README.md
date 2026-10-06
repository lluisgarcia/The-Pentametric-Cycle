# Ὁ Πενταμετρικὸς Κύκλος — The Pentametric Cycle

**A Nested Palindrome Encoding the Pythagorean Consonances**
Lluis Garcia Torcal · independent researcher · 2026 · ORCID [0009-0007-8570-2536](https://orcid.org/0009-0007-8570-2536)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23183108.svg)](https://doi.org/10.5281/zenodo.23183108)

📄 **Read the paper:** [`Paper/pentametric_cycle.pdf`](Paper/pentametric_cycle.pdf) · archived preprint on Zenodo: [doi:10.5281/zenodo.23183108](https://doi.org/10.5281/zenodo.23183108)

---

## In one paragraph

The *Pentametric Formula*

$$\mathfrak{P}(n)=\frac{n^{2}+4\,C(m)}{5},\qquad m=4n^{2}\bmod 10,\qquad C(m)=\frac{26m-5m^{2}}{24}$$

always produces an integer. It is equivalent to $(n^{2}+4\cdot(n/5))/5$, where $(n/5)$ is the Legendre symbol modulo 5, and it can be reached by a whole family of ten equivalent forms: digits, floors, a quintic, cosines, golden-ratio rotations and pentagonal angles.

**The cycle.** Doubling the area, taking the last digit and halving it gives a value $H(n)\in\{0,1,2,3,4\}$. The single rule $H:(H-1)$ turns $H$ into silence or one of the four Pythagorean consonances: unison 1:1, octave 2:1, fifth 3:2 and fourth 4:3. The resulting sequence repeats every 25 terms. Each period has 9 silences and 4 of each consonance, and the full 51-term palindrome mirrors at the Axis $n=25$.

**The Lucas connection.** At every Lucas number the formula returns the area of the matching Fibonacci square, $\mathfrak{P}(L_k)=F_k^2$. Conversely, perfect squares occur *only* at Lucas numbers. This links to H. L. Holden's classical 1975 result: the centres of the Fibonacci squares lie on two perpendicular lines, at distance $L_k\sqrt{0.1}$ from the point where the lines meet. A Lucas number therefore gives both the area of a Fibonacci square and the position of its centre.

## Repository contents

| Folder | Contents |
|---|---|
| `Paper/` | The manuscript (PDF and LaTeX source), its figures, and Python scripts that independently check every claim. See `Paper/README.md`. |
| `Geometry/` | GeoGebra constructions (`.ggb`): the Fibonacci grid, Lucas distances, the ±0.8 square and ±2π/5 circle differences, angles, rotations and the pentagon study. Open them with [GeoGebra](https://www.geogebra.org/classic) (free). |
| `Tables/` | The original spreadsheets (`.xlsx`) **with their formulas**. They contain the whole family of Pentametric forms, the cycle, the palindrome, the verification counts and the angle tables. Table 2 of the paper maps each formula to its sheet and columns. |
| `Csv/` | Plain-text exports of every spreadsheet sheet, readable without Excel. These contain values only; the formulas are in `Tables/`. |
| `Images/` | Drawings of the constructions: the Fibonacci squares, centre lines, origin, Lucas distances in units of √0.1, and the ±0.8 and ±2π/5 differences. |
| `HTML/` | Interactive explorers (arctangent, tangent and trigonometric identities) used during the research. |
| `Pdf/` | A PDF export of the Pentametric Palindrome table. |
| `Original Finding/` | Citations of, and links to, the classical sources this work builds on. See the attribution section below. |

## Verifying the results

Every numerical and geometric statement in the paper can be checked in a few seconds:

```bash
cd Paper
python3 verify.py    # formula, periodicity, palindromes, counts, Lucas theorem and its converse
python3 geo.py       # Fibonacci spiral geometry and Holden's lines and distances
python3 family.py    # the ten equivalent forms of the formula
```

Python 3.8 or later is enough, with no extra packages. See `Paper/README.md` for details and for how to rebuild the PDF.

## Attribution

The geometric property that the centres of the Fibonacci squares lie on two orthogonal lines, at distances proportional to the Lucas numbers, is **not** the author's result. It is due to:

- H. L. Holden, *Fibonacci Tiles*, The Fibonacci Quarterly 13(1) (1975), 45–49.
- V. E. Hoggatt, Jr. and K. Alladi, *Generalized Fibonacci Tiling*, The Fibonacci Quarterly 13(2) (1975), 137–144.
- T. Gardiner, *68.15 The Fibonacci spiral*, The Mathematical Gazette 68(444) (1984), 120.

Links to these sources are in [`Original Finding/README.md`](Original%20Finding/README.md). In this work the property is called the *Geometric Lucas Meter* (Τὸ Γεωμετρικὸν Μέτρον τοῦ Λουκᾶ), always with full credit to Holden.

**The author's contributions** are:
- the Pentametric Formula and its family of forms;
- the Pentametric Cycle, its palindrome and its nomenclature;
- the Pentametric–Lucas Theorem and its converse;
- the ±0.8 square and ±2π/5 circle identities;
- the conjecture on simple forms at Lucas positions.

An AI assistant (Claude, by Anthropic) helped write the manuscript and independently checked the proofs and numerical results.

## How to cite

> Garcia Torcal, L. (2026). *Ὁ Πενταμετρικὸς Κύκλος: A Nested Palindrome Encoding the Pythagorean Consonances.* Preprint, Zenodo. https://doi.org/10.5281/zenodo.23183108

BibTeX:
```bibtex
@misc{GarciaTorcal2026,
  author    = {Garcia Torcal, Lluis},
  title     = {{Ὁ Πενταμετρικὸς Κύκλος}: A Nested Palindrome Encoding the Pythagorean Consonances},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.23183108},
  url       = {https://doi.org/10.5281/zenodo.23183108},
  note      = {Preprint}
}
```

The DOI above always points to the latest version of the preprint.

## License

- **Paper, data, spreadsheets, GeoGebra files and images:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). You may share and adapt them for any purpose, provided you give appropriate credit.
- **Python scripts** (`Paper/*.py`): [MIT License](https://opensource.org/licenses/MIT).

The classical sources listed under *Attribution* are copyright their respective publishers and are not redistributed here.
