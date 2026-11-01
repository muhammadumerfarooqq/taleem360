# TALEEM360: Limitations, risks and how to defend them

This is the viva cheat sheet. Every limitation of the project is listed here, from day 1 until now, big or small. Each one has: what is limited, what to say in the viva, the planned fix, and its status.

**Rules for keeping this file alive**
1. After every phase or big chunk of work, update this file together with `README.md`.
2. Add every new limitation or issue the moment it is found.
3. Never delete a row. When something is fixed, change its status to `SOLVED in <phase>, <date>` and add one line to the change log at the bottom.
4. Be honest in the viva. Say "this is a known limitation, here is why it is acceptable now, and here is the fix".

**Status words:** `OPEN` (not fixed, fix planned) · `ACCEPTED` (by design, will not change) · `SOLVED in <phase>` · `TO CHECK` (not verified yet).
**Severity:** `HIGH` (can hurt the demo, data or trust) · `MED` · `LOW`.

**Phases.** Done: 4D (login), 4E (classes), 4F (quiz results and dashboards), 4G (seed), 5A (class login), 5B (Reset PIN, Remove student), Docs sync (1-Nov-2026), Vercel real mode (1-Nov-2026). Proposed next phases: **P6** recognition experiment, **P7** recognition server and real camera, **P8** tutor Chirag (RAG), **P9** models and audio in Storage, **P10** hardening (server marking, SMTP, rate limits), **P11** Capacitor APK and phone tests, **P12** diagrams and final report.

---

## A. Identity and login

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| A1 **HIGH** | **No password recovery by email** for teachers and independent learners. Supabase's built-in mail only sends to the project team, so "Forgot password" cannot work. Today the owner resets it by hand in the Supabase dashboard. | "Class students recover through their teacher (Reset PIN). Email recovery needs our own SMTP server, a configuration step, not a design problem. It is planned in hardening." | Set up custom SMTP (Resend, Brevo or similar) in Supabase, add a "Forgot password" screen. | OPEN (P10) |
| A2 **MED** | A **6-digit PIN is guessable** (1,000,000 combinations). Anyone who knows a class code and a roll number can try PINs. Protection today: Supabase sign-in rate limits, and trivial PINs (111111, 123456) are refused. | "It is a trade-off: young students need something they can remember without email. The risk is limited because an attacker must also know the class code and roll. We add lockout after failures." | Lock a (class, roll) pair after N wrong PINs; optional 8-digit PIN; CAPTCHA on login. | OPEN (P10) |
| A3 **MED** | **Class codes can be probed.** Joining has a per-user lockout, but an attacker can sign up a new user for each guess; only the Supabase sign-up rate limit slows this. | "Codes are 6 characters, and a wrong guess reveals nothing except 'not found'. The fix is a server-side gate." | Edge Function gate by IP, CAPTCHA (Cloudflare Turnstile), longer codes. | OPEN (P10) |
| A4 **HIGH** | **Anyone can sign up as a teacher.** The role is chosen on the Create account form. | "This is a prototype. A real deployment needs teacher verification." | Teacher approval by an admin, or a school invite code, before the teacher role is active. | OPEN (P10) |
| A5 **LOW** | **No student self-service PIN change.** Only the teacher can reset a PIN. | "A student who knows their PIN can still ask the teacher. A self-change screen is small." | "Change PIN" screen (needs the current PIN). | OPEN (P10) |
| A6 **MED** | **Other devices stay signed in after a PIN reset** until the session expires. | "Reset is for forgotten PINs. Sessions expire. We can also sign out all sessions." | Call admin sign-out for the student inside `manage-student`. | OPEN (P10) |
| A7 **LOW** | **No rate limit on teacher actions** (Reset PIN, Remove). | "Every action already checks the teacher owns the class." | Per-teacher counter in the Edge Function. | OPEN (P10) |
| A8 **LOW** | **A second class needs a second class login** for a class-login student (new code + roll + PIN). Email learners can join several classes. | "One identity per class keeps rolls unique and the model simple." | Optional: link several rolls to one identity. | ACCEPTED |
| A9 **LOW** | A **failed join can leave an unused auth user** (wrong code, roll taken). Harmless, not cleaned up. | "No data or access is attached to it." | Scheduled cleanup of users with no profile or enrollment. | OPEN (P10) |
| A10 **LOW** | **Roll format is limited:** A-Z, 0-9, `-`, `/`, 1 to 20 characters, no inner spaces; leading zeros of all-digit rolls are removed. | "Normalising rolls keeps (class, roll) unique and the login address safe." | None needed. | ACCEPTED |
| A11 **MED** | **The hidden login domain `.example`** works today, but if Supabase ever refuses it, `VITE_CLASS_LOGIN_DOMAIN` must change, and **changing it locks out existing class students** (their hidden address changes). | "The address is internal and never shown or mailed." | Pick the final domain before real students join, then never change it. | ACCEPTED (config risk) |
| A12 **LOW** | **A teacher cannot rename a student** or fix a typo in a name or roll. | "Teacher can Remove and the student re-registers." | Teacher "edit name" action in the Edge Function. | OPEN |
| A13 **MED** | **Removing a class-login student permanently deletes their quiz history** (by cascade). | "It is the privacy-friendly default: the student's data goes with the account." | Archive option instead of delete. | ACCEPTED (maybe P10) |
| A14 **LOW** | **A quiz attempt belongs to the student, not the class.** A class dashboard shows attempts of students currently enrolled. | "Results follow the learner, which also gives independent learners their own history." | Store `class_id` on each attempt if class-level history is needed. | ACCEPTED |
| A15 **LOW** | **A teacher cannot reset an email learner's password** (they have a password, not a PIN). | "Their recovery is by email, see A1." | Solved together with A1. | OPEN (P10) |
| A16 **MED** | **No audit trail.** During testing a class student's account disappeared and the cause could not be found (the auth audit table was empty; function logs keep only action and ids). | "Deletions by the teacher go through one function that logs who did what. Dashboard actions by the owner are outside it." | Own `audit_log` table written by the Edge Function; restrict Dashboard access. | OPEN (P10) |

## B. Security and data

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| B1 **HIGH** | **Quiz answers are readable without logging in** (`quiz_questions.correct_index` is public). | "The quiz is practice, not an exam, so nothing graded depends on it. The fix is to move marking to the server." | Edge Function `submit-quiz` marks the answers; hide `correct_index` from the browser. | OPEN (P10) |
| B2 **HIGH** | **Quiz is marked in the browser**, and the saved score is only checked for `0 <= score <= max`. A student could fake a score by calling the API. | Same as B1. "Scores are for self-evaluation and teacher insight, not grades." | Same as B1. | OPEN (P10) |
| B3 **LOW** | Tables still have default `TRUNCATE`, `TRIGGER`, `REFERENCES` grants. They cannot be used through the public API. | "Not reachable from the app; it is housekeeping." | `revoke` them in a migration. | OPEN (P10) |
| B4 **LOW** | **A missing read policy fails silently** (a teacher just sees "No quizzes yet"). | "Policies were audited with a read-only SQL file (`audit_policies.sql`)." | Show an error state when a query fails. | OPEN |
| B5 **LOW** | **The Edge Function allows CORS from any origin** (`*`). It still needs a valid teacher session. | "The token is what protects it, not the origin." | Restrict to the app's own domain. | OPEN (P10) |
| B6 **MED** | **Free plan: backups.** A free Supabase project may have no scheduled backups. (Verify in the dashboard.) | "The data is demo-level; before real use we upgrade or export regularly." | Manual `pg_dump` export or Pro plan. | TO CHECK |
| B7 **LOW** | **The service-role key must never be in the browser.** It exists only inside the Edge Function environment. | "Checked: only three public values are in Vercel." | Keep it that way; scan repo for secrets before each push. | ACCEPTED (rule) |

## C. Quiz, content and dashboard logic

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| C1 **MED** | **Only 4 models and 20 quiz questions are in the database** (heart, carbon-atom, generator, computer-hardware). The planned scope is 12 models. | "The pipeline is general; adding a model is a content task." | Add the other 8 models and their quizzes (P9). | OPEN (P9) |
| C2 **LOW** | **Urdu question text, explanations and topic fields are not in the database yet.** | "The screens support Urdu; the quiz rows need the translations." | Add Urdu columns to the seed. | OPEN (P9) |
| C3 **MED** | **Quiz questions are hand-written, not auto-generated** (the original plan said generated and auto-checked). | "A reviewed question bank is safer for correctness. Generation with review is planned with the tutor." | LLM-generated questions from the textbook, reviewed by a teacher. | OPEN (P8) |
| C4 **LOW** | **Weak below 50%, strong at 75% or above** are first-guess thresholds. | "They are constants in one file (`insights.ts`), easy to tune with a teacher's advice." | Ask the supervisor; optional per-teacher setting. | OPEN |
| C5 **LOW** | The dashboard average is sum of scores divided by sum of maximums (a long quiz weighs more). | "It matches total marks, like a real report." | None. | ACCEPTED |
| C6 **LOW** | `glb_path` is empty for 3 of the 4 models in the database. | "Models still ship inside the app." | Fill when models move to Storage. | OPEN (P9) |

## D. Recognition (the core of the project)

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| D1 **HIGH** | **Recognition is a mock.** It compares colours with one sample picture; any other photo says "not found". Nothing is recognised by AI yet. | Be honest: "The recognition server is the next phase. The rest of the flow (viewer, quiz, dashboards) is real." | Phase P6 experiment (DINOv2 and CLIP on about 10 to 20 real textbook photos, target at least 90% top-1), then P7 server. | OPEN (P6, P7) |
| D2 **MED** | **Only registered diagrams are recognised.** Anything else returns "not found". | "The system is a catalogue lookup for a closed textbook set." | Show the closest matches ("did you mean?"). | ACCEPTED |
| D3 **MED** | **Photo quality:** blur, glare on glossy pages, a cut-off figure, similar diagrams in different chapters. | "We will measure this in the experiment and add a re-take hint." | Crop with OpenCV, geometric check, confidence threshold. | OPEN (P6) |
| D4 **MED** | **The real camera is not connected.** The Fetching screen sends an empty placeholder; the resize helper is untested on real photos and in Android WebView. | "The screens and API contract exist; the camera is part of the APK phase." | Wire the real photo in P7, test in P11. | OPEN (P7, P11) |
| D5 **HIGH** | **Permission to use STBB textbook diagrams.** They are used for internal matching only, not republished. Permission is not confirmed. | "The images are only reference fingerprints inside the server; students see our own 3D models." | Ask the supervisor or STBB; keep only embeddings if needed. | TO CHECK |
| D6 **MED** | **Free hosting for the recognition server** has little RAM and may sleep (slow first request). | "A demo-scale server is enough; a school deployment needs a paid instance." | Pick a host after measuring model size. | OPEN (P7) |
| D7 **MED** | **Scale:** the plan is 12 models; the long-term idea was 500+. | "12 models prove the pipeline. Adding more is content work plus re-indexing." | Document the process for adding a model. | ACCEPTED |
| D8 **MED** | **One-time recognition replaced live AR tracking** (the original idea). | "Live AR needs ARCore, which is not supported on budget phones like the Redmi 12C. One photo works on every phone." | None. Confirm the change with the supervisor. | TO CHECK |

## E. 3D models and content

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| E1 **HIGH** | **Only the heart is a real 3D model;** the atom, generator/motor and computer board are simple stand-ins until their `.glb` files exist. | "The viewer is the same; the heart shows the real pipeline." | Create and split the other models (P9). | OPEN (P9) |
| E2 **HIGH** | **`heart.glb` author and licence are unknown.** It must be credited or replaced before the final demo. | "We found it from a free source; we are checking the licence and will replace it if needed." | Find the source or make our own model. | OPEN |
| E3 **MED** | **The 3D model is not tested on a real phone.** Speed in Android WebView and real touch gestures are unknown. | "It is tested on a laptop; the models stay small (about 3 MB or less) for low-end phones." | Test on the Redmi 12C; reduce polygons with glTF tools. | OPEN (P11) |
| E4 **MED** | **Texts for 5 heart parts (muscle, coronary vessels, AV valves, atrial appendage, arterial ligament) came from general anatomy,** not the textbook. | "They must be verified against the Class 9 Biology chapter." | Check with the textbook and the teacher. | OPEN |
| E5 **LOW** | The mesh called "Veins" is the cardiac surface veins, not the great veins. Labels sit at the centre of a mesh and can look off; two inner valve meshes cannot be tapped. | "A model-quality issue, not an app issue." | Re-model or re-label. | OPEN (P9) |
| E6 **MED** | **AI-generated meshes (Meshy) are often one single mesh,** which must be split into named parts before tapping parts works. | "Splitting is a manual content step." | Split in a 3D tool; document the steps. | OPEN (P9) |
| E7 **LOW** | **Model size limits:** free Storage is 1 GB and 50 MB per file; big models also slow low-end phones. | "We keep models small and compress them." | gltf-transform with Draco and texture compression. | OPEN (P9) |

## F. Language, audio and the tutor (Chirag)

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| F1 **MED** | **The tutor Chirag is a mock** with three sample topics. The textbook RAG is not built. | "The Ask screen and API contract exist; the retrieval backend is next." | RAG over the textbook, answers only from the book, "not in your book" fallback (P8). | OPEN (P8) |
| F2 **MED** | **Tutor risks when real:** wrong answers (hallucination), free Gemini limits, slow replies. | "Answers must come only from retrieved textbook text, and show the source." | Grounding check, caching, rate limits. | OPEN (P8) |
| F3 **MED** | **Voice-over exists only for the generator,** in a computer voice. Urdu pronunciation of English words (coil, brushes, bulb) is unchecked. | "Audio files are generated from the same text and can be replaced by a human recording." | Record or generate better voices for all models. | OPEN (P9) |
| F4 **LOW** | **Fallback speech depends on the device.** If an mp3 fails, the browser's own voice is used, and an Urdu voice may not exist on every phone. | "It fails silently rather than crashing." | Ship all audio files. | OPEN (P9) |
| F5 **LOW** | **Urdu font files are large** (about 160 to 220 kB each) and are bundled so Urdu works offline. | "A deliberate size-for-offline trade." | Subset the fonts. | ACCEPTED |

## G. Hosting and free plans

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| G1 **HIGH** | **A free Supabase project pauses after about a week of inactivity;** until it is resumed the live site cannot sign in. | "Before any demo we open the project. In production we use a paid plan or a small keep-alive job." | Weekly scheduled ping, or upgrade. | OPEN |
| G2 **MED** | **Free plan limits:** 500 MB database, 1 GB storage, 50 MB per file, 5 GB egress, and rate limits. A whole class at once could reach them. | "Text data is tiny; models are the main load, so they are compressed." | Monitor usage; upgrade for a real rollout. | OPEN |
| G3 **LOW** | **Vercel is on a personal Hobby account** (non-commercial terms, old deployments are deleted after a time). | "Fine for an academic project." | Use an organisation account for a real launch. | ACCEPTED |
| G4 **LOW** | **Edge Function needs deploying by hand** and a change in its permissions needs a migration (see the grants lesson in S9). | "Steps are documented in `backend/functions/README.md`." | CI deploy later. | ACCEPTED |

## H. Platform and testing

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| H1 **HIGH** | **No Android APK yet.** The app is a web app (works in a phone browser). The Capacitor camera plugin has quirks across Android versions. | "The web version is the working prototype; packaging is the last step." | Capacitor build and a full-flow test on the Redmi 12C (P11). | OPEN (P11) |
| H2 **MED** | **No offline mode** except fonts. Models, quizzes and sign-in need the internet. | "School Wi-Fi or mobile data is assumed." | Cache models after first download. | OPEN |
| H3 **MED** | **Automated tests are small:** unit tests for the roll and PIN rules (14 groups) and a Node test of the Edge Function (16 checks). Everything else was tested by hand on the real project. | "Every feature has a written manual test list in the README." | Playwright end-to-end tests, CI. | OPEN |
| H4 **LOW** | **Only Android phones are targeted;** iOS and old browsers are not tested. | "Scope is low-end Android." | None. | ACCEPTED |
| H5 **LOW** | **The demo (mock) mode is still in the code.** With the real variables set it is off. | "It keeps screens working without a backend for development." | None. | ACCEPTED |

## I. Process, scope and documentation

| ID | Limitation | Say in the viva | Planned fix | Status |
|----|-----------|-----------------|-------------|--------|
| I1 **MED** | **The five diagrams are out of date:** ERD (needs `roll_no`, `join_attempts`), use-case (class login, Reset PIN, Remove student), sequence (join flow, `manage-student`), architecture (Edge Function, Supabase), methodology (identity decision). They still show Firebase and FastAPI. | "The diagrams are updated at the end, after the build, as agreed with the supervisor." | Redraw all five (P12). **Keep reminding.** | OPEN (P12) |
| I2 **LOW** | **`CLAUDE.md` still said Firebase and FastAPI** and the root `.env.example` still has Firebase placeholders. | "Superseded by Supabase." | `CLAUDE.md` fixed on 1-Nov-2026; clean the root `.env.example`. | OPEN (`.env.example` only) |
| I3 **LOW** | Some README details were **inferred, not seen:** `join_attempts` purpose, `model_parts` and `join_attempts` columns, helper function signatures. | "They will be filled from the real database when the ERD is drawn." | Read the real schema when drawing the ERD. | OPEN (P12) |
| I4 **LOW** | Dated entries in `docs/PROGRESS.md` all say 2026-11-01; some work happened earlier. | "Cosmetic." | Correct the dates. | OPEN |
| I5 **LOW** | `docs/API.md` describes the planned recognition and tutor server; Claude Code changed four lines from Firebase to Supabase token. | "It documents the contract of the planned server." | Review the edit. | TO CHECK |
| I6 **MED** | **The supervisor's final deadline and approvals.** The login change was approved on 1-Nov-2026. The final deadline is not confirmed. | n/a | Ask the supervisor. | TO CHECK |
| I7 **LOW** | **Candidates to verify in the app** (not confirmed yet): deleting a class, regenerating or revoking a join code, what happens when a teacher account is deleted, signing in on two devices at once. | n/a | Test each, then add real rows to this file. | TO CHECK |

---

## Solved so far (history)

| ID | Problem | Solved in | How |
|----|---------|-----------|-----|
| S1 | Login was a mock (any email worked) | 4D | Real Supabase Auth, roles, protected routes |
| S2 | Classes and join codes existed only in sample data | 4E | `create_class`, `join_class`, teacher roster |
| S3 | Quiz results were not saved; dashboards showed sample data | 4F | `attempts` table, `insights.ts`, "My progress", real teacher dashboard |
| S4 | Models and questions lived only inside the app | 4G | `seed_models.sql` (idempotent) |
| S5 | Email and password was not practical for school students | 5A | Class code + roll + PIN login |
| S6 | Student sign-up blocked by "Confirm email" | 4D (config) | Confirm email turned off |
| S7 | A 6-digit PIN was rejected as a password | 5A (config) | Minimum password length set to 6 |
| S8 | A forgotten PIN or a wrong student could not be fixed | 5B | `manage-student` Edge Function: Reset PIN, Remove student |
| S9 | Reset PIN failed with a server error: `service_role` had no table grants after the earlier revoke | 5B (1-Nov-2026) | `2026-11-01_service_role_grants.sql` (least privilege). **Lesson:** after any revoke, check grants for every role |
| S10 | Two students could get the same roll | 5A | Unique index on (class, roll) |
| S11 | Class code was not accepted in lowercase | 5A | Class code normalised on input |
| S12 | Teacher saw "Name not available" for students | 4E / 4F | Teacher read rule on profiles; roster shows names |
| S13 | A name with a symbol (for example a backtick) was accepted | 5B | `checkName` (letters, marks, space, dash, apostrophe, full stop; Urdu allowed) |
| S14 | Result screen said "sent to your teacher" to independent learners | 5B | Correct message per learner type |
| S15 | A student could change their own role (risk) | 5B check | Column privileges verified: only `display_name` is updatable |
| S16 | README and diagrams text described Firebase, FastAPI and a mock-only app | Docs sync, 1-Nov-2026 | README, PROGRESS, backend READMEs rewritten to match Supabase |
| S17 | The live site was still in mock mode | Vercel real mode, 1-Nov-2026 | Three public variables set in Vercel, redeployed, end-to-end checked |

---

## Viva quick answers (the questions most likely to come)

1. **"Is the recognition real?"** Not yet. It is a mock; the experiment and the server are the next phase (D1). Everything after recognition (viewer, quiz, dashboards, login) is real.
2. **"Can a student cheat the quiz?"** Technically yes, because marking is in the browser (B1, B2). The quiz is practice, not an exam. The fix is server-side marking.
3. **"What if a student forgets the PIN?"** The teacher presses Reset PIN and gives a new one (5B). The old PIN stops working immediately.
4. **"What if a teacher forgets the password?"** It needs our own email server (A1). Today the owner resets it in the dashboard.
5. **"Why not email for students?"** Young students often have no email. Class code + roll + PIN is the Google-Classroom-like idea, and the supervisor approved it.
6. **"How do you stop one teacher seeing another's students?"** Row Level Security in the database plus a permission check in the function; verified with a column-privilege test and an audit file.
7. **"What if Supabase is down or paused?"** The live site cannot sign in (G1). Before demos we open the project.
8. **"Does it work on a low-end phone?"** The web app works in a phone browser; the APK and the Redmi 12C test are in the last phase (H1, E3).
9. **"Where do the models come from, and are they licensed?"** Heart: licence being checked (E2). Others are built in-house.
10. **"Which parts are mock?"** Recognition, the tutor, 3 of 4 models, audio for 3 models. Real: login, classes, quiz saving, dashboards, Reset PIN, Remove student.

---

## Change log

- 2026-11-01: File created. Contents gathered from the whole project history (steps 0 to 5B, live deploy, docs sync). S1 to S17 recorded as solved.
