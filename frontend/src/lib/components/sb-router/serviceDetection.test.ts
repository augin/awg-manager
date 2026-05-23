import { describe, it, expect } from 'vitest';
import { detectServiceKey } from './serviceDetection';
import type { SingboxRouterRule } from '$lib/types';

function rule(partial: Partial<SingboxRouterRule>): SingboxRouterRule {
  return { ...partial };
}

describe('detectServiceKey', () => {
  it('returns "custom" for empty rule', () => {
    expect(detectServiceKey(rule({}))).toBe('custom');
  });

  it('detects netflix from domain_suffix', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['netflix.com'] }))).toBe('netflix');
    expect(detectServiceKey(rule({ domain_suffix: ['nflxext.com'] }))).toBe('netflix');
  });

  it('detects youtube', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['youtube.com'] }))).toBe('youtube');
    expect(detectServiceKey(rule({ domain_suffix: ['ytimg.com'] }))).toBe('youtube');
    expect(detectServiceKey(rule({ domain_suffix: ['googlevideo.com'] }))).toBe('youtube');
  });

  it('detects telegram', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['telegram.org'] }))).toBe('telegram');
    expect(detectServiceKey(rule({ domain_suffix: ['t.me'] }))).toBe('telegram');
  });

  it('detects spotify', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['spotify.com'] }))).toBe('spotify');
    expect(detectServiceKey(rule({ domain_suffix: ['scdn.co'] }))).toBe('spotify');
  });

  it('detects github', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['github.com'] }))).toBe('github');
    expect(detectServiceKey(rule({ domain_suffix: ['githubusercontent.com'] }))).toBe('github');
  });

  it('detects openai', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['openai.com'] }))).toBe('openai');
    expect(detectServiceKey(rule({ domain_suffix: ['chatgpt.com'] }))).toBe('openai');
  });

  it('detects discord', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['discord.com'] }))).toBe('discord');
    expect(detectServiceKey(rule({ domain_suffix: ['discordapp.com'] }))).toBe('discord');
  });

  it('detects twitch', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['twitch.tv'] }))).toBe('twitch');
  });

  it('detects meta domains', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['facebook.com'] }))).toBe('meta');
    expect(detectServiceKey(rule({ domain_suffix: ['instagram.com'] }))).toBe('meta');
    expect(detectServiceKey(rule({ domain_suffix: ['whatsapp.com'] }))).toBe('meta');
  });

  it('detects apple', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['apple.com'] }))).toBe('apple');
    expect(detectServiceKey(rule({ domain_suffix: ['icloud.com'] }))).toBe('apple');
  });

  it('detects geoip_ru from rule_set', () => {
    expect(detectServiceKey(rule({ rule_set: ['geoip-ru'] }))).toBe('geoip_ru');
    expect(detectServiceKey(rule({ rule_set: ['geosite-ru'] }))).toBe('geoip_ru');
  });

  it('domain_suffix takes precedence over rule_set', () => {
    expect(detectServiceKey(rule({
      domain_suffix: ['netflix.com'],
      rule_set: ['geoip-ru'],
    }))).toBe('netflix');
  });

  it('falls back to "custom" for unknown domain', () => {
    expect(detectServiceKey(rule({ domain_suffix: ['example.com'] }))).toBe('custom');
  });

  it('handles undefined/null arrays gracefully', () => {
    expect(detectServiceKey(rule({ domain_suffix: undefined }))).toBe('custom');
  });

  it('handles empty arrays', () => {
    expect(detectServiceKey(rule({ domain_suffix: [], rule_set: [] }))).toBe('custom');
  });
});
