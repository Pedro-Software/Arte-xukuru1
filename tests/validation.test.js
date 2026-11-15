import { describe, expect, it } from 'vitest';
import { slugify, validateProduct, validateImage, validateTheme } from '../assets/js/services/validation.js';

describe('validação de conteúdo administrativo', () => {
  it('gera slugs estáveis e sem acentos', () => {
    expect(slugify('Sabonete de Aroeira')).toBe('sabonete-de-aroeira');
    expect(slugify('  Coração & Argila!  ')).toBe('coracao-argila');
  });
  it('aceita preço em reais e estoque inteiro não negativo', () => {
    expect(validateProduct({ title:'Peça', category_slug:'ceramica', price:120.5, stock:2 }).valid).toBe(true);
    expect(validateProduct({ title:'Peça', category_slug:'ceramica', price:-1, stock:-1 }).valid).toBe(false);
  });
  it('restringe uploads a JPEG/PNG/WebP até 5 MB', () => {
    expect(validateImage({type:'image/webp',size:1024}).valid).toBe(true);
    expect(validateImage({type:'image/svg+xml',size:100}).valid).toBe(false);
    expect(validateImage({type:'image/png',size:5*1024*1024+1}).valid).toBe(false);
  });
  it('aceita apenas cores, presets seguros e contraste legível', () => {
    expect(validateTheme({primary:'#1F3E2B',font:'Cinzel',layout:'cards-3'})).toBe(true);
    expect(validateTheme({primary:'#FFFFFF',background:'#FFFFFF'})).toBe(false);
    expect(validateTheme({primary:'red; background:url(javascript:alert(1))'})).toBe(false);
    expect(validateTheme({font:'Comic Sans'})).toBe(false);
  });
});
