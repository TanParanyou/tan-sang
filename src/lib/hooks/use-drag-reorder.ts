'use client';

import { useState, useCallback } from 'react';

export interface UseDragReorderOptions {
  onReorder: (fromIndex: number, toIndex: number) => void;
  rowSelector?: string;
  dataIndexAttribute?: string;
}

export function useDragReorder({
  onReorder,
  rowSelector = '[data-member-row-index]',
  dataIndexAttribute = 'data-member-row-index',
}: UseDragReorderOptions) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Desktop Drag & Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex((prev) => (prev !== index ? index : prev));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        onReorder(draggedIndex, targetIndex);
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Mobile Touch Drag Handlers
  const handleTouchStart = useCallback((index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(index);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const rowEl = element?.closest(rowSelector);
      if (rowEl) {
        const targetIdx = Number(rowEl.getAttribute(dataIndexAttribute));
        if (!isNaN(targetIdx)) {
          setDragOverIndex((prev) => (prev !== targetIdx ? targetIdx : prev));
        }
      }
    },
    [rowSelector, dataIndexAttribute],
  );

  const handleTouchEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, onReorder]);

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      onReorder(fromIndex, toIndex);
    },
    [onReorder],
  );

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    moveItem,
  };
}
