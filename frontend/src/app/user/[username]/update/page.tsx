"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

export default function UpdateProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [seekingStatus, setSeekingStatus] = useState("Actively Looking");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/v1/profile/${username}`);
        const p = res.data;
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setHeadline(p.headline);
        setLocation(p.location);
        setBio(p.bio);
        setPhone(p.phone);
        setSeekingStatus(p.seeking_status || "Actively Looking");
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    if (username) load();
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/v1/profile/${username}`, {
        headline,
        location,
        bio,
        phone,
        seeking_status: seekingStatus,
      });
      setIsSaved(true);
      setTimeout(() => {
        router.push(`/user/${username}`);
      }, 1200);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Error saving profile to database.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${username}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5bbbae] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </Link>
          <span className="text-xs text-[#737475]">Editing Profile @{username}</span>
        </div>

        <div className="bg-white rounded-xl border border-[#d1d6da] p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#252525]">Edit Candidate Profile</h1>
            <p className="text-sm text-[#737475]">
              Update your personal credentials and presentation for companies on Belooga.
            </p>
          </div>

          {isSaved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Profile updated successfully! Redirecting back to workspace...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Section */}
            <div className="flex items-center gap-5 p-4 rounded-lg bg-[#f8f9fa] border border-[#d1d6da]">
              <img
                src="/images/avatar.jpg"
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[#5bbbae] text-[#5bbbae]"
                  onClick={() => alert("File picker opened for avatar.")}
                >
                  <Upload className="w-4 h-4" /> Change Avatar
                </Button>
                <p className="text-[11px] text-[#737475]">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Professional Headline</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Fullstack Engineer | React & Python"
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Seeking Status</label>
              <select
                value={seekingStatus}
                onChange={(e) => setSeekingStatus(e.target.value)}
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae] bg-white"
              >
                <option value="Actively Looking">Actively Looking</option>
                <option value="Open to Offers">Open to Offers</option>
                <option value="Not Looking">Not Looking</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your technical background and career achievements..."
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href={`/user/${username}`}>
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
