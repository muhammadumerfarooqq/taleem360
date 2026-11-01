-- TALEEM360, step 5B: READ-ONLY audit of who may read, insert, update and delete what.
--
-- Only SELECT statements. Nothing here changes the database. Run each block in the Supabase SQL Editor
-- (or all at once: the result tabs show one result each) and read the answers.
--
-- Tables checked: profiles, classes, enrollments, attempts, models, quiz_questions.

-- 1. Is row-level security switched on for each table? (rls_enabled should be true for all six) ----------------
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'classes', 'enrollments', 'attempts', 'models', 'quiz_questions')
order by c.relname;

-- 2. Row-level security policies: who (roles) may do what (cmd) and under which rule ---------------------------
--    cmd is SELECT, INSERT, UPDATE, DELETE or ALL. "using" limits which existing rows; "with_check" limits new rows.
--    A table with RLS on and NO policy for a command means nobody (except the owner / service role) may do it.
select schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual as using_expression,
       with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'classes', 'enrollments', 'attempts', 'models', 'quiz_questions')
order by tablename, cmd, policyname;

-- 3. Table privileges (grants) for the roles the app uses. Policies only matter if the grant exists. ------------
--    Look for: anon having anything other than SELECT; authenticated having DELETE or UPDATE where it should not.
select table_schema,
       table_name,
       grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'classes', 'enrollments', 'attempts', 'models', 'quiz_questions')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
group by table_schema, table_name, grantee
order by table_name, grantee;

-- 4. The same grants, one row per privilege (easier to filter), including grants to any other role ----------------
select table_name, grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'classes', 'enrollments', 'attempts', 'models', 'quiz_questions')
order by table_name, grantee, privilege_type;

-- 5. Who may call the functions the app uses (execute rights) ---------------------------------------------------
--    create_class, join_class and join_class_with_roll should be executable by 'authenticated' and NOT by 'anon'.
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('create_class', 'join_class', 'join_class_with_roll')
order by routine_name, grantee;

-- What to look for, in plain words:
--   * quiz_questions: students must not be able to read the correct_index column directly.
--   * attempts: a student may insert and read only their own rows; a teacher may read their own class's students; nobody updates or deletes.
--   * enrollments: students must not be able to update or delete (a roll could be changed); only the service role (the manage-student function) deletes.
--   * profiles: a user may update only their own row, and must not be able to change their own role.
--   * classes: only the owning teacher may update or delete; anon has no access.
