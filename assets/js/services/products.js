import { localProductImages, resolveLocalImage } from './localImages.js';
import { requireSupabase } from '../lib/supabaseClient.js';

export async function fetchPublicCatalog() {
  const client = requireSupabase();
  const [productsResult, categoriesResult, imagesResult] = await Promise.all([
    client.from('public_products').select('*').order('sort_order').order('title'),
    client.from('public_categories').select('*').order('sort_order').order('name'),
    client.from('public_product_images').select('*').order('sort_order')
  ]);
  for (const result of [productsResult, categoriesResult, imagesResult]) if (result.error) throw result.error;

  const imageGroups = new Map();
  for (const image of imagesResult.data || []) {
    const list = imageGroups.get(image.product_id) || [];
    const url = resolveLocalImage(image.storage_path);
    if (url) list.push({ ...image, url });
    imageGroups.set(image.product_id, list);
  }
  const products = (productsResult.data || []).map(row => {
    const gallery = imageGroups.get(row.id) || [];
    const cover = localProductImages[row.legacy_id] || gallery.find(image => image.is_cover) || gallery[0];
    return {
      id: row.id,
      legacyId: row.legacy_id,
      title: row.title,
      category: row.category_slug,
      categoryName: row.category_name,
      price: Number(row.price),
      featured: Boolean(row.featured),
      artisan: row.artisan || 'Não informado',
      village: row.village || 'Não informado',
      image: cover?.url || '',
      imageAlt: cover?.alt || cover?.alt_text || row.image_alt || row.title,
      gallery: [...new Set([cover?.url, ...gallery.map(image => image.url)].filter(Boolean))],
      materials: row.materials || 'Não informado',
      description: row.description || row.short_description || '',
      dimensions: row.dimensions || 'Não informadas',
      weight: row.weight || 'Não informado',
      stock: Number(row.stock),
      sortOrder: row.sort_order
    };
  });
  return { products, categories: categoriesResult.data || [] };
}
