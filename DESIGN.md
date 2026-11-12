# WASB Studio: design system

## Idea
The leap (الوثبة). Every piece of work stands in a WASB arch and crosses its edge, the way the horse rears inside the mark.

## Colour
Two inks on paper. Colour beyond these comes only from client work.
- `--red #C43B2B`: whole regions (the mark, the closing section) and single active markers. Never scattered.
- `--ink #111111`: text, the works ground, solid buttons.
- `--paper #F5F3EF`, `--paper-2 #EBE7E0`: grounds.
- `--mute #5D5852` on paper, `--mute-on-ink #B5AEA4` on ink: secondary text.

## Type
- Display: Alexandria 700 to 900 (Arabic and Latin), echoing the wide heavy wordmark. Arabic line-height 1.2 to 1.35; Latin 1.0 to 1.1 with slight negative tracking.
- Body: IBM Plex Sans Arabic 400, 1.0625rem / 1.75.
- Hero and closing titles cap at 6rem.

## Shape
One shape: the arch, a flat base with a rounded top (`--arch: 999px 999px 0 0`). It is the frame, the window, the mask, the list marker and the button (rounded top corners, flat base, standing on a 1.5px baseline). No shadows except under a physical sheet; no gradients; no glass.

## Layout
- `.wrap` max 1360px with a fluid gutter.
- Works: a 12-column grid, plates of span 7 and 5 alternating, bottom-aligned so every arch stands on a shared baseline.
- Each plate has 15% headroom above its frame so the cutout can cross the top edge.

## Motion
- Things rise from the baseline and cross their frame: `clip-path: inset(100% 0 0 0)` to `inset(0)`, then the figure translates up.
- One scroll-driven moment: the hero pins while the mark's inner window opens to the full viewport (the gate), the mark leaps out, and the positioning line arrives.
- Ease-out only (`--out`), 0.5 to 1.2s. No bounce.
- `prefers-reduced-motion`: the hero unpins, the gate is removed, everything is visible at rest.

## Content rules
- Projects, sites, copy and contact details live in `js/config.js`.
- Client work is shown as supplied. Mockups reframe; they never redraw.
- No invented clients, results, dates or contact details.
