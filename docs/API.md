# TALEEM360 API contract

Status: **PLANNED**. No backend exists yet. Every endpoint below is mocked inside `app/src/api.ts` today (`VITE_USE_MOCK=true`). This file is the binding contract the backend (FastAPI) and the app must both follow. Where `api.ts` differs from this contract today, see "Known gaps" in the [README](../README.md#9-backend-integration).

- [Conventions](#conventions)
- [Endpoints](#endpoints)
  - [GET /health](#get-health)
  - [GET /me](#get-me)
  - [GET /home](#get-home)
  - [GET /models](#get-models)
  - [POST /recognize](#post-recognize)
  - [GET /models/{id}](#get-modelsid)
  - [GET /models/{id}/content](#get-modelsidcontent)
  - [POST /ask](#post-ask)
  - [GET /models/{id}/quiz](#get-modelsidquiz)
  - [POST /quizzes/{quizId}/submit](#post-quizzesquizidsubmit)
  - [GET /teacher/classes](#get-teacherclasses)
  - [GET /teacher/results](#get-teacherresults)
  - [Teacher projector (no endpoint)](#teacher-projector-no-endpoint)
- [Errors](#errors)
- [Pagination, versioning and rate limits](#pagination-versioning-and-rate-limits)

## Conventions

| Item | Rule |
|------|------|
| Base URL | `${VITE_BACKEND_URL}/api/v1` (for example `http://localhost:8000/api/v1` in development) |
| Format | JSON (`Content-Type: application/json`) except `POST /recognize` (`multipart/form-data`) |
| Auth | Firebase ID token in `Authorization: Bearer <token>` on every endpoint except `GET /health` |
| Roles | `student` or `teacher`, stored as a Firebase custom claim `role`. Teacher endpoints return `403 forbidden` for students |
| Login | Done by the Firebase Auth SDK inside the app (planned for step 5). There is **no** login endpoint. `api.login` stays a mock until then |
| IDs | Lowercase slugs, e.g. `heart`, `lungs`, `dc-motor` |
| Languages | `en` or `ur`. Urdu text is UTF-8, right-to-left |
| Time | ISO 8601 UTC strings, e.g. `2026-01-31T10:15:00Z` |
| Unknown fields | Clients must ignore fields they do not know, so the backend can add fields without breaking the app |

All examples use placeholder names and sample data only.

## Endpoints

### GET /health

Liveness check. **No auth.**

Response `200`:

```json
{ "status": "ok", "version": "0.1.0" }
```

### GET /me

Who am I. Auth: student or teacher.

Response `200`:

```json
{
  "uid": "uid_abc123",
  "name": "Ayesha",
  "role": "student",
  "classLevel": 9,
  "classId": "9a"
}
```

Notes: `classLevel` is an integer 6 to 10 for students. `classId` is a string such as `"9a"` for students. For teachers both `classLevel` and `classId` are `null` (a teacher can have several classes; use [`GET /teacher/classes`](#get-teacherclasses)).

### GET /home

`api.getHomeData`. Auth: student.

Response `200`:

```json
{
  "student": { "name": "Ayesha", "classLevel": 9 },
  "subjects": [
    { "id": "biology", "name": "Biology", "examples": "Heart, lungs, cell" },
    { "id": "chemistry", "name": "Chemistry", "examples": "Atom, molecules" },
    { "id": "physics", "name": "Physics", "examples": "Motor, turbine" },
    { "id": "cs", "name": "Computer Science", "examples": "Hardware, logic" }
  ],
  "recent": [
    { "modelId": "heart", "title": "Human heart", "subject": "Biology", "chapter": "Ch 9 Transport" }
  ]
}
```

Notes: `recent` is the student's last scans (newest first, at most 5). The app builds the subtitle ("Biology · Ch 9 Transport") from `subject` and `chapter`.

### GET /models

List models. Auth: student or teacher.

Query parameters (all optional): `subject` (e.g. `biology`), `classLevel` (6 to 10), `page`, `pageSize` (see [Pagination](#pagination-versioning-and-rate-limits)).

Response `200`:

```json
{
  "models": [
    {
      "id": "heart",
      "title": "Human heart",
      "subject": "Biology",
      "classLevel": 9,
      "chapter": "Ch 9 Transport",
      "thumbUrl": "https://storage.example.invalid/thumbs/heart.webp"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### POST /recognize

`api.recognize`. Auth: student. Rate limited.

Request: `multipart/form-data` with one field, `photo`.

| Rule | Value |
|------|-------|
| Format | JPEG |
| Client resize | longest side 1024 px |
| Target size | under 1 MB |
| Hard limit | 5 MB (larger gets `413 too_large`) |

Response `200`, recognised:

```json
{
  "status": "ok",
  "modelId": "heart",
  "label": "Human heart",
  "confidence": 0.93,
  "matchedBy": "embedding+geometry",
  "figure": "Fig 9.4"
}
```

Response `200`, not found (this is **not** an HTTP error):

```json
{
  "status": "not_found",
  "reason": "low_confidence",
  "tip": "Hold the phone steady and fill the box"
}
```

Errors: `400 invalid_image` (not a readable JPEG), `413 too_large`, `429 rate_limited`, plus the [common errors](#errors).

Notes: `matchedBy` is one of `embedding`, `embedding+geometry`, `caption` (planned values). `confidence` is 0 to 1. The not-found rule is described in the README recognition section.

### GET /models/{id}

`api.getModel`. Auth: student or teacher.

Response `200`:

```json
{
  "id": "heart",
  "title": "Human heart",
  "titleUr": "انسانی دل",
  "subject": "Biology",
  "classLevel": 9,
  "chapter": "Ch 9 Transport",
  "glbUrl": "https://storage.example.invalid/models/heart.glb?signature=PLACEHOLDER",
  "glbExpiresAt": "2026-01-31T11:15:00Z",
  "glbSizeBytes": 2400000,
  "version": 3,
  "hotspots": [
    { "partId": "aorta", "position": "0.12m 0.31m 0.05m", "normal": "0m 1m 0m" }
  ]
}
```

Notes:

- `glbUrl` is a short-lived signed URL. The app downloads the file and caches it keyed by `id` and `version`. When `version` changes, the cache entry is replaced.
- `position` and `normal` use the same string format as `<model-viewer>` hotspot slots (`"x y z"` with units).
- Errors: `404 not_found` for an unknown id.

### GET /models/{id}/content

`api.getContent`. Auth: student or teacher.

Response `200`:

```json
{
  "modelId": "heart",
  "source": { "book": "Class 9 Biology (STBB)", "chapter": "Ch 9 Transport", "pages": "112-114" },
  "defaultPartId": "aorta",
  "parts": [
    {
      "id": "aorta",
      "nameEn": "Aorta",
      "nameUr": "ابہر",
      "textEn": "The largest artery in the body. It carries oxygen-rich blood from the left ventricle out to the whole body.",
      "textUr": "سب سے بڑی شریان، جو بائیں بطن سے آکسیجن والا خون پورے جسم تک پہنچاتی ہے۔",
      "audioEnUrl": "https://storage.example.invalid/audio/heart/aorta-en.mp3",
      "audioUrUrl": "https://storage.example.invalid/audio/heart/aorta-ur.mp3",
      "color": "#FFB020"
    }
  ]
}
```

Notes: `defaultPartId` is an **optional addition to the original contract** (added in step 1C): the part the viewer selects first. If it is missing the app selects the first part. `part.id` matches `hotspots[].partId` from `GET /models/{id}` and the named material or node in the `.glb`. `audioEnUrl` and `audioUrUrl` may be `null` until audio is recorded. `color` is the dot colour shown next to the part name.

### POST /ask

`api.askQuestion`. Auth: student. Rate limited.

Request:

```json
{
  "modelId": "heart",
  "partId": "aorta",
  "question": "Why is the wall of the aorta so thick?",
  "lang": "en"
}
```

`partId` is optional. `lang` is `en` or `ur` and sets the answer language.

Response `200`, answered from the book:

```json
{
  "answer": "The aorta wall is thick because blood leaves the left ventricle at high pressure.",
  "lang": "en",
  "grounded": true,
  "sources": [{ "book": "Class 9 Biology (STBB)", "chapter": "Ch 9 Transport", "page": 113 }]
}
```

Response `200`, the book has no answer:

```json
{
  "answer": "I could not find this in your textbook. Please ask your teacher.",
  "lang": "en",
  "grounded": false,
  "sources": []
}
```

Notes: the backend answers only from retrieved textbook chunks. When nothing relevant is retrieved it must return `grounded: false` and say it was not found in the book, never a guess.

### GET /models/{id}/quiz

`api.getQuiz`. Auth: student.

Response `200` (always 5 questions):

```json
{
  "quizId": "quiz_heart_v1",
  "modelId": "heart",
  "questions": [
    {
      "id": "q1",
      "text": "How many chambers does the human heart have?",
      "options": [
        { "id": "a", "text": "Two" },
        { "id": "b", "text": "Three" },
        { "id": "c", "text": "Four" },
        { "id": "d", "text": "Five" }
      ]
    }
  ]
}
```

**This response never includes the correct answers.** They stay on the server until the student submits.

### POST /quizzes/{quizId}/submit

`api.submitQuiz`. Auth: student.

Request:

```json
{
  "answers": [
    { "questionId": "q1", "optionId": "c" },
    { "questionId": "q2", "optionId": "b" },
    { "questionId": "q3", "optionId": "c" },
    { "questionId": "q4", "optionId": "b" },
    { "questionId": "q5", "optionId": "a" }
  ]
}
```

Response `200`:

```json
{
  "score": 4,
  "total": 5,
  "results": [
    { "questionId": "q1", "correct": true, "correctOptionId": "c", "topic": "Chambers" },
    { "questionId": "q5", "correct": false, "correctOptionId": "c", "topic": "Pulmonary trunk" }
  ],
  "savedResultId": "res_xyz789"
}
```

Notes: the server marks the quiz and writes the result to Firestore (`quizResults`). The correct option ids are returned only now. A missing answer counts as wrong. Resubmitting the same `quizId` creates a new attempt. Errors: `404 not_found` for an unknown `quizId`. A malformed body (missing field, unknown `questionId` or `optionId`) returns `400 invalid_request`.

### GET /teacher/classes

Lists the teacher's classes. Auth: **teacher only** (students get `403 forbidden`).

Response `200`:

```json
{
  "classes": [
    { "id": "9a", "name": "Class 9-A", "subject": "Biology", "studentCount": 32 }
  ]
}
```

Notes: the `id` values are the ones to use as `classId` in `GET /teacher/results`. `studentCount` is a sample number here.

### GET /teacher/results

`api.getTeacherResults`. Auth: **teacher only** (students get `403 forbidden`).

Query parameters (optional): `classId` (use an `id` from [`GET /teacher/classes`](#get-teacherclasses)), `modelId`.

Response `200`:

```json
{
  "summary": { "studentsTaken": 5, "classAverage": 72, "mostScannedModel": "Heart" },
  "rows": [
    { "studentName": "Zainab Ali", "modelId": "heart", "score": 5, "total": 5, "label": "Strong" },
    { "studentName": "Bilal Ahmed", "modelId": "heart", "score": 2, "total": 5, "label": "Needs help" }
  ],
  "weakTopics": [
    { "topic": "Heart valves", "percentCorrect": 40 },
    { "topic": "Chambers", "percentCorrect": 80 }
  ]
}
```

`label` rule: 4 or 5 correct is `Strong`, 3 is `Okay`, 0 to 2 is `Needs help`. `classAverage` is a percentage. `weakTopics` is sorted lowest `percentCorrect` first. Names in the examples are sample data.

### Teacher projector (no endpoint)

The projector screen is client-only. It opens at `/teacher/projector?model=<id>` and uses the data from `GET /models/{id}` and `GET /models/{id}/content`. It has no endpoint of its own.

## Errors

Every non-2xx response uses one format:

```json
{ "error": { "code": "not_found", "message": "Model 'xyz' does not exist." } }
```

| HTTP | `code` | When |
|------|--------|------|
| 400 | `invalid_image` | The uploaded photo is missing or not a readable JPEG |
| 400 | `invalid_request` | Malformed body: missing required field, unknown `questionId` or `optionId`, or a bad query value |
| 401 | `unauthorized` | Missing, expired or invalid Firebase ID token |
| 403 | `forbidden` | Valid token but the role is not allowed (for example a student calling `/teacher/results`) |
| 404 | `not_found` | Unknown model, quiz or route |
| 413 | `too_large` | The photo is larger than 5 MB |
| 429 | `rate_limited` | Too many requests. Includes a `Retry-After` header (seconds) |
| 500 | `server_error` | Anything unexpected. The message never contains stack traces or secrets |

`message` is for developers and logs. The app shows its own friendly text. A `not_found` recognition result is **not** an error; it is a normal `200` with `"status": "not_found"`.

## Pagination, versioning and rate limits

- **Versioning:** the version is in the path (`/api/v1`). Breaking changes go to `/api/v2`; adding fields to a response is not breaking. `GET /health` reports the server version.
- **Pagination:** only list endpoints paginate (`GET /models`, and later `GET /teacher/results` if a class is large). Use `page` (starts at 1) and `pageSize` (default 20, max 100). The response includes `page`, `pageSize` and `total`.
- **Rate limits (planned, per user):** `POST /recognize` and `POST /ask` are limited to **30 requests per minute per user**. Other endpoints use a looser limit (value TBD). Over the limit returns `429 rate_limited` with `Retry-After`.
- **Caching:** `GET /models/{id}` is cacheable by the app by `version`. Signed `.glb` URLs expire (`glbExpiresAt`); the app asks again when needed.
