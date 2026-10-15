# Progress

| Step | Weight | Status |
|------|--------|--------|
| 0 | 5% | Done |
| 1 | 15% | Done: 1A (Login, Home), 1B (Scan, Fetching, Viewer), 1C (api.ts aligned with the contract; Ask, Quiz, Result, Teacher dashboard, Projector). All on mock data |
| 2 | 10% | Pending |
| 3 | 15% | Pending |
| 4 | 10% | Pending |
| 5 | 10% | Pending |
| 6 | 10% | Pending |
| 7 | 5% | Pending |
| 8 | 10% | Pending |
| 9 | 10% | Pending |

**Total complete: 20%**

1A responsive layout fix done.
Docs-1 done (README.md and docs/API.md).
Docs-1c done (contract fixes: invalid_request, GET /teacher/classes, classId in GET /me).
Step 1C done. Step 1 complete.
Subject tabs: Chemistry, Physics and Computer Science open their own sample model, parts, quiz and tutor answers in mock mode (Home subject cards pass `?subject=` through Scan and Fetching). Sample chapter and page labels still to be checked against the real STBB books.

Subject models are now real shaded 3D stand-ins (atom, DC motor, computer board) with drag-to-rotate, zoom and animation (`components/scene3d.ts`, `Stage3D.tsx`). The Scan-screen textbook figures stay flat. Not yet run in the real app (npm blocked in the sandbox); run `npm run build`.
Step 2C (laptop): real heart .glb in model-viewer. Phone test still pending.
Step 2D: 9 selectable heart parts with labels (laptop). Phone test pending.

UI polish pass (laptop): student font sizes scaled down about 10%, tighter top/bottom padding on every screen, soft card shadows and a gradient scan card on Home, Login now fits one screen (no scrollbar) with fluid spacing, scrollbars hidden inside the student column (scrolling still works). Checked for no horizontal scroll and 44px tap targets at 360x640 to 1366x768. Phone test on Redmi 12C still pending.
UI polish round 2: Viewer part chips are now one swipe row (selected chip auto-centres) so the explanation and Ask/Quiz buttons fit on screen without scrolling at 390x844; tab bar labels 12px.
UI polish round 3: new design layer `app/src/styles-ui.css` (loaded last): Baloo 2 rounded headings, graph-paper backgrounds, sticker-style buttons and cards with a solid offset edge, amber highlighter accent, tinted subject cards on Home, smaller components on every student screen. Added `@fontsource/baloo-2` to app/package.json.
UI polish round 4: signature 360-orbit motif (rings with a travelling dot) on Login, Home and Fetching. Home: hero scan card with orbit art and CTA, tinted subject tiles with large watermark icons. Fetching: progress-ring orb loader and a timeline card. Viewer: bigger part name with "Part n of N", filled active chip, plain readable explanation with a part-colour accent bar. Styles in `app/src/styles-ui2.css`.
UI round 5 (Sticker lab, direction B): new `app/src/styles-sticker.css` replaces the orbit layers (styles-ui.css and styles-ui2.css removed). Paper background with a doodle SVG (`app/public/doodles.svg`), thick ink outlines, offset shadows, colour-block tiles, yellow/mint buttons. Applied to Login, Home, Fetching, Viewer, Ask, Quiz, Result and the Scan controls. Teacher screens not restyled yet.
Viewer declutter: language toggle moved to the header, audio button to the title row, part chips flattened (selected chip yellow), sheet handle removed, smaller Ask/Quiz buttons, bigger model stage. Small controls (chips, language toggle, audio) keep a 44px tap area through an invisible pseudo-element.
UI scale: every student screen renders at 90% (`.shell { zoom: 0.9 }` in styles-sticker.css, with height and max-width divided by 0.9 so the column still fills the phone). Tap targets and input text are bumped by 1/0.9 so they still measure 44px and 16px on screen.
Login layout: curved sheet. Yellow top (minimal line-art background `app/public/login-bg.svg`) with the brand, headline and three stickers, and a cream sheet with rounded top holding the form. Added the `sun` tone to StudentShell.
Login animation: the line-art background SVG now animates (atom orbits, heart beats, bolt flickers, star spins, wave drifts) and the three subject stickers float, with the heart beating, atom spinning and bolt flickering. All motion stops with prefers-reduced-motion. Yellow top is now about 40% of the screen (was over half).
