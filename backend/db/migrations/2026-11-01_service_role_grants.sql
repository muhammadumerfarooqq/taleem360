-- Step 5B fix: the manage-student Edge Function reads/writes through the
-- service_role client. Earlier hardening left service_role with NO table
-- privileges (RLS bypass does not grant table access), so every call failed
-- with outcome "error:profile". Grant only what the function needs.
-- service_role exists only inside Edge Functions, never in the browser.
-- Idempotent: safe to run more than once.

grant usage on schema public to service_role;

grant select on public.profiles to service_role;
grant select on public.classes  to service_role;
grant select, insert, delete on public.enrollments to service_role;
