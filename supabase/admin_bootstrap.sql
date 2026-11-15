-- Execute uma única vez no SQL Editor depois de criar o usuário em Authentication > Users.
-- Substitua COLE_O_UUID_DO_USUARIO pelo UUID real exibido no painel. Não use e-mail aqui.
-- ON CONFLICT DO NOTHING evita elevar um editor existente ao reaplicar acidentalmente.
insert into public.admin_users(user_id, role, is_active)
values ('76f72234-46a2-4b46-b8dd-7e9ae57c181b', 'admin', true)
on conflict (user_id) do nothing;

-- Confira o resultado (deve mostrar exatamente o UUID escolhido e role=admin):
select user_id, role, is_active, created_at from public.admin_users
where user_id = '76f72234-46a2-4b46-b8dd-7e9ae57c181b';
