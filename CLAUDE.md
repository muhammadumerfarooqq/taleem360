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
