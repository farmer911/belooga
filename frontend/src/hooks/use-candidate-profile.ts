"use client";

import { useState, useRef, useCallback, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import {
  uploadAvatar,
  uploadResume,
  downloadCandidatePdf,
} from "@/services/media-upload.service";

export interface JobExperience {
  id: string;
  title: string;
  company_name: string;
  from_date_year: number;
  from_date_month?: number;
  currently_work_here: boolean;
  to_date_year?: number | null;
  to_date_month?: number | null;
  description?: string;
  logo_url?: string;
  display_order?: number;
}

export interface EducationExperience {
  id: string;
  school_name: string;
  degree_name: string;
  gpa?: string;
  from_date_year: number;
  from_date_month?: number;
  currently_work_here?: boolean;
  to_date_year?: number | null;
  to_date_month?: number | null;
  description?: string;
  display_order?: number;
}

export interface CandidateProfile {
  id: string;
  username: string;
  full_name: string;
  headline?: string;
  bio?: string;
  location?: string;
  seeking_status?: string;
  avatar_url?: string;
  resume_url?: string;
  video_pitch_url?: string;
  video_pitch_poster?: string;
  email?: string;
  phone?: string;
  is_hidden?: boolean;
  job_experiences?: JobExperience[];
  education_experiences?: EducationExperience[];
  skills?: string[];
  languages?: Array<{ name: string; proficiency: string }>;
  interests?: string[];
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export function useCandidateProfile(username: string) {
  const queryClient = useQueryClient();
  const queryKey = ["candidate-profile", username];

  const { data: profileData = null, isLoading, refetch } = useQuery<CandidateProfile | null>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<CandidateProfile>(`/v1/profile/${username}`);
      return res.data;
    },
    enabled: Boolean(username),
  });

  const [customResumeName, setCustomResumeName] = useState<string>("");
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const profile = profileData;
  const experiences = profileData?.job_experiences ?? [];
  const education = profileData?.education_experiences ?? [];
  const skills = profileData?.skills ?? [];
  const avatarPreview = customAvatarPreview || profileData?.avatar_url || "/images/avatar.jpg";
  const resumeName =
    customResumeName ||
    (profileData?.resume_url
      ? profileData.resume_url.split("/").pop() || "Resume.pdf"
      : `${profileData?.first_name || "Candidate"}_${profileData?.last_name || "CV"}_2026.pdf`);

  const setProfile = useCallback(
    (updater: SetStateAction<CandidateProfile | null>) => {
      queryClient.setQueryData<CandidateProfile | null>(queryKey, (prev = null) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    [queryClient, username]
  );

  const updateListField = useCallback(
    <K extends "job_experiences" | "education_experiences" | "skills">(
      field: K,
      updater: SetStateAction<NonNullable<CandidateProfile[K]>>
    ) => {
      queryClient.setQueryData<CandidateProfile | null>(queryKey, (prev = null) => {
        if (!prev) return prev;
        const current = (prev[field] ?? []) as NonNullable<CandidateProfile[K]>;
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [field]: next };
      });
    },
    [queryClient, username]
  );

  const setExperiences = useCallback((u: SetStateAction<JobExperience[]>) => updateListField("job_experiences", u), [updateListField]);
  const setEducation = useCallback((u: SetStateAction<EducationExperience[]>) => updateListField("education_experiences", u), [updateListField]);
  const setSkills = useCallback((u: SetStateAction<string[]>) => updateListField("skills", u), [updateListField]);

  const fetchProfile = useCallback(async () => {
    if (username) await refetch();
  }, [username, refetch]);

  const handleToggleVisibility = async () => {
    if (!profile) return;
    try {
      const newStatus = !profile.is_hidden;
      await apiClient.patch(`/v1/profile/${username}`, { is_hidden: newStatus });
      setProfile((prev) => (prev ? { ...prev, is_hidden: newStatus } : null));
    } catch (e) {
      console.error("Failed to toggle visibility", e);
    }
  };

  const handleAddExperience = async (payload: Omit<JobExperience, "id">) => {
    try {
      const res = await apiClient.post(`/v1/profile/${username}/job-experiences/`, payload);
      const newEntry: JobExperience = {
        id: res.data.id || String(Date.now()),
        ...payload,
        display_order: res.data.display_order ?? experiences.length,
      };
      setExperiences((prev) => [...prev, newEntry]);
      return newEntry;
    } catch (err) {
      console.error("Failed to save experience", err);
      throw err;
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      setExperiences((prev) => prev.filter((item) => item.id !== id));
      await apiClient.delete(`/v1/profile/${username}/job-experiences/${id}/`);
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  };

  const handleReorderExperiences = async (updatedList: JobExperience[]) => {
    setExperiences(updatedList);
    try {
      const orders = updatedList.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));
      await apiClient.post(`/v1/profile/${username}/job-experiences/order/`, {
        orders,
      });
    } catch (err) {
      console.error("Failed to persist experience reorder", err);
    }
  };

  const handleAddEducation = async (payload: Omit<EducationExperience, "id">) => {
    try {
      const res = await apiClient.post(`/v1/profile/${username}/education/`, payload);
      const newEntry: EducationExperience = {
        id: res.data.id || String(Date.now()),
        ...payload,
        display_order: education.length,
      };
      setEducation((prev) => [...prev, newEntry]);
      return newEntry;
    } catch (err) {
      console.error("Failed to save education", err);
      throw err;
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      setEducation((prev) => prev.filter((item) => item.id !== id));
      await apiClient.delete(`/v1/profile/${username}/education/${id}/`);
    } catch (err) {
      console.error("Failed to delete education", err);
    }
  };

  const handleAddSkill = async (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    try {
      await apiClient.post(`/v1/profile/${username}/skills/`, { name: trimmed });
      setSkills((prev) => [...prev, trimmed]);
    } catch (err) {
      console.error("Failed to add skill", err);
      setSkills((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      await apiClient.delete(`/v1/profile/${username}/skills/${encodeURIComponent(skillToRemove)}/`);
      setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    } catch (err) {
      console.error("Failed to remove skill", err);
      setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, username);
      setCustomAvatarPreview(res.avatar_url);
      setProfile((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : null));
    } catch (err) {
      console.error("Avatar upload failed", err);
      setCustomAvatarPreview(URL.createObjectURL(file));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      await uploadResume(file, username);
      setCustomResumeName(file.name);
    } catch (err) {
      console.error("Resume upload failed", err);
      setCustomResumeName(file.name);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadCandidatePdf(username);
  };

  return {
    profile,
    setProfile,
    isLoading,
    experiences,
    setExperiences,
    education,
    setEducation,
    skills,
    setSkills,
    resumeName,
    avatarPreview,
    isUploadingAvatar,
    isUploadingResume,
    resumeInputRef,
    avatarInputRef,
    fetchProfile,
    handleToggleVisibility,
    handleAddExperience,
    handleDeleteExperience,
    handleReorderExperiences,
    handleAddEducation,
    handleDeleteEducation,
    handleAddSkill,
    handleRemoveSkill,
    handleAvatarFileChange,
    handleResumeFileChange,
    handleDownloadPdf,
  };
}
