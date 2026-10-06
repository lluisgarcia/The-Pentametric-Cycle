# Original Finding — classical sources

The Pentametric Cycle builds on a classical geometric result about Fibonacci squares, which is **not** the author's work. This folder records where that result comes from. The original articles are copyrighted by their publishers, so they are linked here rather than copied.

## The result

When squares of sides 1, 1, 2, 3, 5, 8, 13, … are arranged in the standard Fibonacci spiral:

- the centres of the squares lie on **two perpendicular straight lines**, with slopes 3 and −1/3;
- the distance of the *k*-th centre from the point where the lines meet is **Lₖ / √10 = Lₖ · √0.1**, where Lₖ is the *k*-th Lucas number (2, 1, 3, 4, 7, 11, 18, 29, …).

In the paper this property is called the **Geometric Lucas Meter** (Τὸ Γεωμετρικὸν Μέτρον τοῦ Λουκᾶ), always with full credit to Holden.

## Sources

1. **H. L. Holden**, "Fibonacci Tiles", *The Fibonacci Quarterly* **13**(1) (February 1975), pp. 45–49.
   Read online: https://www.mathstat.dal.ca/FQ/Scanned/13-1/holden.pdf
   *The original result.* Holden proves that the centres lie on perpendicular lines of slopes 3 and −1/3 for any Fibonacci-type sequence. He gives the distances as (f₍ₖ₊₃₎ + f₍ₖ₋₃₎)/(2√10), which for the Fibonacci numbers equals Lₖ/√10.

2. **V. E. Hoggatt, Jr. and K. Alladi**, "Generalized Fibonacci Tiling", *The Fibonacci Quarterly* **13**(2) (April 1975), pp. 137–144.
   Read online: https://www.mathstat.dal.ca/FQ/Scanned/13-2/hoggatt1.pdf
   *An extension.* The authors rederive the centres with generating functions and state that the distances "are proportional to the Lucas numbers".

3. **Tony Gardiner**, "68.15 The Fibonacci spiral", *The Mathematical Gazette* **68**(444) (June 1984), p. 120.
   DOI: https://doi.org/10.2307/3615922
   *A classroom rediscovery.* Children in a Saturday maths club noticed the two perpendicular lines. With the centre of the first square as origin, Gardiner gives them as y = 3x and 3y = −(x − 1), which meet at P = (1/10, 3/10).

## How the author's work relates

The Pentametric Formula 𝔓(n) returns, at each Lucas number, the **area** of the matching Fibonacci square: 𝔓(Lₖ) = Fₖ². Holden's result gives the **position** of that square's centre: Lₖ · √0.1. Together they show that one Lucas number gives both the area of a Fibonacci square and the location of its centre. This correspondence, and everything else built on the Pentametric Formula, is the author's contribution; see [`../Paper/pentametric_cycle.pdf`](../Paper/pentametric_cycle.pdf).
