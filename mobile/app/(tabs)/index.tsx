import React, { useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import { CompaniesDirectorySection } from "@/components/companies-directory-section";
import { TopCandidatesSection } from "@/components/top-candidates-section";
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
import type { CandidateSearchCardDTO } from "@/lib/schemas";
import { Body, Button, Card, ErrorText, Field, H1, H2, Pill, Row, Sheet, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";
import { NEUMORPHIC_TOKENS } from "@/theme/tokens";

export default function DiscoveryScreen() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const [queryText, setQueryText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSkillsAdded, setCustomSkillsAdded] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const searchQuery = useMobileCandidateSearchQuery({ q: queryText, skill: selectedSkills[0], skills: selectedSkills, cursor });
  const trendingQuery = useMobileTrendingInsightsQuery();
  const suggestionsQuery = useMobileSearchSuggestionsQuery(queryText);
  const skillCatalogQuery = useMobileSkillCatalogQuery();
  const createCustomSkillMutation = useCreateMobileCustomSkillMutation();
  const bookmarksQuery = useMobileBookmarksQuery();
  const toggleBookmarkMutation = useToggleMobileBookmarkMutation();

  const candidates = searchQuery.data?.items ?? [];
  const trendingSkills = trendingQuery.data?.trending_skills ?? [];
  const bookmarks = bookmarksQuery.data ?? [];
  const mergedSkillNames = Array.from(
    new Set([
      ...trendingSkills.map((s) => s.name),
      ...(skillCatalogQuery.data ?? []).map((s) => s.name),
      ...customSkillsAdded,
    ])
  );
  const visibleCandidates = showSavedOnly
    ? candidates.filter((c) => isCandidateBookmarked(bookmarks, c.username))
    : candidates;

  const setQuery = (text: string) => {
    setQueryText(text);
    setCursor(undefined);
  };

  const toggleSkillSelection = (skillName: string) => {
    setSelectedSkills((prev) => (prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]));
    setCursor(undefined);
  };

  const handleAddCustomSkill = () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    createCustomSkillMutation.mutate(
      { name: clean },
      {
        onSuccess: (created) => {
          const addedName = created.name || clean;
          setCustomSkillsAdded((prev) => (prev.includes(addedName) ? prev : [...prev, addedName]));
          setSelectedSkills((prev) => (prev.includes(addedName) ? prev : [...prev, addedName]));
          setCustomSkillInput("");
          setCursor(undefined);
        },
      }
    );
  };

  const openCandidate = (username: string) =>
    router.push({ pathname: "/candidate/[username]", params: { username } });

  const renderCandidate = ({ item: candidate }: { item: CandidateSearchCardDTO }) => {
    const bookmarked = isCandidateBookmarked(bookmarks, candidate.username);
    const skillMatch = computeCandidateSkillMatch(candidate.skills, selectedSkills);
    return (
      <Card testID={`mobile-candidate-card-${candidate.username}`}>
        <H2 testID={`mobile-candidate-name-${candidate.username}`}>
          {candidate.first_name} {candidate.last_name} (@{candidate.username})
        </H2>
        <Row>
          <Pill testID={`mobile-skill-match-badge-${candidate.username}`} label={skillMatch.label} />
          <Pill testID={`mobile-candidate-trust-${candidate.username}`} label={`Trust Score: ${candidate.trust_score}%`} tone="success" />
        </Row>
        <Body testID={`mobile-candidate-headline-${candidate.username}`} tone="brand">
          {candidate.headline}
        </Body>
        {candidate.skills.length > 0 ? (
          <Row>
            {candidate.skills.map((sk) => (
              <Pill
                key={sk}
                label={sk}
                tone={selectedSkills.some((sel) => sel.toLowerCase() === sk.toLowerCase()) ? "brand" : "neutral"}
              />
            ))}
          </Row>
        ) : null}
        <Row>
          {isAuthenticated ? (
            <Button
              testID={`bookmark-candidate-${candidate.username}`}
              label={bookmarked ? "Saved" : "Save"}
              variant={bookmarked ? "primary" : "secondary"}
              disabled={toggleBookmarkMutation.isPending}
              onPress={() =>
                toggleBookmarkMutation.mutate({ username: candidate.username, currentlyBookmarked: bookmarked })
              }
            />
          ) : null}
          <Button
            testID={`mobile-open-candidate-${candidate.username}`}
            label="Watch Pitch & Timeline"
            onPress={() => openCandidate(candidate.username)}
          />
        </Row>
      </Card>
    );
  };

  const header = (
    <Card testID="mobile-search-filter-bar">
      <Row style={{ justifyContent: "space-between" }}>
        <Pill label="TALENT DISCOVERY" />
        {isAuthenticated ? (
          <Button
            testID="filter-saved-shortlist-chip"
            label={`Saved Shortlist (${bookmarks.length})`}
            variant={showSavedOnly ? "primary" : "inset"}
            onPress={() => setShowSavedOnly((prev) => !prev)}
          />
        ) : null}
      </Row>
      <H1 testID="mobile-discovery-heading">Talent Discovery & 60s Pitch Feed</H1>
      <Field
        testID="mobile-search-input"
        value={queryText}
        placeholder="Search skills (FastAPI, PostgreSQL, React Native)..."
        onChangeText={setQuery}
        returnKeyType="search"
      />
      {(suggestionsQuery.data ?? []).length > 0 ? (
        <Row testID="mobile-search-suggestions">
          {(suggestionsQuery.data ?? []).map((suggestion) => (
            <Button
              key={suggestion}
              testID={`mobile-search-suggestion-${suggestion}`}
              label={suggestion}
              variant="inset"
              onPress={() => setQuery(suggestion)}
            />
          ))}
        </Row>
      ) : null}
      <Sheet testID="mobile-bottom-sheet-drawer" title="Multi-Skill Filter">
        {isAuthenticated ? (
          <Row>
            <Field
              testID="mobile-custom-skill-input"
              style={{ flex: 1 }}
              value={customSkillInput}
              placeholder="+ Nhập skill mới (VD: Rust, Zig)..."
              onChangeText={setCustomSkillInput}
            />
            <Button
              testID="mobile-add-custom-skill-btn"
              label="+ Thêm Skill"
              disabled={createCustomSkillMutation.isPending}
              onPress={handleAddCustomSkill}
            />
          </Row>
        ) : null}
        <ErrorText error={createCustomSkillMutation.error} />
        <Well testID="mobile-trending-skill-chips">
          <Row>
            {mergedSkillNames.map((skillName) => {
              const trendingMeta = trendingSkills.find((t) => t.name === skillName);
              return (
                <Button
                  key={skillName}
                  testID={`mobile-skill-chip-${skillName}`}
                  label={trendingMeta ? `${skillName} (${trendingMeta.candidate_count})` : skillName}
                  variant={selectedSkills.includes(skillName) ? "primary" : "inset"}
                  onPress={() => toggleSkillSelection(skillName)}
                />
              );
            })}
          </Row>
        </Well>
      </Sheet>
      <ErrorText testID="mobile-search-error" error={searchQuery.error} />
      {showSavedOnly && bookmarks.length === 0 ? (
        <Well testID="shortlist-empty-state">
          <Body>No candidates saved yet. Bookmark profiles while browsing search results to compare them here.</Body>
          <Button
            testID="shortlist-back-to-filters-btn"
            label="Back to Search Filters"
            variant="secondary"
            onPress={() => setShowSavedOnly(false)}
          />
        </Well>
      ) : null}
    </Card>
  );

  const footer = (
    <>
      {searchQuery.data?.next_cursor ? (
        <Button
          testID="mobile-search-load-more"
          label="Load Next Batch"
          variant="secondary"
          onPress={() => setCursor(searchQuery.data?.next_cursor ?? undefined)}
        />
      ) : null}
      <TopCandidatesSection />
      <CompaniesDirectorySection />
    </>
  );

  return (
    <FlatList
      testID="mobile-candidate-pitch-list"
      style={styles.list}
      contentContainerStyle={styles.content}
      data={visibleCandidates}
      keyExtractor={(c) => c.username}
      renderItem={renderCandidate}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={
        searchQuery.isPending ? undefined : <Body testID="mobile-search-empty">No candidates match these filters.</Body>
      }
      refreshing={searchQuery.isRefetching}
      onRefresh={() => void searchQuery.refetch()}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: NEUMORPHIC_TOKENS.canvas },
  content: { padding: 16, gap: 14 },
});
