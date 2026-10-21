# Landing journey storyboard (slide version)

The journey is one scroll-driven section with five slides. Each slide has an isolated studio image and a text card. Slides hand over one at a time with depth transitions. The backdrop is the site-wide image `/images/site-background-wind.jpg`.

## Slides

| # | Title | Image | Text |
|---|-------|-------|------|
| 1 | Follow one process | `journey-turbine.png` | Walk through a single process, from first choice to indicator reading. |
| 2 | Choose a process | `journey-globe.png` | Search published apparel and footwear factors by process family and source geography. |
| 3 | Enter quantities | `journey-quantities.png` | Quantities convert to the factor reference unit before calculation. |
| 4 | Read the indicators | `journey-indicators.png` | All 16 EF 3.1 indicators, each with its unit. |
| 5 | Start an estimate | `journey-closing.png` | Enter your own processes and quantities. Ends with the "Start an estimate" button. |

## Timing

- Slide k is centred at scroll progress k/4.
- Text is fully visible within ±0.05 of its centre, and gone beyond ±0.10.
- The image grows in over the 0.25 before its centre and out after it.
- Progress is eased per frame (time constant about 1/7 s). Reduced motion skips the easing.

## Depth

- Images move in z and rotate slightly (`perspective` on the stage, `preserve-3d` on the image).
- Images rise from below as they come forward.
- The backdrop moves slowest, so it sits farthest back.
- Text moves 22 px vertically at most. It never shares space with an image on desktop, and on narrow screens the text sits above the image.

## Fit and layout

- Images are `object-fit: contain` inside a fixed card, so each visual fits fully.
- Desktop: text on the left, image on the right. A gradient scrim keeps the text readable.
- Narrow (≤680 px): text at the top, image at the bottom, dots at the bottom edge.
- Reduced motion: the scene is shorter (300vh), with no easing.

## Assets

- Images are generated studio-style renders on plain backgrounds, with the backgrounds removed. They are not stock photos. No watermarks.
