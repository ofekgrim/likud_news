'use client';

import { useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ContentBlock } from '@/lib/types';
import { BlockRenderer } from './block-renderer';
import { AddBlockMenu } from './add-block-menu';

// ── Props ────────────────────────────────────────────────────────────────

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

// ── Main Component ───────────────────────────────────────────────────────

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      onChange(arrayMove(blocks, oldIndex, newIndex));
    },
    [blocks, onChange],
  );

  const handleAdd = useCallback(
    (block: ContentBlock) => {
      onChange([...blocks, block]);
    },
    [blocks, onChange],
  );

  const handleUpdate = useCallback(
    (id: string, updated: ContentBlock) => {
      onChange(blocks.map((b) => (b.id === id ? updated : b)));
    },
    [blocks, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange],
  );

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onUpdate={(updated) => handleUpdate(block.id, updated)}
              onDelete={() => handleDelete(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          אין בלוקים עדיין. הוסף את הבלוק הראשון למטה.
        </div>
      )}

      {/* Add block menu */}
      <div className="pt-2">
        <AddBlockMenu onAdd={handleAdd} />
      </div>
    </div>
  );
}

// ── Sortable Wrapper ─────────────────────────────────────────────────────

function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: ContentBlock;
  onUpdate: (updated: ContentBlock) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlockRenderer
        block={block}
        onChange={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// Re-export for convenience
export { BlockRenderer } from './block-renderer';
export { AddBlockMenu } from './add-block-menu';
export type { BlockEditorProps };
