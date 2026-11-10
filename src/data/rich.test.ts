import { describe, expect, it } from 'vitest';
import { boldParts } from '@onigam/lab-kit/ui';
import { visitorTexts } from './texts';

// The kit's `rich()` draws what the visitor reads, and this lab's marks stand next to its bold markers. These tests run the lab's own sentences through the kit's own splitter, in both languages, so that neither a change of the kit nor of a text
// can put raw stars back on the screen.

describe('the bold and the marks, through the kit’s own function', () => {
  it('holds a bold that ends on a star mark or a dagger', () => {
    expect(boldParts('**7 mm*** suffisent')).toEqual([
      { text: '7 mm*', bold: true },
      { text: ' suffisent', bold: false },
    ]);
    expect(boldParts('**7 mm†** suffisent')[0]).toEqual({ text: '7 mm†', bold: true });
  });

  it('leaves no raw marker anywhere the kit renders with it, in either language', () => {
    const raw: string[] = [];
    const texts = visitorTexts();
    expect(texts.length).toBeGreaterThan(500);
    for (const [where, t] of texts) {
      for (const lang of ['fr', 'en'] as const) {
        for (const para of t[lang].split(/\n\s*\n/)) {
          for (const piece of boldParts(para))
            if (piece.text.includes('**')) raw.push(`${where} (${lang}): ${piece.text}`);
        }
      }
    }
    expect(raw).toEqual([]);
  });
});
