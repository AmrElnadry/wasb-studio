# WASB Studio: design system

## Idea
The leap (الوثبة). The horse leaves the frame of the mark; work crosses the edge of its frame; arrows leap out of their buttons. The logo is the only curved shape on the page and is never reused as a container.

## Colour
Two inks on paper. Colour beyond these comes only from client work.
- `--red #C43B2B`: the mark, the leap screen, the closing section, primary action, small diamond markers.
- `--ink #111111`: text, the works and approach grounds, solid buttons.
- `--paper #F5F3EF`, `--paper-2 #EBE7E0`: grounds.
- `--mute #5D5852` on paper, `--mute-on-ink #B5AEA4` on ink: secondary text.
The mark appears in red on paper and in paper on red. No other recolouring.

## Type
- Display: Alexandria 700 to 900. Arabic line-height 1.2 to 1.35; Latin 1.0 to 1.1 with slight negative tracking.
- Body: IBM Plex Sans Arabic 400, 1.125rem / 1.75.

## Shape
- Frames, buttons, fields and the header bar are straight rectangles with 1.5px ink rules.
- Markers are 8px diamonds, taken from the dots of the وثب wordmark.
- The approach arc is the one drawn curve besides the logo.

## Components
- Header: one floating bar (logo with its original wordmark, links, language, red action). Hides on scroll down, returns on scroll up. Below 1040px the links move to a full-screen menu.
- Button: label plus a square cell; on hover a colour rises from the base and the arrow leaps out of the cell and lands back.
- Service door (hero): rule, name, arrow cell, then a ground with real work crossing its top edge.
- Work card: uniform 4:3 photo frames in two columns; the first and last are full width. Filter by the three services.
- Service sheet: three full-width sheets that stack on scroll, each with text, deliverables, a link to filtered work, and one real image.

## Motion
- Scroll-driven leap: the hero pins, the horse separates from its frame, arcs to the centre and grows until its red fills the viewport, then the positioning line arrives.
- Reveals rise from the base (`clip-path` inset) with ease-out, 0.5 to 1.1s. No bounce.
- `prefers-reduced-motion`: the hero unpins, the leap is removed, everything is visible at rest.

## Content rules
- Projects, sites, copy and contact details live in `js/config.js`.
- Client work is shown as supplied. Mockups reframe; they never redraw.
- No invented clients, results, dates or contact details.

## Current page (dark version)
- Intro: a red square on black flashes six covers, then grows into the centred red slab; the wordmark wipes in right to left. Skipped with `?nointro`, a hash link, or reduced motion; any click, key or scroll skips it.
- Hero: the three services sit inside the white stroke of the letter ب; hovering one opens a small preview window. English places them as a list.
- Dock: logo bottom-right, menu and language bottom-left, no frames. The menu icon is the three dots of ث.
- Works: an index of project names with a sticky preview; filtered by service.
- Sites: a panoramic hall; the centre site scrolls its home page, neighbours are blurred, auto-advances every 9s.
- Approach: pinned; the red line draws with scroll and each step appears when the line reaches it.
- Contact: WhatsApp button, mobile number and address from `js/config.js`.
