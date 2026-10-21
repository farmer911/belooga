import React from "react";
import { ActionButton, mobileRouter, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  buildCandidatePdfExportUrl,
  useMobileCandidateProfileQuery,
} from "@/hooks/use-mobile-discovery";

export interface MobileCandidateProfileScreenProps {
  username?: string;
}

export default function MobileCandidateProfileScreen({
  username,
}: MobileCandidateProfileScreenProps) {
  const resolvedUsername =
    username ?? mobileRouter.getState().params.username ?? "alexnguyen";
  const profileBundleQuery = useMobileCandidateProfileQuery(resolvedUsername);
  const bundle = profileBundleQuery.data;

  const pdfExportUrl = buildCandidatePdfExportUrl(resolvedUsername);

  return (
    <ScreenShell testID="mobile-candidate-profile-screen" mode="dark">
      <SurfaceCard testID="mobile-candidate-header-card" mode="dark">
        <ActionButton
          testID="mobile-candidate-back"
          label="Back to Feed"
          variant="secondary"
          onPress={() => mobileRouter.back()}
        />
        {bundle ? (
          <>
            <h1 data-testid="mobile-profile-fullname">
              {bundle.profile.first_name} {bundle.profile.last_name}
            </h1>
            <p data-testid="mobile-profile-headline">{bundle.profile.headline}</p>
            <div data-testid="mobile-profile-trust-badge">
              {bundle.trust.tier} ({bundle.trust.trust_score}%)
            </div>
            <div data-testid="mobile-profile-video-pitch">
              Video Pitch: {bundle.profile.video_url ?? "No video uploaded"}
            </div>
            <div data-testid="mobile-profile-trajectory-years">
              Total Experience: {bundle.trajectory.total_years_experience} yrs
            </div>
            <div data-testid="mobile-profile-timeline-list">
              {bundle.profile.job_experiences.map((exp) => (
                <div key={exp.id} data-testid={`mobile-job-exp-${exp.id}`}>
                  {exp.title} at {exp.company_name} ({exp.start_date})
                </div>
              ))}
            </div>
            <a
              data-testid="mobile-profile-pdf-export-link"
              href={pdfExportUrl}
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
