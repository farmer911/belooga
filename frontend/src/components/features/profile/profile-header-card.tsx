"use client";

import * as React from "react";
import { MapPin, Mail, Phone, Edit3, Loader2 } from "lucide-react";
import { CandidateProfile } from "@/hooks/use-candidate-profile";

export interface ProfileHeaderCardProps {
  profile: CandidateProfile;
  avatarPreview?: string;
  isUploadingAvatar?: boolean;
  onAvatarUploadClick?: () => void;
  isEditable?: boolean;
}

export function ProfileHeaderCard({
  profile,
  avatarPreview,
  isUploadingAvatar = false,
  onAvatarUploadClick,
  isEditable = true,
}: ProfileHeaderCardProps) {
  const displayAvatar = avatarPreview || profile.avatar_url || "/images/avatar.jpg";

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm text-center space-y-4">
      <div className="relative inline-block">
        <img
          data-testid="profile-avatar-img"
          src={displayAvatar}
          alt={profile.full_name}
          className="w-28 h-28 rounded-full object-cover border-4 border-brand-primary/20 mx-auto shadow-sm"
        />
        {isEditable && onAvatarUploadClick && (
          <button
            type="button"
            onClick={onAvatarUploadClick}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 p-2 bg-brand-primary hover:bg-brand-hover text-white rounded-full shadow cursor-pointer transition-transform hover:scale-110"
            title="Upload New Avatar"
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="space-y-1">
        <h1 data-testid="profile-fullname" className="text-2xl font-bold text-typography-main">
          {profile.full_name}
        </h1>
        {profile.username && (
          <p className="text-sm font-medium text-brand-primary">@{profile.username}</p>
        )}
        {profile.headline && (
          <p data-testid="profile-headline" className="text-sm text-typography-heading pt-1 font-medium">
            {profile.headline}
          </p>
        )}
      </div>

      {profile.seeking_status && (
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/15 text-brand-dark">
          {profile.seeking_status}
        </div>
      )}

      {profile.bio && (
        <p className="text-xs text-typography-body text-left leading-relaxed pt-2 border-t border-surface-divider">
          {profile.bio}
        </p>
      )}

      {/* Contact Channels */}
      <div className="space-y-2 text-left pt-3 border-t border-surface-divider text-xs text-typography-heading">
        {profile.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span data-testid="profile-location">{profile.location}</span>
          </div>
        )}
        {profile.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{profile.email}</span>
          </div>
        )}
        {profile.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{profile.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
