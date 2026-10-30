import React, { useState } from "react";
import {
  COMPANY_INDUSTRIES,
  COMPANY_LOCATIONS,
  useMobileCompaniesSearchQuery,
  useMobileCompanyProfileQuery,
  useSubmitMobileCompanyReviewMutation,
} from "@/hooks/use-mobile-companies";
import { Body, Button, Card, ErrorText, Field, H2, Pill, Row, Sheet, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

type CompanyDetailTab = "overview" | "jobs" | "reviews" | "alumni";
const DETAIL_TABS: { key: CompanyDetailTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "jobs", label: "Open Jobs" },
  { key: "reviews", label: "Reviews" },
  { key: "alumni", label: "Alumni" },
];

function CompanyReviewForm({ slug }: { slug: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const submitReviewMutation = useSubmitMobileCompanyReviewMutation();
  return (
    <Sheet testID="company-review-drawer" title="Write a Verified Review">
      <Row>
        {[1, 2, 3, 4, 5].map((n) => (
          <Button key={n} testID={`company-review-rating-${n}`} label={`${n}/5`} variant={rating === n ? "primary" : "inset"} onPress={() => setRating(n)} />
        ))}
      </Row>
      <Field testID="company-review-title-input" value={title} onChangeText={setTitle} placeholder="Review headline..." />
      <Field
        testID="company-review-body-input"
        value={content}
        onChangeText={setContent}
        placeholder="Engineering culture, compensation & interview experience..."
        multiline
      />
      <Button
        testID="mobile-company-review-btn"
        label="Submit Company Review"
        disabled={!title.trim() || !content.trim() || submitReviewMutation.isPending}
        onPress={() =>
          submitReviewMutation.mutate(
            { slug, input: { rating, title: title.trim(), content: content.trim() } },
            {
              onSuccess: () => {
                setTitle("");
                setContent("");
              },
            }
          )
        }
      />
      <ErrorText error={submitReviewMutation.error} />
    </Sheet>
  );
}

export function CompaniesDirectorySection() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("All");
  const [location, setLocation] = useState<string>("All");
  const [hiringOnly, setHiringOnly] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [detailTab, setDetailTab] = useState<CompanyDetailTab>("overview");

  const searchQuery = useMobileCompaniesSearchQuery({ q: q || undefined, industry, location, hiring_only: hiringOnly, sort_by: "rating" });
  const detailQuery = useMobileCompanyProfileQuery(activeSlug);
  const companies = searchQuery.data?.items ?? [];
  const profile = detailQuery.data;

  return (
    <>
      <Card testID="mobile-companies-section">
        <H2>Company Directory</H2>
        <Field testID="mobile-company-search-input" value={q} onChangeText={setQ} placeholder="Search company name, tech stack, industry..." />
        <Row>
          {COMPANY_INDUSTRIES.map((ind) => (
            <Button key={ind} testID={`company-industry-${ind}`} label={ind} variant={industry === ind ? "primary" : "secondary"} onPress={() => setIndustry(ind)} />
          ))}
        </Row>
        <Row>
          {COMPANY_LOCATIONS.map((loc) => (
            <Button key={loc} testID={`company-location-${loc}`} label={loc} variant={location === loc ? "primary" : "secondary"} onPress={() => setLocation(loc)} />
          ))}
          <Button
            testID="company-hiring-only-toggle"
            label={hiringOnly ? "Hiring Now ✓" : "Hiring Now"}
            variant={hiringOnly ? "primary" : "secondary"}
            onPress={() => setHiringOnly((v) => !v)}
          />
        </Row>
        <ErrorText error={searchQuery.error} />
        {companies.map((c) => (
          <Well key={c.slug} testID={`mobile-company-card-${c.slug}`}>
            <H2>{c.name}</H2>
            <Body>
              {c.industry} • {c.location} • Rating {c.avg_rating} ({c.review_count}) • ${c.avg_salary_usd}/mo
            </Body>
            <Button testID={`company-card-link-${c.slug}`} label={`View (${c.open_jobs_count} jobs)`} variant="secondary" onPress={() => setActiveSlug(c.slug)} />
          </Well>
        ))}
      </Card>

      {activeSlug ? (
        <Card testID="mobile-company-profile-card">
          <H2>{profile?.name ?? activeSlug}</H2>
          <Row>
            {DETAIL_TABS.map((t) => (
              <Button key={t.key} testID={`company-tab-${t.key}`} label={t.label} variant={detailTab === t.key ? "primary" : "secondary"} onPress={() => setDetailTab(t.key)} />
            ))}
          </Row>
          <ErrorText error={detailQuery.error} />
          {profile && detailTab === "overview" ? (
            <Body>
              {profile.description} • Stack: {profile.tech_stack.join(", ")}
            </Body>
          ) : null}
          {profile && detailTab === "jobs"
            ? profile.open_jobs.map((job) => <Pill key={job.id} label={`${job.title} (${job.salary_range})`} />)
            : null}
          {profile && detailTab === "reviews"
            ? profile.reviews.map((r) => (
                <Well key={r.id}>
                  <Body>
                    {r.rating}/5 · {r.title} — @{r.author_username}
                  </Body>
                  <Body>{r.content}</Body>
                </Well>
              ))
            : null}
          {profile && detailTab === "alumni"
            ? profile.alumni.map((al) => <Pill key={al.username} label={`${al.full_name} (@${al.username})`} tone="success" />)
            : null}
        </Card>
      ) : null}

      {activeSlug && isAuthenticated ? <CompanyReviewForm slug={activeSlug} /> : null}
    </>
  );
}
