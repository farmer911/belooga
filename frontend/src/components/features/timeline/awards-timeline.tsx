"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Trash2, Pencil, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useTimelineDnD } from "@/hooks/use-timeline-dnd";

export interface AwardItem {
  id: string;
  title: string;
  issuer?: string;
  location_name?: string;
  issued_year?: number | null;
  from_date_year?: number | null;
  display_order?: number;
}

export interface AwardsTimelineProps {
  username: string;
  isEditable?: boolean;
  onUpdateAward?: (id: string, payload: Partial<AwardItem>) => Promise<void> | void;
  onReorderAwards?: (items: AwardItem[]) => Promise<void> | void;
}

export function AwardsTimeline({
  username,
  isEditable = true,
  onUpdateAward,
  onReorderAwards,
}: AwardsTimelineProps) {
  const queryClient = useQueryClient();
  const queryKey = ["candidate-awards", username];
  const [editingId, setEditingId] = React.useState<string | null>(null);
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
      const payload = {
        title: title.trim(),
        issuer: issuer.trim(),
        location_name: issuer.trim(),
        issued_year: Number(year),
        from_date_year: Number(year),
      };
      if (editingId) {
        if (onUpdateAward) {
          await onUpdateAward(editingId, payload);
        } else {
          await apiClient.patch(`/v1/profile/${username}/awards/${editingId}/`, payload);
        }
        return { id: editingId, updated: true };
      }
      const res = await apiClient.post<{ id: string }>(`/v1/profile/${username}/awards/`, payload);
      return { id: res.data.id, updated: false };
    },
    onSuccess: (data) => {
      const entry: AwardItem = {
        id: data.id,
        title: title.trim(),
        issuer: issuer.trim(),
        location_name: issuer.trim(),
        issued_year: Number(year),
        from_date_year: Number(year),
      };
      queryClient.setQueryData<AwardItem[]>(queryKey, (prev = []) =>
        data.updated ? prev.map((a) => (a.id === data.id ? { ...a, ...entry } : a)) : [...prev, entry]
      );
      setEditingId(null);
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

  const handleReorder = async (nextItems: AwardItem[]) => {
    queryClient.setQueryData<AwardItem[]>(queryKey, nextItems);
    if (onReorderAwards) {
      await onReorderAwards(nextItems);
    } else {
      const orders = nextItems.map((item, idx) => ({ id: item.id, order: idx }));
      try {
        await apiClient.post(`/v1/profile/${username}/awards/order/`, { orders });
      } catch {
        // Optimistic order kept if endpoint not active
      }
    }
  };

  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDrop } = useTimelineDnD({
    items: awards,
    onReorder: handleReorder,
  });

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= awards.length) return;
    const next = [...awards];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    handleReorder(next);
  };

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
          {awards.map((item, idx) => {
            const displayIssuer = item.issuer || item.location_name || "";
            const displayYear = item.issued_year ?? item.from_date_year;
            return (
              <div
                key={item.id}
                data-testid="timeline-award-card"
                draggable={isEditable ? "true" : undefined}
                onDragStart={isEditable ? () => handleDragStart(idx) : undefined}
                onDragOver={isEditable ? (e) => handleDragOver(e, idx) : undefined}
                onDrop={isEditable ? () => handleDrop(idx) : undefined}
                className={`p-3.5 rounded-lg border bg-surface-page flex items-center justify-between gap-3 transition-all ${
                  draggedIndex === idx ? "opacity-40 border-dashed border-brand-primary" : dragOverIndex === idx ? "border-brand-primary bg-teal-50/40" : "border-surface-border"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isEditable && (
                    <div className="flex flex-col items-center text-slate-400">
                      <GripVertical className="w-4 h-4 cursor-grab" />
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="hover:text-brand-primary disabled:opacity-30 cursor-pointer" title="Move up">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === awards.length - 1} className="hover:text-brand-primary disabled:opacity-30 cursor-pointer" title="Move down">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-typography-main">{item.title}</h3>
                    <p className="text-xs text-typography-muted">
                      {displayIssuer} {displayYear ? `• ${displayYear}` : ""}
                    </p>
                  </div>
                </div>
                {isEditable && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid="edit-award-btn"
                      onClick={() => {
                        setEditingId(item.id);
                        setTitle(item.title);
                        setIssuer(displayIssuer);
                        setYear(displayYear || 2025);
                      }}
                      className="text-slate-300 hover:text-brand-primary p-1 cursor-pointer"
                      title="Edit award"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                      title="Delete award"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
            title={editingId ? "Update award" : "Add award"}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
