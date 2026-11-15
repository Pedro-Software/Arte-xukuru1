-- Seeds aditivos. Os 8 itens entram como rascunho, com imagens locais como fallback,
-- preço de referência e aprovação cultural pendente. Reexecutar não sobrescreve edição.
insert into public.categories(slug,name,description,sort_order,is_active) values
 ('ceramica','Cerâmica','Peças de cerâmica; descrição e origem sujeitas a validação.',1,true),
 ('colares','Colares','Colares e adornos; materiais sujeitos a validação.',2,true),
 ('cuidados-pessoais','Cuidados pessoais','Produtos identificados nas embalagens; composição e regularização a confirmar.',3,true),
 ('fitoterapicos','Produtos de cuidado','Produtos identificados nas embalagens; alegações e composição a confirmar.',4,true)
on conflict(slug) do nothing;

insert into public.products(legacy_id,slug,title,description,short_description,category_slug,price,stock,featured,artisan,village,materials,dimensions,weight,image_alt,legacy_image_url,sort_order,status,cultural_approval_status)
values
(1,'ceramicas-utilitarias-em-barro','Cerâmicas utilitárias em barro','A foto reúne peças de cerâmica em diferentes formatos, incluindo bilhas, jarras, canecas, xícaras com pires, potes e vasos. Cada peça tem forma e acabamento próprios.','Peças de cerâmica em diferentes formatos, conforme a foto.','ceramica',165.00,7,true,'Artesanato Xukuru','Local de produção não indicado na foto','Cerâmica de barro, conforme visível na foto. Tipo e origem da argila não informados.','Não informadas','Não informado','Peças de cerâmica de barro: bilhas, jarras, canecas, xícaras com pires, potes e vasos','imgs/WhatsApp Image 2026-09-02 at 08.42.18 (4).jpeg',1,'draft','pending'),
(2,'colar-pecas-geometricas-tons-madeira','Colar com peças geométricas em tons de madeira','Colar de destaque com peças geométricas alongadas e contas arredondadas em tons naturais, combinado a pequenas contas escuras. O desenho forma uma composição em camadas na parte frontal.','Colar de destaque com peças geométricas e contas em tons naturais.','colares',120.00,12,true,'Artesanato Xukuru','Local de produção não indicado na foto','Peças e contas em tons de madeira e contas escuras, conforme a aparência na foto. Os materiais específicos não estão identificados.','Não informadas','Não informado','Colar artesanal com peças geométricas em tons de madeira, contas escuras e contas arredondadas claras','imgs/WhatsApp Image 2026-09-02 at 08.43.00 (1) (4).jpeg',2,'draft','pending'),
(3,'sabonete-de-aroeira','Sabonete de aroeira','Barra de sabonete com rótulo que identifica aroeira e informa produção na Sala de Medicinas Sagradas do Xukuru do Ororubá. A embalagem também descreve o produto como anti-inflamatório e cicatrizante; a foto não informa composição completa ou modo de uso.','Barra identificada como sabonete de aroeira.','cuidados-pessoais',75.00,25,true,'Sala de Medicinas Sagradas do Xukuru do Ororubá (conforme o rótulo)','Local de produção não indicado na foto','O rótulo informa o uso de plantas cultivadas no território, mas não detalha a composição completa.','Não informadas','Não informado','Barra embalada de sabonete de aroeira com rótulo da Sala de Medicinas Sagradas do Xukuru do Ororubá','imgs/WhatsApp Image 2026-09-02 at 08.42.54 (4).jpeg',3,'draft','pending'),
(4,'colar-de-contas-escuras','Colar de contas escuras','Colar comprido composto por várias voltas de contas ovais em tons escuros, intercaladas por pequenos separadores claros. A foto mostra o colar disposto sobre uma superfície de madeira.','Colar comprido com contas ovais em tons escuros.','colares',145.00,9,false,'Artesanato Xukuru','Local de produção não indicado na foto','Contas ovais escuras e pequenos separadores claros, conforme visíveis na foto. O material específico não está identificado.','Não informadas','Não informado','Colar composto por várias voltas de contas ovais escuras','imgs/WhatsApp Image 2026-09-02 at 08.42.59 (4).jpeg',4,'draft','pending'),
(5,'pomada-jeti-radya','Pomada anti-inflamatória e analgésica','A foto mostra potes da marca Jeti Radya. O rótulo identifica o produto como pomada anti-inflamatória e analgésica, sem detalhar nesta imagem os ingredientes ou o modo de uso.','Pote identificado no rótulo como pomada Jeti Radya.','fitoterapicos',95.00,14,false,'Jeti Radya (conforme o rótulo)','Local de produção não indicado na foto','Ingredientes não informados na parte visível do rótulo.','Não informadas','Não informado','Potes de pomada Jeti Radya; o rótulo indica produto anti-inflamatório e analgésico','imgs/WhatsApp Image 2026-09-02 at 08.43.05 (4).jpeg',5,'draft','pending'),
(6,'clareador-bela-xukuru','Clareador de axila e rosto','Pote identificado no rótulo como clareador de axila e rosto, da marca Bela Xukuru. A embalagem descreve o produto como natural, à base de óleos vegetais e essência floral, e voltado ao cuidado da pele.','Pote identificado como clareador da marca Bela Xukuru.','cuidados-pessoais',110.00,8,false,'Bela Xukuru (conforme o rótulo)','Local de produção não indicado na foto','O rótulo informa óleos vegetais e essência floral, sem identificar os ingredientes individualmente.','Não informadas','Não informado','Pote de clareador de axila e rosto da marca Bela Xukuru','imgs/WhatsApp Image 2026-09-02 at 08.43.04 (5).jpeg',6,'draft','pending'),
(7,'tintura-de-mulungu','Tintura de mulungu','Frasco com conta-gotas identificado no rótulo como tintura de mulungu, da marca Jeti Radya. A foto não informa concentração, composição completa ou instruções de uso.','Frasco identificado no rótulo como tintura de mulungu.','fitoterapicos',230.00,4,false,'Jeti Radya (conforme o rótulo)','Local de produção não indicado na foto','O rótulo identifica a tintura de mulungu; a composição completa não está visível na foto.','Não informadas','Não informado','Frasco com conta-gotas identificado como Tintura de Mulungu, da marca Jeti Radya','imgs/WhatsApp Image 2026-09-02 at 08.43.04 (1) (4).jpeg',7,'draft','pending'),
(8,'locao-cicatrizante-jeti-radya','Loção cicatrizante','Frasco com válvula spray identificado no rótulo como loção cicatrizante da marca Jeti Radya. A imagem não detalha ingredientes ou modo de uso.','Frasco identificado como loção cicatrizante Jeti Radya.','cuidados-pessoais',45.00,30,false,'Jeti Radya (conforme o rótulo)','Local de produção não indicado na foto','Composição não informada na parte visível do rótulo.','Não informadas','Não informado','Frasco escuro com válvula spray identificado como Loção Cicatrizante Jeti Radya','imgs/WhatsApp Image 2026-09-02 at 08.43.03 (4).jpeg',8,'draft','pending')
on conflict(legacy_id) do nothing;

insert into public.site_pages(slug,title,seo_title,seo_description) values
 ('home','Início','Arte Xukuru do Ororubá','Vitrine cultural em implantação.'),
 ('catalog','Catálogo','Catálogo | Arte Xukuru do Ororubá','Produtos com informações e autorização em validação.'),
 ('cart','Sacola','Sacola demonstrativa | Arte Xukuru do Ororubá','Esta sacola é demonstrativa e não realiza pagamentos.'),
 ('about','Sobre','Sobre | Arte Xukuru do Ororubá','Informações institucionais em revisão.'),
 ('history','História','História | Arte Xukuru do Ororubá','Conteúdo cultural sujeito a validação pelos representantes autorizados.')
on conflict(slug) do nothing;

-- Os textos atuais ficam disponíveis no draft para revisão. Nada é publicado automaticamente.
with section_seed(page_slug,section_key,section_type,sort_order,fields) as (values
 ('home','home.hero','hero',10,jsonb_build_object(
  'home.hero.tag','🌿 Serra do Ororubá · Pesqueira, PE',
  'home.hero.title.prefix','Arte Indígena Viva do','home.hero.title.name','Povo Xukuru',
  'home.hero.description','Peças únicas criadas nas aldeias da Serra do Ororubá — cerâmica, trançados, biojoias e muito mais. Cada compra fortalece diretamente as famílias artesãs e a soberania cultural do povo Xukuru do Nordeste brasileiro.',
  'home.hero.catalog_cta','🛒 Explorar Catálogo','home.hero.history_cta','📖 Nossa História')),
 ('home','home.trust','trust_bar',20,jsonb_build_object(
  'home.trust.title.1','100% Artesanato Genuíno','home.trust.text.1','Peças únicas das mãos dos artesãos Xukuru',
  'home.trust.title.2','Comércio Justo e Direto','home.trust.text.2','80% do valor vai direto ao artesão',
  'home.trust.title.3','Frete Grátis acima de R$ 350','home.trust.text.3','Embalagem ecológica com nota de origem',
  'home.trust.title.4','Compra 100% Segura','home.trust.text.4','PIX, Cartão e parcelamento sem juros')),
 ('home','home.featured','cards',30,jsonb_build_object(
  'home.featured.tag','Destaques da Aldeia','home.featured.title','Peças em Destaque',
  'home.featured.subtitle','Selecionadas com carinho pelos artesãos mestres das aldeias Xukuru do Ororubá.','home.featured.cta','Ver Todo o Catálogo →')),
 ('home','home.purpose','image_text',40,jsonb_build_object(
  'home.purpose.tag','🪶 Nossa Missão','home.purpose.title','Arte que Resiste, Memória que Persiste',
  'home.purpose.description','O povo Xukuru do Ororubá é o maior povo indígena de Pernambuco, com mais de 12.000 pessoas vivendo nas aldeias da Serra do Ororubá. Cada peça que adquirimos é um ato político de resistência e um investimento direto na vida e na dignidade dessas famílias.',
  'home.purpose.stat.1.value','12k+','home.purpose.stat.1.label','Pessoas Xukuru',
  'home.purpose.stat.2.value','27','home.purpose.stat.2.label','Aldeias Ativas',
  'home.purpose.stat.3.value','27k','home.purpose.stat.3.label','ha de Território',
  'home.purpose.image','')),
 ('home','home.values','cards',45,jsonb_build_object(
  'home.values.tag','🌱 Nossos Valores','home.values.heading','Por Que Comprar Arte Xukuru?',
  'home.values.1.title','Sustentabilidade Sagrada','home.values.1.text','Matérias-primas coletadas com critérios espirituais e ecológicos tradicionais, respeitando os ciclos da natureza e o território ancestral.',
  'home.values.2.title','Economia Solidária','home.values.2.text','Modelo de comércio justo: 80% do valor pago vai diretamente às mãos do artesão, financiando saúde, educação e cultura nas aldeias.',
  'home.values.3.title','Identidade Cultural Viva','home.values.3.text','Cada grafismo, entalhe e padrão carrega os ensinamentos dos mais velhos e fortalece a identidade das crianças e jovens Xukuru.')),
 ('catalog','catalog.intro','notice',10,jsonb_build_object(
  'catalog.title','Seleção de referências','catalog.disclaimer','As fotos mostram os produtos e as peças do catálogo. As descrições usam informações visíveis nas imagens e nos rótulos. Os valores exibidos são referências e precisam ser confirmados com quem produz; confirme também composição completa, medidas e disponibilidade.')),
 ('cart','cart.disclaimer','notice',10,jsonb_build_object(
  'cart.tag','SUA SELEÇÃO','cart.title','Sua sacola','cart.disclaimer','Esta sacola é uma demonstração. Os valores são indicativos; confirme preço, composição completa, medidas e disponibilidade com quem produz. Nenhuma cobrança ou pedido é gerado.','cart.payment_notice','Checkout demonstrativo: não há meios de pagamento ou cobranças disponíveis.')),
 ('history','history.intro','rich_text',10,jsonb_build_object(
  'history.tag','Identidade e memória','history.title','A História do Povo Xukuru do Ororubá',
  'history.subtitle','Conteúdo cultural em revisão. Os textos, dados históricos e imagens serão publicados após validação com representantes autorizados.',
  'history.wiki.title','Referência externa para pesquisa','history.wiki.description','O conteúdo desta página será revisado. Consulte fontes e representantes autorizados antes de reutilizar informações culturais.')),
 ('history','history.story.territory','image_text',20,jsonb_build_object(
  'history.story.territory.tag','Território','history.story.territory.image','',
  'history.story.territory.title','A Serra do Ororubá: Coração do Povo Xukuru',
  'history.story.territory.p1','A Serra do Ororubá, nos municípios de Pesqueira e Poção em Pernambuco, é muito mais do que uma formação geográfica para o povo Xukuru. É o território sagrado onde vivem os Encantados — espíritos protetores que habitam as florestas, riachos e grutas da serra.',
  'history.story.territory.p2','Com quase 27.555 hectares demarcados e homologados pelo governo federal em 2001, esse território abriga hoje mais de 12.000 indígenas distribuídos em 27 aldeias. A luta por esse reconhecimento custou sangue — mais notavelmente a vida do Cacique Chicão, assassinado em 1998.')),
 ('history','history.story.art','image_text',30,jsonb_build_object(
  'history.story.art.tag','Arte e memória','history.story.art.image','',
  'history.story.art.title','Grafismos, Argila e Sementes: A Linguagem Ancestral',
  'history.story.art.p1','O artesanato Xukuru não é decorativo — é uma forma de narrar, ensinar e resistir. Os grafismos geométricos gravados na cerâmica comunicam cosmologias inteiras: a serpente sagrada, o olho do gavião, as veredas d’água que unem aldeias.',
  'history.story.art.p2','As mulheres artesãs são as grandes guardiãs desse saber. Através da argila modelada à mão, das palhas trançadas em rituais noturnos e das sementes reunidas nos rituais do Toré, a cultura Xukuru se perpetua e se reinventa a cada geração.')),
 ('history','history.story.today','image_text',40,jsonb_build_object(
  'history.story.today.tag','Hoj e e amanhã','history.story.today.image','',
  'history.story.today.title','Autonomia Econômica e Cultural no Século XXI',
  'history.story.today.p1','A nova geração Xukuru une smartphones e trançados, captam projetos de lei de acesso a recursos genéticos enquanto aprendem com as avós nas aldeias.',
  'history.story.today.p2','Ao comprar nesta loja, você integra uma rede de apoio que conecta o território Xukuru ao Brasil e ao mundo, valorizando a produção indígena com preço justo e reconhecimento de autoria.')),
 ('about','about.intro','rich_text',10,jsonb_build_object(
  'about.tag','🏺 Sobre Nós','about.title','Quem Somos e Como Funciona','about.subtitle','Uma plataforma de comércio justo que conecta as aldeias Xukuru a todo o Brasil.')),
 ('about','about.proposal','image_text',15,jsonb_build_object(
  'about.proposal.tag','Nossa proposta','about.proposal.image','',
  'about.proposal.title','Loja Virtual com Propósito Indígena',
  'about.proposal.p1','A Arte Xukuru do Ororubá nasceu da parceria entre artesãos das aldeias e apoiadores da causa indígena para criar um canal de venda online com equidade e transparência.',
  'about.proposal.p2','A loja busca informar autoria, origem e contexto das peças. As informações serão confirmadas com as pessoas envolvidas antes da publicação.',
  'about.proposal.p3','80% do valor de cada produto vai diretamente à família artesã. Os 20% restantes financiam a operação logística, embalagens ecológicas e projetos culturais nas aldeias. Alegação pendente de validação.')),
 ('about','about.values','cards',20,jsonb_build_object(
  'about.values.tag','Princípios','about.values.heading','O que nos guia',
  'about.values.1.title','Soberania Indígena','about.values.1.text','Decisões de publicação respeitam a autorização e a vontade dos titulares das narrativas e imagens.',
  'about.values.2.title','Responsabilidade','about.values.2.text','Informações de materiais, origem, composição e benefícios são publicadas somente após validação.',
  'about.values.3.title','Transparência','about.values.3.text','Condições de preço, disponibilidade e comercialização devem ser confirmadas antes de qualquer oferta.')),
 ('about','about.contact','cta',30,jsonb_build_object(
  'about.contact.title','Quer conversar sobre o projeto?','about.contact.text','Os canais de contato serão publicados após confirmação.',
  'about.contact.button','Entre em contato')),
 ('home','shared.navigation','navigation',0,jsonb_build_object(
  'nav.home','Início','nav.catalog','Catálogo','nav.about','Sobre','nav.history','História',
  'nav.search.placeholder','Buscar produtos e categorias...')),
 ('home','shared.footer','footer',100,jsonb_build_object(
  'footer.brand','Arte Xukuru do Ororubá','footer.description','Vitrine demonstrativa. Informações culturais, comerciais e de contato estão em validação.',
  'footer.policy','Política de Privacidade','footer.terms','Termos de Uso','footer.contact.whatsapp','WhatsApp 5587999999999 (pendente de confirmação)','footer.contact.email','contato@artexukuru.org.br (pendente de confirmação)',
  'footer.payment.heading','Pagamentos','footer.payment.notice','PIX, cartões e boleto. Meios de pagamento pendentes de confirmação.',
  'footer.claims.notice','SSL 256-bit, Loja Verificada FUNAI e Certificado de Origem Indígena — alegações pendentes de comprovação.',
  'footer.copyright','© 2026 Arte Xukuru do Ororubá — informações e direitos sujeitos à validação apropriada.'))
)
insert into public.page_sections(page_id,section_key,section_type,draft_content,published_content,draft_style,published_style,draft_is_visible,published_is_visible,draft_sort_order,published_sort_order)
select p.id,s.section_key,s.section_type,jsonb_build_object('fields',s.fields),'{"fields":{}}'::jsonb,
 jsonb_build_object('layout','standard'),'{"layout":"standard"}'::jsonb,true,true,s.sort_order,s.sort_order
from section_seed s join public.site_pages p on p.slug=s.page_slug
on conflict(page_id,section_key) do nothing;

insert into public.site_settings(key,draft_value,published_value) values
 ('theme','{"primary":"#1F3E2B","secondary":"#C45A35","accent":"#D99B26","background":"#F9F6F0","font":"Outfit","layout":"standard"}'::jsonb,'{}'::jsonb),
 ('identity','{"name":"Arte Xukuru","description":"do Ororubá","logo_url":"","favicon_url":""}'::jsonb,'{}'::jsonb),
 ('seo','{"title":"Arte Xukuru do Ororubá","description":"Vitrine demonstrativa em implantação."}'::jsonb,'{}'::jsonb),
 ('contacts','{"email":"","whatsapp":""}'::jsonb,'{}'::jsonb),
 ('notices','{"checkout":"Demonstração: nenhum pagamento ou pedido é processado.","claims":"Alegações comerciais, culturais, médicas e de certificação pendentes de validação."}'::jsonb,'{}'::jsonb)
on conflict(key) do nothing;

