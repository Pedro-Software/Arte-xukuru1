import { resolveLocalImage } from './localImages.js';
import { requireSupabase, supabaseConfig } from '../lib/supabaseClient.js';

export function isApprovedMediaUrl(value) {
  if (!supabaseConfig.configured) return false;
  try {
    const project = new URL(supabaseConfig.url);
    const image = new URL(value, project.origin);
    return image.protocol === 'https:' && image.origin === project.origin &&
      /^\/storage\/v1\/object\/public\/xukuru-public\//.test(image.pathname);
  } catch { return false; }
}

export async function fetchPublishedCMS() {
  const client = requireSupabase();
  const [sections, settings] = await Promise.all([
    client.from('public_page_sections').select('*').order('published_sort_order'),
    client.from('public_site_settings').select('*')
  ]);
  if (sections.error) throw sections.error;
  if (settings.error) throw settings.error;
  return { sections: sections.data || [], settings: settings.data || [] };
}

export function reorderPublishedSectionsAtExistingSlots(childNodes, sections) {
  const children = Array.from(childNodes);
  const childSet = new Set(children);
  const published = sections
    .map((section, index) => ({ ...section, index }))
    .filter(section => childSet.has(section.node))
    .sort((a, b) => {
      const difference = Number(a.order) - Number(b.order);
      return Number.isFinite(difference) && difference !== 0 ? difference : a.index - b.index;
    });
  const publishedNodes = new Set(published.map(section => section.node));
  let nextPublished = 0;
  return children.map(node => publishedNodes.has(node) ? published[nextPublished++].node : node);
}

export function applyPublishedCMS({ sections = [], settings = [] }) {
  for (const section of sections) {
    const sectionNode = document.querySelector(`[data-section-key="${CSS.escape(section.section_key)}"]`);
    if (sectionNode) sectionNode.hidden = !section.published_is_visible;
    if (!section.published_is_visible) continue;
    const fields = section.published_content?.fields || {};
    for (const [key, value] of Object.entries(fields)) {
      const nodes = document.querySelectorAll(`[data-cms-key="${CSS.escape(key)}"]`);
      if (!nodes.length || typeof value !== 'string') continue;
      for (const node of nodes) {
        if (/\.(image|image_url)$/.test(key)) {
          if (resolveLocalImage(value)) {
            node.setAttribute('src', resolveLocalImage(value)); node.hidden = false;
            node.parentElement?.querySelector('.image-pending-placeholder')?.setAttribute('hidden', '');
          }
        } else if (/\.(href|url)$/.test(key)) {
          try { const url = new URL(value, window.location.origin); if (['https:','mailto:'].includes(url.protocol)) node.setAttribute('href', value); } catch { /* mantém destino anterior */ }
        } else node.textContent = value;
      }
    }
    const placeholders = section.published_content?.placeholders || {};
    for (const [key, value] of Object.entries(placeholders)) {
      const node = document.querySelector(`[data-cms-placeholder="${CSS.escape(key)}"]`);
      if (node && typeof value === 'string') node.setAttribute('placeholder', value.slice(0, 160));
    }
    const links = section.published_content?.links || {};
    for (const [key, value] of Object.entries(links)) {
      const node = document.querySelector(`[data-cms-href-key="${CSS.escape(key)}"]`);
      if (!node || typeof value !== 'string') continue;
      try {
        const url = new URL(value, window.location.origin);
        if (['https:', 'mailto:'].includes(url.protocol)) node.setAttribute('href', value);
      } catch { /* URL inválida permanece sem alteração. */ }
    }
    const images = section.published_content?.images || {};
    for (const [key, value] of Object.entries(images)) {
      const node = document.querySelector(`[data-cms-image-key="${CSS.escape(key)}"]`);
      if (!node || typeof value !== 'string' || !resolveLocalImage(value)) continue;
      node.setAttribute('src', resolveLocalImage(value));
      node.hidden = false;
      node.parentElement?.querySelector('.image-pending-placeholder')?.setAttribute('hidden', '');
    }
    const imageAlt = section.published_content?.image_alt || {};
    for (const [key, value] of Object.entries(imageAlt)) {
      const node = document.querySelector(`[data-cms-image-key="${CSS.escape(key)}"]`);
      if (node && typeof value === 'string' && resolveLocalImage(images[key] || fields[key])) node.setAttribute('alt', value.slice(0, 300));
    }
    const layout = section.published_style?.layout;
    if (layout && /^[a-z0-9-]+$/.test(layout)) {
      const node = document.querySelector(`[data-section-key="${CSS.escape(section.section_key)}"]`);
      node?.setAttribute('data-layout', layout);
    }
  }
  const groups = new Map();
  for (const section of sections) {
    if (!section.published_is_visible) continue;
    const node = document.querySelector(`[data-section-key="${CSS.escape(section.section_key)}"]`);
    if (!node?.parentElement) continue;
    const list = groups.get(node.parentElement) || [];
    list.push({ node, order: section.published_sort_order }); groups.set(node.parentElement, list);
  }
  for (const [parent, list] of groups) {
    parent.append(...reorderPublishedSectionsAtExistingSlots(parent.childNodes, list));
  }
  for (const setting of settings) {
    if (setting.key === 'theme' && setting.published_value) {
      const value = setting.published_value;
      for (const [key, variable] of Object.entries({ primary: '--color-primary', secondary: '--color-secondary', accent: '--color-accent', background: '--color-bg' })) {
        if (/^#[0-9a-f]{6}$/i.test(value[key] || '')) document.documentElement.style.setProperty(variable, value[key]);
      }
      if (['Cinzel','Outfit'].includes(value.font)) document.documentElement.style.setProperty('--font-heading', `'${value.font}'`);
      if (['standard','text-left','text-right','two-columns','cards-2','cards-3','cards-4','image-text'].includes(value.layout)) {
        if (value.layout === 'standard') document.documentElement.removeAttribute('data-theme-layout');
        else document.documentElement.setAttribute('data-theme-layout', value.layout);
      }
    }
    if (setting.key === 'seo' && setting.published_value?.title) {
      document.title = setting.published_value.title;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', setting.published_value.title);
    }
    if (setting.key === 'seo' && typeof setting.published_value?.description === 'string') {
      const description = document.querySelector('meta[name="description"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (description) description.setAttribute('content', setting.published_value.description);
      if (ogDescription) ogDescription.setAttribute('content', setting.published_value.description);
    }
    if (setting.key === 'identity') {
      for (const field of ['name','description']) {
        const node = document.querySelector(`[data-cms-setting="identity.${field}"]`);
        const value = setting.published_value?.[field];
        if (node && typeof value === 'string') node.textContent = value;
      }
      const logo = document.querySelector('[data-cms-setting="identity.logo_url"]');
      if (logo && typeof setting.published_value?.logo_url === 'string' && resolveLocalImage(setting.published_value.logo_url)) {
        logo.src = resolveLocalImage(setting.published_value.logo_url); logo.alt = setting.published_value.name ? `Marca ${setting.published_value.name}` : 'Marca da vitrine'; logo.hidden = false;
      }
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon && typeof setting.published_value?.favicon_url === 'string' && resolveLocalImage(setting.published_value.favicon_url)) {
        favicon.href = resolveLocalImage(setting.published_value.favicon_url); favicon.type = 'image/jpeg';
      }
    }
    if (setting.key === 'contacts') {
      const published = setting.published_value || {};
      const email = document.querySelector('[data-cms-key="footer.contact.email"]');
      const whatsapp = document.querySelector('[data-cms-key="footer.contact.whatsapp"]');
      if (email && typeof published.email === 'string') email.textContent = published.email ? `📧 E-mail: ${published.email}` : '📧 E-mail: endereço pendente de confirmação';
      if (whatsapp && typeof published.whatsapp === 'string') whatsapp.textContent = published.whatsapp ? `📱 WhatsApp: ${published.whatsapp}` : '📱 WhatsApp: canal pendente de confirmação';
      const cta = document.querySelector('[data-contact-cta]');
      if (cta) {
        if (/^\d{8,15}$/.test(published.whatsapp || '')) { cta.href = `https://wa.me/${published.whatsapp}`; cta.target='_blank'; cta.rel='noopener noreferrer'; cta.hidden = false; }
        else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(published.email || '')) { cta.href = `mailto:${encodeURIComponent(published.email)}`; cta.removeAttribute('target'); cta.removeAttribute('rel'); cta.hidden = false; }
        else { cta.removeAttribute('href'); cta.hidden = true; }
      }
    }
    if (setting.key === 'notices') {
      const checkout = document.querySelector('[data-cms-key="cart.payment_notice"]');
      const claims = document.querySelector('[data-cms-key="footer.claims.notice"]');
      if (checkout && typeof setting.published_value?.checkout === 'string') checkout.textContent = setting.published_value.checkout;
      if (claims && typeof setting.published_value?.claims === 'string') claims.textContent = setting.published_value.claims;
    }
  }
}
