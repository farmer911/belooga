import React, { useState } from 'react';
import {
  COMPANY_INDUSTRIES,
  COMPANY_LOCATIONS,
  useCreateMobileCompanyMutation,
  useMobileCompaniesSearchQuery,
  useMobileCompanyProfileQuery,
  useSubmitMobileCompanyReviewMutation,
} from '@/hooks/use-mobile-companies';
import { ActionButton, BadgePill, BottomSheetDrawer, SurfaceCard } from '@/lib/native-runtime';
import { getSemanticTokens } from '@/theme/tokens';

type CompanyDetailTab = 'overview' | 'jobs' | 'reviews' | 'alumni';

export function CompaniesDirectorySection() {
  const tokens = getSemanticTokens('neumorphic');
  const [q, setQ] = useState('');
  const [industry, setIndustry] = useState<string>('All');
  const [location, setLocation] = useState<string>('All');
  const [hiringOnly, setHiringOnly] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>('databricks');
  const [detailTab, setDetailTab] = useState<CompanyDetailTab>('overview');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');

  const searchQuery = useMobileCompaniesSearchQuery({
    q: q || undefined,
    industry,
    location,
    hiring_only: hiringOnly,
    sort_by: 'rating',
  });
  const detailQuery = useMobileCompanyProfileQuery(activeSlug);
  const createCompanyMutation = useCreateMobileCompanyMutation();
  const submitReviewMutation = useSubmitMobileCompanyReviewMutation();

  const companies = searchQuery.data?.items ?? [];
  const profile = detailQuery.data;

  const inputStyle: React.CSSProperties = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: '10px 12px',
  };

  return (
    <div
      data-testid="mobile-companies-section"
      aria-label="mobile-companies-section"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SurfaceCard testID="company-filter-bar" mode="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 15, color: tokens.typography.heading }}>
            Company Search &amp; Employer Directory (/companies)
          </strong>
          <ActionButton
            testID="company-create-open-btn"
            label="+ Create Company"
            variant="secondary"
            onPress={() =>
              createCompanyMutation.mutate({
                name: q.trim() || 'Belooga AI Labs',
                industry: industry === 'All' ? 'AI / Cloud' : industry,
                location: location === 'All' ? 'Ho Chi Minh' : location,
                company_size: '50-200',
                description: 'Verified AI & Engineering Hub',
                tech_stack: ['FastAPI', 'PostgreSQL 16', 'React Native'],
              })
            }
          />
        </div>
        <input
          data-testid="mobile-company-search-input"
          aria-label="mobile-company-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company name, tech stack, industry..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COMPANY_INDUSTRIES.map((ind) => (
            <ActionButton
              key={ind}
              testID={`company-industry-${ind}`}
              label={ind}
              variant={industry === ind ? 'primary' : 'secondary'}
              onPress={() => setIndustry(ind)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COMPANY_LOCATIONS.map((loc) => (
            <ActionButton
              key={loc}
              testID={`company-location-${loc}`}
              label={loc}
              variant={location === loc ? 'primary' : 'secondary'}
              onPress={() => setLocation(loc)}
            />
          ))}
          <ActionButton
            testID="company-hiring-only-toggle"
            label={hiringOnly ? '[x] Hiring Now' : '[ ] Hiring Now'}
            variant={hiringOnly ? 'accent' : 'secondary'}
            onPress={() => setHiringOnly((v) => !v)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {companies.map((c) => (
            <div
              key={c.slug}
              data-testid={`mobile-company-card-${c.slug}`}
              aria-label={`mobile-company-card-${c.slug}`}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ color: tokens.typography.heading }}>{c.name}</strong>
                <div style={{ fontSize: 12, color: tokens.typography.body }}>
                  {c.industry} • {c.location} • Rating: {c.avg_rating} ({c.review_count}) • $
                  {c.avg_salary_usd}/mo
                </div>
              </div>
              <ActionButton
                testID={`company-card-link-${c.slug}`}
                label={`View (${c.open_jobs_count} Jobs)`}
                variant="secondary"
                onPress={() => setActiveSlug(c.slug)}
              />
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard testID="mobile-company-profile-card" mode="dark">
        <div
          aria-label="mobile-company-profile-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <strong style={{ fontSize: 15, color: tokens.typography.heading }}>
            Company Profile: {profile?.name ?? activeSlug} (/companies/{activeSlug})
          </strong>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ActionButton
              testID="company-tab-overview"
              label="Overview & Tech"
              variant={detailTab === 'overview' ? 'primary' : 'secondary'}
              onPress={() => setDetailTab('overview')}
            />
            <ActionButton
              testID="company-tab-jobs"
              label="Open Jobs"
              variant={detailTab === 'jobs' ? 'primary' : 'secondary'}
              onPress={() => setDetailTab('jobs')}
            />
            <ActionButton
              testID="company-tab-reviews"
              label="Salary & Reviews"
              variant={detailTab === 'reviews' ? 'primary' : 'secondary'}
              onPress={() => setDetailTab('reviews')}
            />
            <ActionButton
              testID="company-tab-alumni"
              label="Belooga Alumni"
              variant={detailTab === 'alumni' ? 'primary' : 'secondary'}
              onPress={() => setDetailTab('alumni')}
            />
          </div>
          {detailTab === 'overview' ? (
            <div style={{ fontSize: 12, color: tokens.typography.body }}>
              {profile?.description ?? 'Unified Data & AI Platform'} • Stack:{' '}
              {(profile?.tech_stack ?? []).join(', ')}
            </div>
          ) : null}
          {detailTab === 'jobs' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(profile?.open_jobs ?? []).map((job) => (
                <BadgePill key={job.id} label={`${job.title} (${job.salary_range})`} tone="brand" />
              ))}
            </div>
          ) : null}
          {detailTab === 'alumni' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(profile?.alumni ?? []).map((al) => (
                <BadgePill key={al.username} label={`${al.full_name} (@${al.username})`} tone="success" />
              ))}
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <BottomSheetDrawer testID="company-review-drawer" title={`Write Verified Review for ${activeSlug}`}>
        <input
          aria-label="company-review-title-input"
          value={reviewTitle}
          onChange={(e) => setReviewTitle(e.target.value)}
          placeholder="Review headline..."
          style={inputStyle}
        />
        <input
          aria-label="company-review-body-input"
          value={reviewContent}
          onChange={(e) => setReviewContent(e.target.value)}
          placeholder="Engineering culture, compensation & interview experience..."
          style={inputStyle}
        />
        <ActionButton
          testID="mobile-company-review-btn"
          accessibilityLabel="mobile-company-review-btn"
          label="Submit Company Review (/v1/companies/reviews)"
          onPress={() => {
            if (!reviewTitle.trim() || !reviewContent.trim()) return;
            submitReviewMutation.mutate({
              slug: activeSlug,
              input: { rating: 5, title: reviewTitle.trim(), content: reviewContent.trim() },
            });
            setReviewTitle('');
            setReviewContent('');
          }}
        />
      </BottomSheetDrawer>
    </div>
  );
}
