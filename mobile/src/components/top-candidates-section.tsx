import React, { useState } from 'react';
import {
  TOP_CANDIDATE_CATEGORIES,
  type TopCandidateCategory,
  formatTopCandidateTierLabel,
  useMobileTopCandidatesQuery,
} from '@/hooks/use-mobile-top-candidates';
import { useSendRecruiterInviteMutation } from '@/hooks/use-mobile-recruiter-hub';
import { ActionButton, BadgePill, SurfaceCard, mobileRouter } from '@/lib/native-runtime';
import { getSemanticTokens } from '@/theme/tokens';

export function TopCandidatesSection() {
  const tokens = getSemanticTokens('dark');
  const [category, setCategory] = useState<TopCandidateCategory>('all');
  const [activelyLookingOnly, setActivelyLookingOnly] = useState(true);

  const topQuery = useMobileTopCandidatesQuery({
    category,
    actively_looking_only: activelyLookingOnly,
    limit: 6,
  });
  const inviteMutation = useSendRecruiterInviteMutation();

  const items = topQuery.data?.items ?? [];

  return (
    <div
      data-testid="mobile-top-candidates-section"
      aria-label="mobile-top-candidates-section"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SurfaceCard testID="top-candidates-filter-bar" mode="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 15, color: tokens.typography.heading }}>
            Top High-Potential Candidates Leaderboard (/top-candidates)
          </strong>
          <ActionButton
            testID="mobile-top-candidates-active-toggle"
            accessibilityLabel="mobile-top-candidates-active-toggle"
            label={activelyLookingOnly ? '[x] Ready Now' : '[ ] All Status'}
            variant={activelyLookingOnly ? 'accent' : 'secondary'}
            onPress={() => setActivelyLookingOnly((v) => !v)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TOP_CANDIDATE_CATEGORIES.map((cat) => (
            <ActionButton
              key={cat}
              testID={`mobile-top-candidates-category-${cat}`}
              accessibilityLabel={`mobile-top-candidates-category-${cat}`}
              label={cat.toUpperCase()}
              variant={category === cat ? 'primary' : 'secondary'}
              onPress={() => setCategory(cat)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((cand) => (
            <div
              key={cand.username}
              data-testid={`mobile-top-candidate-card-${cand.username}`}
              aria-label={`mobile-top-candidate-card-${cand.username}`}
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
                  #{cand.rank} {cand.full_name} (@{cand.username})
                </strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  <BadgePill
                    testID={`top-candidate-badge-${cand.username}`}
                    label={formatTopCandidateTierLabel(cand.badge_tier)}
                    tone="brand"
                  />
                  <BadgePill
                    testID={`top-candidate-score-${cand.username}`}
                    label={`${cand.potential_score}/100 pts`}
                    tone="success"
                  />
                </div>
              </div>
              <span style={{ fontSize: 12, color: tokens.brand.primary }}>{cand.headline}</span>
              <span
                data-testid={`top-candidate-reason-${cand.username}`}
                style={{ fontSize: 12, color: tokens.typography.body }}
              >
                {cand.highlight_reason}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ActionButton
                  testID={`top-candidate-view-btn-${cand.username}`}
                  accessibilityLabel={`top-candidate-view-btn-${cand.username}`}
                  label="Watch Pitch & Profile"
                  variant="secondary"
                  onPress={() =>
                    mobileRouter.push(`/candidate/${cand.username}`, { username: cand.username })
                  }
                />
                <ActionButton
                  testID={`top-candidate-invite-btn-${cand.username}`}
                  accessibilityLabel={`top-candidate-invite-btn-${cand.username}`}
                  label="1-Click Interview Invite"
                  onPress={() =>
                    inviteMutation.mutate({
                      username: cand.username,
                      job_title: cand.headline || 'Staff Engineer',
                      interview_datetime: '2026-10-28T14:00:00Z',
                      offered_salary_range: '$3,200 - $4,200/mo',
                      custom_video_prompt: 'Share your highest-impact production architecture.',
                      unlock_contact_via_wallet: true,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
