-- TALEEM360, step 5A: roll numbers for class students.
--
-- *** REVIEW THIS FILE BEFORE YOU RUN IT. It was written without access to the real database. ***
-- It has NOT been run anywhere. Nothing in the app applies it. See backend/db/README.md for how to run it.
--
-- What it does
--   1. adds enrollments.roll_no (text, optional), a length check, and a UNIQUE index on (class_id, roll_no)
--      for rows that have a roll (old enrollments without a roll stay valid);
--   2. adds public.join_class_with_roll(p_code, p_roll): joins a class with the EXISTING public.join_class
--      (so its role checks, lockout and rate limiting stay in force) and then stores the student's roll.
-- It does not change any existing function, table policy or grant.
--
-- ASSUMPTIONS I made about things I cannot see (please check each one):
--   A1. public.enrollments has the columns class_id and student_id. public.classes has id and name, and a
--       grade (or class_level) column. public.profiles has id and role ('student' | 'teacher').
--       (classes.id may be uuid or text: I compare it as text, so either works.)
--   A2. public.join_class(p_code text) exists and takes one text argument. Its result can be a row/record
--       (for example a classes row), a jsonb object, or a plain id. I turn it into jsonb and read the class id
--       from "id", "class_id" or the plain value. A NULL result (or a row with no id) means "wrong code".
--   A3. join_class raises its own errors for a locked-out or not-a-student caller, and may raise an error
--       containing "already" when the student is already in the class. I let those errors pass through unchanged.
--   A4. join_class uses auth.uid() to find the caller, so it behaves the same when it is called from this
--       SECURITY DEFINER function. If it relies on the calling role instead, test this function first.
--   A5. join_class creates the enrollment itself (one row per student and class). This function only fills in
--       roll_no on that row; it never creates or deletes enrollments.
--   A6. The owner of this function can read and update public.enrollments (the owner normally bypasses
--       row-level security). Students are NOT given update rights on enrollments.
--   A7. Roll numbers are normalised here and also in the app (app/src/lib/studentAuth.ts). The unique index
--       only protects rolls written through this function: any other writer must normalise the same way.
--
-- Normalising a roll (the same rules as normalizeRoll in the app):
--   trim, upper case, collapse runs of spaces into one space, strip leading zeros when it is all digits
--   ("007" -> "7", "000" -> "0"); then only A-Z, 0-9, "-" and "/" are allowed, 1 to 20 characters.
--   So an inner space ("1 2") is rejected as invalid_roll.
--
-- Errors this function raises (the app matches the message text):
--   not_authenticated, only_students, invalid_roll, roll_taken, roll_already_set

begin;

-- 1. the roll column, its length check and the uniqueness inside a class -----------------------------------------
alter table public.enrollments add column if not exists roll_no text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'enrollments_roll_no_length_check'
      and conrelid = 'public.enrollments'::regclass
  ) then
    alter table public.enrollments
      add constraint enrollments_roll_no_length_check
      check (roll_no is null or char_length(roll_no) between 1 and 20);
  end if;
end
$$;

create unique index if not exists enrollments_class_id_roll_no_key
  on public.enrollments (class_id, roll_no)
  where roll_no is not null;

-- 2. join a class and set the roll ---------------------------------------------------------------------------------
create or replace function public.join_class_with_roll(p_code text, p_roll text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid := auth.uid();
  v_roll     text;
  v_joined   jsonb;
  v_class_id text;
  v_current  text;
  v_class    jsonb;
begin
  -- who is calling: a signed-in student (the database decides this, not the app)
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and role = 'student') then
    raise exception 'only_students' using errcode = '42501';
  end if;

  -- normalise the roll (same rules as the app), BEFORE join_class, so a bad roll never uses up a try
  v_roll := regexp_replace(upper(coalesce(p_roll, '')), '^\s+|\s+$', '', 'g');   -- trim (all kinds of space)
  v_roll := regexp_replace(v_roll, '\s+', ' ', 'g');                              -- collapse inner spaces
  if v_roll ~ '^[0-9]+$' then
    v_roll := regexp_replace(v_roll, '^0+(?=[0-9])', '');                         -- strip leading zeros
  end if;
  if v_roll !~ '^[A-Z0-9/-]{1,20}$' then
    raise exception 'invalid_roll' using errcode = '22023';
  end if;

  -- join with the EXISTING function: its role checks, lockout and rate limiting stay in force.
  -- Reading it with FROM works whether it returns a row, a jsonb value, a plain id or a one-row table.
  select to_jsonb(j) into v_joined from public.join_class(p_code) as j limit 1;

  -- wrong code: NULL (or a row without an id)
  if v_joined is null or v_joined = 'null'::jsonb then
    return null;
  end if;
  if jsonb_typeof(v_joined) = 'object' then
    v_class_id := coalesce(v_joined ->> 'id', v_joined ->> 'class_id', v_joined ->> 'join_class');
  else
    v_class_id := v_joined #>> '{}';
  end if;
  if v_class_id is null then
    return null;
  end if;

  -- store the roll on this student's enrollment. Only if it has none yet, so calling this again can never
  -- change a roll that is already set.
  begin
    update public.enrollments
       set roll_no = v_roll
     where student_id = v_uid
       and class_id::text = v_class_id
       and roll_no is null;
  exception
    when unique_violation then
      -- someone else in this class already has this roll. Raising here rolls back the whole call,
      -- including the enrollment that join_class just made.
      raise exception 'roll_taken' using errcode = 'P0001';
  end;

  select roll_no into v_current
    from public.enrollments
   where student_id = v_uid and class_id::text = v_class_id;
  if v_current is distinct from v_roll then
    -- the student already had a different roll in this class: do not change it (rolls back the call)
    raise exception 'roll_already_set' using errcode = 'P0001';
  end if;

  select to_jsonb(c) into v_class from public.classes c where c.id::text = v_class_id;
  return jsonb_build_object(
    'id',    v_class_id,
    'name',  v_class -> 'name',
    'grade', coalesce(v_class -> 'grade', v_class -> 'class_level')
  );
end
$$;

-- 3. who may call it: signed-in users only --------------------------------------------------------------------------
revoke all on function public.join_class_with_roll(text, text) from public;
revoke all on function public.join_class_with_roll(text, text) from anon;
grant execute on function public.join_class_with_roll(text, text) to authenticated;

commit;

-- After running, you can check that it exists and who may call it:
--   select proname, prosecdef from pg_proc where proname = 'join_class_with_roll';
--   select grantee, privilege_type from information_schema.routine_privileges
--    where routine_name = 'join_class_with_roll';
