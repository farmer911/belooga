import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyExpertInputSchema,
  applyMobileExpertReviewer,
  expertProfileMeSchema,
  fetchMobileMyExpertProfile,
} from '../src/hooks/use-mobile-expert-leaderboard';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe("[BEL-205] Mobile 'Become an Expert Reviewer' Registration Form & Expert Profile Parity (#134)", () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates expert registration input schema and active expert profile status schema', () => {
    const input = applyExpertInputSchema.parse({
      full_name: 'Nguyen Minh Phuc',
      role_title: 'Principal Distributed Systems Engineer',
      company_name: 'Grab / Belooga',
      years_experience: 10,
      category: 'backend',
      specialties: ['Python', 'FastAPI', 'PostgreSQL 16', 'React Native'],
      turnaround_hours: 24,
      hourly_rate_vnd: 299000,
      linkedin_url: 'https://linkedin.com/in/phucnguyen',
      bio: 'Reviewed 300+ engineering CVs for Staff/Principal roles.',
    });
    expect(input.years_experience).toBe(10);
    expect(input.turnaround_hours).toBe(24);

    const me = expertProfileMeSchema.parse({
      id: 'exp-phuc',
      full_name: 'Nguyen Minh Phuc',
      role_title: 'Principal Distributed Systems Engineer',
      company_name: 'Grab / Belooga',
      years_experience: 10,
      category: 'backend',
      specialties: ['Python', 'FastAPI', 'PostgreSQL 16'],
      turnaround_hours: 24,
      hourly_rate_vnd: 299000,
      status: 'ACTIVE',
      ranking_score: 97.5,
    });
    expect(me.status).toBe('ACTIVE');
  });

  it('submits POST /v1/expert-review/apply and fetches GET /v1/expert-review/me', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push({ url, method });

      if (method === 'POST' && url.endsWith('/v1/expert-review/apply')) {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            id: 'exp-new-1',
            full_name: body.full_name,
            role_title: body.role_title,
            company_name: body.company_name,
            years_experience: body.years_experience,
            category: body.category,
            specialties: body.specialties,
            turnaround_hours: body.turnaround_hours,
            hourly_rate_vnd: body.hourly_rate_vnd,
            status: 'ACTIVE',
            ranking_score: 96.0,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          id: 'exp-new-1',
          full_name: 'Nguyen Minh Phuc',
          role_title: 'Principal Engineer',
          company_name: 'Belooga',
          years_experience: 10,
          category: 'backend',
          specialties: ['Python', 'FastAPI'],
          turnaround_hours: 24,
          hourly_rate_vnd: 299000,
          status: 'ACTIVE',
          ranking_score: 96.0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const created = await applyMobileExpertReviewer(
      {
        full_name: 'Nguyen Minh Phuc',
        role_title: 'Principal Engineer',
        company_name: 'Belooga',
        years_experience: 10,
        category: 'backend',
        specialties: ['Python', 'FastAPI'],
        turnaround_hours: 24,
        hourly_rate_vnd: 299000,
        linkedin_url: 'https://linkedin.com/in/phucnguyen',
        bio: 'Hiring committee lead.',
      },
      mobileApiClient
    );
    expect(created.id).toBe('exp-new-1');
    expect(calls[0]?.url).toContain('/v1/expert-review/apply');

    const me = await fetchMobileMyExpertProfile(mobileApiClient);
    expect(me?.full_name).toBe('Nguyen Minh Phuc');
    expect(calls[1]?.url).toContain('/v1/expert-review/me');
  });

  it('wires all required #131/#134 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/expert-leaderboard-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MobileCareerScreens.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-become-expert-open-btn',
      'mobile-become-expert-form',
      'mobile-become-expert-submit-btn',
      'mobile-expert-me-card',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
