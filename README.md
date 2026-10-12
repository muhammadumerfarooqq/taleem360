# TALEEM360

TALEEM360 is a STEM learning app for STBB Classes 6-10. Students use an Android app to scan a photo of a textbook object, view its 3D model, ask an AI tutor, and take a short quiz; teachers follow results on a web dashboard.

## Flow

login -> scan one photo -> server recognition -> fetch .glb -> in-app model-viewer -> AI tutor (RAG + Gemini) -> 5-question MCQ quiz -> Firestore -> teacher dashboard

## Stack

React + Vite + Capacitor, model-viewer, FastAPI, ChromaDB, Gemini, Firebase

## Folder structure

- `docs/` - documentation and progress
- `brand/` - brand assets
- `app/` - frontend (`src/mock`, `src/screens/student`, `src/screens/teacher`, `src/components`, `public/fonts`)
- `backend/` - FastAPI (`app/routers`, `app/services`, `scripts`, `tests`)
- `content/` - `models`, `references`, `test_photos`, `textbook_chunks`, `quiz`

## Progress

| Step | Weight | Status |
|------|--------|--------|
| 0 | 5% | Done |
| 1 | 15% | In progress: 1A done (Login, Home), 1B and 1C pending |
| 2 | 10% | Pending |
| 3 | 15% | Pending |
| 4 | 10% | Pending |
| 5 | 10% | Pending |
| 6 | 10% | Pending |
| 7 | 5% | Pending |
| 8 | 10% | Pending |
| 9 | 10% | Pending |

**Total complete: 10%**

1A responsive layout fix done.

## How to run

```
cd app
npm install
npm run dev
```

The app runs on mock data (`VITE_USE_MOCK=true`). All backend calls go through `app/src/api.ts`.
