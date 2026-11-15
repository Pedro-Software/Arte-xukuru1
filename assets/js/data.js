// Produtos identificados nas fotografias fornecidas para o catálogo.
const XUKURU_PRODUCTS = [
  {
    id: 1,
    title: "Cerâmicas utilitárias em barro",
    category: "ceramica",
    categoryName: "Cerâmica",
    price: 165.00,
    featured: true,
    artisan: "Artesanato Xukuru",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.42.18 (4).jpeg",
    imageAlt: "Peças de cerâmica de barro: bilhas, jarras, canecas, xícaras com pires, potes e vasos",
    materials: "Cerâmica de barro, conforme visível na foto. Tipo e origem da argila não informados.",
    description: "A foto reúne peças de cerâmica em diferentes formatos, incluindo bilhas, jarras, canecas, xícaras com pires, potes e vasos. Cada peça tem forma e acabamento próprios.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 7
  },
  {
    id: 2,
    title: "Colar com peças geométricas em tons de madeira",
    category: "colares",
    categoryName: "Colares",
    price: 120.00,
    featured: true,
    artisan: "Artesanato Xukuru",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.43.00 (1) (4).jpeg",
    imageAlt: "Colar artesanal com peças geométricas em tons de madeira, contas escuras e contas arredondadas claras",
    materials: "Peças e contas em tons de madeira e contas escuras, conforme a aparência na foto. Os materiais específicos não estão identificados.",
    description: "Colar de destaque com peças geométricas alongadas e contas arredondadas em tons naturais, combinado a pequenas contas escuras. O desenho forma uma composição em camadas na parte frontal.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 12
  },
  {
    id: 3,
    title: "Sabonete de aroeira",
    category: "cuidados-pessoais",
    categoryName: "Cuidados pessoais",
    price: 75.00,
    featured: true,
    artisan: "Sala de Medicinas Sagradas do Xukuru do Ororubá (conforme o rótulo)",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.42.54 (4).jpeg",
    imageAlt: "Barra embalada de sabonete de aroeira com rótulo da Sala de Medicinas Sagradas do Xukuru do Ororubá",
    materials: "O rótulo informa o uso de plantas cultivadas no território, mas não detalha a composição completa.",
    description: "Barra de sabonete com rótulo que identifica aroeira e informa produção na Sala de Medicinas Sagradas do Xukuru do Ororubá. A embalagem também descreve o produto como anti-inflamatório e cicatrizante; a foto não informa composição completa ou modo de uso.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 25
  },
  {
    id: 4,
    title: "Colar de contas escuras",
    category: "colares",
    categoryName: "Colares",
    price: 145.00,
    featured: false,
    artisan: "Artesanato Xukuru",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.42.59 (4).jpeg",
    imageAlt: "Colar composto por várias voltas de contas ovais escuras",
    materials: "Contas ovais escuras e pequenos separadores claros, conforme visíveis na foto. O material específico não está identificado.",
    description: "Colar comprido composto por várias voltas de contas ovais em tons escuros, intercaladas por pequenos separadores claros. A foto mostra o colar disposto sobre uma superfície de madeira.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 9
  },
  {
    id: 5,
    title: "Pomada anti-inflamatória e analgésica",
    category: "fitoterapicos",
    categoryName: "Produtos de cuidado",
    price: 95.00,
    featured: false,
    artisan: "Jeti Radya (conforme o rótulo)",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.43.05 (4).jpeg",
    imageAlt: "Potes de pomada Jeti Radya; o rótulo indica produto anti-inflamatório e analgésico",
    materials: "Ingredientes não informados na parte visível do rótulo.",
    description: "A foto mostra potes da marca Jeti Radya. O rótulo identifica o produto como pomada anti-inflamatória e analgésica, sem detalhar nesta imagem os ingredientes ou o modo de uso.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 14
  },
  {
    id: 6,
    title: "Clareador de axila e rosto",
    category: "cuidados-pessoais",
    categoryName: "Cuidados pessoais",
    price: 110.00,
    featured: false,
    artisan: "Bela Xukuru (conforme o rótulo)",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.43.04 (5).jpeg",
    imageAlt: "Pote de clareador de axila e rosto da marca Bela Xukuru",
    materials: "O rótulo informa óleos vegetais e essência floral, sem identificar os ingredientes individualmente.",
    description: "Pote identificado no rótulo como clareador de axila e rosto, da marca Bela Xukuru. A embalagem descreve o produto como natural, à base de óleos vegetais e essência floral, e voltado ao cuidado da pele.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 8
  },
  {
    id: 7,
    title: "Tintura de mulungu",
    category: "fitoterapicos",
    categoryName: "Produtos de cuidado",
    price: 230.00,
    featured: false,
    artisan: "Jeti Radya (conforme o rótulo)",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.43.04 (1) (4).jpeg",
    imageAlt: "Frasco com conta-gotas identificado como Tintura de Mulungu, da marca Jeti Radya",
    materials: "O rótulo identifica a tintura de mulungu; a composição completa não está visível na foto.",
    description: "Frasco com conta-gotas identificado no rótulo como tintura de mulungu, da marca Jeti Radya. A foto não informa concentração, composição completa ou instruções de uso.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 4
  },
  {
    id: 8,
    title: "Loção cicatrizante",
    category: "cuidados-pessoais",
    categoryName: "Cuidados pessoais",
    price: 45.00,
    featured: false,
    artisan: "Jeti Radya (conforme o rótulo)",
    village: "Local de produção não indicado na foto",
    image: "imgs/WhatsApp Image 2026-09-02 at 08.43.03 (4).jpeg",
    imageAlt: "Frasco escuro com válvula spray identificado como Loção Cicatrizante Jeti Radya",
    materials: "Composição não informada na parte visível do rótulo.",
    description: "Frasco com válvula spray identificado no rótulo como loção cicatrizante da marca Jeti Radya. A imagem não detalha ingredientes ou modo de uso.",
    dimensions: "Não informadas",
    weight: "Não informado",
    stock: 30
  }
];

// Dados dos Correios para Simulação de CEP
const FRETE_CONFIG = {
  origem: "55200-000", // Pesqueira - PE
  cidadeOrigem: "Pesqueira - PE (Serra do Ororubá)",
  opcoes: [
    {
      id: "pac",
      nome: "Correios PAC (Econômico)",
      prazoBase: 6, // dias úteis
      precoBase: 24.90
    },
    {
      id: "sedex",
      nome: "Correios SEDEX (Expresso)",
      prazoBase: 2, // dias úteis
      precoBase: 42.50
    }
  ]
};
