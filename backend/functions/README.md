# Edge Functions (Supabase)

## manage-student (step 5B)

Lets a **teacher** reset a class student's PIN or remove a student from their class.
Setting someone else's password and deleting a login need Supabase's **service-role key**, so this cannot be done in the app.

**The function is a file for you to review and deploy yourself. It has not been deployed or run against a real project.**

### The service-role key: read this first

- Supabase **injects** `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into every Edge Function by itself. You do not set them and you do not need to know the key.
- **Do not copy the service-role key anywhere**: not into this repo, the app, a `.env` file, a chat, a screenshot or a log. The app only ever uses the public anon key.
- Keep **"Verify JWT"** switched **on** (the default). The function also checks the caller itself.
- Optional secret `CLASS_LOGIN_DOMAIN`: set it only if you changed `VITE_CLASS_LOGIN_DOMAIN` in the app. The two must be identical (default `students.taleem360.example`). It is a setting, not a secret.

### What it does

`POST` with the teacher's session and `{ "action": "reset_pin" | "remove_student", "student_id": "...", "class_id": "..." }`.

| Action | Class-login student | Email learner |
|--------|---------------------|---------------|
| `reset_pin` | Sets a new random 6-digit PIN (never an obvious one) and returns it **once**. It is not stored or logged | Refused (they use their own password) |
| `remove_student` | Deletes their enrolment rows, then their login. This frees the roll number and **permanently deletes their quiz history** (through the existing cascades). If the login cannot be deleted the enrolment is put back and an error is returned | Only deletes the enrolment for **this class**. Account and quiz history stay |

**Checks done inside the function** (the request body is never trusted; every failed permission check returns the same `403 Not allowed`):

1. the `Authorization` header holds a valid user session;
2. that user has role `teacher` in `profiles`;
3. that user owns `class_id` (`classes.teacher_id`);
4. `student_id` is enrolled in `class_id` (`enrollments`);
5. `student_id` is not the caller, and its profile role is `student`.

Only the action, the teacher id and the student id are logged. Never a PIN, token or key.

### Assumptions to check before deploying

- `profiles(id, role)`, `classes(id, teacher_id)` and `enrollments(class_id, student_id)` exist with those column names.
- Deleting an auth user removes the `profiles` row, `attempts` and other rows that point to it (foreign keys with `on delete cascade`). If something blocks the delete, the function answers `409` and changes nothing.
- Re-inserting the saved enrolment rows (the "put it back" step) works for your `enrollments` table.

### Deploy: route A, Supabase Dashboard (no tools to install)

1. Supabase Dashboard > **Edge Functions** > **Deploy a new function** > **Via Editor**.
2. Name it exactly `manage-student`.
3. Replace the sample code with the whole of `backend/functions/manage-student/index.ts` and deploy.
4. In the function's settings keep **Verify JWT** on.
5. Do not add any secret for the keys: they are already there.

### Deploy: route B, Supabase CLI

```
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy manage-student
```

Run these from the `backend` folder (the CLI looks for `supabase/functions`; if you do not use `supabase init`, copy `functions/manage-student` to `supabase/functions/manage-student` first). Do not pass `--no-verify-jwt`. Optional: `supabase secrets set CLASS_LOGIN_DOMAIN=<your domain>` only if you changed it in the app.

### Check it works

After deploying, sign in as the teacher in the app, open a class and press **Reset PIN** for a class student. A new PIN appears once; the student can then sign in with it. If the app says the function is not deployed yet, the name or the project is wrong.

### Known limitations

- A student's existing sessions on other devices stay valid until they expire after a PIN reset.
- No rate limit on teacher actions yet.
- No student self-service PIN change yet.
