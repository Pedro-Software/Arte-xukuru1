export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SAFE_LAYOUTS = ['standard', 'text-left', 'text-right', 'two-columns', 'cards-2', 'cards-3', 'cards-4', 'image-text'];
export const SAFE_FONTS = ['Outfit', 'Cinzel'];

export function slugify(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function validateProduct(input) {
  const errors = {};
  if (!String(input.title || '').trim()) errors.title = 'Informe o nome do produto.';
  if (!String(input.category_slug || '').trim()) errors.category_slug = 'Escolha uma categoria.';
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 9999999999.99) errors.price = 'Informe um preço de referência válido em reais.';
  const stock = Number(input.stock);
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'O estoque deve ser um número inteiro igual ou maior que zero.';
  if (String(input.title || '').length > 180) errors.title = 'Use até 180 caracteres.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateImage(file) {
  if (!file) return { valid: false, error: 'Selecione uma imagem.' };
  if (!IMAGE_MIME_TYPES.includes(file.type)) return { valid: false, error: 'Use somente JPEG, PNG ou WebP.' };
  if (file.size > IMAGE_MAX_BYTES) return { valid: false, error: 'A imagem deve ter no máximo 5 MB.' };
  return { valid: true };
}

export function validateTheme(theme) {
  const hex = /^#[0-9a-f]{6}$/i;
  return ['primary', 'secondary', 'accent', 'background'].every(key => !theme[key] || hex.test(theme[key])) &&
    (!theme.font || SAFE_FONTS.includes(theme.font)) &&
    (!theme.layout || SAFE_LAYOUTS.includes(theme.layout)) &&
    contrastRatio(theme.primary || '#1F3E2B',theme.background || '#F9F6F0')>=4.5;
}

export function contrastRatio(foreground,background) {
  const luminance = color => {
    const channels=color.replace('#','').match(/.{2}/g)?.map(value=>parseInt(value,16)/255)||[];
    if(channels.length!==3)return 0;
    const [r,g,b]=channels.map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
    return 0.2126*r+0.7152*g+0.0722*b;
  };
  const a=luminance(foreground),b=luminance(background);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}

export function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.origin);
    return ['https:', 'http:'].includes(url.protocol) ? raw : '';
  } catch { return ''; }
}
