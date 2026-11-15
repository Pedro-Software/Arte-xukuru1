-- Verificações estruturais pós-migração. Execute no SQL Editor com role postgres.
do $$
begin
  if not (select relrowsecurity from pg_class where oid='public.products'::regclass) then raise exception 'RLS ausente em products'; end if;
  if not (select relrowsecurity from pg_class where oid='public.page_sections'::regclass) then raise exception 'RLS ausente em page_sections'; end if;
  if has_column_privilege('anon','public.page_sections','draft_content','SELECT') then raise exception 'anon possui SELECT draft_content'; end if;
  if has_column_privilege('anon','public.page_sections','draft_style','SELECT') then raise exception 'anon possui SELECT draft_style'; end if;
  if has_column_privilege('authenticated','public.page_sections','draft_content','SELECT') then raise exception 'authenticated comum pode selecionar draft_content diretamente'; end if;
  if has_column_privilege('authenticated','public.site_settings','draft_value','SELECT') then raise exception 'authenticated comum pode selecionar draft_value diretamente'; end if;
  if has_column_privilege('anon','public.site_settings','draft_value','SELECT') then raise exception 'anon possui SELECT draft_value'; end if;
  if not has_column_privilege('anon','public.page_sections','published_content','SELECT') then raise exception 'SELECT do conteúdo publicado ausente'; end if;
  if has_table_privilege('anon','public.admin_users','SELECT') then raise exception 'anon pode ler admin_users'; end if;
  if has_table_privilege('anon','public.audit_logs','SELECT') then raise exception 'anon pode ler audit_logs'; end if;
  if has_table_privilege('anon','public.operator_page_sections','SELECT') then raise exception 'anon pode consultar view de operador'; end if;
  if has_table_privilege('authenticated','public.admin_users','UPDATE') then raise exception 'cliente pode alterar papéis de admin'; end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_public_read') then raise exception 'policy products_public_read ausente'; end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='xukuru_drafts_operator_select') then raise exception 'policy Storage privada ausente'; end if;
end $$;

select 'RLS e privilégios estruturais conferidos' as resultado;
