"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";

export interface ExpertProfile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  avatar_url?: string;
  company: string;
  role_category: string;
  years_of_experience: number;
  rating: number;
  total_reviews_count: number;
  turn_around_days: number;
  is_active: boolean;
}

export interface ReviewPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  features: string[];
  turn_around_hours: number;
  is_popular: boolean;
}

export interface ReviewFeedback {
  id: string;
  order_id: string;
  expert_name?: string;
  score_overall: number;
  score_ats_compatibility: number;
  score_impact_action_verbs: number;
  score_structure_formatting: number;
  summary_verdict: string;
  strengths: string[];
  improvements: string[];
  annotated_cv_url?: string;
  video_feedback_url?: string;
  submitted_at: string;
}

export interface ReviewOrder {
  id: string;
  package_name: string;
  package_slug: string;
  expert_name?: string;
  resume_url: string;
  target_role: string;
  target_companies?: string;
  candidate_notes?: string;
  order_status: "pending_payment" | "paid" | "in_review" | "completed" | "cancelled";
  amount_paid_cents: number;
  payment_reference?: string;
  created_at: string;
  feedback?: ReviewFeedback;
}

export interface ExpertRecommendation {
  target_role: string;
  recommended_expert: ExpertProfile;
  recommended_package: ReviewPackage;
  match_confidence_pct: number;
  estimated_ats_lift_points: number;
  match_rationale: string;
}

export function useExpertReview() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ReviewPackage | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);

  const packagesQuery = useQuery<ReviewPackage[]>({
    queryKey: ["expert-review-packages"],
    queryFn: async () => (await apiClient.get<ReviewPackage[]>("/v1/expert-review/packages/")).data,
  });

  const expertsQuery = useQuery<ExpertProfile[]>({
    queryKey: ["expert-review-experts", selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === "All"
          ? "/v1/expert-review/experts/"
          : `/v1/expert-review/experts/?category=${encodeURIComponent(selectedCategory)}`;
      return (await apiClient.get<ExpertProfile[]>(url)).data;
    },
  });

  const recommendationQuery = useQuery<ExpertRecommendation>({
    queryKey: ["expert-review-recommendation", selectedCategory],
    queryFn: async () => {
      const roleHint = selectedCategory === "All" ? "Senior Backend Engineer" : `Senior ${selectedCategory} Engineer`;
      return (
        await apiClient.get<ExpertRecommendation>(
          `/v1/expert-review/recommend?target_role=${encodeURIComponent(roleHint)}`
        )
      ).data;
    },
  });

  const myOrdersQuery = useQuery<ReviewOrder[]>({
    queryKey: ["expert-review-my-orders"],
    queryFn: async () => {
      try {
        return (await apiClient.get<ReviewOrder[]>("/v1/expert-review/orders/me")).data;
      } catch {
        return (await apiClient.get<ReviewOrder[]>("/v1/expert-review/orders/my-orders/")).data;
      }
    },
    enabled: isAuthenticated,
  });

  const packages = packagesQuery.data ?? [];
  const experts = expertsQuery.data ?? [];
  const recommendation = recommendationQuery.data ?? null;
  const myOrders = myOrdersQuery.data ?? [];
  const isLoading = packagesQuery.isLoading || expertsQuery.isLoading;
  const rawError = packagesQuery.error || expertsQuery.error;
  const error = rawError ? getApiErrorDetail(rawError, "Failed to load expert review offerings") : null;

  const fetchMyOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    await myOrdersQuery.refetch();
  }, [isAuthenticated, myOrdersQuery]);

  const handleCategoryFilter = async (category: string) => setSelectedCategory(category);

  const createOrder = async (payload: {
    package_slug: string;
    expert_id?: string;
    resume_url: string;
    target_role: string;
    target_companies?: string;
    candidate_notes?: string;
  }) => {
    const res = await apiClient.post<ReviewOrder>("/v1/expert-review/orders/", payload);
    await queryClient.invalidateQueries({ queryKey: ["expert-review-my-orders"] });
    return res.data;
  };

  const checkoutOrder = async (orderId: string, paymentMethod = "card") => {
    const res = await apiClient.post<ReviewOrder>(
      `/v1/expert-review/orders/${orderId}/checkout/`,
      { payment_method: paymentMethod }
    );
    await queryClient.invalidateQueries({ queryKey: ["expert-review-my-orders"] });
    return res.data;
  };

  const fetchOrderFeedback = async (orderId: string): Promise<ReviewFeedback> =>
    (await apiClient.get<ReviewFeedback>(`/v1/expert-review/orders/${orderId}/feedback/`)).data;

  const submitOrderFeedback = async (
    orderId: string,
    payload: {
      score_overall: number;
      score_ats_compatibility: number;
      score_impact_action_verbs: number;
      score_structure_formatting: number;
      summary_verdict: string;
      strengths: string[];
      improvements: string[];
    }
  ): Promise<ReviewFeedback> => {
    const res = await apiClient.post<ReviewFeedback>(
      `/v1/expert-review/orders/${orderId}/feedback/`,
      payload
    );
    await queryClient.invalidateQueries({ queryKey: ["expert-review-my-orders"] });
    return res.data;
  };

  const simulateOrderDelivery = async (orderId: string): Promise<ReviewOrder> => {
    const res = await apiClient.post<ReviewOrder>(`/v1/expert-review/orders/${orderId}/simulate-delivery`, {});
    await queryClient.invalidateQueries({ queryKey: ["expert-review-my-orders"] });
    return res.data;
  };

  const openBookingForPackage = (pkg: ReviewPackage) => {
    setSelectedPackage(pkg);
    setBookingModalOpen(true);
  };

  const openBookingForExpert = (expert: ExpertProfile) => {
    setSelectedExpert(expert);
    if (!selectedPackage && packages.length > 0) {
      const proPkg = packages.find((p) => p.slug === "pro") || packages[0];
      setSelectedPackage(proPkg);
    }
    setBookingModalOpen(true);
  };

  return {
    experts, packages, recommendation, myOrders, selectedCategory,
    isLoading, error, bookingModalOpen, selectedPackage, selectedExpert,
    setBookingModalOpen, setSelectedPackage, setSelectedExpert,
    handleCategoryFilter, createOrder, checkoutOrder, fetchOrderFeedback,
    submitOrderFeedback, simulateOrderDelivery, openBookingForPackage, openBookingForExpert,
    refreshOrders: fetchMyOrders,
  };
}
