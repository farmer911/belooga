import React, { useState } from "react";
import { ActionButton, mobileRouter, ScreenShell, SurfaceCard } from "@/lib/native-runtime";
import {
  useMobileCandidateSearchQuery,
  useMobileTrendingInsightsQuery,
} from "@/hooks/use-mobile-discovery";

export default function MobileDiscoveryFeedScreen() {
  const [queryText, setQueryText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const searchQuery = useMobileCandidateSearchQuery({
    q: queryText,
    skill: selectedSkill,
    cursor,
  });
  const trendingQuery = useMobileTrendingInsightsQuery();

  const candidates = searchQuery.data?.items ?? [];
  const trendingSkills = trendingQuery.data?.trending_skills ?? [];

  return (
    <ScreenShell testID="mobile-discovery-feed-screen" mode="dark">
      <SurfaceCard testID="mobile-search-filter-bar" mode="dark">
        <h1 data-testid="mobile-discovery-heading">Talent Discovery & 60s Pitch Feed</h1>
        <input
          data-testid="mobile-search-input"
          value={queryText}
          placeholder="Search skills, roles, or companies..."
          onChange={(e) => {
            setQueryText(e.target.value);
            setCursor(undefined);
          }}
        />
        <div data-testid="mobile-trending-skill-chips">
          {trendingSkills.map((skill) => (
            <ActionButton
              key={skill.name}
              testID={`mobile-skill-chip-${skill.name}`}
              label={`${skill.name} (${skill.candidate_count})`}
              variant={selectedSkill === skill.name ? "primary" : "secondary"}
              onPress={() => {
                setSelectedSkill(selectedSkill === skill.name ? undefined : skill.name);
                setCursor(undefined);
              }}
            />
          ))}
        </div>
      </SurfaceCard>

      <div data-testid="mobile-candidate-pitch-list">
        {candidates.map((candidate) => (
          <SurfaceCard
            key={candidate.username}
            testID={`mobile-candidate-card-${candidate.username}`}
            mode="dark"
          >
            <h2 data-testid={`mobile-candidate-name-${candidate.username}`}>
              {candidate.first_name} {candidate.last_name}
            </h2>
            <p data-testid={`mobile-candidate-headline-${candidate.username}`}>
              {candidate.headline}
            </p>
            <span data-testid={`mobile-candidate-trust-${candidate.username}`}>
              Trust Score: {candidate.trust_score}%
            </span>
            <ActionButton
              testID={`mobile-open-candidate-${candidate.username}`}
              label="Watch 60s Video Pitch & Timeline"
              onPress={() =>
                mobileRouter.push(`/candidate/${candidate.username}`, {
                  username: candidate.username,
                })
              }
            />
          </SurfaceCard>
        ))}
      </div>

      {searchQuery.data?.next_cursor ? (
        <ActionButton
          testID="mobile-search-load-more"
          label="Load Next Batch"
          variant="secondary"
          onPress={() => setCursor(searchQuery.data?.next_cursor ?? undefined)}
        />
      ) : null}
    </ScreenShell>
  );
}
