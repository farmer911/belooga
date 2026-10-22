import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOP_CANDIDATE_BADGE_TIERS,
  TOP_CANDIDATE_CATEGORIES,
  fetchMobileTopCandidates,
  formatTopCandidateTierLabel,
  topCandidateItemSchema,
} from '../src/hooks/use-mobile-top-candidates';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe('[BEL-197] Mobile Top High-Potential Candidates Leaderboard & Spotlight Carousel Parity (#123)', () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates top candidate categories, badge tiers, and schema', () => {
    expect(TOP_CANDIDATE_CATEGORIES).toEqual([
      'all',
      'backend',
      'frontend',
      'ai',
      'mobile',
      'devops',
    ]);
    expect(TOP_CANDIDATE_BADGE_TIERS).toEqual(['TOP_1_PCT', 'TOP_5_PCT', 'RISING_STAR']);
    expect(formatTopCandidateTierLabel('TOP_1_PCT')).toBe('Top 1% Talent');
    expect(formatTopCandidateTierLabel('TOP_5_PCT')).toBe('Top 5% Talent');
    expect(formatTopCandidateTierLabel('RISING_STAR')).toBe('Rising Star');

    const item = topCandidateItemSchema.parse({
      rank: 1,
      username: 'alexnguyen',
      full_name: 'Alex Nguyen',
      headline: 'Principal Distributed Systems Engineer',
      location: 'Ho Chi Minh City',
      potential_score: 98,
      badge_tier: 'TOP_1_PCT',
      highlight_reason: '96% ATS Benchmark • Verified 60s Video Pitch • 10+ yrs Architecture',
      skills: ['Python', 'FastAPI', 'PostgreSQL 16', 'React Native'],
      has_video_pitch: true,
      actively_looking: true,
    });
    expect(item.rank).toBe(1);
    expect(item.potential_score).toBe(98);
  });

  it('queries GET /v1/search/top-candidates with category and actively_looking_only filters', async () => {
    const urls: string[] = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(
        JSON.stringify({
          items: [
            {
              rank: 1,
              username: 'alexnguyen',
              full_name: 'Alex Nguyen',
              headline: 'Principal Distributed Systems Engineer',
              location: 'Ho Chi Minh City',
              potential_score: 98,
              badge_tier: 'TOP_1_PCT',
              highlight_reason: '96% ATS Benchmark • Verified 60s Video Pitch',
              skills: ['Python', 'FastAPI', 'PostgreSQL 16'],
              has_video_pitch: true,
              actively_looking: true,
            },
            {
              rank: 2,
              username: 'sarahchen',
              full_name: 'Sarah Chen',
              headline: 'Staff Mobile & Edge Systems Architect',
              location: 'Singapore',
              potential_score: 95,
              badge_tier: 'TOP_5_PCT',
              highlight_reason: '94% Trust Score • Expo SDK 58 & ConnectRPC',
              skills: ['React Native', 'TypeScript', 'Redis 7'],
              has_video_pitch: true,
              actively_looking: true,
            },
          ],
          total: 2,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const res = await fetchMobileTopCandidates(
      { category: 'backend', actively_looking_only: true, limit: 10 },
      mobileApiClient
    );
    expect(res.items.length).toBe(2);
    expect(urls[0]).toContain('/v1/search/top-candidates?');
    expect(urls[0]).toContain('category=backend');
    expect(urls[0]).toContain('actively_looking_only=true');
  });

  it('wires all required #120/#123 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/top-candidates-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MainActivity.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-top-candidates-section',
      'mobile-top-candidates-category-',
      'mobile-top-candidates-active-toggle',
      'mobile-top-candidate-card-',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
