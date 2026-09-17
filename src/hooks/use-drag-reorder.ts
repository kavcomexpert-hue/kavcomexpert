"use client";

import { useState } from "react";

export function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (orderedIds: string[]) => void | Promise<void>,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState(items);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setOrderedItems(items);
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(event: React.DragEvent, targetId: string) {
    event.preventDefault();

    if (!draggingId || draggingId === targetId) {
      return;
    }

    setOrderedItems((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.id === draggingId);
      const toIndex = next.findIndex((item) => item.id === targetId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleDragEnd() {
    setDraggingId(null);
    await onReorder(orderedItems.map((item) => item.id));
  }

  return {
    orderedItems,
    draggingId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
