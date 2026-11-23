// Static local URLs work with both Vite and Live Server.
export const localProductImages = {
  1: { source: "imgs/WhatsApp Image 2026-09-02 at 08.42.18 (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.42.18 (4).jpeg", import.meta.url).href, alt: "Peças de cerâmica de barro: bilhas, jarras, canecas, xícaras com pires, potes e vasos" },
  2: { source: "imgs/WhatsApp Image 2026-09-02 at 08.43.00 (1) (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.43.00 (1) (4).jpeg", import.meta.url).href, alt: "Colar artesanal com peças geométricas em tons de madeira, contas escuras e contas arredondadas claras" },
  3: { source: "imgs/WhatsApp Image 2026-09-02 at 08.42.54 (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.42.54 (4).jpeg", import.meta.url).href, alt: "Barra embalada de sabonete de aroeira com rótulo da Sala de Medicinas Sagradas do Xukuru do Ororubá" },
  4: { source: "imgs/WhatsApp Image 2026-09-02 at 08.42.59 (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.42.59 (4).jpeg", import.meta.url).href, alt: "Colar composto por várias voltas de contas ovais escuras" },
  5: { source: "imgs/WhatsApp Image 2026-09-02 at 08.43.05 (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.43.05 (4).jpeg", import.meta.url).href, alt: "Potes de pomada Jeti Radya; o rótulo indica produto anti-inflamatório e analgésico" },
  6: { source: "imgs/WhatsApp Image 2026-09-02 at 08.43.04 (5).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.43.04 (5).jpeg", import.meta.url).href, alt: "Pote de clareador de axila e rosto da marca Bela Xukuru" },
  7: { source: "imgs/WhatsApp Image 2026-09-02 at 08.43.04 (1) (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.43.04 (1) (4).jpeg", import.meta.url).href, alt: "Frasco com conta-gotas identificado como Tintura de Mulungu, da marca Jeti Radya" },
  8: { source: "imgs/WhatsApp Image 2026-09-02 at 08.43.03 (4).jpeg", url: new URL("../../../imgs/WhatsApp Image 2026-09-02 at 08.43.03 (4).jpeg", import.meta.url).href, alt: "Frasco escuro com válvula spray identificado como Loção Cicatrizante Jeti Radya" },
};
const communityImage = new URL("../../../imgs/WhatsApp Image 2026-11-05 at 22.08.30.jpeg", import.meta.url).href;
const sourceImages = new Map(Object.values(localProductImages).map(image => [image.source, image.url]));
sourceImages.set("imgs/WhatsApp Image 2026-11-05 at 22.08.30.jpeg", communityImage);
const allowedImages = new Set([...Object.values(localProductImages).map(image => image.url), communityImage]);

// Published CMS content can select only the local images shipped with this version.
export function resolveLocalImage(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const source = decodeURIComponent(value.trim()).replace(/^\.?\//, '');
    if (sourceImages.has(source)) return sourceImages.get(source);
    const base = typeof document !== 'undefined' ? document.baseURI : import.meta.url;
    const url = new URL(value, base).href;
    return allowedImages.has(url) ? url : '';
  } catch { return ''; }
}
