import { describe, expect, it } from 'vitest';
import { reorderPublishedSectionsAtExistingSlots } from '../assets/js/services/cms.js';

describe('ordenação de seções publicadas no HTML', () => {
  it('mantém a posição da única seção publicada entre seções estáticas', () => {
    const proposal = { key: 'about.proposal' };
    const values = { key: 'about.values' };
    const contact = { key: 'about.contact' };

    expect(reorderPublishedSectionsAtExistingSlots(
      [proposal, values, contact],
      [{ node: proposal, order: 15 }]
    )).toEqual([proposal, values, contact]);
  });

  it('ordena seções publicadas entre suas posições originais sem mover conteúdo não publicado', () => {
    const proposal = { key: 'about.proposal' };
    const values = { key: 'about.values' };
    const contact = { key: 'about.contact' };
    const copyright = { key: 'static.footer' };

    expect(reorderPublishedSectionsAtExistingSlots(
      [proposal, values, contact, copyright],
      [{ node: proposal, order: 30 }, { node: contact, order: 10 }]
    )).toEqual([contact, values, proposal, copyright]);
  });
});
