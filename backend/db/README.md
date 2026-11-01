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

## migrations/

SQL files that **change the database** (new columns, indexes, functions). They are different from `seed_models.sql`, which only inserts data. A migration is run **once**, by you, after you have read it.

### migrations/2026-11-01_roll_numbers.sql (step 5A)

> **Read this file before you run it.** It was written without access to the real database and has **not been run anywhere**. The app does not apply it. The top of the file lists every assumption it makes about `join_class`, `enrollments`, `classes` and `profiles`; check each one against your project first.

What it does:

- Adds `enrollments.roll_no` (optional text, 1 to 20 characters) and a **unique index on `(class_id, roll_no)`** for rows that have a roll. Old enrollments without a roll stay valid. A roll number is unique only **inside** a class.
- Adds `public.join_class_with_roll(p_code, p_roll)`. It requires a signed-in student, normalises the roll (trim, upper case, collapse spaces, strip leading zeros when all digits; only `A-Z`, `0-9`, `-` and `/`), calls the **existing** `public.join_class(p_code)` (so its role checks, lockout and rate limiting stay in force), and then stores the roll on the student's enrollment. A wrong code returns `NULL`. A roll already used in that class raises `roll_taken` and rolls everything back, including the enrollment.
- `revoke all ... from public` and `from anon`, `grant execute ... to authenticated`. It changes no existing function, policy or grant.

How to run it:

1. **Review the file** (the assumptions at the top, then the code).
2. Open the Supabase Dashboard and pick your project.
3. Go to **SQL Editor** and click **New query**.
4. Paste the whole file and click **Run**. It runs in one transaction (`begin` ... `commit`): if anything fails, nothing is saved.
5. Check it: `select proname, prosecdef from pg_proc where proname = 'join_class_with_roll';` should return one row with `prosecdef = true`.

It is safe to run again (`if not exists` and `create or replace`). The app needs it for class-student sign-up and for joining a class with a roll number; until it is run, those two things show a "try again later" message.

## audit_policies.sql (read only)

Only SELECT statements: it changes nothing. Paste it into the SQL Editor and run it to list the row-level security policies (`pg_policies`), the table grants and the function rights for `profiles`, `classes`, `enrollments`, `attempts`, `models` and `quiz_questions`. The last lines of the file say what to look for (for example: students must not be able to update or delete `enrollments`, or read `correct_index`).

## migrations/2026-11-01_service_role_grants.sql

Gives the `service_role` (used only inside the Edge Function `manage-student`) the table privileges it needs, and nothing more: `usage` on schema `public`, `select` on `profiles` and `classes`, `select, insert, delete` on `enrollments`. Run it in the SQL Editor (it is safe to run more than once) if the function fails with outcome `error:profile` in its log. Why it was needed: after default grants are revoked, the service role keeps bypassing Row Level Security but has no table access. After any revoke, check grants for every role (`anon`, `authenticated`, `service_role`) with `audit_policies.sql`.
