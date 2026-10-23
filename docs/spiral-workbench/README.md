# Spiral Workbench

An interactive geometry tool for studying the Fibonacci spirals and Holden's lines. One page, plain HTML + JavaScript + SVG, no libraries, no build step, works offline.

## Open it

Double-click `index.html`. Files: `index.html`, `workbench.js`, this README.

## The frame

- The unit square is centred at the origin, corners (±½, ±½). One drawing unit (u) is the side of the unit square. y points up.
- The origins unit **h = √0.1 ≈ 0.316228** (written ρ in the notes; earlier called the Holden unit). Every length is shown in units and in h.
- Spiral 0 is the Fibonacci tiling (squares attached down, right, up, left, …) with its quarter-circle arcs; its square centres lie alternately on x + 3y = 0 and y = 3x − 1, which cross at Holden's crossing H₀ = (0.3, −0.1). The origins grid ("Holden grid" in the panel) is x + 3y = m and 3x − y = 1 + m (m whole), lines h apart.
- The eight spirals are spiral 0 under the 8 symmetries of the unit square: 4 rotations (0°, 90°, 180°, 270°, solid) and 4 mirrors (x-axis, y-axis, y = x, y = −x, dashed).

## Using it

- **Layers (right panel):** per spiral, show/hide the spiral, squares, centres, Holden lines, Holden grid and crossing. Click a column title to toggle it for all eight. Quick buttons: all on / all off / rotations only / mirrors only. Also: unit square, circle r = h, plain grid, snap, number of squares (1–14).
- **Tools (top):** Point, Segment, Line, Circle (centre + point), Circle r (type the radius in u or h, click the centre), Midpoint, Intersect (line/segment/circle/arc, built-in objects included), Parallel, Perpendicular, Polygon (shows its area), Distance, Angle, Area, Select (drag a free point to move it; Delete removes it and what depends on it), Undo/Redo, Clear. Keys: the letter in each tool's tooltip, Esc, Delete, Enter (close polygon), Ctrl+Z / Ctrl+Y.
- **Snapping:** to existing points, centres, square corners, crossings, intersections, and Holden-grid nodes of spirals whose grid is switched on.
- **Readouts:** values to 6 places, plus an exact form when it matches within 1e-9 (p/q with q ≤ 100, √ forms such as √5/12, multiples of π, multiples of h, arctan(p/q) angles). Hover a point for its coordinates (decimals and fractions).
- **View:** drag empty space to pan, wheel or +/− to zoom, Fit. Export SVG and PNG. Save/Load the drawing and settings as JSON.
- **Self-test:** runs on load, results in the console and the badge (top right of the canvas).

## Rotation (new)

- **Turn column** in the layers table: each spiral can be still (·), turn clockwise (↻) or anticlockwise (↺). Click the column title to set all eight.
- **Rotation panel:** ▶ play / ❚❚ pause, the angle slider θ (over 1 to 4 turns, to stop anywhere), ±1° steps, θ = 0, speed (2°/s to 360°/s), and the centre of the turn: each spiral's **own origin** (its Holden crossing, the centre it curls around) or **O**, the origin of origins. Everything of a spiral turns with it: squares, centres, Holden lines and grid. Turning a spiral clockwise about its origin makes it seem to curl in; anticlockwise, to grow out.
- **Crossings:** the points where the shown spirals cross each other, marked live (purple). **Trails** leaves the path of every crossing as the spirals turn.
- **Pin to the spirals** (on by default): a point clicked on a crossing, a square centre, a square corner or an origin, with any tool (Point, Segment, Distance, Angle, Polygon, Circle, Mark…), is pinned to it and follows the turn. A crossing of two spirals is followed along the whole of both spirals, from one arc to the next, always the crossing nearest to where it was: it moves on continuously in its own direction. If it runs off the end of the drawn spirals it is shown as lost, and picked up again if you turn back. Segments, polygons, distances, angles and areas built on pinned points update live. Pinned points are green; free points are black and stay where they are.
- **Mark** tool: click a point or a crossing to put an orange ring around it, to show where to look (for a screen recording, say); the ring keeps its size on screen and follows the point.
- **Centre of the turn** (the "about" menu): **H**, the spiral's Holden crossing; **O**, the origin of origins; or **where it starts**. The Fibonacci tiling starts at a corner of the unit square and cannot be continued inwards with Fibonacci squares, but it can with **halving squares**: the spiral's own rule run backwards with squares of sides 1/2, 1/4, 1/8, … This inward spiral converges exactly to **H′ = (7/10, −1/10)** for spiral 0 (and its images for the others): the mirror of H in the right side of the unit square, the origin of the neighbouring mirror square. Its squares behave like Holden's tiling around H′: their centres lie alternately on two perpendicular lines through H′, of slopes **7 and −1/7**, each half its square's diagonal from H′. With "where it starts" the halving squares and their arcs are drawn and the spiral turns about H′, with no gaps; with H or O they are not drawn. The self-test checks the limit and the two lines. (No constant ratio of squares ends at the spiral's own origin or at O.) Proofs, and what happens for other ratios: the note [*The Hidden Origin: halving squares and the start of the Fibonacci spiral*](https://doi.org/10.5281/zenodo.23592256).
- **The total angle turned** is kept across loops, and every move (playing, the slider, ±1°) is taken in steps of at most half a degree, so pinned points keep to their own crossings. **⏮ back to start** rewinds the whole turn, so every pinned point goes back along its own path to where it was made.
- **Measurement against the angle turned:** the selected distance, angle or area is plotted against the total angle while the spirals turn (half-degree steps, across loops). **enlarge** opens a large view that works like a price chart: the wheel zooms the angle and Shift + wheel the values; drag the value axis to stretch the waves and the angle axis to stretch θ; drag inside to pan; **auto values** fits the height to the part in view; click to put a vertical line that shows the exact angle and value (click it again to remove it, or **clear lines**); double-click resets; a crosshair reads off θ and the value. **× 1 … × 1000** multiplies the plotted values; **axis: fit / from 0 / log / breath** (on a log axis a steady scaling is a straight line; *breath* is the log of the value minus its own straight-line trend, so steady growth is flat and only the waves remain); **PNG** saves the graph as zoomed, with its settings and lines written on it; **CSV** saves every recorded measurement as a standard table (comma-separated, decimal point) with the angle turned, each value, and for the graphed one its log and breath. Every half-degree step is sampled, even at the highest speeds. *Clear trails and graph* starts again.
- **Lines by:** Holden's lines coloured by their role, odd line (centres 1, 3, 5, …) green and even line (centres 2, 4, 6, …) rust, or by their spiral.

The self-test still checks the exact, unturned construction; the turned spirals are rotations of it.

## Code map (workbench.js)

Sections are numbered at the top of the file: maths helpers, exact-form recognisers, the eight spirals, geometry, self-test, state and user objects, snapping and hit tests, drawing, tools, panels and file I/O. Section 11 is the rotation (live spirals, crossings, trails, the graph). Not included yet: 3D, sound, Pentametric areas.

## Credit

Holden's lines: H. L. Holden, *Fibonacci tiles*, Fibonacci Quarterly 13 (1975) 45–49. Concept and study: Lluis Garcia Torcal.
