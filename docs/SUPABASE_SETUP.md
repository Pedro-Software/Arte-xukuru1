# Configurar o Supabase para o Arte Xukuru

Este guia conecta a aplicação ao seu projeto Supabase. Nenhuma ação foi executada no seu projeto remoto: URL, chaves, UUID e credenciais precisam ser copiados da sua própria conta.

## 1. Copiar a URL do projeto e a chave pública

1. Abra o projeto no Dashboard do Supabase.
2. Na tela **Connect**, copie a **Project URL** e a **publishable key**. Também é possível encontrá-las em **Project Settings → API Keys**.
3. A URL tem formato semelhante a `https://<project-ref>.supabase.co`. A chave pública atual costuma começar com `sb_publishable_`.
4. Não use a **secret key** (ou a antiga `service_role`) no site, no arquivo `.env.local`, no HTML ou no JavaScript. A publishable key pode estar no navegador porque as permissões são aplicadas pelo RLS; a secret key ignora o RLS e deve ficar somente em ambiente de servidor seguro. [Documentação oficial sobre API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## 2. Preencher `.env.local`

Abra o terminal integrado do VS Code na pasta do projeto e rode:

```powershell
Copy-Item .env.example .env.local
```

Edite `.env.local` e substitua os dois valores de exemplo:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Salve o arquivo. Ele está excluído do Git; não o envie em commits nem compartilhe capturas contendo chaves. Reinicie o Vite sempre que alterar essas variáveis.

## 3. Instalar e abrir o site

No terminal, dentro da pasta do projeto:

```powershell
npm install
npm run dev
```

O terminal informa a URL local e a porta livre. Abra essa URL para o site e acrescente `/admin.html` para o painel. Se a porta padrão estiver ocupada, use a que o Vite mostrar.

Para conferir a compilação de produção:

```powershell
npm run build
npm run preview
```

## 4. Preparar o banco e o Storage

Escolha **uma** forma para aplicar a migração. O seed pode ser executado depois pelo SQL Editor em ambos os caminhos.

### Opção A — SQL Editor (mais simples para a primeira configuração)

1. No Dashboard do projeto, abra **SQL Editor → New query**.
2. Abra `supabase/migrations/20261105000100_cms_core.sql` no VS Code, copie todo o conteúdo e execute-o uma única vez no SQL Editor.
3. Abra uma nova query, copie todo `supabase/seed.sql` e execute-o. O seed cria categorias, os oito produtos existentes como rascunhos, as páginas, os textos de revisão e as configurações iniciais. Se for repetido, preserva registros já existentes.

### Opção B — Supabase CLI

O projeto já inclui `supabase/config.toml` e a pasta de migrações. Instale/atualize o Supabase CLI caso ainda não esteja disponível; então, no terminal:

```powershell
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push --dry-run
supabase db push
```

O `project ref` aparece na URL do projeto e em **Project Settings → General**. Confira o resumo do `--dry-run` antes de executar `db push`. Depois, execute `supabase/seed.sql` no SQL Editor.

**Não aplique a mesma migração pelos dois caminhos.** Uma migração executada manualmente no SQL Editor não entra automaticamente no histórico de migrações da CLI. Se já a aplicou manualmente, continue usando esse caminho; para migrar a gestão para CLI, primeiro alinhe o histórico com a orientação da CLI/Supabase, em vez de repetir cegamente o `db push`.

> A migração cria tabelas, índices, funções, views, políticas RLS e os buckets `xukuru-drafts` (privado) e `xukuru-public` (público para leitura). Ela não cria usuário administrador.

## 5. Conferir tabelas, RLS e buckets

1. Em **Table Editor**, confirme `categories`, `products`, `product_images`, `site_pages`, `page_sections`, `site_settings`, `media_assets`, `content_revisions`, `audit_logs` e `admin_users`.
2. Abra **Authentication → Policies** ou confira as políticas de cada tabela em Table Editor. RLS deve estar habilitado. A API pública lê somente os dados publicados; não conceda acesso público de escrita.
3. Em **Storage**, confirme `xukuru-drafts` como privado e `xukuru-public` como público. Não altere as políticas `storage.objects` criadas pela migração sem revisar o efeito.
4. Para conferir grants e RLS, execute `supabase/tests/security_checks.sql` no SQL Editor com a role de banco apropriada. A última linha deve retornar “RLS e privilégios estruturais conferidos”.

Views públicas com `security_invoker` dependem dos grants e RLS nas tabelas-base. Por isso a view pública não é, sozinha, a proteção: as políticas e permissões por coluna também são necessárias. [Documentação de views](https://supabase.com/docs/guides/database/views) e [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 6. Criar o primeiro admin

1. No Dashboard, abra **Authentication → Users → Add user → Create new user**.
2. Informe o e-mail que você controla e crie uma senha forte. Confirme o e-mail do usuário no Dashboard ou pelo link enviado, conforme a configuração do provedor Email.
3. Abra o usuário recém-criado e copie o **UUID/ID** (não é o e-mail).
4. No VS Code, abra `supabase/admin_bootstrap.sql`. Substitua `COLE_O_UUID_DO_USUARIO` pelo UUID copiado, sem alterar as aspas, e execute o SQL no **SQL Editor**.
5. A consulta no final deve mostrar esse mesmo UUID, `role = admin` e `is_active = true`.

O papel não pode ser concedido pelo navegador. O arquivo é um modelo; execute-o somente depois de trocar o marcador. `ON CONFLICT DO NOTHING` não eleva uma conta existente: se você cadastrou intencionalmente essa conta como editor, faça a promoção manual e consciente no SQL Editor.

## 7. Restringir cadastro e configurar autenticação

1. Abra **Authentication → Providers → Email** (em algumas versões, as opções gerais aparecem em **Authentication → Settings / General configuration**).
2. Mantenha Email habilitado para login com senha. Desative **Allow new users to sign up / Enable signups** para impedir cadastro público. O login do painel não tem botão de cadastro.
3. Em **Authentication → URL Configuration**, configure **Site URL** para o domínio principal de produção quando existir.
4. Em **Redirect URLs**, inclua a origem local que o Vite mostrar, com caminho de painel, por exemplo `http://127.0.0.1:5173/**` e, se você alternar entre hosts, `http://localhost:5173/**`. Inclua também o domínio publicado, por exemplo `https://seu-dominio.example/**`.
5. A recuperação de senha retorna para `/admin.html?reset=1`. A URL precisa corresponder a uma entrada permitida. Use o domínio real e evite liberar curingas em domínios que não controla. [Configuração de autenticação](https://supabase.com/docs/guides/auth/general-configuration) e [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls).

## 8. Entrar e fazer um primeiro teste manual

1. Reinicie `npm run dev` depois de editar `.env.local`.
2. Abra `/admin.html`, entre com o usuário do passo 6 e confirme que o painel mostra o e-mail e o perfil **Administrador**.
3. Em **Produtos**, abra um rascunho ou crie um produto. Informe título, categoria, preço de referência e estoque; salve o rascunho.
4. Abra o produto salvo e envie uma imagem JPEG, PNG ou WebP de até 5 MB. Ela será armazenada no bucket privado e não aparece publicamente ainda.
5. Edite o texto e o ALT, valide autorização, procedência, preço e estoque com as pessoas responsáveis. Registre uma referência interna da autorização e marque a confirmação cultural no formulário. Imagens de produto só passam para o bucket público quando um administrador publica o produto.
6. Em **Editor de páginas**, selecione Início, Catálogo, Sacola, Sobre ou História, edite um campo, escolha a prévia Desktop/Celular e salve como rascunho. A prévia fica dentro da sessão autenticada. Para tornar a alteração pública, registre a referência, confirme a revisão humana e clique em publicar.
7. Em **Aparência**, altere cores/fonte/preset e publique após conferir a prévia. Em **Configurações**, edite identidade, contatos, SEO e avisos; salve rascunho ou publique.
8. Abra o site em uma janela anônima. Confira que aparecem apenas produtos, imagens, textos e temas publicados. Os registros seed começam como rascunhos e não aparecem na vitrine.
9. Confirme que sacola e checkout continuam demonstrativos: nenhum pedido ou cobrança é criada.

## 9. Testes disponíveis

Os testes locais e o build não precisam de credenciais:

```powershell
npm run test
npm run build
npm audit
```

O teste REST de autorização requer três contas de teste independentes: um usuário sem papel, um editor ativo e um admin ativo, além da URL e publishable key. O visitante anônimo não precisa de conta. Use contas de teste, não contas de clientes. O teste tenta escritas que devem ser negadas, mas não usa chave privilegiada nem grava dados se o RLS funcionar.

Crie os três usuários de teste em **Authentication → Users**. Use o admin já criado no passo 6 se preferir. Para a conta editora de teste, copie o UUID e execute no SQL Editor, substituindo o marcador:

```sql
insert into public.admin_users(user_id, role, is_active)
values ('UUID_DO_EDITOR_DE_TESTE', 'editor', true)
on conflict (user_id) do update set role = 'editor', is_active = true;
```

Deixe a conta comum fora de `admin_users`.

```powershell
$env:TEST_SUPABASE_URL = 'https://SEU_PROJECT_REF.supabase.co'
$env:TEST_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SUA_CHAVE_PUBLICA'
$env:TEST_USER_EMAIL = 'EMAIL_DO_USUARIO_COMUM'
$env:TEST_USER_PASSWORD = 'SENHA_DO_USUARIO_COMUM'
$env:TEST_EDITOR_EMAIL = 'EMAIL_DO_EDITOR'
$env:TEST_EDITOR_PASSWORD = 'SENHA_DO_EDITOR'
$env:TEST_ADMIN_EMAIL = 'EMAIL_DO_ADMIN'
$env:TEST_ADMIN_PASSWORD = 'SENHA_DO_ADMIN'
npm run test:rls
```

Ao terminar, remova as variáveis da sessão do PowerShell:

```powershell
'TEST_SUPABASE_URL','TEST_SUPABASE_PUBLISHABLE_KEY','TEST_USER_EMAIL','TEST_USER_PASSWORD','TEST_EDITOR_EMAIL','TEST_EDITOR_PASSWORD','TEST_ADMIN_EMAIL','TEST_ADMIN_PASSWORD' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
```

## 10. Resolver erros comuns

- **Supabase não configurado / API key inválida:** confira nomes das variáveis, URL sem espaços e publishable key; reinicie o Vite. Nunca substitua pela secret key no frontend.
- **`relation does not exist` / schema cache:** migração ou seed não foi aplicado, ou a API ainda está atualizando. Confira a sequência no SQL Editor e recarregue.
- **`permission denied`, `42501`, `401` ou `403`:** confirme que o login é válido, o usuário existe em `admin_users`, está ativo e tem o papel esperado. Confira RLS, grants e políticas Storage; não tente resolver desativando RLS.
- **Admin recebe acesso negado:** confira UUID e `is_active=true`; o UUID precisa ser exatamente o da conta autenticada.
- **`storage bucket not found`:** execute a migração e confirme os nomes exatos dos dois buckets.
- **Link de recuperação não abre:** inclua a URL local/de produção em **Authentication → URL Configuration → Redirect URLs** e peça um novo link.
- **Upload negado:** confirme o papel de operador, tamanho até 5 MB, formato JPEG/PNG/WebP e existência das políticas de `storage.objects`.
- **Catálogo vazio:** os oito produtos iniciais são rascunhos; publique apenas os que tiverem aprovação humana. Se estiver testando, crie/publice um produto aprovado com estoque positivo.
- **CORS:** REST e Storage do Supabase aceitam chamadas do navegador; verifique a URL correta e as políticas. Redirect URLs controlam redirecionamento de Auth, não substituem RLS.
- **CLI reclama de migração já aplicada:** não execute a mesma migração pelo SQL Editor e pelo CLI sem alinhar `supabase_migrations.schema_migrations` com o procedimento oficial.

## 11. Publicar a versão estática

1. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como variáveis de build no serviço de hospedagem e rode `npm run build`.
2. Publique o conteúdo da pasta `dist/`. Configure o domínio para servir tanto `index.html` quanto `admin.html` e os arquivos em `assets/`.
3. Cadastre o domínio em **Authentication → URL Configuration** e atualize **Site URL**.
4. Não envie `.env.local`, secret key, senha de banco ou chave `service_role` ao repositório ou ao navegador. A publishable key é pública; a segurança do conteúdo está nas policies RLS e Storage revisadas.

## 12. Revisão cultural, de privacidade e comercial

Antes de publicação, confirme com representantes legítimos, com autorização prévia, livre e informada, o uso de nomes, narrativas, imagens, grafismos e demais materiais culturais. Registre apenas uma referência interna não sensível; não suba documentos de autorização nem dados pessoais desnecessários.

Valide individualmente: alegação de repasse de 80%; “Loja Verificada FUNAI”; certificado de origem; “SSL 256-bit”; PIX, cartão, boleto e frete grátis; dados de população, território e número de aldeias (24 versus 27); autoria e procedência de fotografias; composição, regularização, modo de uso e alegações médicas/cosméticas. Até a confirmação, mantenha rascunhos e o texto neutro já exibido no site.
