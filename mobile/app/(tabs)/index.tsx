import React, { useState } from "react";
import {
  ActionButton,
  BadgePill,
  mobileRouter,
  ScreenShell,
  SurfaceCard,
} from "@/lib/native-runtime";
import {
  useMobileCandidateSearchQuery,
  useMobileSearchSuggestionsQuery,
  useMobileTrendingInsightsQuery,
} from "@/hooks/use-mobile-discovery";
import { getSemanticTokens } from "@/theme/tokens";

export default function MobileDiscoveryFeedScreen() {
  const tokens = getSemanticTokens("dark");
  const [queryText, setQueryText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const searchQuery = useMobileCandidateSearchQuery({
    q: queryText,
    skill: selectedSkill,
    cursor,
  });
  const suggestionsQuery = useMobileSearchSuggestionsQuery(queryText);
  const trendingQuery = useMobileTrendingInsightsQuery();

  const candidates = searchQuery.data?.items ?? [];
  const trendingSkills = trendingQuery.data?.trending_skills ?? [];
  const suggestions = suggestionsQuery.data ?? [];

  return (
    <ScreenShell testID="mobile-discovery-feed-screen" mode="dark">
      <SurfaceCard testID="mobile-search-filter-bar" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BadgePill label="TALENT DISCOVERY • <15MS GIN" tone="brand" />
          <BadgePill label={`${searchQuery.data?.total ?? candidates.length} Verified`} tone="success" />
        </div>
        <h1
          data-testid="mobile-discovery-heading"
          style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.typography.heading }}
        >
          Talent Discovery & 60s Pitch Feed
        </h1>
        <input
          data-testid="mobile-search-input"
          value={queryText}
          placeholder="Search skills (FastAPI, PostgreSQL, React Native)..."
          onChange={(e) => {
            setQueryText(e.target.value);
            setCursor(undefined);
          }}
          style={{
            backgroundColor: tokens.surface.elevated,
            color: tokens.typography.main,
            border: `1px solid ${tokens.surface.border}`,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 14,
          }}
        />
        {suggestions.length > 0 ? (
          <div data-testid="mobile-search-suggestions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map((sug) => (
              <ActionButton
                key={sug}
                testID={`mobile-suggest-${sug}`}
                label={sug}
                variant="secondary"
                onPress={() => setQueryText(sug)}
              />
            ))}
          </div>
        ) : null}
        <div data-testid="mobile-trending-skill-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div data-testid="mobile-candidate-pitch-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {candidates.map((candidate) => (
          <SurfaceCard
            key={candidate.username}
            testID={`mobile-candidate-card-${candidate.username}`}
            mode="dark"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2
                data-testid={`mobile-candidate-name-${candidate.username}`}
                style={{ margin: 0, fontSize: 17, fontWeight: 700, color: tokens.typography.heading }}
              >
                {candidate.first_name} {candidate.last_name} (@{candidate.username})
              </h2>
              <BadgePill
                testID={`mobile-candidate-trust-${candidate.username}`}
                label={`Trust Score: ${candidate.trust_score}%`}
                tone="success"
              />
            </div>
            <p
              data-testid={`mobile-candidate-headline-${candidate.username}`}
              style={{ margin: 0, fontSize: 14, color: tokens.brand.primary, fontWeight: 600 }}
            >
              {candidate.headline}
            </p>
            {candidate.skills.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {candidate.skills.map((sk) => (
                  <BadgePill key={sk} label={sk} tone="neutral" />
                ))}
              </div>
            ) : null}
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
