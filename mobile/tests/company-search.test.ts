import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMPANY_INDUSTRIES,
  COMPANY_LOCATIONS,
  companyProfileDetailSchema,
  companySummarySchema,
  createMobileCompanyProfile,
  fetchMobileCompanyProfile,
  searchMobileCompanies,
  submitMobileCompanyReview,
} from '../src/hooks/use-mobile-companies';
import { mobileApiClient, setMobileFetchTransportForTesting } from '../src/services/api-client';

describe('[BEL-193] Mobile Company Search & Filter Engine + Company Profile Screen Parity (#118)', () => {
  beforeEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  afterEach(() => {
    setMobileFetchTransportForTesting(null);
  });

  it('validates company industries, locations, and summary/detail schemas', () => {
    expect(COMPANY_INDUSTRIES).toContain('AI / Cloud');
    expect(COMPANY_LOCATIONS).toContain('Ho Chi Minh');

    const summary = companySummarySchema.parse({
      slug: 'databricks',
      name: 'Databricks',
      industry: 'AI / Cloud',
      location: 'Ho Chi Minh',
      company_size: '1000+',
      avg_rating: 4.9,
      review_count: 128,
      avg_salary_usd: 3200,
      open_jobs_count: 6,
      tech_stack: ['Python', 'Spark', 'PostgreSQL 16'],
      is_verified: true,
    });
    expect(summary.slug).toBe('databricks');
    expect(summary.avg_rating).toBe(4.9);
  });

  it('queries GET /v1/companies/search with multi-facet filters (q, industry, location, tech_stack, hiring_only, min_rating, sort_by)', async () => {
    const urls: string[] = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(
        JSON.stringify({
          items: [
            {
              slug: 'databricks',
              name: 'Databricks',
              industry: 'AI / Cloud',
              location: 'Ho Chi Minh',
              company_size: '1000+',
              avg_rating: 4.9,
              review_count: 128,
              avg_salary_usd: 3200,
              open_jobs_count: 6,
              tech_stack: ['Python', 'PostgreSQL 16'],
              is_verified: true,
            },
          ],
          total: 1,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const res = await searchMobileCompanies(
      {
        q: 'Data',
        industry: 'AI / Cloud',
        location: 'Ho Chi Minh',
        tech_stack: ['Python', 'PostgreSQL 16'],
        hiring_only: true,
        min_rating: 4.0,
        sort_by: 'rating',
      },
      mobileApiClient
    );

    expect(res.items.length).toBe(1);
    expect(urls[0]).toContain('/v1/companies/search?');
    expect(urls[0]).toContain('q=Data');
    expect(urls[0]).toContain('hiring_only=true');
    expect(urls[0]).toContain('sort_by=rating');
  });

  it('fetches GET /v1/companies/{slug} with 4 profile tabs and submits company creation & review', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    setMobileFetchTransportForTesting((async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push({ url, method });

      if (method === 'GET' && url.endsWith('/v1/companies/databricks')) {
        return new Response(
          JSON.stringify({
            slug: 'databricks',
            name: 'Databricks',
            industry: 'AI / Cloud',
            location: 'Ho Chi Minh',
            company_size: '1000+',
            website_url: 'https://databricks.com',
            description: 'Unified Data & AI Lakehouse Platform.',
            avg_rating: 4.9,
            review_count: 128,
            avg_salary_usd: 3200,
            open_jobs_count: 2,
            tech_stack: ['Python', 'PostgreSQL 16', 'React'],
            benefits: ['Remote-first', 'Top 5% Market Compensation', 'Annual Learning Stipend'],
            open_jobs: [
              {
                id: 'job-db-1',
                title: 'Staff Distributed Systems Engineer',
                location: 'Ho Chi Minh / Remote',
                salary_range: '$3,000 - $4,200/mo',
              },
            ],
            reviews: [
              {
                id: 'rev-1',
                author_username: 'alexnguyen',
                rating: 5,
                title: 'World-class engineering culture',
                content: 'High ownership and deep technical challenges.',
              },
            ],
            alumni: [
              {
                username: 'alexnguyen',
                full_name: 'Alex Nguyen',
                headline: 'Principal Systems Architect',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST' && url.endsWith('/reviews')) {
        return new Response(
          JSON.stringify({
            id: 'rev-2',
            author_username: 'phucnguyen',
            rating: 5,
            title: 'Great mentorship & compensation',
            content: 'Fast feedback loops and strong engineering bar.',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          slug: 'belooga-ai',
          name: 'Belooga AI',
          industry: 'AI / Cloud',
          location: 'Ho Chi Minh',
          company_size: '50-200',
          avg_rating: 5.0,
          review_count: 1,
          avg_salary_usd: 3000,
          open_jobs_count: 3,
          tech_stack: ['FastAPI', 'React Native'],
          is_verified: true,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch);

    const detail = await fetchMobileCompanyProfile('databricks', mobileApiClient);
    const parsed = companyProfileDetailSchema.parse(detail);
    expect(parsed.open_jobs.length).toBe(1);
    expect(parsed.reviews.length).toBe(1);
    expect(parsed.alumni.length).toBe(1);

    const created = await createMobileCompanyProfile(
      {
        name: 'Belooga AI',
        industry: 'AI / Cloud',
        location: 'Ho Chi Minh',
        company_size: '50-200',
        description: 'Next-gen AI Career & Talent Intelligence.',
        tech_stack: ['FastAPI', 'React Native'],
      },
      mobileApiClient
    );
    expect(created.slug).toBe('belooga-ai');

    const review = await submitMobileCompanyReview(
      'databricks',
      {
        rating: 5,
        title: 'Great mentorship & compensation',
        content: 'Fast feedback loops and strong engineering bar.',
      },
      mobileApiClient
    );
    expect(review.id).toBe('rev-2');
  });

  it('wires all required #115/#118 accessibilityLabel & Android content-desc contracts', () => {
    const sectionSource = readFileSync(
      join(import.meta.dir, '../src/components/companies-directory-section.tsx'),
      'utf8'
    );
    const javaSource = readFileSync(
      join(import.meta.dir, '../android/app/src/main/java/com/belooga/mobile/MainActivity.java'),
      'utf8'
    );

    const requiredIds = [
      'mobile-companies-section',
      'mobile-company-search-input',
      'mobile-company-card-',
      'mobile-company-profile-card',
      'mobile-company-review-btn',
    ];

    for (const id of requiredIds) {
      expect(sectionSource).toContain(id);
      expect(javaSource).toContain(id);
    }
  });
});
