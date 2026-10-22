import React, { useState } from 'react';
import {
  EXPERT_LEADERBOARD_CATEGORIES,
  EXPERT_LEADERBOARD_SORT_MODES,
  type ExpertLeaderboardCategory,
  type ExpertLeaderboardSortMode,
  useApplyExpertReviewerMutation,
  useBookMobileExpertOrderMutation,
  useMobileExpertLeaderboardQuery,
  useMyExpertProfileQuery,
  useSubmitExpertOrderFeedbackMutation,
} from '@/hooks/use-mobile-expert-leaderboard';
import { ActionButton, BadgePill, BottomSheetDrawer, SurfaceCard } from '@/lib/native-runtime';
import { getSemanticTokens } from '@/theme/tokens';

export function ExpertLeaderboardSection() {
  const tokens = getSemanticTokens('dark');
  const [category, setCategory] = useState<ExpertLeaderboardCategory>('all');
  const [sortBy, setSortBy] = useState<ExpertLeaderboardSortMode>('rank');
  const [feedbackComment, setFeedbackComment] = useState('STAR bullets boosted my ATS score by +28 pts.');
  const [applyOpen, setApplyOpen] = useState(false);
  const [fullName, setFullName] = useState('Nguyen Minh Phuc');
  const [roleTitle, setRoleTitle] = useState('Principal Distributed Systems Engineer');
  const [companyName, setCompanyName] = useState('Grab / Belooga');
  const [specialtiesRaw, setSpecialtiesRaw] = useState('Python, FastAPI, PostgreSQL 16');
  const [bio, setBio] = useState('Hiring committee reviewer for Staff/Principal roles.');

  const leaderboardQuery = useMobileExpertLeaderboardQuery({ category, sort_by: sortBy });
  const myExpertQuery = useMyExpertProfileQuery();
  const applyMutation = useApplyExpertReviewerMutation();
  const bookMutation = useBookMobileExpertOrderMutation();
  const feedbackMutation = useSubmitExpertOrderFeedbackMutation();

  const items = leaderboardQuery.data?.items ?? [];

  const inputStyle: React.CSSProperties = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: '10px 12px',
  };

  return (
    <div
      data-testid="mobile-expert-leaderboard-section"
      aria-label="mobile-expert-leaderboard-section"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SurfaceCard testID="mobile-expert-me-card" mode="dark">
        <div
          aria-label="mobile-expert-me-card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
        >
          <div>
            <strong style={{ fontSize: 14, color: tokens.typography.heading }}>
              {myExpertQuery.data
                ? `Active Expert: ${myExpertQuery.data.full_name} (${myExpertQuery.data.company_name})`
                : 'Become a Verified Expert Reviewer (299k VND/CV)'}
            </strong>
            <div style={{ fontSize: 12, color: tokens.typography.body }}>
              {myExpertQuery.data
                ? `SLA: ${myExpertQuery.data.turnaround_hours}h • Score: ${myExpertQuery.data.ranking_score}`
                : 'Earn 299,000 VND per CV review directly into your Belooga Wallet.'}
            </div>
          </div>
          <ActionButton
            testID="mobile-become-expert-open-btn"
            accessibilityLabel="mobile-become-expert-open-btn"
            label="+ Đăng Ký Làm Chuyên Gia"
            onPress={() => setApplyOpen((v) => !v)}
          />
        </div>
      </SurfaceCard>

      {applyOpen ? (
        <BottomSheetDrawer
          testID="mobile-become-expert-form"
          title="Đăng Ký Làm Chuyên Gia Chấm CV (/v1/expert-review/apply)"
        >
          <input aria-label="become-expert-name-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name..." style={inputStyle} />
          <input aria-label="become-expert-role-input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role Title..." style={inputStyle} />
          <input aria-label="become-expert-company-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name..." style={inputStyle} />
          <input aria-label="become-expert-specialties-input" value={specialtiesRaw} onChange={(e) => setSpecialtiesRaw(e.target.value)} placeholder="Specialties..." style={inputStyle} />
          <input aria-label="become-expert-bio-input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Mentoring bio..." style={inputStyle} />
          <ActionButton
            testID="mobile-become-expert-submit-btn"
            accessibilityLabel="mobile-become-expert-submit-btn"
            label="Hoàn Tất Đăng Ký Chuyên Gia"
            onPress={() => {
              applyMutation.mutate({
                full_name: fullName,
                role_title: roleTitle,
                company_name: companyName,
                years_experience: 10,
                category: category === 'all' ? 'backend' : category,
                specialties: specialtiesRaw.split(',').map((s) => s.trim()).filter(Boolean),
                turnaround_hours: 24,
                hourly_rate_vnd: 299000,
                linkedin_url: 'https://linkedin.com/in/expert',
                bio,
              });
              setApplyOpen(false);
            }}
          />
        </BottomSheetDrawer>
      ) : null}

      <SurfaceCard testID="expert-leaderboard-controls" mode="dark">
        <strong style={{ fontSize: 15, color: tokens.typography.heading }}>
          Expert Reviewer Ranking &amp; Leaderboard (/v1/expert-review/leaderboard)
        </strong>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EXPERT_LEADERBOARD_CATEGORIES.map((cat) => (
            <ActionButton
              key={cat}
              testID={`mobile-expert-category-${cat}`}
              accessibilityLabel={`mobile-expert-category-${cat}`}
              label={cat.toUpperCase()}
              variant={category === cat ? 'primary' : 'secondary'}
              onPress={() => setCategory(cat)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EXPERT_LEADERBOARD_SORT_MODES.map((mode) => (
            <ActionButton
              key={mode}
              testID={`mobile-expert-sort-${mode}`}
              accessibilityLabel={`mobile-expert-sort-${mode}`}
              label={`Sort: ${mode}`}
              variant={sortBy === mode ? 'accent' : 'secondary'}
              onPress={() => setSortBy(mode)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((exp) => (
            <div
              key={exp.id}
              data-testid={`mobile-expert-leaderboard-card-${exp.id}`}
              aria-label={`mobile-expert-leaderboard-card-${exp.id}`}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: tokens.typography.heading }}>
                  #{exp.rank_position} {exp.name} — {exp.badge_title}
                </strong>
                <BadgePill label={`${exp.ranking_score} pts`} tone="brand" />
              </div>
              <span style={{ fontSize: 12, color: tokens.typography.body }}>{exp.title}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <BadgePill testID={`expert-ats-lift-${exp.id}`} label={`+${exp.avg_ats_lift_points} ATS pts`} tone="success" />
                <BadgePill testID={`expert-rating-${exp.id}`} label={`Rating ${exp.rating} (${exp.completed_reviews_count} CVs)`} tone="brand" />
                <BadgePill testID={`expert-sla-${exp.id}`} label={`${exp.avg_turnaround_hours}h avg SLA`} tone="neutral" />
                <BadgePill testID={`expert-callback-rate-${exp.id}`} label={`${exp.interview_callback_rate}% Interview Rate`} tone="warning" />
              </div>
              <ActionButton
                testID={`mobile-expert-book-btn-${exp.id}`}
                accessibilityLabel={`mobile-expert-book-btn-${exp.id}`}
                label={`1-Click Book Expert (${exp.price_vnd / 1000}k VND)`}
                onPress={() =>
                  bookMutation.mutate({
                    expert_id: exp.id,
                    package_id: 'pkg_senior',
                    target_role: 'Staff Backend Engineer',
                  })
                }
              />
            </div>
          ))}
        </div>
      </SurfaceCard>

      <BottomSheetDrawer testID="expert-order-feedback-form" title="Rate Completed Expert Review (#ord_8841)">
        <input aria-label="expert-feedback-comment-input" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} style={inputStyle} />
        <ActionButton
          testID="expert-order-feedback-submit-btn"
          accessibilityLabel="expert-order-feedback-submit-btn"
          label="Submit Rating & Recalculate Leaderboard"
          onPress={() =>
            feedbackMutation.mutate({
              orderId: 'ord_8841',
              input: { rating: 5, ats_lift_achieved: 28, comment: feedbackComment },
            })
          }
        />
      </BottomSheetDrawer>
    </div>
  );
}
