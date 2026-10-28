import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { UserPostsSection } from "@/components/user-posts-section";
import {
  isCandidateBookmarked,
  useMobileBookmarksQuery,
  useToggleMobileBookmarkMutation,
} from "@/hooks/use-mobile-bookmarks";
import { buildCandidatePdfExportUrl, useMobileCandidateProfileQuery } from "@/hooks/use-mobile-discovery";
import { Body, Button, Card, ErrorText, H1, Pill, Row, Screen, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

export default function CandidateProfileScreen() {
  const { username = "" } = useLocalSearchParams<{ username: string }>();
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const profileQuery = useMobileCandidateProfileQuery(username);
  const bookmarksQuery = useMobileBookmarksQuery();
  const toggleBookmarkMutation = useToggleMobileBookmarkMutation();
  const bundle = profileQuery.data;
  const bookmarked = isCandidateBookmarked(bookmarksQuery.data, username);

  return (
    <Screen testID="mobile-candidate-profile-screen">
      <Stack.Screen options={{ title: `@${username}` }} />
      <Card testID="mobile-candidate-header-card">
        {isAuthenticated ? (
          <Button
            testID="public-profile-bookmark-btn"
            label={bookmarked ? "Saved in Shortlist" : "Save to Shortlist"}
            variant={bookmarked ? "primary" : "secondary"}
            disabled={toggleBookmarkMutation.isPending}
            onPress={() => toggleBookmarkMutation.mutate({ username, currentlyBookmarked: bookmarked })}
          />
        ) : null}
        <ErrorText error={profileQuery.error} />
        {bundle ? (
          <>
            <H1 testID="mobile-profile-fullname">
              {bundle.profile.first_name} {bundle.profile.last_name}
            </H1>
            <Pill testID="mobile-profile-trust-badge" label={`${bundle.trust.tier} (${bundle.trust.trust_score}%)`} tone="success" />
            <Body testID="mobile-profile-headline" tone="brand">
              {bundle.profile.headline}
            </Body>
            {bundle.profile.video_url ? (
              <Button
                testID="mobile-profile-video-pitch"
                label="Watch 60s Video Pitch"
                onPress={() => void WebBrowser.openBrowserAsync(bundle.profile.video_url!)}
              />
            ) : (
              <Body testID="mobile-profile-video-pitch">No video pitch uploaded yet.</Body>
            )}
            <Body testID="mobile-profile-trajectory-years">
              Total verified experience: {bundle.trajectory.total_years_experience} yrs
            </Body>
            {bundle.profile.job_experiences.map((exp) => (
              <Well key={exp.id} testID={`mobile-job-exp-${exp.id}`}>
                <Body>
                  {exp.title} at {exp.company_name} ({exp.start_date})
                </Body>
              </Well>
            ))}
            <Row>
              <Button
                testID="mobile-profile-pdf-export-link"
                label="Export ATS PDF Resume"
                variant="secondary"
                onPress={() => void WebBrowser.openBrowserAsync(buildCandidatePdfExportUrl(username))}
              />
            </Row>
          </>
        ) : profileQuery.isPending ? (
          <Body testID="mobile-profile-loading">Loading candidate profile...</Body>
        ) : null}
      </Card>
      <UserPostsSection username={username} isOwner={false} />
    </Screen>
  );
}
