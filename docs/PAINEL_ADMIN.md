# Guia do painel administrativo

Abra `/admin.html` no mesmo host em que está publicado o site. Antes, configure `.env.local` e aplique migração/seed conforme [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Não existe cadastro público pelo painel.

## Perfis e publicação

- **Editor:** pode acessar produtos, categorias, seções, aparência, biblioteca e configurações para revisar e editar rascunhos, conforme as policies. Não aprova cultura, não promove conteúdo e não publica.
- **Admin:** também pode registrar a aprovação cultural, publicar/despublicar/arquivar produto, publicar texto/tema/configuração, aprovar mídia e consultar auditoria.
- **Administrador não promove a própria conta pela API:** papéis ficam em `admin_users` e são mantidos por SQL manual protegido.
- Toda publicação de produto exige estoque positivo e registro administrativo de aprovação. Toda seção exige referência interna e confirmação humana ao publicar. O texto de confirmação não substitui autorização real.

## Visão geral

Mostra total/status dos produtos, categorias ativas, estoque baixo, validação cultural pendente, seções alteradas e atividade recente. O quadro “Revisões obrigatórias” destaca alegações comerciais, culturais, fotográficas e médicas que precisam de confirmação. Não há métricas de vendas ou receita.

## Produtos e categorias

Na tela **Produtos**, o botão **Selecionar fotos em lote** abre o seletor de arquivos. Navegue até `imgs`, selecione as fotos (por exemplo, `Ctrl+A`) e confirme. O importador associa arquivos pelos nomes registrados em `legacy_image_url`, envia correspondências de produtos em rascunho ao bucket privado e ignora arquivos não mapeados ou produtos que já têm imagens. Depois, a aprovação e publicação continuam sendo feitas no fluxo do produto.

Em **Produtos**, use busca, filtro de status, ordenação e paginação. O formulário permite criar/editar dados do catálogo, preço indicativo, estoque, categoria, textos, destaque e autorização. A prévia do cartão é local ao painel. Salve primeiro um novo registro para liberar upload de fotos; imagens aceitas são JPEG, PNG e WebP, até 5 MB.

Uploads de produto começam no bucket privado. Na galeria do produto, marque a capa ou remova uma imagem; o arquivo só é apagado sem vínculos. Publicar um produto aprovado transfere suas imagens do bucket privado ao público, registra o estado aprovado e retira arquivos privados. O catálogo público consulta os UUIDs do Supabase, não usa o `data.js` como fonte em produção.

Em **Categorias**, admins podem criar/editar/ativar/desativar. A remoção é recusada quando existe produto relacionado.

## Editor de páginas

As páginas disponíveis são Início, Catálogo, Sacola, Sobre e História. As seções têm chaves estáveis `data-section-key`; textos editáveis usam `data-cms-key`. Campos simples são texto, nunca HTML. É possível salvar rascunho, ocultar, reordenar, escolher um preset e abrir prévia isolada com largura Desktop/Celular.

Para trocar uma imagem de uma seção, selecione a página e a seção no Editor de páginas, preencha o texto alternativo e escolha o arquivo no controle “Trocar foto pelo computador”. Informe a referência de autorização e confirme a publicação do arquivo; então a URL aprovada é preenchida no rascunho. O arquivo passa a estar acessível publicamente após essa confirmação, mas a seção só mostra a foto no site depois de “Publicar alterações”. Também é possível usar a Biblioteca de mídia e colar uma URL pública aprovada no campo de imagem. Fotos antigas em `imgs/` não são promovidas automaticamente.

Ao publicar seção, o admin informa uma referência interna, confirma a revisão e publica a versão atual do rascunho. Alterar o rascunho depois exige nova confirmação. “Restaurar versão” copia um snapshot anterior para o rascunho; não apaga histórico nem publica por conta própria. Se houver alteração não salva, sair/trocar seção pede confirmação.

## Aparência, configurações e mídia

- **Aparência:** edita cores por hex seguro, fonte entre Outfit/Cinzel e presets de layout. A prévia mostra a identidade atual antes de salvar. Não aceita CSS livre.
- **Configurações:** edita nome, descrição, logo, favicon PNG, e-mail, WhatsApp, metadados SEO e avisos públicos. Logo e favicon precisam ser primeiro enviados à Biblioteca, aprovados/publicados e então informados por URL pública. Os dados passam por validação no navegador e no trigger SQL; há ações separadas de rascunho e publicação.
- **Biblioteca de mídia:** aceita JPEG/PNG/WebP até 5 MB, ALT, nota interna de origem/autorização e preview. O bucket privado não é servido publicamente. Aprovar um arquivo requer confirmação e referência interna; excluir exige remover vínculos primeiro. Arquivos publicados têm URL pública por desenho do bucket.
- **Histórico:** admins podem consultar audit logs e snapshots de produtos e seções. A restauração coloca conteúdo em rascunho.

## Limites da interface atual

O editor não aceita HTML/CSS livre, nem oferece controles separados de largura, espaçamento e estilo de borda. Use a Biblioteca para logo, favicon e imagens de seção. O preview CMS apresenta uma representação isolada dos campos e preset, não uma cópia interativa integral da página publicada.

## Regras de conteúdo

Os oito produtos iniciais são rascunhos e as imagens locais não são expostas pelas views públicas. Confirme preço e disponibilidade com quem produz. O carrinho persiste apenas `{productId, qty}` e reconstrói os dados atuais do produto publicado. O checkout segue demonstrativo e não gera pedido nem cobrança.
