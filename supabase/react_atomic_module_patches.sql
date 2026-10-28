create or replace function public.rick_dev_patch_state(p_expected jsonb, p_patch jsonb)
returns table(data jsonb, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare allowed text[] := array['rick-dev-study-topics','rick-dev-studies','rick-dev-missions','rick-dev-projects','rick-dev-pc-parts','rick-dev-style','rick-dev-soundcloud','rick-dev-fitness-log','rick-dev-study-resources','rick-dev-focus-seconds','rick-dev-focus-minutes','rick-dev-focus-remaining','rick-dev-running','rick-dev-evolution','rick-dev-system-progress'];
begin
 if jsonb_typeof(p_expected) <> 'object' or jsonb_typeof(p_patch) <> 'object' or pg_column_size(p_patch)>5242880 then raise exception 'invalid_state_patch' using errcode='22023'; end if;
 if not exists(select 1 from public.rick_dev_admins a where a.user_id=(select auth.uid())) then raise exception 'admin_required' using errcode='42501'; end if;
 if exists(select 1 from jsonb_each(p_patch) e where not(e.key=any(allowed)) or jsonb_typeof(e.value)<>'string')
 or exists(select 1 from jsonb_object_keys(p_patch) k where not(p_expected ? k))
 or exists(select 1 from jsonb_object_keys(p_expected) k where not(p_patch ? k)) then raise exception 'invalid_state_keys' using errcode='22023'; end if;
 return query update public.rick_dev_state as s set data=s.data||p_patch, updated_at=clock_timestamp()
 where s.id=1 and not exists(select 1 from jsonb_each(p_expected) e where coalesce(s.data->e.key,'null'::jsonb) is distinct from e.value)
 returning s.data,s.updated_at;
 if not found then raise exception 'state_conflict_reload' using errcode='40001'; end if;
end; $$;
revoke all on function public.rick_dev_patch_state(jsonb,jsonb) from public,anon;
grant execute on function public.rick_dev_patch_state(jsonb,jsonb) to authenticated;
