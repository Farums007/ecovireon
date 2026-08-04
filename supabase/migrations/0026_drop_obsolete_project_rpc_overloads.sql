-- CREATE OR REPLACE FUNCTION does not replace a function whose parameter
-- list differs — it creates a new overload. 0003, 0008, 0024, and 0025
-- each used a different parameter list for create_project/update_project,
-- so the database now has 4 overloads of each sitting side by side,
-- which risks an "ambiguous function call" at runtime depending on which
-- named parameters a caller happens to supply. Drop every signature
-- except the current (0025) one.

drop function if exists public.create_project(
  text, text, public.project_type, public.project_status, date, date, jsonb, jsonb
);
drop function if exists public.create_project(
  text, text, public.project_type, public.project_status, date, date, jsonb, jsonb, boolean
);
drop function if exists public.create_project(
  text, text, public.project_type, public.project_status, date, date, jsonb, jsonb,
  public.restoration_type, text, text, text, numeric, text
);

drop function if exists public.update_project(
  uuid, text, text, public.project_type, public.project_status, date, date, jsonb, jsonb
);
drop function if exists public.update_project(
  uuid, text, text, public.project_type, public.project_status, date, date, jsonb, jsonb, boolean
);
drop function if exists public.update_project(
  uuid, text, text, public.project_type, public.project_status, date, date, jsonb, jsonb,
  public.restoration_type, text, text, text, numeric, text
);
