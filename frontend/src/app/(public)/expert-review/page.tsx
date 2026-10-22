"use client";

import { useState, useEffect } from "react";
import { useExpertReview } from "@/hooks/use-expert-review";
import { ExpertHero } from "@/components/features/expert-review/expert-hero";
import { PricingTiers } from "@/components/features/expert-review/pricing-tiers";
import { ExpertDirectory } from "@/components/features/expert-review/expert-directory";
import { SampleFeedbackReport } from "@/components/features/expert-review/sample-feedback-report";
import { CandidateOrdersList } from "@/components/features/expert-review/candidate-orders-list";
import { ReviewBookingDialog } from "@/components/features/expert-review/review-booking-dialog";
import { ExpertLeaderboardSection } from "@/components/features/expert-review/expert-leaderboard-section";
import { ExpertAnalyticsPanel } from "@/components/features/analytics/multi-persona-analytics";
import {
  BecomeExpertSection,
  RegisteredExpertApplication,
  readLocalExpertMe,
  toExpertProfile,
  toRankedExpert,
} from "@/components/features/expert-review/become-expert-modal";
import { Spinner } from "@/components/ui/spinner";

export default function ExpertReviewPage() {
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [registeredApp, setRegisteredApp] = useState<RegisteredExpertApplication | null>(() => readLocalExpertMe());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const oid = new URLSearchParams(window.location.search).get("order_id");
      if (oid) setHighlightedOrderId(oid);
    }
  }, []);

  const {
    experts,
    packages,
    recommendation,
    myOrders,
    selectedCategory,
    isLoading,
    bookingModalOpen,
    selectedPackage,
    selectedExpert,
    setBookingModalOpen,
    handleCategoryFilter,
    createOrder,
    checkoutOrder,
    submitOrderFeedback,
    openBookingForPackage,
    openBookingForExpert,
  } = useExpertReview();

  const scrollToPricing = () => {
    document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToExperts = () => {
    document.getElementById("experts-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-surface-card">
      {/* 1. Hero Section */}
      <ExpertHero
        onBrowseExperts={scrollToExperts}
        onViewPricing={scrollToPricing}
      />

      {recommendation && (
        <section
          data-testid="smart-expert-matcher-banner"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
        >
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-brand-dark uppercase tracking-wider">
                AI Smart Reviewer Match ({recommendation.match_confidence_pct}% Confidence):
              </span>{" "}
              <span className="text-typography-heading">{recommendation.match_rationale}</span>
            </div>
            <button
              onClick={() => openBookingForExpert(recommendation.recommended_expert)}
              className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Book {recommendation.recommended_expert.full_name} (+{recommendation.estimated_ats_lift_points} ATS Pts)
            </button>
          </div>
        </section>
      )}

      {/* 2a. Become an Expert Registration Banner & Modal */}
      <BecomeExpertSection onExpertRegistered={(app) => setRegisteredApp(app)} />

      {/* 2a-2. Expert Performance & Revenue Analytics */}
      <ExpertAnalyticsPanel />

      {/* 2. Candidate Active Orders (if any) */}
      <CandidateOrdersList
        orders={myOrders}
        highlightedOrderId={highlightedOrderId}
        onPayOrder={async (id) => {
          await checkoutOrder(id);
        }}
        onSubmitFeedback={submitOrderFeedback}
      />

      {/* 2b. Expert Leaderboard & Podium */}
      <ExpertLeaderboardSection
        customExperts={registeredApp ? [toRankedExpert(registeredApp)] : []}
        onBookExpert={openBookingForExpert}
      />

      {/* 3. Pricing Tiers */}
      {isLoading && packages.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" variant="primary" />
        </div>
      ) : (
        <PricingTiers
          packages={packages}
          onSelectPackage={openBookingForPackage}
        />
      )}

      {/* 4. Interactive Sample Feedback Report */}
      <SampleFeedbackReport />

      {/* 5. Expert Reviewer Directory */}
      <ExpertDirectory
        experts={registeredApp ? [toExpertProfile(registeredApp), ...experts] : experts}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryFilter}
        onRequestReview={openBookingForExpert}
      />

      {/* 6. Multi-Step Review Booking Dialog */}
      <ReviewBookingDialog
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        selectedPackage={selectedPackage}
        selectedExpert={selectedExpert}
        packages={packages}
        onSubmitOrder={createOrder}
        onCheckout={checkoutOrder}
      />
    </main>
  );
}
