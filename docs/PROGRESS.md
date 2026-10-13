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
