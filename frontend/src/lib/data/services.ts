// Service palette for sb-router redesign.
// Brand-aligned MUTED colors — sysadmin-grade, не реальные бренд-цвета.
// Источник: design bundle singbox-router/project/parts/Primitives.jsx
// (SERVICES константа, glyph + color пары).

export interface ServiceVisual {
  /** Glyph displayed in the service tile (1-2 chars). */
  glyph: string;
  /** Hex color or CSS var for the tile background. */
  color: string;
}

export const SERVICES: Record<string, ServiceVisual> = {
  netflix:   { glyph: 'N',  color: '#9a4f60' },
  youtube:   { glyph: 'Y',  color: '#a85a5a' },
  telegram:  { glyph: 'T',  color: '#5d7aa9' },
  twitch:    { glyph: 'Tw', color: '#7a5d9b' },
  spotify:   { glyph: 'S',  color: '#5b8568' },
  github:    { glyph: 'G',  color: '#737aa2' },
  openai:    { glyph: 'O',  color: '#5b8568' },
  meta:      { glyph: 'M',  color: '#5d7aa9' },
  discord:   { glyph: 'D',  color: '#5d7aa9' },
  apple:     { glyph: 'A',  color: '#737aa2' },
  ru_block:  { glyph: 'RU', color: '#b56577' },
  geoip_ru:  { glyph: 'RU', color: '#b56577' },
  custom:    { glyph: '·',  color: 'var(--text-muted)' },
};

/** Lookup that returns a deterministic fallback for unknown service keys. */
export function getServiceVisual(key: string): ServiceVisual {
  return SERVICES[key] ?? SERVICES.custom;
}
