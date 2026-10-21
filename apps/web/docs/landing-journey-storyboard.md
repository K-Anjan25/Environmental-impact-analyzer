# Landing journey storyboard (stacked cards)

The journey is one scroll-driven section with five full-size cards. Each card rises over the previous one and the earlier cards recede underneath, like a stack. The stage behind the cards is an empty cream background. The site-wide turbine photo is not used in this section.

## Cards

| # | Title | Image | Text |
|---|-------|-------|------|
| 1 | Follow one process | `journey-turbine.png` | Walk through a single process, from first choice to indicator reading. |
| 2 | Choose a process | `journey-globe.png` | Search published apparel and footwear factors by process family and source geography. |
| 3 | Enter quantities | `journey-quantities.png` | Quantities convert to the factor reference unit before calculation. |
| 4 | Read the indicators | `journey-indicators.png` | All 16 EF 3.1 indicators, each with its unit. |
| 5 | Start an estimate | `journey-closing.png` | Enter your own processes and quantities. Ends with the "Start an estimate" button. |

## Stack timing

- Card i has stack position r = progress × 4 − i.
- r < −1: waiting below the stage (hidden).
- −1 ≤ r < 0: rising over the previous card with smooth easing.
- r ≥ 0: resting. Depth = min(r, 1). The card scales down by up to 6% and moves up by up to 3%, and it dims to 50% brightness as the next card covers it.
- Progress is eased per frame (time constant about 1/7 s). Reduced motion skips the easing and shortens the section.

## Layout

- Each card is a full-size panel: a text panel (42%) and an image panel (58%).
- The image panel fills its boundary with `object-fit: cover`. Text and image never overlap.
- Narrow (≤680 px): text on top (40%), image below (60%).

## Assets

- Images are square generated studio renders, used as-is with their own dark-teal backgrounds (#204654). They are not stock photos and contain no watermarks.
- Each image fills its panel with `object-fit: cover`, and a soft radial mask fades its edges into the panel colour.
