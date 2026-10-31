"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { uploadAvatar } from "@/services/media-upload.service";
import { CandidateProfile } from "@/hooks/use-candidate-profile";
import { profileUpdateSchema, ProfileFormValues } from "@/lib/schemas";
import {
  PROFILE_INPUT_CLS as INPUT_CLS,
  useProfileOwnerGuard,
  WorkspaceSubpageShell,
} from "@/components/features/profile/workspace-subpage-shell";

export default function UpdateProfilePage() {
  const { username, router } = useProfileOwnerGuard();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: profileData } = useQuery<CandidateProfile>({
    queryKey: ["candidate-profile", username],
    queryFn: async () => (await apiClient.get<CandidateProfile>(`/v1/profile/${username}`)).data,
    enabled: Boolean(username),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { firstName: "", lastName: "", headline: "", location: "", bio: "", phone: "", seekingStatus: "Actively Looking" },
    values: profileData
      ? {
          firstName: profileData.first_name ?? "", lastName: profileData.last_name ?? "",
          headline: profileData.headline ?? "", location: profileData.location ?? "",
          bio: profileData.bio ?? "", phone: profileData.phone ?? "",
          seekingStatus: profileData.seeking_status ?? "Actively Looking",
        }
      : undefined,
  });

  const locationQuery = useWatch({ control, name: "location" }) || "";
  const { data: locationSuggestions = [] } = useQuery<Array<{ name: string }>>({
    queryKey: ["catalog-locations", locationQuery],
    queryFn: async () => (await apiClient.get<Array<{ name: string }>>(`/v1/profile/location/?name=${encodeURIComponent(locationQuery)}`)).data,
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile", username] });
      setStatusMessage({ type: "success", text: "Avatar updated." });
    },
    onError: () => setStatusMessage({ type: "error", text: "Failed to upload avatar." }),
  });

  const updateMutation = useMutation({
    mutationFn: async (v: ProfileFormValues) => {
      await apiClient.patch(`/v1/profile/${username}`, {
        first_name: v.firstName, last_name: v.lastName, headline: v.headline,
        location: v.location, bio: v.bio, phone: v.phone, seeking_status: v.seekingStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile", username] });
      setIsSaved(true); setStatusMessage(null);
      setTimeout(() => router.push(`/user/${username}`), 1200);
    },
    onError: () => setStatusMessage({ type: "error", text: "Error saving profile to database." }),
  });

  const onSubmit = handleSubmit(async (values) => { await updateMutation.mutateAsync(values); });

  return (
    <WorkspaceSubpageShell
      username={username}
      badgeText={`Editing Profile @${username}`}
      title="Edit Candidate Profile"
      subtitle="Update your personal credentials and presentation for companies on Belooga."
    >
      {isSaved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Profile updated successfully! Redirecting back to workspace...</span>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="update-profile-form">
            <div className="flex items-center gap-5 p-4 rounded-lg bg-surface-page border border-surface-border">
              <img
                src={profileData?.avatar_url || "/images/avatar.jpg"}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) avatarMutation.mutate(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="upload-avatar-button"
                  disabled={avatarMutation.isPending}
                  className="gap-2 border-brand-primary text-brand-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" /> {avatarMutation.isPending ? "Uploading..." : "Change Avatar"}
                </Button>
                <p className="text-[11px] text-typography-muted">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">First Name</label>
                <input type="text" className={INPUT_CLS} {...register("firstName")} />
                {errors.firstName && <p className="text-[11px] text-red-600">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Last Name</label>
                <input type="text" className={INPUT_CLS} {...register("lastName")} />
                {errors.lastName && <p className="text-[11px] text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Professional Headline</label>
              <input
                type="text"
                data-testid="update-headline-input"
                placeholder="Senior Fullstack Engineer | React & Python"
                className={INPUT_CLS}
                {...register("headline")}
              />
              {errors.headline && <p className="text-[11px] text-red-600">{errors.headline.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Location</label>
                <input
                  type="text"
                  list="location-suggestions"
                  placeholder="San Francisco, CA"
                  className={INPUT_CLS}
                  {...register("location")}
                />
                <datalist id="location-suggestions">
                  {locationSuggestions.map((loc) => (
                    <option key={loc.name} value={loc.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Phone Number</label>
                <input type="text" placeholder="+1 (555) 000-0000" className={INPUT_CLS} {...register("phone")} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Seeking Status</label>
              <select className={`${INPUT_CLS} bg-surface-card`} {...register("seekingStatus")}>
                <option value="Actively Looking">Actively Looking</option>
                <option value="Open to Offers">Open to Offers</option>
                <option value="Not Looking">Not Looking</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Bio</label>
              <textarea
                rows={4}
                data-testid="update-bio-textarea"
                placeholder="Share your technical background and career achievements..."
                className={INPUT_CLS}
                {...register("bio")}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href={`/user/${username}`}>
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="update-submit-btn"
                className="bg-brand-primary hover:bg-brand-hover text-white gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </div>
          </form>
    </WorkspaceSubpageShell>
  );
}
