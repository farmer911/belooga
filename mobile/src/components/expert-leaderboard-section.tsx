import React, { useState } from "react";
import { View } from "react-native";
import {
  EXPERT_LEADERBOARD_CATEGORIES,
  EXPERT_LEADERBOARD_SORT_MODES,
  type ExpertLeaderboardCategory,
  type ExpertLeaderboardSortMode,
  bookExpertOrderInputSchema,
  useApplyExpertReviewerMutation,
  useBookMobileExpertOrderMutation,
  useMobileExpertLeaderboardQuery,
  useMyExpertProfileQuery,
} from "@/hooks/use-mobile-expert-leaderboard";
import { Body, Button, Card, ErrorText, Field, H2, Pill, Row, Sheet, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

function BecomeExpertForm({ category, onDone }: { category: string; onDone: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    roleTitle: "",
    companyName: "",
    years: "",
    specialties: "",
    linkedinUrl: "",
    bio: "",
  });
  const applyMutation = useApplyExpertReviewerMutation();
  const update = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Sheet testID="mobile-become-expert-form" title="Đăng Ký Làm Chuyên Gia Chấm CV">
      <Field testID="become-expert-name-input" value={form.fullName} onChangeText={update("fullName")} placeholder="Full name" autoCapitalize="words" />
      <Field testID="become-expert-role-input" value={form.roleTitle} onChangeText={update("roleTitle")} placeholder="Role title" />
      <Field testID="become-expert-company-input" value={form.companyName} onChangeText={update("companyName")} placeholder="Company" />
      <Field testID="become-expert-years-input" value={form.years} onChangeText={update("years")} placeholder="Years of experience" keyboardType="number-pad" />
      <Field testID="become-expert-specialties-input" value={form.specialties} onChangeText={update("specialties")} placeholder="Specialties (comma separated)" />
      <Field testID="become-expert-linkedin-input" value={form.linkedinUrl} onChangeText={update("linkedinUrl")} placeholder="LinkedIn URL" keyboardType="url" />
      <Field testID="become-expert-bio-input" value={form.bio} onChangeText={update("bio")} placeholder="Mentoring bio" multiline />
      <Button
        testID="mobile-become-expert-submit-btn"
        label={applyMutation.isPending ? "Submitting..." : "Hoàn Tất Đăng Ký"}
        disabled={applyMutation.isPending}
        onPress={() =>
          applyMutation.mutate(
            {
              full_name: form.fullName,
              role_title: form.roleTitle,
              company_name: form.companyName,
              years_experience: Number(form.years) || 1,
              category: category === "all" ? "backend" : category,
              specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
              turnaround_hours: 24,
              hourly_rate_vnd: 299000,
              linkedin_url: form.linkedinUrl.trim(),
              bio: form.bio,
            },
            { onSuccess: onDone }
          )
        }
      />
      <ErrorText error={applyMutation.error} />
    </Sheet>
  );
}

export function ExpertLeaderboardSection() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const [category, setCategory] = useState<ExpertLeaderboardCategory>("all");
  const [sortBy, setSortBy] = useState<ExpertLeaderboardSortMode>("rank");
  const [applyOpen, setApplyOpen] = useState(false);
  const leaderboardQuery = useMobileExpertLeaderboardQuery({ category, sort_by: sortBy });
  const myExpertQuery = useMyExpertProfileQuery();
  const bookMutation = useBookMobileExpertOrderMutation();
  const items = leaderboardQuery.data?.items ?? [];

  return (
    <View testID="mobile-expert-leaderboard-section" style={{ gap: 12 }}>
      {isAuthenticated ? (
        <Well testID="mobile-expert-me-card">
          {myExpertQuery.data ? (
            <Body>
              Active expert: {myExpertQuery.data.full_name} ({myExpertQuery.data.company_name}) • SLA{" "}
              {myExpertQuery.data.turnaround_hours}h
            </Body>
          ) : (
            <>
              <Body>Become a verified expert reviewer (299k VND/CV).</Body>
              <Button testID="mobile-become-expert-open-btn" label="+ Đăng Ký Làm Chuyên Gia" onPress={() => setApplyOpen((v) => !v)} />
            </>
          )}
        </Well>
      ) : null}
      {applyOpen ? <BecomeExpertForm category={category} onDone={() => setApplyOpen(false)} /> : null}

      <Card testID="expert-leaderboard-controls">
        <H2>Expert Reviewer Leaderboard</H2>
        <Row>
          {EXPERT_LEADERBOARD_CATEGORIES.map((cat) => (
            <Button key={cat} testID={`mobile-expert-category-${cat}`} label={cat.toUpperCase()} variant={category === cat ? "primary" : "secondary"} onPress={() => setCategory(cat)} />
          ))}
        </Row>
        <Row>
          {EXPERT_LEADERBOARD_SORT_MODES.map((mode) => (
            <Button key={mode} testID={`mobile-expert-sort-${mode}`} label={`Sort: ${mode}`} variant={sortBy === mode ? "primary" : "inset"} onPress={() => setSortBy(mode)} />
          ))}
        </Row>
        <ErrorText error={leaderboardQuery.error ?? bookMutation.error} />
        {bookMutation.data ? (
          <Body testID="mobile-expert-booking-status" tone="success">
            Order {bookMutation.data.order_id}: {bookMutation.data.status}
          </Body>
        ) : null}
        {items.map((exp) => (
          <Well key={exp.id} testID={`mobile-expert-leaderboard-card-${exp.id}`}>
            <H2>
              #{exp.rank_position} {exp.name} — {exp.badge_title}
            </H2>
            <Body>{exp.title}</Body>
            <Row>
              <Pill label={`${exp.ranking_score} pts`} />
              <Pill testID={`expert-ats-lift-${exp.id}`} label={`+${exp.avg_ats_lift_points} ATS pts`} tone="success" />
              <Pill testID={`expert-rating-${exp.id}`} label={`Rating ${exp.rating} (${exp.completed_reviews_count} CVs)`} />
              <Pill testID={`expert-sla-${exp.id}`} label={`${exp.avg_turnaround_hours}h avg SLA`} tone="neutral" />
              <Pill testID={`expert-callback-rate-${exp.id}`} label={`${exp.interview_callback_rate}% interview rate`} tone="warning" />
            </Row>
            {isAuthenticated ? (
              <Button
                testID={`mobile-expert-book-btn-${exp.id}`}
                label={`Book Expert (${exp.price_vnd / 1000}k VND)`}
                disabled={bookMutation.isPending}
                onPress={() => bookMutation.mutate(bookExpertOrderInputSchema.parse({ expert_id: exp.id }))}
              />
            ) : null}
          </Well>
        ))}
      </Card>
    </View>
  );
}
