import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EXPERT_LEADERBOARD_CATEGORIES,
  EXPERT_LEADERBOARD_SORT_MODES,
  bookMobileExpertReviewOrder,
  expertLeaderboardItemSchema,
  fetchMobileExpertLeaderboard,
  submitMobileExpertOrderFeedback,
} from '../src/hooks/use-mobile-expert-leaderboard';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe('[BEL-201] Mobile Expert Reviewer Ranking & Leaderboard Screen Parity (#127)', () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates expert leaderboard categories, sort modes, and ranked item schema', () => {
    expect(EXPERT_LEADERBOARD_CATEGORIES).toEqual([
      'all',
      'backend',
      'frontend',
      'ai',
      'devops',
      'management',
    ]);
    expect(EXPERT_LEADERBOARD_SORT_MODES).toEqual([
      'rank',
      'ats_lift',
      'rating',
      'speed',
      'reviews_count',
    ]);

    const item = expertLeaderboardItemSchema.parse({
      id: 'exp-1',
      rank_position: 1,
      name: 'Sarah Jenkins',
      title: 'Ex-Google Staff Hiring Committee',
      category: 'backend',
      badge_title: 'Grandmaster Mentor',
      ranking_score: 98.4,
      avg_ats_lift_points: 28,
      rating: 4.98,
      completed_reviews_count: 310,
      avg_turnaround_hours: 11,
      interview_callback_rate: 91,
      price_vnd: 299000,
    });
    expect(item.rank_position).toBe(1);
    expect(item.avg_ats_lift_points).toBe(28);
  });

  it('fetches GET /v1/expert-review/leaderboard, books 1-click order, and submits feedback', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push({ url, method });

      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'exp-1',
                rank_position: 1,
                name: 'Sarah Jenkins',
                title: 'Ex-Google Staff Hiring Committee',
                category: 'backend',
                badge_title: 'Grandmaster Mentor',
                ranking_score: 98.4,
                avg_ats_lift_points: 28,
                rating: 4.98,
                completed_reviews_count: 310,
                avg_turnaround_hours: 11,
                interview_callback_rate: 91,
                price_vnd: 299000,
              },
            ],
            total: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.endsWith('/feedback/') || url.endsWith('/feedback')) {
        return new Response(
          JSON.stringify({
            order_id: 'ord_8841',
            expert_id: 'exp-1',
            new_rating: 4.99,
            new_ranking_score: 98.7,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          order_id: 'ord_9001',
          expert_id: 'exp-1',
          status: 'ESCROW_LOCKED',
          amount_vnd: 299000,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const board = await fetchMobileExpertLeaderboard(
      { category: 'backend', sort_by: 'ats_lift' },
      mobileApiClient
    );
    expect(board.items.length).toBe(1);
    expect(calls[0]?.url).toContain('/v1/expert-review/leaderboard?category=backend&sort_by=ats_lift');

    const booked = await bookMobileExpertReviewOrder(
      { expert_id: 'exp-1', package_id: 'pkg_senior', target_role: 'Staff Backend Engineer' },
      mobileApiClient
    );
    expect(booked.order_id).toBe('ord_9001');

    const feedback = await submitMobileExpertOrderFeedback(
      'ord_8841',
      { rating: 5, ats_lift_achieved: 30, comment: 'Landed 3 Staff interviews!' },
      mobileApiClient
    );
    expect(feedback.new_ranking_score).toBe(98.7);
  });

  it('wires all required #124/#127 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/expert-leaderboard-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-expert-leaderboard-section',
      'mobile-expert-category-',
      'mobile-expert-sort-',
      'mobile-expert-leaderboard-card-',
      'mobile-expert-book-btn-',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
