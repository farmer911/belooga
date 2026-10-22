import React, { useState } from "react";
import {
  ActionButton,
  BadgePill,
  BottomSheetDrawer,
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
  computeCandidateSkillMatch,
  useCreateMobileCustomSkillMutation,
  useMobileCandidateSearchQuery,
  useMobileSearchSuggestionsQuery,
  useMobileSkillCatalogQuery,
  useMobileTrendingInsightsQuery,
} from "@/hooks/use-mobile-discovery";
import { getSemanticTokens } from "@/theme/tokens";

const DEFAULT_SKILL_CHIPS = ["Golang", "Python", "React", "TypeScript", "Kubernetes", "PostgreSQL", "AI/LLM"];

export default function MobileDiscoveryFeedScreen() {
  const tokens = getSemanticTokens("dark");
  const [queryText, setQueryText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSkillsAdded, setCustomSkillsAdded] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const inputStyle = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
  };

  const searchQuery = useMobileCandidateSearchQuery({
    q: queryText,
    skill: selectedSkills[0],
    skills: selectedSkills,
    cursor,
  });
  const suggestionsQuery = useMobileSearchSuggestionsQuery(queryText);
  const trendingQuery = useMobileTrendingInsightsQuery();
  const skillCatalogQuery = useMobileSkillCatalogQuery();
  const createCustomSkillMutation = useCreateMobileCustomSkillMutation();
  const bookmarksQuery = useMobileBookmarksQuery();
  const toggleBookmarkMutation = useToggleMobileBookmarkMutation();

  const candidates = searchQuery.data?.items ?? [];
  const trendingSkills = trendingQuery.data?.trending_skills ?? [];
  const catalogSkills = (skillCatalogQuery.data ?? []).map((s) => s.name);
  const suggestions = suggestionsQuery.data ?? [];
  const bookmarks = bookmarksQuery.data ?? [];

  const mergedSkillNames = Array.from(
    new Set([
      ...trendingSkills.map((s) => s.name),
      ...catalogSkills,
      ...customSkillsAdded,
      ...DEFAULT_SKILL_CHIPS,
    ])
  );

  const toggleSkillSelection = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
    setCursor(undefined);
  };

  const handleAddCustomSkill = async () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    try {
      const created = await createCustomSkillMutation.mutateAsync({ name: clean });
      const addedName = created.name || clean;
      setCustomSkillsAdded((prev) => (prev.includes(addedName) ? prev : [...prev, addedName]));
      setSelectedSkills((prev) => (prev.includes(addedName) ? prev : [...prev, addedName]));
      setCustomSkillInput("");
      setCursor(undefined);
    } catch {
      setCustomSkillsAdded((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      setSelectedSkills((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      setCustomSkillInput("");
    }
  };

  const visibleCandidates = showSavedOnly
    ? candidates.filter((c) => isCandidateBookmarked(bookmarks, c.username))
    : candidates;

  return (
    <ScreenShell testID="mobile-discovery-feed-screen" mode="dark">
      <SurfaceCard testID="mobile-search-filter-bar" mode="dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <BadgePill label="TALENT DISCOVERY • <15MS GIN" tone="brand" />
          <ActionButton
            testID="filter-saved-shortlist-chip"
            accessibilityLabel="filter-saved-shortlist-chip"
            label={`Saved Shortlist (${bookmarks.length})`}
            variant={showSavedOnly ? "primary" : "secondary"}
            style={{ minHeight: 44, padding: "8px 14px" }}
            onPress={() => setShowSavedOnly((prev) => !prev)}
          />
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
          style={inputStyle}
        />
        <BottomSheetDrawer testID="mobile-bottom-sheet-drawer" title="Multi-Skill Filter & Custom Skill Drawer">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <input
              data-testid="mobile-custom-skill-input"
              aria-label="mobile-custom-skill-input"
              value={customSkillInput}
              placeholder="+ Nhập skill mới (VD: Rust, Zig, GraphQL)..."
              onChange={(e) => setCustomSkillInput(e.target.value)}
              style={inputStyle}
            />
            <ActionButton
              testID="mobile-add-custom-skill-btn"
              accessibilityLabel="mobile-add-custom-skill-btn"
              label="+ Thêm Skill Mới"
              style={{ minHeight: 48, padding: "8px 14px" }}
              onPress={() => void handleAddCustomSkill()}
            />
          </div>
          <div data-testid="mobile-trending-skill-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {mergedSkillNames.map((skillName) => {
              const trendingMeta = trendingSkills.find((t) => t.name === skillName);
              const active = selectedSkills.includes(skillName);
              return (
                <ActionButton
                  key={skillName}
                  testID={`mobile-skill-chip-${skillName}`}
                  accessibilityLabel={`mobile-skill-chip-${skillName}`}
                  label={trendingMeta ? `${skillName} (${trendingMeta.candidate_count})` : skillName}
                  variant={active ? "primary" : "secondary"}
                  onPress={() => toggleSkillSelection(skillName)}
                />
              );
            })}
          </div>
        </BottomSheetDrawer>
      </SurfaceCard>

      {showSavedOnly && bookmarks.length === 0 ? (
        <SurfaceCard testID="shortlist-empty-state" mode="dark">
          <p style={{ margin: 0, color: tokens.typography.muted, fontSize: 14 }}>
            No candidates saved yet. Bookmark profiles while browsing search results to compare them here.
          </p>
          <ActionButton
            testID="shortlist-back-to-filters-btn"
            label="Back to Search Filters"
            variant="secondary"
            onPress={() => setShowSavedOnly(false)}
          />
        </SurfaceCard>
      ) : null}

      <div data-testid="mobile-candidate-pitch-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleCandidates.map((candidate) => {
          const bookmarked = isCandidateBookmarked(bookmarks, candidate.username);
          const skillMatch = computeCandidateSkillMatch(candidate.skills, selectedSkills);
          return (
            <SurfaceCard
              key={candidate.username}
              testID={`mobile-candidate-card-${candidate.username}`}
              mode="dark"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2
                  data-testid={`mobile-candidate-name-${candidate.username}`}
                  style={{ margin: 0, fontSize: 17, fontWeight: 700, color: tokens.typography.heading }}
                >
                  {candidate.first_name} {candidate.last_name} (@{candidate.username})
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <BadgePill
                    testID={`mobile-skill-match-badge-${candidate.username}`}
                    label={skillMatch.label}
                    tone="brand"
                  />
                  <BadgePill
                    testID={`mobile-candidate-trust-${candidate.username}`}
                    label={`Trust Score: ${candidate.trust_score}%`}
                    tone="success"
                  />
                  <ActionButton
                    testID={`bookmark-candidate-${candidate.username}`}
                    accessibilityLabel={`bookmark-candidate-${candidate.username}`}
                    label={bookmarked ? "Saved" : "Save"}
                    variant={bookmarked ? "primary" : "secondary"}
                    disabled={toggleBookmarkMutation.isPending}
                    style={{ minWidth: 44, minHeight: 44, padding: "8px 12px" }}
                    onPress={() =>
                      toggleBookmarkMutation.mutate({
                        username: candidate.username,
                        currentlyBookmarked: bookmarked,
                      })
                    }
                  />
                </div>
              </div>
              <p
                data-testid={`mobile-candidate-headline-${candidate.username}`}
                style={{ margin: 0, fontSize: 14, color: tokens.brand.primary, fontWeight: 600 }}
              >
                {candidate.headline}
              </p>
              {candidate.skills.length > 0 ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {candidate.skills.map((sk) => {
                    const isMatched = selectedSkills.some(
                      (sel) => sel.toLowerCase() === sk.toLowerCase()
                    );
                    return (
                      <BadgePill
                        key={sk}
                        label={sk}
                        tone={isMatched ? "brand" : "neutral"}
                      />
                    );
                  })}
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <ActionButton
                  testID={`mobile-watch-pitch-${candidate.username}`}
                  accessibilityLabel={`mobile-watch-pitch-${candidate.username}`}
                  label="0:30 Video Pitch"
                  variant="secondary"
                  onPress={() =>
                    mobileRouter.push(`/candidate/${candidate.username}`, {
                      username: candidate.username,
                    })
                  }
                />
                <ActionButton
                  testID={`mobile-open-candidate-${candidate.username}`}
                  label="Watch 60s Video Pitch & Timeline"
                  onPress={() =>
                    mobileRouter.push(`/candidate/${candidate.username}`, {
                      username: candidate.username,
                    })
                  }
                />
              </div>
            </SurfaceCard>
          );
        })}
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

