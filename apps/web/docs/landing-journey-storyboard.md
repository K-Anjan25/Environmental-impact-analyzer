# EcoImpact Lab landing journey: storyboard

The landing page has a pinned 3D journey between the hero and the guide cards.
The reader walks one process from the first choice to the impact reading. The
camera glides along one rail. Each frame is a station with one 3D object on the
right and one text card on the left.

## Principles

1. **One frame at a time.** A text card is visible only when its frame is the
   current one. Cards fade out completely before the next one starts to fade in,
   so two cards never overlap.
2. **Objects are built from geometry, not images.** Each object is a procedural
   three.js model: a turbine, a globe, a tray of quantity blocks, an indicator
   ring, and a closing ring set.
3. **Motion is damped.** The scroll position is eased with frame-rate
   independent damping, so the camera never jumps when the reader scrolls fast.
4. **Depth comes from layers.** A turbine backdrop sits behind everything, the
   objects sit in the middle distance, and particles float in front.
5. **Reduced motion keeps the sequence.** Spinning and pointer sway stop. The
   scroll-linked travel and text changes remain, because the reader controls them.

## Timing

The pinned section is 440vh tall, so the reader scrolls about 340vh while the
journey plays out. Each frame is 0.25 of the progress range, which is about 85vh
of scrolling.

| Quantity | Value | Why |
| --- | --- | --- |
| Section height | 440vh (380vh on phones) | Gives each frame room to breathe. |
| Frame spacing | 0.25 of progress (~85vh) | One clear idea per screen of scrolling. |
| Text full-visible band | ±0.05 of progress | The card is readable while held. |
| Text fade band | 0.05 to 0.10 of progress | About 50vh of scrolling for each fade. |
| Object growth band | 0.25 of progress | Objects grow in as the camera nears them. |
| Scroll easing | exp(-7·dt) | Settles in about half a second. |
| Pointer easing | exp(-4·dt) | Soft parallax, never snaps. |

## Frames

Scroll progress `p` runs from 0 at the top of the pinned section to 1 at its
bottom. Frame `k` is centred at `p = k / 4`.

| Frame | Centre p | Text card (left) | Object (right) | Object motion | Camera |
| --- | --- | --- | --- | --- | --- |
| 0 Follow one process | 0.00 | Title and one-line promise | Wind turbine | Rotor turns slowly | Starts level, at the rail start |
| 1 Choose a process | 0.25 | Search factors by family and geography | Globe with process points | Globe turns; points show where processes come from | Glides past the globe, dips low |
| 2 Enter quantities | 0.50 | Quantities converted to the factor reference unit | Tray of nine blocks | Blocks rise to their quantity heights as the camera arrives | Rises and dips between stations |
| 3 Read the indicators | 0.75 | All 16 EF 3.1 indicators on their own lines | Core with a ring of 16 nodes | Nodes light one by one as the camera nears | Holds level for the reading |
| 4 Start an estimate | 1.00 | Start an estimate, with a button to the process library | Concentric rings around a core | Rings open outward | Settles at the end of the rail |

## Transitions between frames

- **Camera:** a Catmull-Rom curve through the stations, with a dip between each
  pair. The camera moves continuously and never cuts.
- **Objects:** each object scales from 70% to 100% and moves forward in depth
  as its weight rises. Objects far from the camera stay small, so the reader
  never sees two full objects at once.
- **Text:** each card fades out over 0.05 of progress while it drifts down 20px,
  then the next card fades in and rises. The fade is driven by scroll, so it
  reverses cleanly if the reader scrolls back.
- **Backdrop:** the turbine image is parented to the camera at a fixed distance,
  so it fills the view and drifts slightly with the scroll for depth.

## Layout rules

- Wide screens: text sits in the left 40%. Objects sit at the right, centred on
  a point 1.7 world units to the right of the camera, so the object sits well
  right of the text.
- Narrow screens (aspect below 0.9): text sits at the top and objects sit in the
  lower half, with no horizontal offset.
- Objects are scaled to fit a box of 30% of the view width and 62% of the view
  height on wide screens. They never exceed that box, so they don't clip at the
  right edge.

## Reduced motion and no-WebGL fallback

- With reduced motion on, the objects do not spin, pointer sway is off, and the
  text and objects still change with scroll.
- Without WebGL, the stage shows the turbine photo as a static background and
  the text cards still change with scroll.
