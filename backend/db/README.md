# backend/db

Database files for TALEEM360 (Supabase). Only data for now.

## seed_models.sql

Puts the app's **models** and **quiz questions** into the database, so the next steps (saving quiz attempts, teacher results) have rows to point at.

- **Data only.** It has `INSERT ... ON CONFLICT DO UPDATE` and nothing else: no tables, no columns, no policies, no grants. The tables must already exist.
- **Safe to run again.** Models are matched by their `id`. Each question gets a fixed id, `md5(model_id || ':' || question number)::uuid`, so the same question always lands on the same row. Running the file twice makes no duplicates; it just refreshes the values.
- **Nothing is deleted.** If you later remove a question from the file, run a `delete` yourself; the seed will not do it.
- **It does not touch files.** No `.glb` or audio is moved or uploaded.
- **The app does not use it yet.** The app still reads the sample content in `app/src/mock`. This file is a copy of that content (the ids, grade, subject, title, GLB path, questions, options and right answers).

### How to run it

1. Open the Supabase Dashboard and pick your project.
2. Go to **SQL Editor** and click **New query**.
3. Open `backend/db/seed_models.sql`, copy all of it and paste it in.
4. Click **Run**.

The SQL Editor runs it with full rights, so row-level security does not get in the way. The whole seed runs in one transaction (`begin` ... `commit`): if anything fails, nothing is saved.

### What to expect

The last two lines are checks. The editor shows only the result of the last statement, so run each one on its own if you want to see both:

| Query | Expected result |
|-------|-----------------|
| `select count(*) from public.models;` | **4** (on an empty table) |
| `select model_id, count(*) from public.quiz_questions group by model_id order by model_id;` | 4 rows, **5** each: `carbon-atom`, `computer-hardware`, `generator`, `heart` (20 questions in total) |

### Models it seeds

These ids are exactly the ids the app uses.

| `id` | grade | subject | title | `glb_path` |
|------|-------|---------|-------|------------|
| `heart` | 9 | Biology | Human heart | `models/heart.glb` |
| `carbon-atom` | 9 | Chemistry | Carbon atom | NULL |
| `generator` | 9 | Physics | Electricity generator | NULL |
| `computer-hardware` | 9 | Computer Science | Inside a computer | NULL |

### How the values were chosen

| Column | Value |
|--------|-------|
| `models.glb_path` | `models/heart.glb` for the heart: the app loads `${BASE_URL}models/heart.glb` and the file is `app/public/models/heart.glb`. The other three models have **no `.glb` file** (the app draws them with built-in stand-ins), so it is NULL. Set it when their files exist |
| `quiz_questions.question_ur` | NULL. The sample quiz has no Urdu question text yet |
| `quiz_questions.explanation` | NULL. The sample quiz has no explanations yet |
| `quiz_questions.options` | `[{"id":"a","text":"..."}, ...]`, the same shape the quiz screen reads (`id` is the letter shown as A to D) |
| `quiz_questions.correct_index` | The 0-based position of the right option in `options` (so `0` is A and `3` is D), taken from the sample answer key |

Not stored, because the tables have no column for them: the topic of each question (used for the result screen), the Urdu and English part texts, the audio, and the chapter and book references.

### Before the app reads quiz questions from here

`quiz_questions` holds the right answer (`correct_index`). Make sure students cannot `select` that column directly, or they could read the answers before submitting. The usual way is to hand out the questions without `correct_index` (a view or a function) and mark the answers on the server.
