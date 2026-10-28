import React, { useState } from "react";
import { router } from "expo-router";
import {
  TOP_CANDIDATE_CATEGORIES,
  type TopCandidateCategory,
  formatTopCandidateTierLabel,
  useMobileTopCandidatesQuery,
} from "@/hooks/use-mobile-top-candidates";
import { Body, Button, Card, ErrorText, H2, Pill, Row, Well } from "@/lib/ui";

export function TopCandidatesSection() {
  const [category, setCategory] = useState<TopCandidateCategory>("all");
  const [activelyLookingOnly, setActivelyLookingOnly] = useState(true);
  const topQuery = useMobileTopCandidatesQuery({ category, actively_looking_only: activelyLookingOnly, limit: 6 });
  const items = topQuery.data?.items ?? [];

  return (
    <Card testID="mobile-top-candidates-section">
      <H2>Top High-Potential Candidates</H2>
      <Row>
        <Button
          testID="mobile-top-candidates-active-toggle"
          label={activelyLookingOnly ? "Ready Now ✓" : "All Statuses"}
          variant={activelyLookingOnly ? "primary" : "secondary"}
          onPress={() => setActivelyLookingOnly((v) => !v)}
        />
        {TOP_CANDIDATE_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            testID={`mobile-top-candidates-category-${cat}`}
            label={cat.toUpperCase()}
            variant={category === cat ? "primary" : "secondary"}
            onPress={() => setCategory(cat)}
          />
        ))}
      </Row>
      <ErrorText error={topQuery.error} />
      {items.map((cand) => (
        <Well key={cand.username} testID={`mobile-top-candidate-card-${cand.username}`}>
          <H2>
            #{cand.rank} {cand.full_name} (@{cand.username})
          </H2>
          <Row>
            <Pill testID={`top-candidate-badge-${cand.username}`} label={formatTopCandidateTierLabel(cand.badge_tier)} />
            <Pill testID={`top-candidate-score-${cand.username}`} label={`${cand.potential_score}/100 pts`} tone="success" />
          </Row>
          <Body tone="brand">{cand.headline}</Body>
          <Body testID={`top-candidate-reason-${cand.username}`}>{cand.highlight_reason}</Body>
          <Button
            testID={`top-candidate-view-btn-${cand.username}`}
            label="Watch Pitch & Profile"
            variant="secondary"
            onPress={() => router.push({ pathname: "/candidate/[username]", params: { username: cand.username } })}
          />
        </Well>
      ))}
    </Card>
  );
}
