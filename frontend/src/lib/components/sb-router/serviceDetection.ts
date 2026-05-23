/**
 * Heuristic mapping singbox routing rule → service key из SERVICES palette.
 *
 * Источник: дизайн-документ singbox-router предполагает что карточка
 * правила показывает узнаваемый glyph (N для Netflix, Y для YouTube, …)
 * вместо generic иконки. Этот файл — таблица паттернов.
 *
 * Эвристика: domain_suffix matches → rule_set matches → 'custom'.
 */

import type { SingboxRouterRule } from '$lib/types';

interface ServicePattern {
  key: string;
  /** Suffix matches (case-insensitive). 'netflix.com' matches 'www.netflix.com'. */
  domains?: string[];
  /** rule_set name patterns (exact match, case-insensitive). */
  ruleSets?: string[];
}

const PATTERNS: ServicePattern[] = [
  { key: 'netflix',   domains: ['netflix.com', 'nflxext.com', 'nflximg.com', 'nflxvideo.net'] },
  { key: 'youtube',   domains: ['youtube.com', 'ytimg.com', 'googlevideo.com', 'youtu.be', 'youtube-nocookie.com'] },
  { key: 'telegram',  domains: ['telegram.org', 'telegram.me', 't.me', 'telesco.pe', 'telegra.ph'] },
  { key: 'twitch',    domains: ['twitch.tv', 'ttvnw.net', 'jtvnw.net'] },
  { key: 'spotify',   domains: ['spotify.com', 'scdn.co', 'spotifycdn.com'] },
  { key: 'github',    domains: ['github.com', 'githubusercontent.com', 'githubassets.com', 'github.io'] },
  { key: 'openai',    domains: ['openai.com', 'chatgpt.com', 'oaistatic.com', 'oaiusercontent.com'] },
  { key: 'meta',      domains: ['facebook.com', 'instagram.com', 'whatsapp.com', 'fb.com', 'fbcdn.net', 'cdninstagram.com'] },
  { key: 'discord',   domains: ['discord.com', 'discordapp.com', 'discord.gg', 'discordcdn.com'] },
  { key: 'apple',     domains: ['apple.com', 'icloud.com', 'mzstatic.com', 'apple-cloudkit.com'] },
  { key: 'geoip_ru',  ruleSets: ['geoip-ru', 'geosite-ru', 'ru', 'geoip_ru', 'geosite_ru'] },
];

function suffixMatches(domain: string, suffix: string): boolean {
  const d = domain.toLowerCase();
  const s = suffix.toLowerCase();
  return d === s || d.endsWith('.' + s);
}

export function detectServiceKey(rule: SingboxRouterRule): string {
  const domains = rule.domain_suffix ?? [];
  if (domains.length > 0) {
    for (const pattern of PATTERNS) {
      if (!pattern.domains) continue;
      for (const ruleDomain of domains) {
        for (const patternDomain of pattern.domains) {
          if (suffixMatches(ruleDomain, patternDomain)) {
            return pattern.key;
          }
        }
      }
    }
  }

  const sets = rule.rule_set ?? [];
  if (sets.length > 0) {
    for (const pattern of PATTERNS) {
      if (!pattern.ruleSets) continue;
      for (const ruleSet of sets) {
        const rs = ruleSet.toLowerCase();
        if (pattern.ruleSets.some(p => p.toLowerCase() === rs)) {
          return pattern.key;
        }
      }
    }
  }

  return 'custom';
}
