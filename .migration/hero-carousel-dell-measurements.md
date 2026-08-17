# Dell Hero — Measured Reference Values (dell.com/en-us)

Captured from live `#hpg-hero-div` computed styles at 375 / 834 / 1440 viewports.
Source of truth for the EDS `hero-carousel` block.

## Responsive layout switch (key finding)
- Desktop (>= ~1024px, we use 900px): text card **overlaid** on image, **white** text, image `object-fit: cover`.
- Mobile & tablet (< ~1024px): **stacked** — image on top, text card **below** on white, **black** text; controls below text.

## Image aspect ratios per breakpoint
- `>=1280`: 2560x900 (2.844:1)
- `900-1279`: 2560x1066 (2.40:1)
- `<900`: 1024x768 / 480x360 (4:3)

## Typography (Roboto — matches project font)
| Element | Desktop (>=900) | Mobile/Tablet (<900) |
|---|---|---|
| Eyebrow (.ghpg-title) | 20px / lh 28 / weight 400 / margin 0 0 8 | 16px / lh 24 / weight 500 / margin 0 0 8 |
| Heading (.ghpg-subtitle) | 40px / lh 48 / weight 300 / margin 8 0 | 32px / lh 40 / weight 300 / margin 8 0 |
| Description | 20px / lh 28 / weight 400 / margin 0 0 24 | 16px / lh 24 / weight 400 / margin 0 0 24 |
| Text color | #fff (over image) | #000 (on white) |

## Colors
- Hero text: #fff desktop / #000 mobile
- Dark token: #0e0e0e
- Nav arrows: #0063b8
- Step counter: #0672cb
- Legal info icon: #006bbd (overridden to #fff when overlaid on image)
- Nav bar background: #fff

## Buttons (DDS editorial, size lg, radius 2px, height 48px, padding 11px 19px, font 16px/24 weight 500)
- Dark-theme slide (white text): primary bg #fff / text #0e0e0e / border 1px #fff; secondary transparent / text #fff / border 2px #fff
- Light-theme slide: invert — dark fill primary, dark outline secondary, dark text

## Controls
- Loop container: flex row, align flex-end, gap ~12px
- Nav group (prev + step + next): flex align center, bg #fff, height 40px
  - Arrow button: 40x40, transparent, color #0063b8, radius 2px, padding 11px
  - Step (x/total): 14px weight 400, color #0672cb, padding 0 8px
- Pause/Play button: 14px weight 500, color #fff, bg #0e0e0e, border 1px #0e0e0e, radius 2px, padding 7px 15px, height 40px, icon after label

## Behavior
- Auto-slide 8000ms, fade transition, pause on hover.
