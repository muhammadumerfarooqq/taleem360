-- TALEEM360 seed data: models and quiz questions.
-- Data only (INSERT ... ON CONFLICT DO UPDATE). No schema changes, no policies, no grants.
-- Safe to run again: models are matched by id, questions by a fixed id made from the model id and the
-- question number, so running it twice never creates duplicates and just refreshes the values.
-- Run it in the Supabase Dashboard: SQL Editor > New query > paste > Run. See backend/db/README.md.
--
-- The model ids are exactly the ids the app uses (app/src/mock). Values come from the mock files:
--   models.glb_path    "models/heart.glb" for the heart (the only .glb in the app); NULL for the other
--                      models, which are drawn by built-in stand-ins and have no .glb file yet.
--   question_ur        NULL (the mock quiz has no Urdu question text yet).
--   explanation        NULL (the mock quiz has no explanations yet).
--   options            [{"id":"a","text":"..."}, ...]  (the same shape the quiz screen reads).
--   correct_index      0-based position of the right option in that list (from the mock answer key).

begin;

-- ---------- models ----------
insert into public.models (id, grade, subject, title, glb_path)
values
  ($t$heart$t$, 9, $t$Biology$t$, $t$Human heart$t$, $t$models/heart.glb$t$),
  ($t$carbon-atom$t$, 9, $t$Chemistry$t$, $t$Carbon atom$t$, null),
  ($t$generator$t$, 9, $t$Physics$t$, $t$Electricity generator$t$, null),
  ($t$computer-hardware$t$, 9, $t$Computer Science$t$, $t$Inside a computer$t$, null)
on conflict (id) do update set
  grade    = excluded.grade,
  subject  = excluded.subject,
  title    = excluded.title,
  glb_path = excluded.glb_path;

-- ---------- quiz questions (20: 5 per model) ----------
-- id = md5(model_id || ':' || question number)::uuid, so every question always has the same id.
insert into public.quiz_questions (id, model_id, question_en, question_ur, options, correct_index, explanation)
select
  md5(v.model_id || ':' || v.idx::text)::uuid,
  v.model_id,
  v.question_en,
  v.question_ur,
  v.options::jsonb,
  v.correct_index,
  v.explanation
from (values
  ($t$heart$t$, 1, $t$How many chambers does the human heart have?$t$, null::text, $j$[{"id":"a","text":"Two"},{"id":"b","text":"Three"},{"id":"c","text":"Four"},{"id":"d","text":"Five"}]$j$, 2, null::text),
  ($t$heart$t$, 2, $t$Which vessel carries oxygen-rich blood from the left ventricle to the body?$t$, null, $j$[{"id":"a","text":"Pulmonary trunk"},{"id":"b","text":"Aorta"},{"id":"c","text":"Vena cava"},{"id":"d","text":"Pulmonary vein"}]$j$, 1, null),
  ($t$heart$t$, 3, $t$What do the heart valves do?$t$, null, $j$[{"id":"a","text":"Make blood oxygen-rich"},{"id":"b","text":"Pump blood to the lungs"},{"id":"c","text":"Keep blood flowing one way"},{"id":"d","text":"Store blood"}]$j$, 2, null),
  ($t$heart$t$, 4, $t$Which vessels carry blood back to the heart?$t$, null, $j$[{"id":"a","text":"Arteries"},{"id":"b","text":"Veins"},{"id":"c","text":"Capillaries"},{"id":"d","text":"Valves"}]$j$, 1, null),
  ($t$heart$t$, 5, $t$Where does the pulmonary trunk send blood?$t$, null, $j$[{"id":"a","text":"To the brain"},{"id":"b","text":"To the body"},{"id":"c","text":"To the lungs"},{"id":"d","text":"To the kidneys"}]$j$, 2, null),
  ($t$carbon-atom$t$, 1, $t$How many protons does a carbon atom have?$t$, null, $j$[{"id":"a","text":"Four"},{"id":"b","text":"Six"},{"id":"c","text":"Eight"},{"id":"d","text":"Twelve"}]$j$, 1, null),
  ($t$carbon-atom$t$, 2, $t$Where is almost all of the mass of an atom found?$t$, null, $j$[{"id":"a","text":"In the outer shell"},{"id":"b","text":"In the K shell"},{"id":"c","text":"In the nucleus"},{"id":"d","text":"Between the shells"}]$j$, 2, null),
  ($t$carbon-atom$t$, 3, $t$How many electrons can the first (K) shell hold at most?$t$, null, $j$[{"id":"a","text":"Eight"},{"id":"b","text":"Two"},{"id":"c","text":"Six"},{"id":"d","text":"Four"}]$j$, 1, null),
  ($t$carbon-atom$t$, 4, $t$How many electrons are in the outer shell of a carbon atom?$t$, null, $j$[{"id":"a","text":"Two"},{"id":"b","text":"Six"},{"id":"c","text":"Eight"},{"id":"d","text":"Four"}]$j$, 3, null),
  ($t$carbon-atom$t$, 5, $t$Which particles are found in the nucleus?$t$, null, $j$[{"id":"a","text":"Protons and electrons"},{"id":"b","text":"Neutrons and electrons"},{"id":"c","text":"Protons and neutrons"},{"id":"d","text":"Only electrons"}]$j$, 2, null),
  ($t$generator$t$, 1, $t$What does an electricity generator change into electrical energy?$t$, null, $j$[{"id":"a","text":"Light energy"},{"id":"b","text":"Chemical energy"},{"id":"c","text":"Kinetic energy (motion)"},{"id":"d","text":"Sound energy"}]$j$, 2, null),
  ($t$generator$t$, 2, $t$What makes the current in the coil of a generator?$t$, null, $j$[{"id":"a","text":"A battery inside the coil"},{"id":"b","text":"The coil turning in a magnetic field"},{"id":"c","text":"Heat from the bulb"},{"id":"d","text":"Light falling on the coil"}]$j$, 1, null),
  ($t$generator$t$, 3, $t$What do the brushes do?$t$, null, $j$[{"id":"a","text":"Make the magnetic field"},{"id":"b","text":"Turn the coil"},{"id":"c","text":"Pick up current from the slip rings"},{"id":"d","text":"Cool the bulb"}]$j$, 2, null),
  ($t$generator$t$, 4, $t$How can you make the bulb glow brighter?$t$, null, $j$[{"id":"a","text":"Turn the coil more slowly"},{"id":"b","text":"Use a weaker magnet"},{"id":"c","text":"Take the bulb out"},{"id":"d","text":"Turn the coil faster"}]$j$, 3, null),
  ($t$generator$t$, 5, $t$What is the job of the slip rings?$t$, null, $j$[{"id":"a","text":"Keep the coil connected to the circuit while it spins"},{"id":"b","text":"Make the magnetic field"},{"id":"c","text":"Light the bulb"},{"id":"d","text":"Store charge"}]$j$, 0, null),
  ($t$computer-hardware$t$, 1, $t$Which part is called the brain of the computer?$t$, null, $j$[{"id":"a","text":"RAM"},{"id":"b","text":"Storage"},{"id":"c","text":"CPU"},{"id":"d","text":"Motherboard"}]$j$, 2, null),
  ($t$computer-hardware$t$, 2, $t$What happens to the data in RAM when the power is switched off?$t$, null, $j$[{"id":"a","text":"It is saved forever"},{"id":"b","text":"It is erased"},{"id":"c","text":"It moves to the CPU"},{"id":"d","text":"It is printed"}]$j$, 1, null),
  ($t$computer-hardware$t$, 3, $t$Which part keeps your files when the computer is off?$t$, null, $j$[{"id":"a","text":"RAM"},{"id":"b","text":"CPU"},{"id":"c","text":"Motherboard"},{"id":"d","text":"Storage (hard disk or SSD)"}]$j$, 3, null),
  ($t$computer-hardware$t$, 4, $t$What connects the CPU, RAM and storage together?$t$, null, $j$[{"id":"a","text":"The motherboard"},{"id":"b","text":"The mouse"},{"id":"c","text":"The monitor"},{"id":"d","text":"The speaker"}]$j$, 0, null),
  ($t$computer-hardware$t$, 5, $t$Which of these is a storage device?$t$, null, $j$[{"id":"a","text":"Monitor"},{"id":"b","text":"Keyboard"},{"id":"c","text":"SSD"},{"id":"d","text":"Mouse"}]$j$, 2, null)
) as v(model_id, idx, question_en, question_ur, options, correct_index, explanation)
on conflict (id) do update set
  model_id      = excluded.model_id,
  question_en   = excluded.question_en,
  question_ur   = excluded.question_ur,
  options       = excluded.options,
  correct_index = excluded.correct_index,
  explanation   = excluded.explanation;

commit;

-- ---------- check the result ----------
-- Expect 4 models, and 5 questions for each of the 4 models (20 in total).
-- (The SQL Editor shows only the last result: run each query on its own to see both.)
select count(*) from public.models;
select model_id, count(*) from public.quiz_questions group by model_id order by model_id;
