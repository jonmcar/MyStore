"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ImageOff, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImagePicker } from "./image-picker";

interface ImageListEditorProps {
  value: string[];
  onChange: (next: string[]) => void;
}

/** Editor for an ordered list of image URLs. Uses ImagePicker under
 * the hood so each image can be either a pasted URL or an upload —
 * the list itself just stores URL strings either way. */
export function ImageListEditor({ value, onChange }: ImageListEditorProps) {
  const [addOpen, setAddOpen] = useState(value.length === 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use index-based IDs — URLs could duplicate and would break keys.
  const ids = value.map((_, i) => `img-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(value, from, to));
  };

  const addImage = (url: string) => {
    if (!url) return;
    onChange([...value, url]);
    // Auto-collapse the picker after adding — keeps the form tidy on
    // a listing with several images.
    setAddOpen(false);
  };

  const removeAt = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {value.map((url, i) => (
                <SortableImageRow
                  key={ids[i]}
                  id={ids[i]}
                  url={url}
                  isPrimary={i === 0}
                  onRemove={() => removeAt(i)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-8 text-center text-sm">
          <ImageOff className="h-6 w-6 opacity-40" />
          <p>No images yet. Add one below.</p>
        </div>
      )}

      {value.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Drag the handle to reorder. The first image is the primary
          image shown on cards and shared links.
        </p>
      )}

      <Separator />

      {/* Add-image picker — collapsible so it doesn't hog space once
        * a few images are already set. */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="hover:text-foreground text-muted-foreground flex items-center gap-1 text-sm font-medium"
          aria-expanded={addOpen}
        >
          {addOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Add image
        </button>

        {addOpen && (
          <div className="rounded-md border p-3">
            <ImagePicker
              // value=""" means "no current value" — the picker shows
              // the empty-state preview. When the admin sets or
              // uploads, we push into the list and reset.
              value=""
              onChange={addImage}
              showPreview={false}
              id="img-list-add"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableImageRowProps {
  id: string;
  url: string;
  isPrimary: boolean;
  onRemove: () => void;
}

function SortableImageRow({
  id,
  url,
  isPrimary,
  onRemove,
}: SortableImageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-background flex items-center gap-3 rounded-md border p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
        aria-label="Reorder image"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded">
        <Image
          src={url}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{url}</p>
        {isPrimary && (
          <p className="text-muted-foreground text-xs">Primary image</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
        aria-label="Remove image"
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  );
}
