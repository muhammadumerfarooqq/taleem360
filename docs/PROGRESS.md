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
Camera step: Scan now opens the phone back camera (getUserMedia, facingMode environment) and the shutter takes one photo, kept in memory (`app/src/photoStore.ts`) and handed to Fetching. If the live camera is not available (http address, permission denied) the drawn page stays as demo fallback plus a "Use the camera app instead" file input. Recognition is still the mock (Physics opens the DC motor). Android app permission comes with Capacitor.
Camera step 2: the drawn textbook page is gone from Scan. With a live camera the back camera fills the screen; without one (plain http on a phone) the screen shows an "Open camera" button that opens the phone camera app, and tries to open it automatically on touch devices. New `npm run dev:https` serves https with a self-signed certificate (adds the dev dependency @vitejs/plugin-basic-ssl) so the live camera works over Wi-Fi.
Demo recognition: in mock mode any real scanned photo opens the electric motor (dc-motor), whatever Home subject the student came from. Without a photo, the Home subject still decides. The Scan default subject is Physics. Real recognition replaces this in step 3.
Model swap: the Physics demo model is now an electricity generator (id `generator`, replaces the DC motor): magnet, coil, slip rings, brushes and a bulb that glows brighter and dimmer as the coil turns. New parts text, 5-question quiz and tutor answers (English and Urdu) on mock data; chapter and page labels still to be checked against the real STBB book. The scan picture `public/scan-pics/magnetic-bulb.png` is not used for matching yet.
Generator bulb: now a real bulb shape (lamp holder, screw base, neck, glass globe, filament). New Handle control (Off / Slow / Fast) in the viewer: Off = clear glass, no glow, coil stopped; Slow = yellow glow; Fast = white-hot globe, big halo and light rays, coil spins faster. New glow primitive in `scene3d.ts`.
Scan check (mock): a real photo is now compared by colour with `public/scan-pics/magnetic-bulb.png` (`app/src/mock/matcher.ts`, called from `recognize()` in api.ts). A match opens the generator; any other photo shows "Diagram not found". Tested with rotated, dark, bright, blurred and low-colour copies of the figure (all match) and with grey, skin, sky, red, noise, doodle and heart pictures (all rejected). It compares colours only, not shapes, so a picture that is just red and blue blocks would also pass. The real server recognition (step 3) replaces this. Threshold: MATCH_SCORE in matcher.ts.
Scan check, stricter: the matcher now also needs a solid red patch and a solid blue patch of similar size close together (the two magnets), not just matching colours; a scan with no real photo can no longer open a model (a failed capture stays on the Scan screen and the "continue without a photo" demo link is removed). Tested with synthetic dark, white and RGB keyboard pictures (all rejected) and copies of the figure (all match).
Logo: the Planet Taleem logo (green smiling planet, graduation cap, yellow ring) is extracted from the designer PDF as a vector file (`app/public/logo-planet.svg`, source copy in `brand/logo-planet.svg`) and used through `app/src/components/Logo.tsx` on Login (brand tile), Home (hero), Fetching (orb), Scan (camera panel), the teacher header and as the browser-tab icon. Android app icon and splash come with the Capacitor step.
Logo round 2: no white tile behind the logo (thin ink outline instead, gentle float); the SVG itself is animated (eye blinks, floating cube bobs, sparkle twinkles; stops with reduced motion). The logo now shows on every student page: Login, Home header and hero, Fetching, Scan, Viewer (stage corner), Ask, Quiz and Result, plus the teacher header.
Teacher screens in Sticker lab: new `app/src/styles-teacher.css` (loaded last) restyles the teacher dashboard and projector like the student app: yellow sidebar and top bar, doodle paper background, ink outlines and offset shadows, tinted stat cards, sticker chips and bars, white stage card on the projector. Layout is unchanged. No horizontal scroll or small tap targets from 360px to 1920px.
Teacher models: the dashboard now opens on a Physics class (Class 9-C) with generator quiz results and weak topics (slip rings, brushes), next to the two Biology classes. The projector opens the generator by default and has chips to switch between the generator, heart, carbon atom and computer hardware. The Scan a diagram and Scan to projector links open the class model instead of always the heart.
Step 3A: English and Urdu voice-over for the Electricity generator (Physics). The audio button in the Viewer now speaks the selected part (10 mp3 files in `app/public/audio/generator/`, made from the existing textEn/textUr with `python tools/make_voice.py`, edge-tts voices en-US-AriaNeural and ur-PK-UzmaNeural). Tap = play, tap again = stop; changing part, language or screen stops it; if the mp3 fails it falls back to the browser voice. Only the generator has voice for now; the other models keep null audio and the button does nothing. Urdu pronunciation and a real-phone test still to check. The percentage is unchanged.
Step 3B: Vercel deploy config. `app/vercel.json` rewrites every path to `index.html` so the BrowserRouter routes work on reload. Deploy to Vercel: Root Directory `app`, Build Command `npm run build`, Output Directory `dist`, no environment variables needed in mock mode. The percentage is unchanged.
AI assistant renamed to Chirag (single constant `ASSISTANT_NAME` in `app/src/config.ts`). Changed only user-visible text: the Ask screen header, greeting, input placeholder and typing label, and the Viewer button ("Ask Chirag"). Routes, file names and internal names are unchanged. The percentage is unchanged.
