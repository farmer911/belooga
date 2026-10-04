"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  [key: string]: any;
}

export function useCandidateProfile(username: string) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [experiences, setExperiences] = useState<JobExperience[]>([]);
  const [education, setEducation] = useState<EducationExperience[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      const res = await apiClient.get(`/v1/profile/${username}`);
      const data = res.data;
      setProfile(data);
      setExperiences(data.job_experiences || []);
      setEducation(data.education_experiences || []);
      setSkills(data.skills || []);
      setAvatarPreview(data.avatar_url || "/images/avatar.jpg");
      setResumeName(
        data.resume_url
          ? data.resume_url.split("/").pop() || "Resume.pdf"
          : `${data.first_name || "Candidate"}_${data.last_name || "CV"}_2026.pdf`
      );
    } catch (err) {
      console.error("Failed to load candidate profile", err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
      setAvatarPreview(res.avatar_url);
      setProfile((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : null));
    } catch (err) {
      console.error("Avatar upload failed", err);
      setAvatarPreview(URL.createObjectURL(file));
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
      setResumeName(file.name);
    } catch (err) {
      console.error("Resume upload failed", err);
      setResumeName(file.name);
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
