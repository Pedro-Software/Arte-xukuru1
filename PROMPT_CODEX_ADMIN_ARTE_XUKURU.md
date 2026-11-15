# PROMPT PARA O CODEX NO VS CODE — ADMINISTRAÇÃO DO ARTE XUKURU

Você é um engenheiro de software full-stack sênior, com experiência em JavaScript, Supabase, PostgreSQL, RLS, autenticação, acessibilidade e CMS. Trabalhe DIRETAMENTE nos arquivos deste workspace, implemente as funcionalidades, crie as migrações SQL, execute verificações disponíveis e documente exatamente o que eu preciso configurar manualmente no Supabase.

## 1. CONTEXTO REAL DO PROJETO (LEIA ANTES DE ALTERAR)

O repositório é o site **Arte Xukuru do Ororubá**, vitrine acadêmica de produtos indígenas associada ao povo Xukuru do Ororubá, de Pesqueira/PE. Atualmente não tem backend nem autenticação. Tecnologia existente: HTML5, CSS3 e JavaScript puro, em SPA com páginas internas.

Arquivos existentes:
- `index.html`: páginas Início (`page-home`), Catálogo (`page-catalog`), Sacola (`page-cart`), História (`page-history`) e Sobre (`page-about`), além de header, footer, modais e textos fixos.
- `assets/css/styles.css`: design system com cores (`--color-primary: #1F3E2B`, `--color-secondary: #C45A35`, `--color-accent: #D99B26`, `--color-bg: #F9F6F0`), fontes Cinzel e Outfit, estilos responsivos.
- `assets/js/data.js`: array global `XUKURU_PRODUCTS` com **8 produtos**, campos `id`, `title`, `category`, `categoryName`, `price`, `featured`, `artisan`, `village`, `image`, `imageAlt`, `materials`, `description`, `dimensions`, `weight`, `stock`; inclui `FRETE_CONFIG` demonstrativo.
- `assets/js/app.js`: objetos `AppState`, `Utils`, `Cart`, `Toast`, `Catalog`, `UI`, `Checkout`; gera cards via `renderCatalogCard`, modal via `openProductModal`, destaques via `navigateTo('home')`, filtros, carrinho salvo em `localStorage` sob `xukuru_cart_demonstrative`, navegação por `data-page` e `DOMContentLoaded`.
- `imgs/`: fotografias reais dos oito produtos; `assets/images/`: imagens institucionais.
- `README.md` e `LICENSE`: documentação e licença MIT sobre o código. O conteúdo cultural e as imagens NÃO devem ser tratados como automaticamente liberados para uso só por haver licença MIT no software.

Fatos críticos a respeitar:
1. O catálogo existente usa IDs **numéricos** e `parseInt()` em eventos. Se migrar para UUID no PostgreSQL, adaptar TODAS as consultas, eventos, carrinho e migração do `localStorage` para strings; não quebrar o produto em destaque, a busca, o modal e a sacola.
2. Hoje os filtros de categoria no HTML são fixos; passar a alimentá-los do banco.
3. O carrinho hoje cria automaticamente o primeiro produto ao abrir pela primeira vez. REMOVER esse preenchimento de demonstração; carrinho novo deve iniciar vazio.
4. O checkout em `app.js` é explicitamente **simulado**. NÃO criar pagamentos reais, pedidos fictícios, métricas de vendas inventadas, frete real ou integrações financeiras sem escopo aprovado.
5. O site contém valores de referência e alegações que requerem confirmação: percentuais de repasse de 80%, frete grátis, descontos/PIX, certificações/selos (incluindo menção à FUNAI), pagamento seguro, quantidades de aldeias inconsistentes entre seções, proveniência de imagens e alegações terapêuticas de alguns cosméticos/fitoterápicos. Sinalizar no painel como 'pendente de validação'; não inventar validação, certificação, autorização, status regulatório ou benefícios médicos.
6. Em `index.html`, os textos de todas as páginas, menus, botões, CTAs, blocos de confiança, seções, história, sobre e rodapé estão hardcoded. Quero poder editá-los pelo painel.
7. Manter o site funcionando e visualmente próximo do atual, inclusive responsividade, navegação e acessibilidade; não reescrever em React/Next.js nem trocar a identidade visual. Corrigir o início atual em `catalog` para abrir em `home`, se não houver intenção explícita documentada em contrário.

## 2. OBJETIVO E ESCOPO

Transformar o site existente em vitrine pública abastecida pelo Supabase + um **CMS/painel administrativo protegido**, para que uma pessoa autorizada possa gerenciar produtos, fotos, categorias, conteúdo textual de cada página, aparência e organização das seções SEM mexer no código-fonte. O Supabase já foi criado por mim, porém você não possui minhas credenciais: escreva as integrações com variáveis de ambiente e forneça instruções precisas para configurá-lo manualmente. Não dependa de eu revelar chaves secretas.

Implemente funcionalidades REAIS integradas ao PostgreSQL e ao Supabase Storage, não apenas telas fictícias. Prefira uma implementação modular, progressiva e funcional, sem destruir o código atual.

## 3. ESTRUTURA TÉCNICA RECOMENDADA

Preserve HTML + CSS + JavaScript vanilla. Para suportar `.env.local`, dependência `@supabase/supabase-js` e build reproduzível, ADICIONE Vite de maneira mínima, sem framework de UI. Configure build multipage para `index.html` e `admin.html`. Caso a estrutura do workspace exija pequena variação, explique a escolha. Scripts mínimos: `npm run dev`, `npm run build`, `npm run preview` e `npm run test` (testes reais). Continue utilizando os estilos atuais e crie CSS isolado do admin.

Estrutura sugerida (ajuste após examinar o código):
- `index.html`: site público existente.
- `admin.html`: entrada do login/painel administrativo, acessível em `/admin.html` (e documentar `/admin` apenas se o host suportar rewrite).
- `assets/js/lib/supabaseClient.js`: cliente único do Supabase.
- `assets/js/services/products.js`, `categories.js`, `cms.js`, `media.js`, `auth.js`: serviços e transformação de dados.
- `assets/js/admin/`: inicialização, guarda de sessão, navegação, formulários e editor visual.
- `assets/css/admin.css`: layout do painel, responsivo, consistente com a marca.
- `supabase/migrations/*.sql`: migrações SQL versionadas e reproduzíveis.
- `supabase/seed.sql` e/ou `scripts/import-legacy-data.*`: migração idempotente de dados existentes (documentar execução).
- `.env.example`, `.gitignore`, `docs/SUPABASE_SETUP.md`, `docs/ADMIN_GUIDE.md` e `README.md` atualizado.

Variáveis locais esperadas:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Use `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)`. A chave **publishable** pode existir no frontend com RLS adequada. NÃO colocar `service_role`, `sb_secret`, senha de banco, token de acesso administrativo ou segredos no browser, git ou `.env.example` preenchido. Compatibilidade com chave legada `anon` somente se a documentação e o projeto exigirem, deixando a publishable como padrão. O frontend deve mostrar configuração ausente de forma clara em desenvolvimento, sem expor segredo. `.env.local` no `.gitignore`.

## 4. AUTENTICAÇÃO E AUTORIZAÇÃO REAL

Usar **Supabase Auth** com login de e-mail e senha (`signInWithPassword`), sessão persistente, verificação de usuário na inicialização (`getUser`/método adequado), tratamento de expiração, logout (`signOut`), feedback de erros sem vazar detalhes e opção de recuperação de senha configurada com URL de retorno. O login é só para operadores, sem tela pública de cadastro. Se possível, configurar/descrever desativação de criação pública de contas no painel do Supabase.

Criar tabela `admin_users` (ou nome equivalente) com `user_id uuid PRIMARY KEY REFERENCES auth.users(id)`, `role` (ao menos `admin` e `editor`), `is_active`, `created_at` e `updated_at`. A autorização DEVE ocorrer no banco com RLS e função SQL confiável; não basta ocultar menu nem verificar e-mail no JavaScript. Usuário autenticado sem `admin_users` ativo deve receber 'Acesso não autorizado' e não deve poder ler rascunhos nem alterar dados. Somente `admin` controla tema/publicação/operadores; `editor` pode editar rascunhos de conteúdo/produtos, conforme permissões documentadas.

A concessão inicial da role deve ser feita APENAS por SQL executado por operador legítimo no SQL Editor do Supabase, após criar usuário em **Authentication > Users**, NUNCA por signup no cliente, triggers de autoelevação, URL, query string ou metadados editáveis pelo usuário. Criar script SQL de bootstrap com o UUID como placeholder, sem contas/senhas fictícias nem inserção automática com privilégios. Não permitir autoalteração de role ou `is_active` via RLS. Evitar funções `SECURITY DEFINER` em esquemas expostos; se necessárias para checagem de role, criar em esquema privado, `SET search_path = ''`, nomes qualificados, privilégios mínimos e teste de não escalonamento.

O login deve ter design consistente, campos com labels, mostrar carregamento, teclado, celular e acesso negado. A verificação frontend é conveniência UX; o banco precisa bloquear operações mesmo em chamadas REST manuais.

## 5. MODELAGEM COMPLETA DO BANCO SUPABASE

Criar SQL de migração idempotente **segura** ou sequência versionada (não usar `DROP TABLE` destrutivo). Definir tipos adequados, chaves primárias/estrangeiras, `NOT NULL`, `CHECK`, `UNIQUE`, índices de leitura, timestamps `timestamptz` e trigger de `updated_at`. Use nomes abaixo como proposta ou justifique alterações. Estrutura mínima:

### 5.1 `categories`
- `id` uuid ou `slug` text chave; `name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`.
- Semeie categorias existentes: `ceramica`, `colares`, `cuidados-pessoais`, `fitoterapicos` e seus nomes atuais; preservar exatamente os vínculos.

### 5.2 `products`
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `legacy_id integer UNIQUE NULL` para migração, `slug UNIQUE`, `title`, `description`, `short_description`, `category_id`/`category_slug` FK, `price numeric(12,2) CHECK (price>=0)`, `stock integer CHECK (stock>=0)`, `featured`, `artisan`, `village`, `materials`, `dimensions`, `weight`, `image_alt`, `sort_order`, `status` (`draft`, `pending_review`, `published`, `archived`), `is_active` quando necessário, `created_at`, `updated_at`, `published_at`.
- Campo de governança cultural: `cultural_approval_status` (`pending`, `approved`, `rejected`) e referência interna a responsável, data e observações; não expor metadados pessoais/publicações restritas. Um status 'approved' deve ser registrado apenas depois de validação humana real. Exigir aprovação real para publicar textos/imagens culturais quando aplicável; evitar que o próprio código presuma que aprovação ocorreu.
- Validar preços em BRL (sem converter centavos incorretamente), estoque, strings vazias, slugs e campos obrigatórios. Permitir produto sem foto como rascunho, mas mostrar placeholder na loja se necessário.

### 5.3 `product_images`
- `id uuid`, `product_id` FK, `storage_bucket`, `storage_path`, `alt_text`, `sort_order`, `is_cover`, `created_at`.
- Suportar mais de uma imagem e apenas uma capa por produto, incluindo índice único parcial; imagem principal exibida nos cards e galeria no modal.

### 5.4 `site_pages` e `page_sections` (CMS)
- `site_pages`: `id`, `slug` único (`home`, `catalog`, `cart`, `about`, `history`), `title`, `seo_title`, `seo_description`, `is_enabled`, timestamps.
- `page_sections`: `id`, `page_id` FK, `section_key` estável, `section_type` permitido, `draft_content jsonb`, `published_content jsonb`, `draft_style jsonb`, `published_style jsonb`, `draft_is_visible`, `published_is_visible`, `draft_sort_order`, `published_sort_order`, `created_at`, `updated_at`, `published_at`.
- Definir schemas/validadores para cada tipo de seção (hero, cards, texto rico restrito, estatísticas, imagem+texto, CTA, trust-bar, rodapé e navegação). Nunca permitir que JSON/CSS do CMS seja executado como JS/HTML arbitrário.
- Seed de seções com TODOS os conteúdos atuais em `index.html`, incluindo hero, barra de confiança, destaques, propósito, valores, título/textos do catálogo, aviso de preços de referência, sacola, história, sobre, links de contato, rodapé, redes sociais, CTAs e placeholders. Preservar textos aprovados e identificar conteúdos a revisar.
- Hidratar conteúdo no DOM com chaves estáveis (`data-cms-key` / `data-section-key`) ou renderer específico por tipo, SEM substituir tudo por uma estrutura diferente. Conteúdo publicado para visitantes e rascunho apenas para operadores autorizados.

### 5.5 `site_settings` / `theme_settings`
- Chaves para nome da loja, logo, favicon, contatos, redes, mensagens institucionais, SEO e tema; manter **versões draft/published** onde necessário.
- Customização visual permitida: cores do tema usando CSS variables atuais, fonte de título/corpo de lista segura, banner, imagem de hero, largura de conteúdo, estilo de cards, quantidade de colunas por breakpoint, espaçamentos predefinidos, arredondamento e ordem/visibilidade das seções.
- VALIDAR CSS (somente valores permitidos; hex seguro, enums, intervalos); nunca aceitar CSS livre, scripts, HTML/iframes arbitrários, `javascript:` ou links inseguros.

### 5.6 `media_assets`, `content_revisions`, `audit_logs`
- `media_assets`: bucket, path, tipo, tamanho, dimensões opcionais, ALT, origem/legenda e status de autorização.
- `content_revisions`: snapshot/versionamento anterior e novo, autor, entidade, timestamp; permitir restaurar versão no editor sem apagar o histórico. Se outra estrutura for melhor, explicar.
- `audit_logs`: ator, ação, entidade, entity_id, timestamp, resumo de alterações; logs somente para admin (e talvez auditor autorizado), gravação não confiada ao navegador sem proteção. Não registrar senhas/chaves/tokens nem dados pessoais desnecessários.
- Não criar tabelas `orders`, `payments`, vendas realizadas ou métricas de receita sem um sistema real de pedidos.

## 6. RLS, PRIVILÉGIOS E STORAGE: REQUISITOS INEGOCIÁVEIS

Em CADA tabela pública exposta, ativar `ROW LEVEL SECURITY` e configurar `GRANT`/`REVOKE` coerentes (não confiar apenas em RLS; atenção a privilégios default do Supabase). Criar policies separadas por `SELECT`, `INSERT`, `UPDATE`, `DELETE`, limitadas explicitamente a `anon`/`authenticated` e com `USING`/`WITH CHECK` adequados. Regras:
- `anon`: ler somente produtos PUBLICADOS, categorias ATIVAS, seções PUBLICADAS e configurações públicas. Sem escrita. Nunca ler rascunhos, aprovações internas, admins, revisões privadas ou audit logs.
- `authenticated` comum sem papel administrativo: mesmas leituras públicas, sem escrita.
- `editor` ativo: ler e editar rascunhos de produtos, imagens e conteúdos, sem promover a admin nem publicar sem autorização.
- `admin` ativo: gerir conteúdo, categorias, tema, publicação e ler logs. Mudança de roles de usuários feita com processo protegido/manual, não via client comum.
- NÃO expor `draft_content`/`draft_style` em uma tabela diretamente selecionável por anônimos: policies por linha NÃO protegem colunas. Implementar **view pública `security_invoker`** ou tabelas de publicação separadas com acesso SELECT concedido somente às colunas publicadas, conferindo grants. Demonstrar nos testes que cliente `anon` não consegue consultar colunas draft, inclusive diretamente pela API.
- Resolver com cuidado conflitos entre policies e funções de verificação de admin; sem recursão nem escalonamento de privilégio.

Supabase Storage:
- Bucket privado `xukuru-drafts` para imagens ainda não aprovadas (visualização por usuário autorizado via acesso autenticado/URL temporária), e bucket público `xukuru-public` SOMENTE para imagens liberadas/publicadas. Se optar por outra estratégia equivalente, justificar como impede vazamento de fotos não autorizadas.
- Políticas específicas em `storage.objects` de leitura/escrita, upload somente por operador autorizado, exclusão restrita, não permitir upload de anônimos e não permitir alteração em buckets alheios.
- Upload com preview local, progress/feedback, MIME restrito a JPEG/PNG/WebP, tamanho máximo configurável (ex.: 5 MB), nome único seguro/UUID e `alt_text`; bloquear SVG ou outros arquivos executáveis. Incluir substituição/remoção com confirmação e prevenção de imagens órfãs; verificar referência antes de apagar.
- Ao publicar, somente tornar mídia aprovada acessível no bucket público; URLs de imagens antigas locais podem continuar como fallback durante migração. Evitar sobrescrever arquivos com mesmo nome e problemas de cache usando paths versionados.

Escrever testes automatizados para autorização: visitante, autenticado sem papel, editor e admin; ler rascunho, cadastrar, editar, excluir, publicar, alterar role, manipular Storage, acessar URLs privadas. Testar explicitamente o acesso REST sem usar o painel. Incluir scripts SQL de verificação ou pgTAP (`supabase/tests`) quando viável.

## 7. MÓDULOS DO PAINEL ADMINISTRATIVO

Crie interface profissional, responsiva, com sidebar/drawer mobile e cabeçalho com usuário e logout, mantendo verde/terracota/ocre/bege. Módulos:

**A. Visão geral / dashboard**
- Cards: total de produtos, publicados, em rascunho, pendentes de validação cultural, estoque baixo, categorias e seções editadas aguardando publicação.
- Lista de alterações recentes e atalhos 'Novo produto', 'Editar página inicial', 'Ver site'. Nenhuma métrica de pedidos ou faturamento inventada.
- Estados de carregamento, vazio e erro com botão Tentar novamente.

**B. Produtos — CRUD completo**
- Tabela com miniatura, nome, categoria, preço, estoque, destaque, status, atualização; busca, filtros, ordenação e paginação.
- Formulário criar/editar com título, descrição curta e longa, categoria, preço BRL, estoque, materiais, artesão, aldeia, medidas, peso, ALT, destaque, ordem, status e controle de aprovação. Preview do card e modal como vistos pelo visitante.
- Upload/substituição/galeria de fotos; seleção de capa, texto alternativo, ordenação, remoção segura.
- Salvar rascunho, solicitar revisão, publicar (quando autorizado), despublicar/arquivar, excluir com confirmação e proteção de relacionamentos/carrinhos. Preferir arquivar a excluir definitivamente.
- Atualização na página pública após publicação sem alterar manualmente `data.js`.

**C. Categorias**
- Criar, editar, reordenar, ativar/desativar categorias. Impedir remoção se ainda existem produtos relacionados ou oferecer remapeamento explícito.
- Filtro do catálogo deve refletir automaticamente categorias ativas.

**D. Editor de páginas (CMS) — ponto CENTRAL deste pedido**
- Listar páginas `Início`, `Catálogo`, `Sacola`, `Sobre`, `História` e seções de header/footer.
- Ao selecionar uma página, mostrar seções existentes em ordem, um painel de edição com campos rotulados (texto, título, subtítulo, CTA, links, ALT, imagens e cards) e preview visual responsivo (desktop/mobile).
- Permitir editar os textos de cada aba: título, parágrafos, bullets, legendas, botões, rótulos e avisos; páginas Sobre e História com blocos longos, sem remover/mesclar o sentido cultural.
- Permitir reordenar seções (botões subir/descer acessíveis; drag-and-drop opcional), exibir/ocultar seções, escolher entre layouts de seção pré-aprovados (ex.: texto à esquerda/direita, duas colunas, cards 2/3/4, imagem com texto), trocar imagens, mudar estilo de seção entre presets. Restringir à estrutura do CMS, SEM editor CSS arbitrário e SEM quebrar navegação/semântica.
- Campos de texto devem ter contagem/validação, opção desfazer/restaurar versão anterior e aviso ao sair sem salvar.
- Botões explícitos: `Salvar rascunho`, `Pré-visualizar`, `Publicar alterações`, `Restaurar versão`, com sucesso/erro.
- Mudanças de layout/texto só entram no site público após publicar. Preview dos rascunhos deve estar protegido por login; visitante nunca vê rascunho.
- Crie mapeamento/seed real de cada seção relevante do `index.html`, não apenas demo com 2 componentes.

**E. Aparência e identidade visual**
- Editor com color pickers restritos, preview de paleta, upload de logo, favicon, banner/fundo, tipografia entre presets, espaçamento, largura, estilos de botões/cards e reset para padrão.
- Usar tokens CSS existentes; manter responsividade e contraste WCAG adequado; quando possível impedir paletas com contraste de texto inadequado.
- Salvar como rascunho e publicar; nunca expor CSS arbitrário ou edição livre de HTML/JS.

**F. Biblioteca de mídia**
- Grid de uploads e ativos, metadados, seleção, preview, ALT, status de autorização/uso, vínculo com produto/seção; excluir somente quando não utilizado, com confirmação.

**G. Configurações e histórico**
- Editar nome, contatos, redes, links, metadados SEO básicos, avisos de plataforma demonstrativa, forma de contato, e ícones seguros.
- Ver histórico/auditoria e versões publicadas, visualizar o site, fazer logout.
- Opcional: gestão de operadores apenas se implementada de maneira realmente segura. Não criar funcionalidades que prometam convite/remoção sem backend protegido.

## 8. INTEGRAÇÃO COM O SITE PÚBLICO SEM REGRESSÕES

Refatorar o consumo de produtos para buscar dados no Supabase na inicialização e usá-los em `Catalog.getFiltered()`, `UI.renderCatalog()`, `UI.renderCatalogCard()`, `UI.openProductModal()`, `UI.navigateTo('home')` e `Cart`. Não manter `XUKURU_PRODUCTS` fixo como fonte de verdade em produção; `data.js` pode continuar como fixture/seed separado e documentado, jamais como segunda base concorrente.

Migração detalhada:
- Preservar os oito itens reais, seus títulos/descrições/fotos/preços de **referência**, estoque, origem informada/pendente, categorias e destaque; não inventar outros produtos, medidas, autorizações ou composição.
- Usar `legacy_id` para mapear produto antigo ao novo UUID; atualizar eventos `data-open-product` sem `parseInt()` e resolver carrinho antigo em `localStorage` na primeira carga. Para registros inválidos/arquivados, descartar com aviso não bloqueante.
- No carrinho, guardar apenas `{productId, qty}` no `localStorage`, não snapshots de `price`, `title` e `stock`; ao carregar, reconstruir a partir da lista publicada atual, recalcular preço, limitar quantidade ao estoque e informar ajustes. Remover o preenchimento automático com produto id 1.
- Exibir apenas produtos publicados/autorizados, com estoque configurado, e categoria visível; considerar produtos sem estoque como indisponíveis e impedir adição.
- Na página inicial, mostrar destaques ativos; no catálogo, filtro/categorias/contador corretos; modal e sacola sempre sincronizados.
- Hidratar conteúdos/tema publicados do banco no carregamento, com loading e erro apropriados. Em falha de rede, não trocar automaticamente para dados de teste que possam confundir visitante sobre preços/estoques; manter uma tela informativa e retry. Configuração inicial ausente deve mostrar erro claro.
- Garantir `textContent` para texto comum ou escape rigoroso contra XSS; sanitizar qualquer HTML rico com allowlist confiável e URLs protocoladas; evitar interpolação insegura de dados do banco em `innerHTML`.
- Corrigir links/URLs placeholders e rótulos de segurança/comercialização: destacar itens que precisam confirmação; NÃO transformar checkout demonstrativo em checkout real, nem afirmar que a loja recebe pagamentos.
- Garantir SEO/meta, ALT, foco de modal, Escape, teclado, navegação, mobile, responsividade e semântica.

## 9. GOVERNANÇA CULTURAL, LGPD E VERACIDADE

O projeto envolve patrimônio e conhecimento cultural do povo Xukuru. Criar interface para registrar **autorização prévia, livre e informada** pelo representante legitimamente autorizado para uso de imagem, nome do artesão, história, símbolos e outros materiais. Guardar só evidências necessárias e com acesso restrito; registrar status/data/referência de autorização, sem publicar documentos confidenciais. Rascunho não é autorização. Assegurar que uma foto ou narrativa pendente não saia publicamente só porque um editor fez upload.

Expor no CMS revisão explícita de alegações do site original: '80% do valor ao artesão', 'Loja Verificada FUNAI', 'certificado de origem', 'SSL 256-bit', meios de pagamento, frete grátis, números de aldeias (24 vs. 27 em páginas distintas), fotos ilustrativas, composição e supostos efeitos médicos dos produtos. Não afirmar essas informações como verificadas sem confirmação. Sinalizar itens pendentes para revisão antes de publicação; privilegiar redação neutra quando necessário. Respeitar LGPD, minimizar dados pessoais e não guardar senhas no banco de perfis.

## 10. TESTES E CRITÉRIOS DE ACEITE

Crie testes coerentes com a stack (ex.: Vitest para funções de transformação/validação e testes SQL/RLS). Realize as verificações que forem possíveis no ambiente e relate as que dependem de credenciais Supabase. Critérios observáveis:

1. `npm install`, `npm run dev`, `npm run build` e testes passam sem erros; site público e `/admin.html` abrem.
2. Visitante não autenticado não abre painel, não lê rascunho e não altera banco/Storage mesmo por chamadas diretas.
3. Login de admin ativo abre painel; conta autenticada comum sem role recebe acesso negado; logout encerra sessão.
4. Admin cria produto com foto, preço/estoque/categoria, salva rascunho, revisa e publica. O item aparece no catálogo e na busca com informações corretas, após publicação.
5. Admin edita preço/foto/texto e o site público reflete a mudança; produto arquivado desaparece do catálogo.
6. Admin edita um título da Home, um parágrafo de Sobre, um conteúdo de História, um texto de rodapé e uma imagem; salva rascunho e pré-visualiza sem afetar o público; depois publica e vê a alteração.
7. Admin altera cores/layout/reordena seção; preview responsivo e publicar funcionam sem editar HTML/CSS manualmente.
8. Carregar os 8 produtos existentes sem perda de dados, evitando duplicidade ao reaplicar seed; carrinho, modal, busca, filtros e destaques continuam operando.
9. O checkout continua claramente demonstrativo e não gera cobrança nem pedido falso.
10. Segurança RLS, XSS, validação de arquivos, acesso negado e controle de publicação foram testados; relatar limitações se algum teste não puder rodar.

## 11. OBRIGAÇÃO DE ENTREGAR OS ARQUIVOS, NÃO APENAS EXPLICAÇÕES

Implemente diretamente no workspace, seguindo etapas:
1. Inspecione o repositório e resuma o que está sendo alterado.
2. Crie configuração mínima Vite + Supabase e migrações SQL com RLS/policies e seeds.
3. Implemente serviços de dados e migre o site público, preservando layout e funcionalidades.
4. Construa login, guarda, dashboard e CRUD de produtos/categorias + imagens.
5. Construa editor de páginas, layout/tema, preview, publicação, biblioteca de mídia, revisões e logs.
6. Execute build/testes, corrija falhas e atualize documentação.

Não interrompa no primeiro mockup. Se houver restrição técnica real, entregue o máximo funcional e liste objetivamente o restante, sem apresentar protótipos como concluídos. Evite dependências excessivas. Antes de refatoração arriscada, preserve a versão anterior/commit e faça pequenas alterações verificáveis.

## 12. GUIA OBRIGATÓRIO PARA EU VINCULAR O SUPABASE (SOU INICIANTE NO PAINEL ATUAL)

Ao final, escreva `docs/SUPABASE_SETUP.md` em português do Brasil, extremamente didático e com caminhos de menu atuais, incluindo:
1. Onde encontrar **Project URL** e **publishable key** no Dashboard do Supabase (Connect ou Settings > API Keys), distinguindo da **secret key** que NUNCA entra no frontend.
2. Como preencher `.env.local` a partir de `.env.example`; explicar por que `.env.local` não deve ser commitado.
3. Comandos exatos no terminal VS Code para instalar dependências, iniciar o site e buildar; informar a porta exibida pelo Vite em vez de presumir endereço fixo.
4. Como executar a migração pelo **SQL Editor** e, alternativamente, pelo **Supabase CLI** (`supabase login`, `supabase link`, `supabase db push`), sem reexecutar indevidamente comandos destrutivos.
5. Como conferir tabelas em **Table Editor**, policies em RLS, buckets em **Storage** e permissões reais.
6. Como criar o primeiro usuário administrador em **Authentication > Users**, obter o UUID e executar o SQL de bootstrap para dar permissão em `admin_users` — nunca elevar papel pelo navegador.
7. Como revisar configurações de e-mail/login e bloquear cadastros públicos, se apropriado.
8. Como definir **Authentication > URL Configuration** (Site URL e Redirect URLs) para localhost e domínio de produção, especialmente recuperação de senha.
9. Como fazer upload de imagens, publicar uma alteração e testar com uma janela anônima.
10. Como identificar/corrigir erros comuns: URL/chave incorretas, `Invalid API key`, `permission denied`, `42501`, policies faltantes, `401/403`, `relation does not exist`, `storage bucket not found`, redirect URL não permitida, CORS/configuração, importação de dados, módulo não carregado, cadastro não autorizado.
11. Como fazer deploy do Vite estático sem revelar segredos e manter as rotas pública/admin; explicar requisitos de URLs autorizadas e que segurança real reside no Supabase RLS.
12. Checklist de validação de conteúdo cultural e legal/comercial antes de colocar o site online.

ALÉM dos documentos, responda ao final da tarefa no chat com:
- `Arquivos alterados/criados` (com caminhos reais).
- `Funcionalidades implementadas` vs. `Pendente`.
- `Comandos executados + resultados`.
- `SQL exato a executar no Supabase`, ou o caminho dos arquivos SQL com ordem de execução.
- `Configurações manuais que eu preciso fazer`, em passos numerados simples.
- `Como testar login, cadastrar produto, trocar imagem, editar uma página e publicar`.
- Avisos sobre preço indicativo, checkout simulado, direitos culturais e informações não verificadas.

**Importante:** Eu já criei meu projeto Supabase, mas ainda NÃO forneci nenhuma chave. Não invente URL, chave, UUID, e-mail ou senha. Crie código pronto para configuração, peça apenas os valores públicos locais necessários, e deixe todos os passos manuais explícitos. Não faça deploy nem alterações no meu projeto remoto sem acesso autorizado. Comece lendo os arquivos atuais e depois IMPLEMENTE, não apenas planeje.
