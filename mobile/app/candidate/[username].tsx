import React from "react";
import {
  ActionButton,
  BadgePill,
  mobileRouter,
  ScreenShell,
  SurfaceCard,
} from "@/lib/native-runtime";
import {
  isCandidateBookmarked,
  useMobileBookmarksQuery,
  useToggleMobileBookmarkMutation,
} from "@/hooks/use-mobile-bookmarks";
import {
  buildCandidatePdfExportUrl,
  useMobileCandidateProfileQuery,
} from "@/hooks/use-mobile-discovery";
import { getSemanticTokens } from "@/theme/tokens";

export interface MobileCandidateProfileScreenProps {
  username?: string;
}

export default function MobileCandidateProfileScreen({
  username,
}: MobileCandidateProfileScreenProps) {
  const tokens = getSemanticTokens("dark");
  const resolvedUsername =
    username ?? mobileRouter.getState().params.username ?? "alexnguyen";
  const profileBundleQuery = useMobileCandidateProfileQuery(resolvedUsername);
  const bookmarksQuery = useMobileBookmarksQuery();
  const toggleBookmarkMutation = useToggleMobileBookmarkMutation();
  const bundle = profileBundleQuery.data;
  const bookmarked = isCandidateBookmarked(bookmarksQuery.data, resolvedUsername);

  const pdfExportUrl = buildCandidatePdfExportUrl(resolvedUsername);

  return (
    <ScreenShell testID="mobile-candidate-profile-screen" mode="dark">
      <SurfaceCard testID="mobile-candidate-header-card" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <ActionButton
            testID="mobile-candidate-back"
            label="Back to Feed"
            variant="secondary"
            onPress={() => mobileRouter.back()}
          />
          <ActionButton
            testID="public-profile-bookmark-btn"
            accessibilityLabel={`bookmark-candidate-${resolvedUsername}`}
            label={bookmarked ? "Saved in Shortlist" : "Save to Shortlist"}
            variant={bookmarked ? "primary" : "secondary"}
            disabled={toggleBookmarkMutation.isPending}
            style={{ minHeight: 44 }}
            onPress={() =>
              toggleBookmarkMutation.mutate({
                username: resolvedUsername,
                currentlyBookmarked: bookmarked,
              })
            }
          />
        </div>
        {bundle ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1
                data-testid="mobile-profile-fullname"
                style={{ margin: 0, fontSize: 21, fontWeight: 800, color: tokens.typography.heading }}
              >
                {bundle.profile.first_name} {bundle.profile.last_name}
              </h1>
              <BadgePill
                testID="mobile-profile-trust-badge"
                label={`${bundle.trust.tier} (${bundle.trust.trust_score}%)`}
                tone="success"
              />
            </div>
            <p
              data-testid="mobile-profile-headline"
              style={{ margin: 0, color: tokens.brand.primary, fontWeight: 600 }}
            >
              {bundle.profile.headline}
            </p>
            <div
              data-testid="mobile-profile-video-pitch"
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                fontSize: 13,
              }}
            >
              60s Video Pitch: {bundle.profile.video_url ?? "No video uploaded"}
            </div>
            <div data-testid="mobile-profile-trajectory-years" style={{ fontWeight: 700 }}>
              Total Verified Experience: {bundle.trajectory.total_years_experience} yrs
            </div>
            <div
              data-testid="mobile-profile-timeline-list"
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {bundle.profile.job_experiences.map((exp) => (
                <div
                  key={exp.id}
                  data-testid={`mobile-job-exp-${exp.id}`}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: tokens.surface.elevated,
                    border: `1px solid ${tokens.surface.border}`,
                  }}
                >
                  {exp.title} at {exp.company_name} ({exp.start_date})
                </div>
              ))}
            </div>
            <a
              data-testid="mobile-profile-pdf-export-link"
              href={pdfExportUrl}
              style={{
                display: "inline-block",
                textAlign: "center",
                backgroundColor: tokens.brand.primary,
                color: tokens.typography.inverse,
                fontWeight: 700,
                padding: "12px 16px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Export 1-Click ATS PDF Resume
            </a>
          </>
        ) : (
          <div data-testid="mobile-profile-loading">Loading Candidate Profile...</div>
        )}
      </SurfaceCard>
    </ScreenShell>
  );
}
