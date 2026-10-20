# Spiral Workbench

An interactive geometry tool for studying the Fibonacci spirals and Holden's lines. One page, plain HTML + JavaScript + SVG, no libraries, no build step, works offline.

## Open it

Double-click `index.html`. Files: `index.html`, `workbench.js`, this README.

## The frame

- The unit square is centred at the origin, corners (±½, ±½). One drawing unit (u) is the side of the unit square. y points up.
- Holden unit **h = √0.1 ≈ 0.316228**. Every length is shown in units and in h.
- Spiral 0 is the Fibonacci tiling (squares attached down, right, up, left, …) with its quarter-circle arcs; its square centres lie alternately on x + 3y = 0 and y = 3x − 1, which cross at Holden's crossing H₀ = (0.3, −0.1). The Holden grid is x + 3y = m and 3x − y = 1 + m (m whole), lines h apart.
- The eight spirals are spiral 0 under the 8 symmetries of the unit square: 4 rotations (0°, 90°, 180°, 270°, solid) and 4 mirrors (x-axis, y-axis, y = x, y = −x, dashed).

## Using it

- **Layers (right panel):** per spiral, show/hide the spiral, squares, centres, Holden lines, Holden grid and crossing. Click a column title to toggle it for all eight. Quick buttons: all on / all off / rotations only / mirrors only. Also: unit square, circle r = h, plain grid, snap, number of squares (1–14).
- **Tools (top):** Point, Segment, Line, Circle (centre + point), Circle r (type the radius in u or h, click the centre), Midpoint, Intersect (line/segment/circle/arc, built-in objects included), Parallel, Perpendicular, Polygon (shows its area), Distance, Angle, Area, Select (drag a free point to move it; Delete removes it and what depends on it), Undo/Redo, Clear. Keys: the letter in each tool's tooltip, Esc, Delete, Enter (close polygon), Ctrl+Z / Ctrl+Y.
- **Snapping:** to existing points, centres, square corners, crossings, intersections, and Holden-grid nodes of spirals whose grid is switched on.
- **Readouts:** values to 6 places, plus an exact form when it matches within 1e-9 (p/q with q ≤ 100, √ forms such as √5/12, multiples of π, multiples of h, arctan(p/q) angles). Hover a point for its coordinates (decimals and fractions).
- **View:** drag empty space to pan, wheel or +/− to zoom, Fit. Export SVG and PNG. Save/Load the drawing and settings as JSON.
- **Self-test:** runs on load, results in the console and the badge (top right of the canvas).

## Code map (workbench.js)

Sections are numbered at the top of the file: maths helpers, exact-form recognisers, the eight spirals, geometry, self-test, state and user objects, snapping and hit tests, drawing, tools, panels and file I/O. Not included yet (by design): 3D, sound, animation, Pentametric areas.

## Credit

Holden's lines: H. L. Holden, *Fibonacci tiles*, Fibonacci Quarterly 13 (1975) 45–49. Concept and study: Lluis Garcia Torcal.
