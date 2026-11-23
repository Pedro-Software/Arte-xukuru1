# Arte Xukuru do Ororubá

Vitrine demonstrativa com catálogo carregado do Supabase e painel administrativo em `/admin.html`. As informações e fotos que ainda aguardam autorização ficam como rascunho. A identidade visual existente, com verde, terracota, ocre e bege, foi preservada.

## Rodar localmente

```powershell
npm install
npm run dev
```

Abra os endereços que o Vite mostrar no terminal. Para gerar a versão estática:

```powershell
npm run build
npm run preview
```

A URL e a publishable key do projeto ficam em `assets/js/lib/supabasePublicConfig.js`, incluído no GitHub e no build. O Live Server também pode abrir `index.html` e `admin.html`; nesse caso, a biblioteca Supabase é carregada pelo import map. Para usar outro projeto com Vite, defina o par `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local` ou nas variáveis da Vercel e gere um novo build. O arquivo `.env.local` não é enviado ao GitHub.

O painel exige conta criada em Authentication e papel ativo na tabela `admin_users`. Veja o [guia de configuração do Supabase](docs/SUPABASE_SETUP.md) e o [guia do painel](docs/PAINEL_ADMIN.md).

## Dados e segurança

- A migração fica em `supabase/migrations/20261105000100_cms_core.sql`.
- Os dados iniciais ficam em `supabase/seed.sql` e podem ser reaplicados sem substituir as edições existentes.
- `supabase/admin_bootstrap.sql` é um modelo manual para dar o papel inicial de admin ao UUID correto.
- `xukuru-drafts` é privado; `xukuru-public` só recebe mídia aprovada pelo admin.
- A API pública usa views e RLS para filtrar produtos publicados e separar campos publicados dos rascunhos.
- A chave `service_role`/secret nunca deve ser usada no navegador.

## Verificações

```powershell
npm run test
npm run build
npm audit
```

O teste direto de RLS requer um projeto Supabase configurado e contas de teste: `npm run test:rls`. Instruções estão no guia de configuração.

## Limites atuais

O checkout é apenas demonstrativo: não cria pedidos, não cobra e não processa pagamentos. Os valores do catálogo são referências. Oito registros de produtos são semeados como rascunhos, sem publicação automática. A autorização cultural, a origem de cada imagem, composição, alegações médicas, condições comerciais e demais dados precisam ser confirmados antes da publicação.
