"use client";

import { useExpertReview } from "@/hooks/use-expert-review";
import { ExpertHero } from "@/components/features/expert-review/expert-hero";
import { PricingTiers } from "@/components/features/expert-review/pricing-tiers";
import { ExpertDirectory } from "@/components/features/expert-review/expert-directory";
import { SampleFeedbackReport } from "@/components/features/expert-review/sample-feedback-report";
import { CandidateOrdersList } from "@/components/features/expert-review/candidate-orders-list";
import { ReviewBookingDialog } from "@/components/features/expert-review/review-booking-dialog";
import { Spinner } from "@/components/ui/spinner";

export default function ExpertReviewPage() {
  const {
    experts,
    packages,
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
    <main className="min-h-screen bg-white">
      {/* 1. Hero Section */}
      <ExpertHero
        onBrowseExperts={scrollToExperts}
        onViewPricing={scrollToPricing}
      />

      {/* 2. Candidate Active Orders (if any) */}
      <CandidateOrdersList
        orders={myOrders}
        onPayOrder={async (id) => {
          await checkoutOrder(id);
        }}
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
        experts={experts}
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
