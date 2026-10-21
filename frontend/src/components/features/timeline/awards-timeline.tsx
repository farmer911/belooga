"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Trash2 } from "lucide-react";
import { apiClient } from "@/services/api-client";

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  issued_year?: number | null;
}

export function AwardsTimeline({ username, isEditable = true }: { username: string; isEditable?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = ["candidate-awards", username];
  const [title, setTitle] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [year, setYear] = React.useState(2025);

  const { data: awards = [] } = useQuery<AwardItem[]>({
    queryKey,
    queryFn: async () => (await apiClient.get<AwardItem[]>(`/v1/profile/${username}/awards/`)).data,
    enabled: Boolean(username),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ id: string }>(`/v1/profile/${username}/awards/`, {
        title: title.trim(),
        issuer: issuer.trim(),
        issued_year: Number(year),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AwardItem[]>(queryKey, (prev = []) => [
        ...prev,
        { id: data.id, title: title.trim(), issuer: issuer.trim(), issued_year: Number(year) },
      ]);
      setTitle("");
      setIssuer("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/v1/profile/${username}/awards/${id}/`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<AwardItem[]>(queryKey, (prev = []) => prev.filter((a) => a.id !== deletedId));
    },
  });

  return (
    <div
      data-testid="awards-timeline-card"
      className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-brand-primary" />
        <h2 className="text-lg font-bold text-typography-main">Honors, Awards & Certifications</h2>
      </div>

      {awards.length > 0 && (
        <div className="space-y-2.5">
          {awards.map((item) => (
            <div
              key={item.id}
              data-testid="timeline-award-card"
              className="p-3.5 rounded-lg border border-surface-border bg-surface-page flex items-center justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-bold text-typography-main">{item.title}</h3>
                <p className="text-xs text-typography-muted">
                  {item.issuer} {item.issued_year ? `• ${item.issued_year}` : ""}
                </p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                  title="Delete award"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditable && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !issuer.trim()) return;
            addMutation.mutate();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1"
        >
          <input
            type="text"
            data-testid="award-title-input"
            placeholder="Award or Certification title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sm:col-span-5 px-3 py-1.5 border border-surface-border rounded-lg text-xs"
          />
          <input
            type="text"
            data-testid="award-issuer-input"
            placeholder="Issuing organization..."
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="sm:col-span-4 px-3 py-1.5 border border-surface-border rounded-lg text-xs"
          />
          <input
            type="number"
            min={1990}
            max={2035}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="sm:col-span-2 px-2 py-1.5 border border-surface-border rounded-lg text-xs"
          />
          <button
            type="submit"
            data-testid="add-award-btn"
            disabled={addMutation.isPending}
            className="sm:col-span-1 flex items-center justify-center rounded-lg bg-brand-primary hover:bg-brand-hover text-white py-1.5 cursor-pointer"
            title="Add award"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
