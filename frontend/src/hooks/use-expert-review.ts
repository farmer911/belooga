"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api-client";
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

export function useExpertReview() {
  const { isAuthenticated } = useAuthStore();
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [packages, setPackages] = useState<ReviewPackage[]>([]);
  const [myOrders, setMyOrders] = useState<ReviewOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ReviewPackage | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);

  // Fetch initial packages and experts
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pkgRes, expRes] = await Promise.all([
        apiClient.get<ReviewPackage[]>("/v1/expert-review/packages/"),
        apiClient.get<ExpertProfile[]>("/v1/expert-review/experts/"),
      ]);
      setPackages(pkgRes.data);
      setExperts(expRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load expert review offerings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch logged-in user orders
  const fetchMyOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get<ReviewOrder[]>("/v1/expert-review/orders/my-orders/");
      setMyOrders(res.data);
    } catch {
      // Non-blocking for unauthenticated or first-time view
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    fetchMyOrders();
  }, [fetchData, fetchMyOrders]);

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    setIsLoading(true);
    try {
      const url =
        category === "All"
          ? "/v1/expert-review/experts/"
          : `/v1/expert-review/experts/?category=${encodeURIComponent(category)}`;
      const res = await apiClient.get<ExpertProfile[]>(url);
      setExperts(res.data);
    } catch (err: any) {
      setError("Failed to filter experts");
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (payload: {
    package_slug: string;
    expert_id?: string;
    resume_url: string;
    target_role: string;
    target_companies?: string;
    candidate_notes?: string;
  }) => {
    const res = await apiClient.post<ReviewOrder>("/v1/expert-review/orders/", payload);
    await fetchMyOrders();
    return res.data;
  };

  const checkoutOrder = async (orderId: string, paymentMethod = "card") => {
    const res = await apiClient.post<ReviewOrder>(
      `/v1/expert-review/orders/${orderId}/checkout/`,
      { payment_method: paymentMethod }
    );
    await fetchMyOrders();
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
    experts,
    packages,
    myOrders,
    selectedCategory,
    isLoading,
    error,
    bookingModalOpen,
    selectedPackage,
    selectedExpert,
    setBookingModalOpen,
    setSelectedPackage,
    setSelectedExpert,
    handleCategoryFilter,
    createOrder,
    checkoutOrder,
    openBookingForPackage,
    openBookingForExpert,
    refreshOrders: fetchMyOrders,
  };
}
