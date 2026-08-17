# Kia Hero Carousel (#hero-car) — Measured Reference Values

Captured from live kia.com/in/home.html computed styles at 375 and 1440.
Source of truth for the EDS `hero-slider` block. Single breakpoint at 768/769px.

## Layout / sizing
| | Desktop (>=769) | Mobile (<769) |
|---|---|---|
| Slide aspect | 1440 x 945 (~1.524:1, landscape) | 375 x 667 (~0.562:1, portrait) |
| `.cont` position | relative, raised `bottom: 94.5px` from base, text-align center, color #fff | relative, `bottom: 66.7px`, center, #fff |
| `.l-wrap` gutter | margin 0 80px | margin 0 31px |

## Typography (source font `Kia-sig` — NOT available in project; substitute project heading font, keep sizes/weights exact)
| Element | Desktop | Mobile |
|---|---|---|
| `.sub-heading` (title) | 40px / lh 60 / weight 700 / ls 0.16px | 19.2px / lh 25 / weight 700 |
| `.fz-lg` (tagline) | 28px / lh 42 / weight 400 | 12px / lh 18 / weight 400 |
| `.desc` (base) | 16px / lh 24 / weight 400 | ~14px |
| `.t-discliamer` | 10px / lh 15 / #fff | 10px |
| all text color | #fff | #fff |

## Button `.btn`
- bg #fff, text #000, border 1px solid #fff, border-radius 0
- padding 18px 40px 19px, height 60px
- font 14px / lh 21 / weight 700
- margin-top 40px desktop / 30px mobile
- display inline-block

## Controls
- Arrows `.swiper-button-next/prev`: 40x40, background rgba(0,0,0,0.2), **display:none on mobile** (shown >=769)
- Pagination bullets: 40x30 clickable hit-area, visible marker is a thin bar; active #fff, inactive translucent white; pagination anchored `bottom:0`, centered
- Autoplay slides (Kia auto-advances), fade/slide transition

## Intentional fixes applied in migration (per spec)
- Source has invalid nested `<p>` inside `.desc` — authored cleanly in EDS (no nested `<p>`).
- Image slides missing `alt` — JS falls back `alt` to the slide title.
- Kia `gtagEvent(...)` analytics on arrows/next removed; no third-party analytics wired.
- Media re-hosted (placeholders used where real Kia assets unavailable); no Kia CDN hotlinking committed.
