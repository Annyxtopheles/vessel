import type { PaletteColor } from '../types';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function getColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 9999;
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

export function matchColorPalette(
  itemHex: string,
  palette: PaletteColor[],
  threshold = 65
): { verdict: 'suits' | 'avoid'; paletteColor: PaletteColor } | null {
  if (!itemHex || !palette || palette.length === 0) return null;
  const activePalette = palette.filter((p) => !p.deletedAt && p.verdict !== 'neutral');

  let closest: { dist: number; item: PaletteColor } | null = null;
  for (const p of activePalette) {
    const dist = getColorDistance(itemHex, p.colorHex);
    if (dist <= threshold) {
      if (!closest || dist < closest.dist) {
        closest = { dist, item: p };
      }
    }
  }

  if (closest && (closest.item.verdict === 'suits' || closest.item.verdict === 'avoid')) {
    return { verdict: closest.item.verdict, paletteColor: closest.item };
  }
  return null;
}
