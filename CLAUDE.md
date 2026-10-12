# TALEEM360

STEM learning app for STBB (Sindh Textbook Board) Classes 6-10: a student Android app plus a teacher web dashboard.

## Flow

login -> scan one photo -> server recognition -> fetch .glb -> in-app model-viewer -> AI tutor (RAG + Gemini) -> 5-question MCQ quiz -> Firestore -> teacher dashboard

## Stack

- Frontend: React + Vite + Capacitor, `<model-viewer>` for 3D (.glb)
- Backend: FastAPI, ChromaDB (RAG), Gemini
- Data/Auth: Firebase (Firestore)

## Standing rules (every step)

1. Never break or change previously working steps/code. Read an existing file before editing; make the smallest change; extend, don't replace.
2. Security first.
3. Never commit secrets: `.env`, API keys, passwords, credentials, Firebase service-account files, keys of any kind. Only `.env.example` (placeholders) is committed.
4. All backend calls go through `app/src/api.ts`. Mock data first.
5. Target low-end Android (Redmi 12C).
6. Update `README.md` at the end of every step.
7. DO NOT run `git add`, `commit`, `tag` or `push`. The user does that in PowerShell.
8. Do not install anything unless asked. One step at a time.

## Responsive rules (every screen)

- Every student screen is wrapped in `app/src/components/StudentShell.tsx`. Never build a student screen without it. Teacher screens (`/teacher*`) do not use it: full-width, desktop-first.
- Phone (<= 480px): fills the viewport edge to edge, using `100dvh` (never `100vh` alone). Wider: one centred column, max-width 430px, on a `#0B1624` page.
- Put the fixed bottom bar in the shell's `bottomBar` prop and decorations (rings etc.) in `decor`, so both stay clipped to the column. Content scrolls vertically inside the shell; the bottom bar stays fixed.
- Respect safe areas: `env(safe-area-inset-top/bottom)` on headers and bottom bars (`viewport-fit=cover` is set in `index.html`).
- Touch: tappable elements at least 44x44px, inputs `font-size` at least 16px, no hover-only behaviour, no horizontal scroll.
- Landscape phones (height < 500px): content scrolls, nothing is clipped or covered by the bar.
- Check new screens at 360x640, 390x844, 412x915, 844x390, 768x1024, 1366x768 and 1920x1080.
