-- Arte Xukuru CMS: estrutura aditiva, RLS e Storage. Seguro para reexecutar.
begin;
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

-- Defina a tabela de operadores antes das funções que a consultam.
create table if not exists public.admin_users(
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('admin','editor')), is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function private.has_role(required_role text)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_users u where u.user_id=(select auth.uid()) and u.is_active and u.role=required_role)
$$;
create or replace function private.is_operator()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_users u where u.user_id=(select auth.uid()) and u.is_active and u.role in ('admin','editor'))
$$;
create or replace function private.path_used_in_pages(p_path text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
 if not private.is_operator() then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
 return exists(select 1 from public.page_sections s where position(p_path in s.draft_content::text)>0 or position(p_path in s.published_content::text)>0);
end $$;
revoke all on function private.has_role(text), private.is_operator(), private.path_used_in_pages(text) from public;
grant execute on function private.has_role(text), private.is_operator() to anon, authenticated;
grant execute on function private.path_used_in_pages(text) to authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
drop trigger if exists admin_users_touch on public.admin_users;
create trigger admin_users_touch before update on public.admin_users for each row execute function private.touch_updated_at();

create table if not exists public.categories(
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(length(btrim(name)) between 1 and 100), description text not null default '',
 sort_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products(
 id uuid primary key default gen_random_uuid(), legacy_id integer unique,
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(length(btrim(title)) between 1 and 180), description text not null default '',
 short_description text not null default '', category_slug text not null references public.categories(slug) on update cascade on delete restrict,
 price numeric(12,2) not null check(price>=0), stock integer not null default 0 check(stock>=0),
 featured boolean not null default false, artisan text not null default '', village text not null default '',
 materials text not null default '', dimensions text not null default '', weight text not null default '',
 image_alt text not null default '', legacy_image_url text not null default '',
 sort_order integer not null default 0, status text not null default 'draft' check(status in ('draft','pending_review','published','archived')),
 is_active boolean not null default true, cultural_approval_status text not null default 'pending' check(cultural_approval_status in ('pending','approved','rejected')),
 cultural_approval_reference text not null default '', cultural_approval_notes text not null default '',
 cultural_approved_by uuid references auth.users(id) on delete set null, cultural_approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 check(cultural_approval_status <> 'approved' or (cultural_approved_by is not null and cultural_approved_at is not null))
);
create index if not exists products_status_order_idx on public.products(status,sort_order,title);
create index if not exists products_category_idx on public.products(category_slug,status);

create table if not exists public.product_images(
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 storage_bucket text not null check(storage_bucket in ('xukuru-drafts','xukuru-public')),
 storage_path text not null check(storage_path !~ '(^/|\.\.)'), alt_text text not null default '',
 sort_order integer not null default 0, is_cover boolean not null default false,
 authorization_status text not null default 'pending' check(authorization_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), unique(storage_bucket,storage_path)
);
create unique index if not exists product_images_one_cover_idx on public.product_images(product_id) where is_cover;
create index if not exists product_images_product_idx on public.product_images(product_id,sort_order);

create table if not exists public.site_pages(
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug in ('home','catalog','cart','about','history')),
 title text not null, seo_title text not null default '', seo_description text not null default '',
 is_enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.page_sections(
 id uuid primary key default gen_random_uuid(), page_id uuid not null references public.site_pages(id) on delete cascade,
 section_key text not null check(section_key ~ '^[a-z0-9._-]+$'),
 section_type text not null check(section_type in ('hero','cards','rich_text','statistics','image_text','cta','trust_bar','footer','navigation','notice')),
 draft_content jsonb not null default '{"fields":{}}'::jsonb check(pg_column_size(draft_content)<65536),
 published_content jsonb not null default '{"fields":{}}'::jsonb check(pg_column_size(published_content)<65536),
 draft_style jsonb not null default '{"layout":"standard"}'::jsonb, published_style jsonb not null default '{"layout":"standard"}'::jsonb,
 draft_is_visible boolean not null default true, published_is_visible boolean not null default false,
 draft_sort_order integer not null default 0, published_sort_order integer not null default 0,
 content_approval_status text not null default 'pending' check(content_approval_status in ('pending','approved','rejected')),
 content_approval_reference text not null default '', content_approved_by uuid references auth.users(id) on delete set null,
 content_approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 constraint page_sections_approval_complete_check check(content_approval_status<>'approved' or (content_approved_by is not null and content_approved_at is not null and length(btrim(content_approval_reference))>0)),
 unique(page_id,section_key)
);
alter table public.page_sections add column if not exists content_approval_status text not null default 'pending';
alter table public.page_sections add column if not exists content_approval_reference text not null default '';
alter table public.page_sections add column if not exists content_approved_by uuid references auth.users(id) on delete set null;
alter table public.page_sections add column if not exists content_approved_at timestamptz;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='page_sections_approval_complete_check' and conrelid='public.page_sections'::regclass) then
   alter table public.page_sections add constraint page_sections_approval_complete_check check(content_approval_status<>'approved' or (content_approved_by is not null and content_approved_at is not null and length(btrim(content_approval_reference))>0));
 end if;
end $$;
create index if not exists page_sections_page_order_idx on public.page_sections(page_id,published_sort_order);

create table if not exists public.site_settings(
 key text primary key check(key in ('theme','identity','seo','contacts','notices')),
 draft_value jsonb not null default '{}'::jsonb, published_value jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.media_assets(
 id uuid primary key default gen_random_uuid(), storage_bucket text not null check(storage_bucket in ('xukuru-drafts','xukuru-public')),
 storage_path text not null check(storage_path !~ '(^/|\.\.)'), mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 size_bytes bigint not null check(size_bytes between 1 and 5242880), width integer check(width is null or width>0),
 height integer check(height is null or height>0), alt_text text not null default '', source_note text not null default '',
 authorization_status text not null default 'pending' check(authorization_status in ('pending','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), unique(storage_bucket,storage_path)
);
create table if not exists public.content_revisions(
 id uuid primary key default gen_random_uuid(), entity_type text not null check(entity_type in ('product','page_section','site_setting')),
 entity_id uuid not null, old_snapshot jsonb not null, new_snapshot jsonb not null,
 actor uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists content_revisions_entity_idx on public.content_revisions(entity_type,entity_id,created_at desc);
create table if not exists public.audit_logs(
 id uuid primary key default gen_random_uuid(), actor uuid references auth.users(id) on delete set null,
 action text not null check(action in ('create','update','publish','archive','upload','delete')),
 entity_type text not null, entity_id uuid, summary text not null default '', created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function private.guard_product_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is not null and not private.is_operator() then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
 if tg_op='INSERT' and (select auth.uid()) is not null and not private.has_role('admin') then
   new.cultural_approval_status := 'pending'; new.cultural_approval_reference := ''; new.cultural_approval_notes := '';
   new.cultural_approved_by := null; new.cultural_approved_at := null; new.published_at := null;
 end if;
 if tg_op='UPDATE' and not private.has_role('admin') and (
   old.status='published' or new.cultural_approval_status is distinct from old.cultural_approval_status
   or new.cultural_approval_reference is distinct from old.cultural_approval_reference
   or new.cultural_approval_notes is distinct from old.cultural_approval_notes
   or new.cultural_approved_by is distinct from old.cultural_approved_by
   or new.cultural_approved_at is distinct from old.cultural_approved_at
   or new.published_at is distinct from old.published_at
 ) then raise exception 'Ação reservada ao administrador' using errcode='42501'; end if;
 if new.status='published' then
   if not private.has_role('admin') then raise exception 'Somente admin pode publicar' using errcode='42501'; end if;
   if new.cultural_approval_status<>'approved' or new.cultural_approved_by is null or new.cultural_approved_at is null then
     raise exception 'Aprovação cultural humana pendente' using errcode='23514'; end if;
   if new.stock<1 then raise exception 'Produto publicado precisa ter estoque maior que zero' using errcode='23514'; end if;
   new.published_at := coalesce(new.published_at,now());
 elsif tg_op='UPDATE' and old.status='published' then new.published_at := null; end if;
 return new;
end $$;
revoke all on function private.guard_product_write() from public,anon,authenticated;

create or replace function private.guard_product_image_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is not null and not private.is_operator() then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
 if tg_op<>'DELETE' and new.storage_bucket='xukuru-public' and
    (not private.has_role('admin') or new.authorization_status<>'approved') then
   raise exception 'Imagem pública requer admin e autorização aprovada' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.guard_product_image_write() from public,anon,authenticated;

create or replace function private.guard_section_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is not null and not private.is_operator() then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
 if tg_op='INSERT' and (select auth.uid()) is not null and not private.has_role('admin') then
   new.published_content := '{"fields":{}}'::jsonb; new.published_style := '{"layout":"standard"}'::jsonb;
   new.published_is_visible := false; new.published_sort_order := 0; new.published_at := null;
   new.content_approval_status := 'pending'; new.content_approval_reference := ''; new.content_approved_by := null; new.content_approved_at := null;
 elsif tg_op='UPDATE' and not private.has_role('admin') and (
   new.published_content is distinct from old.published_content or new.published_style is distinct from old.published_style
   or new.published_is_visible is distinct from old.published_is_visible
   or new.published_sort_order is distinct from old.published_sort_order or new.published_at is distinct from old.published_at
   or new.content_approval_status is distinct from old.content_approval_status or new.content_approval_reference is distinct from old.content_approval_reference
   or new.content_approved_by is distinct from old.content_approved_by or new.content_approved_at is distinct from old.content_approved_at
 ) then raise exception 'Somente admin pode publicar conteúdo' using errcode='42501'; end if;
 if tg_op='UPDATE' then
   if new.draft_content is distinct from old.draft_content or new.draft_style is distinct from old.draft_style
      or new.draft_is_visible is distinct from old.draft_is_visible or new.draft_sort_order is distinct from old.draft_sort_order then
     if new.content_approval_status is not distinct from old.content_approval_status then
       new.content_approval_status := 'pending'; new.content_approved_by := null; new.content_approved_at := null;
     end if;
   end if;
   if new.content_approval_status='approved' and old.content_approval_status is distinct from 'approved' then
     if not private.has_role('admin') then raise exception 'Somente admin pode validar conteúdo' using errcode='42501'; end if;
     new.content_approved_by := (select auth.uid()); new.content_approved_at := now();
   end if;
   if new.published_at is distinct from old.published_at or new.published_content is distinct from old.published_content
      or new.published_style is distinct from old.published_style or new.published_is_visible is distinct from old.published_is_visible
      or new.published_sort_order is distinct from old.published_sort_order then
     if not private.has_role('admin') or new.content_approval_status<>'approved' or new.content_approved_by is null or new.content_approved_at is null or length(btrim(new.content_approval_reference))=0 then
       raise exception 'Publique somente após confirmação humana do conteúdo' using errcode='42501';
     end if;
     if new.content_approval_status is not distinct from old.content_approval_status then
       raise exception 'Registre novamente a aprovação da versão que será publicada' using errcode='42501';
     end if;
   end if;
 end if;
 if coalesce(new.draft_style->>'layout','standard') not in ('standard','text-left','text-right','two-columns','cards-2','cards-3','cards-4','image-text') then
   raise exception 'Layout não permitido' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function private.guard_section_write() from public,anon,authenticated;

create or replace function private.guard_setting_write()
returns trigger language plpgsql set search_path = '' as $$
declare v jsonb;
begin
 foreach v in array array[new.draft_value,new.published_value] loop
   if jsonb_typeof(v)<>'object' then raise exception 'Configuração deve ser um objeto JSON' using errcode='23514'; end if;
   if new.key='theme' then
     if exists(select 1 from jsonb_object_keys(v) as keys(key) where key not in ('primary','secondary','accent','background','font','layout')) then
       raise exception 'Campo de tema não permitido' using errcode='23514'; end if;
     if exists(select 1 from jsonb_each_text(v) e where e.key in ('primary','secondary','accent','background') and e.value !~ '^#[0-9A-Fa-f]{6}$') then
       raise exception 'Cor deve ser hexadecimal #RRGGBB' using errcode='23514';
     end if;
     if coalesce(v->>'font','Outfit') not in ('Outfit','Cinzel') or
        coalesce(v->>'layout','standard') not in ('standard','text-left','text-right','two-columns','cards-2','cards-3','cards-4','image-text') then
       raise exception 'Fonte ou layout não permitido' using errcode='23514';
     end if;
   elsif new.key='identity' then
     if exists(select 1 from jsonb_object_keys(v) as keys(key) where key not in ('name','description','logo_url','favicon_url')) or exists(select 1 from jsonb_each_text(v) e where length(e.value)>500) then raise exception 'Campo de identidade não permitido ou muito longo' using errcode='23514'; end if;
     if exists(select 1 from jsonb_each_text(v) e where e.key in ('logo_url','favicon_url') and e.value<>'' and e.value !~ '^https://[^/]+/storage/v1/object/public/xukuru-public/.+$') then raise exception 'Logo e favicon devem usar mídia HTTPS publicada' using errcode='23514'; end if;
   elsif new.key='contacts' then
     if exists(select 1 from jsonb_object_keys(v) as keys(key) where key not in ('email','whatsapp')) or exists(select 1 from jsonb_each_text(v) e where length(e.value)>160) then raise exception 'Campo de contato não permitido ou muito longo' using errcode='23514'; end if;
     if coalesce(v->>'email','')<>'' and v->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'E-mail inválido' using errcode='23514'; end if;
     if coalesce(v->>'whatsapp','')<>'' and v->>'whatsapp' !~ '^[0-9]{8,15}$' then raise exception 'WhatsApp deve conter de 8 a 15 dígitos' using errcode='23514'; end if;
   elsif new.key='seo' then
     if exists(select 1 from jsonb_object_keys(v) as keys(key) where key not in ('title','description')) or exists(select 1 from jsonb_each_text(v) e where length(e.value)>500) then raise exception 'Campo de SEO não permitido ou muito longo' using errcode='23514'; end if;
   elsif new.key='notices' then
     if exists(select 1 from jsonb_object_keys(v) as keys(key) where key not in ('checkout','claims')) or exists(select 1 from jsonb_each_text(v) e where length(e.value)>1000) then raise exception 'Aviso não permitido ou muito longo' using errcode='23514'; end if;
   end if;
 end loop;
 return new;
end $$;
revoke all on function private.guard_setting_write() from public,anon,authenticated;

create or replace function private.guard_media_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is not null and not private.is_operator() then raise exception 'Acesso não autorizado' using errcode='42501'; end if;
 if tg_op='DELETE' then
   if not private.has_role('admin') and (old.storage_bucket<>'xukuru-drafts' or old.authorization_status<>'pending') then
     raise exception 'Somente admin pode remover mídia aprovada' using errcode='42501'; end if;
   return old;
 end if;
 if not private.has_role('admin') then
   if tg_op='INSERT' then new.authorization_status:='pending'; new.storage_bucket:='xukuru-drafts'; new.created_by:=(select auth.uid());
   elsif old.storage_bucket<>'xukuru-drafts' or old.authorization_status<>'pending' or new.storage_bucket<>'xukuru-drafts' or new.authorization_status<>'pending' then
     raise exception 'Aprovação/publicação de mídia é exclusiva do admin' using errcode='42501'; end if;
 end if;
 if new.storage_bucket='xukuru-public' and (not private.has_role('admin') or new.authorization_status<>'approved') then
   raise exception 'Mídia pública requer aprovação administrativa' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function private.guard_media_write() from public,anon,authenticated;

create or replace function private.record_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare kind text; entity uuid; old_value jsonb; new_value jsonb; act text;
begin
 if tg_table_name='products' then
   kind:='product'; entity:=new.id;
   old_value:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old)-array['cultural_approval_notes','cultural_approval_reference'] end;
   new_value:=to_jsonb(new)-array['cultural_approval_notes','cultural_approval_reference'];
   act:=case when new.status='published' and (tg_op='INSERT' or old.status<>'published') then 'publish' when new.status='archived' then 'archive' when tg_op='INSERT' then 'create' else 'update' end;
 else
   kind:='page_section'; entity:=new.id;
   old_value:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end; new_value:=to_jsonb(new);
   act:=case when new.published_at is distinct from old.published_at and new.published_at is not null then 'publish' when tg_op='INSERT' then 'create' else 'update' end;
 end if;
 insert into public.content_revisions(entity_type,entity_id,old_snapshot,new_snapshot,actor) values(kind,entity,old_value,new_value,(select auth.uid()));
 insert into public.audit_logs(actor,action,entity_type,entity_id,summary) values((select auth.uid()),act,kind,entity,case when act='publish' then 'Conteúdo publicado' else 'Conteúdo atualizado' end);
 return new;
end $$;
revoke all on function private.record_revision() from public,anon,authenticated;

create or replace function private.record_setting_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare act text;
begin
 if tg_op='INSERT' then act:='create';
 elsif new.published_value is distinct from old.published_value or new.published_at is distinct from old.published_at then act:='publish';
 else act:='update'; end if;
 insert into public.audit_logs(actor,action,entity_type,entity_id,summary)
 values((select auth.uid()),act,'site_setting',null,case when act='publish' then 'Configuração publicada: '||new.key else 'Configuração atualizada: '||new.key end);
 return new;
end $$;
revoke all on function private.record_setting_audit() from public,anon,authenticated;

do $$ declare t text; begin
 foreach t in array array['categories','products','site_pages','page_sections','site_settings'] loop
  execute format('drop trigger if exists %I_touch on public.%I',t,t);
  execute format('create trigger %I_touch before update on public.%I for each row execute function private.touch_updated_at()',t,t);
 end loop;
end $$;
drop trigger if exists products_guard_write on public.products;
create trigger products_guard_write before insert or update on public.products for each row execute function private.guard_product_write();
drop trigger if exists images_guard_write on public.product_images;
create trigger images_guard_write before insert or update or delete on public.product_images for each row execute function private.guard_product_image_write();
drop trigger if exists sections_guard_write on public.page_sections;
create trigger sections_guard_write before insert or update on public.page_sections for each row execute function private.guard_section_write();
drop trigger if exists settings_guard_write on public.site_settings;
create trigger settings_guard_write before insert or update on public.site_settings for each row execute function private.guard_setting_write();
drop trigger if exists media_guard_write on public.media_assets;
create trigger media_guard_write before insert or update or delete on public.media_assets for each row execute function private.guard_media_write();
drop trigger if exists products_revision on public.products;
create trigger products_revision after insert or update on public.products for each row execute function private.record_revision();
drop trigger if exists sections_revision on public.page_sections;
create trigger sections_revision after insert or update on public.page_sections for each row execute function private.record_revision();
drop trigger if exists settings_audit on public.site_settings;
create trigger settings_audit after insert or update on public.site_settings for each row execute function private.record_setting_audit();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_revisions enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.categories,public.products,public.product_images,public.site_pages,public.page_sections,public.site_settings,public.media_assets,public.content_revisions,public.audit_logs from anon,authenticated;
grant select on public.categories,public.products,public.product_images,public.site_pages,public.page_sections,public.site_settings,public.media_assets,public.content_revisions,public.audit_logs to authenticated;
grant insert,update,delete on public.categories,public.products,public.product_images,public.site_pages,public.page_sections,public.site_settings,public.media_assets to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon,authenticated using(is_active);
drop policy if exists categories_operator_read on public.categories;
create policy categories_operator_read on public.categories for select to authenticated using(private.is_operator());
drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert on public.categories for insert to authenticated with check(private.has_role('admin'));
drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update on public.categories for update to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete on public.categories for delete to authenticated using(private.has_role('admin'));

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon,authenticated using(status='published' and is_active and stock>0 and cultural_approval_status='approved' and exists(select 1 from public.categories c where c.slug=category_slug and c.is_active));
drop policy if exists products_operator_read on public.products;
create policy products_operator_read on public.products for select to authenticated using(private.is_operator());
drop policy if exists products_operator_insert on public.products;
create policy products_operator_insert on public.products for insert to authenticated with check(private.is_operator() and (private.has_role('admin') or status in ('draft','pending_review')));
drop policy if exists products_operator_update on public.products;
create policy products_operator_update on public.products for update to authenticated using(private.has_role('admin') or (private.has_role('editor') and status in ('draft','pending_review'))) with check(private.has_role('admin') or (private.has_role('editor') and status in ('draft','pending_review')));
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for delete to authenticated using(private.has_role('admin'));

drop policy if exists images_public_read on public.product_images;
create policy images_public_read on public.product_images for select to anon,authenticated using(storage_bucket='xukuru-public' and authorization_status='approved' and exists(select 1 from public.products p where p.id=product_id and p.status='published' and p.is_active and p.stock>0 and p.cultural_approval_status='approved'));
drop policy if exists images_operator_read on public.product_images;
create policy images_operator_read on public.product_images for select to authenticated using(private.is_operator());
drop policy if exists images_operator_insert on public.product_images;
create policy images_operator_insert on public.product_images for insert to authenticated with check(private.has_role('admin') or (private.has_role('editor') and exists(select 1 from public.products p where p.id=product_id and p.status in ('draft','pending_review'))));
drop policy if exists images_operator_update on public.product_images;
create policy images_operator_update on public.product_images for update to authenticated using(private.has_role('admin') or (private.has_role('editor') and exists(select 1 from public.products p where p.id=product_id and p.status in ('draft','pending_review')))) with check(private.has_role('admin') or (private.has_role('editor') and exists(select 1 from public.products p where p.id=product_id and p.status in ('draft','pending_review'))));
drop policy if exists images_operator_delete on public.product_images;
create policy images_operator_delete on public.product_images for delete to authenticated using(private.has_role('admin') or (private.has_role('editor') and exists(select 1 from public.products p where p.id=product_id and p.status in ('draft','pending_review'))));

drop policy if exists pages_public_read on public.site_pages;
create policy pages_public_read on public.site_pages for select to anon,authenticated using(is_enabled);
drop policy if exists pages_operator_read on public.site_pages;
create policy pages_operator_read on public.site_pages for select to authenticated using(private.is_operator());
drop policy if exists pages_admin_write on public.site_pages;
create policy pages_admin_write on public.site_pages for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));

drop policy if exists sections_public_read on public.page_sections;
create policy sections_public_read on public.page_sections for select to anon,authenticated using(published_at is not null);
drop policy if exists sections_operator_read on public.page_sections;
create policy sections_operator_read on public.page_sections for select to authenticated using(private.is_operator());
drop policy if exists sections_operator_insert on public.page_sections;
create policy sections_operator_insert on public.page_sections for insert to authenticated with check(private.is_operator());
drop policy if exists sections_operator_update on public.page_sections;
create policy sections_operator_update on public.page_sections for update to authenticated using(private.is_operator()) with check(private.is_operator());
drop policy if exists sections_admin_delete on public.page_sections;
create policy sections_admin_delete on public.page_sections for delete to authenticated using(private.has_role('admin'));

drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings for select to anon,authenticated using(published_at is not null);
drop policy if exists settings_operator_read on public.site_settings;
create policy settings_operator_read on public.site_settings for select to authenticated using(private.is_operator());
drop policy if exists settings_admin_write on public.site_settings;
create policy settings_admin_write on public.site_settings for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));

drop policy if exists media_operator_read on public.media_assets;
create policy media_operator_read on public.media_assets for select to authenticated using(private.is_operator());
drop policy if exists media_operator_insert on public.media_assets;
create policy media_operator_insert on public.media_assets for insert to authenticated with check(private.is_operator() and created_by=(select auth.uid()));
drop policy if exists media_operator_update on public.media_assets;
create policy media_operator_update on public.media_assets for update to authenticated using(private.has_role('admin') or (private.has_role('editor') and storage_bucket='xukuru-drafts' and authorization_status='pending')) with check(private.has_role('admin') or (private.has_role('editor') and storage_bucket='xukuru-drafts' and authorization_status='pending'));
drop policy if exists media_operator_delete on public.media_assets;
create policy media_operator_delete on public.media_assets for delete to authenticated using(private.has_role('admin') or (private.has_role('editor') and storage_bucket='xukuru-drafts' and authorization_status='pending'));
drop policy if exists revisions_operator_read on public.content_revisions;
create policy revisions_operator_read on public.content_revisions for select to authenticated using(private.is_operator());
drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated using(private.has_role('admin'));

create or replace view public.public_categories with(security_invoker=true) as select slug,name,description,sort_order from public.categories where is_active;
create or replace view public.public_products with(security_invoker=true) as
 select p.id,p.legacy_id,p.slug,p.title,p.description,p.short_description,p.category_slug,c.name category_name,p.price,p.stock,p.featured,p.artisan,p.village,p.materials,p.dimensions,p.weight,p.image_alt,p.sort_order
 from public.products p join public.categories c on c.slug=p.category_slug and c.is_active;
create or replace view public.public_product_images with(security_invoker=true) as select id,product_id,storage_bucket,storage_path,alt_text,sort_order,is_cover from public.product_images;
create or replace view public.public_page_sections with(security_invoker=true) as select page_id,section_key,section_type,published_content,published_style,published_is_visible,published_sort_order,published_at from public.page_sections where published_at is not null;
create or replace view public.public_site_settings with(security_invoker=true) as select key,published_value,published_at from public.site_settings where published_at is not null;
create or replace view public.operator_page_sections with(security_barrier=true) as select * from public.page_sections where private.is_operator();
create or replace view public.operator_site_settings with(security_barrier=true) as select * from public.site_settings where private.is_operator();
revoke all on public.public_categories,public.public_products,public.public_product_images,public.public_page_sections,public.public_site_settings,public.operator_page_sections,public.operator_site_settings from public,anon,authenticated;
grant select on public.public_categories,public.public_products,public.public_product_images,public.public_page_sections,public.public_site_settings to anon,authenticated;
grant select on public.operator_page_sections,public.operator_site_settings to authenticated;

-- Somente as colunas publicadas ficam acessíveis por API pública. RLS filtra as linhas.
grant select(slug,name,description,sort_order,is_active) on public.categories to anon,authenticated;
grant select(id,legacy_id,slug,title,description,short_description,category_slug,price,stock,featured,artisan,village,materials,dimensions,weight,image_alt,sort_order,is_active,status,cultural_approval_status) on public.products to anon,authenticated;
grant select(id,product_id,storage_bucket,storage_path,alt_text,sort_order,is_cover,authorization_status) on public.product_images to anon,authenticated;
grant select(id,slug,title,seo_title,seo_description,is_enabled) on public.site_pages to anon,authenticated;
revoke select on public.page_sections,public.site_settings from anon,authenticated;
grant select(id,page_id,section_key,section_type,published_content,published_style,published_is_visible,published_sort_order,published_at,created_at,updated_at) on public.page_sections to anon,authenticated;
grant select(key,published_value,published_at,updated_at) on public.site_settings to anon,authenticated;
revoke select on public.admin_users,public.media_assets,public.content_revisions,public.audit_logs from anon;
revoke select(draft_content,draft_style,draft_is_visible,draft_sort_order) on public.page_sections from public,anon,authenticated;
revoke select(draft_value) on public.site_settings from public,anon,authenticated;
revoke insert,update,delete on public.admin_users,public.content_revisions,public.audit_logs from anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('xukuru-drafts','xukuru-drafts',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('xukuru-public','xukuru-public',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists xukuru_drafts_operator_select on storage.objects;
create policy xukuru_drafts_operator_select on storage.objects for select to authenticated using(bucket_id='xukuru-drafts' and private.is_operator());
drop policy if exists xukuru_drafts_operator_insert on storage.objects;
create policy xukuru_drafts_operator_insert on storage.objects for insert to authenticated with check(bucket_id='xukuru-drafts' and private.is_operator());
drop policy if exists xukuru_drafts_operator_update on storage.objects;
create policy xukuru_drafts_operator_update on storage.objects for update to authenticated using(bucket_id='xukuru-drafts' and private.is_operator()) with check(bucket_id='xukuru-drafts' and private.is_operator());
drop policy if exists xukuru_drafts_operator_delete on storage.objects;
create policy xukuru_drafts_operator_delete on storage.objects for delete to authenticated using(
 bucket_id='xukuru-drafts' and private.is_operator()
 and not exists(select 1 from public.media_assets m where m.storage_bucket='xukuru-drafts' and m.storage_path=name)
 and not exists(select 1 from public.product_images i where i.storage_bucket='xukuru-drafts' and i.storage_path=name)
 and not private.path_used_in_pages(name)
);
drop policy if exists xukuru_public_admin_insert on storage.objects;
create policy xukuru_public_admin_insert on storage.objects for insert to authenticated with check(bucket_id='xukuru-public' and private.has_role('admin') and exists(select 1 from public.media_assets m where m.storage_bucket='xukuru-public' and m.storage_path=name and m.authorization_status='approved'));
drop policy if exists xukuru_public_admin_update on storage.objects;
create policy xukuru_public_admin_update on storage.objects for update to authenticated using(bucket_id='xukuru-public' and private.has_role('admin')) with check(bucket_id='xukuru-public' and private.has_role('admin'));
drop policy if exists xukuru_public_admin_delete on storage.objects;
create policy xukuru_public_admin_delete on storage.objects for delete to authenticated using(
 bucket_id='xukuru-public' and private.has_role('admin')
 and not exists(select 1 from public.media_assets m where m.storage_bucket='xukuru-public' and m.storage_path=name)
 and not exists(select 1 from public.product_images i where i.storage_bucket='xukuru-public' and i.storage_path=name)
 and not private.path_used_in_pages(name)
);
commit;

