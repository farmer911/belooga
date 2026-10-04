"use client";

import { useState, useCallback } from "react";

export interface UseTimelineDnDOptions<T> {
  items: T[];
  onReorder: (newItems: T[]) => void | Promise<void>;
}

export interface UseTimelineDnDReturn {
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (dropIndex: number) => Promise<void>;
  handleDragEnd: () => void;
}

export function useTimelineDnD<T>({
  items,
  onReorder,
}: UseTimelineDnDOptions<T>): UseTimelineDnDReturn {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedIndex((currDragged) => {
      if (currDragged !== null && currDragged !== index) {
        setDragOverIndex(index);
      }
      return currDragged;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (dropIndex: number) => {
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const updated = [...items];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dropIndex, 0, movedItem);

      setDraggedIndex(null);
      setDragOverIndex(null);

      try {
        await onReorder(updated);
      } catch (err) {
        console.error("Failed to persist timeline reorder:", err);
      }
    },
    [draggedIndex, items, onReorder]
  );

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
