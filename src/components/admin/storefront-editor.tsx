"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Megaphone,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Type,
  Image as ImageIcon,
  Layout,
  BookOpen,
  Grid3x3,
  Gift,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HeroEditor,
  FeaturedEditor,
  EditorialEditor,
  CategoriesEditor,
  PromoEditor,
  ServicesEditor,
  TextBlockEditor,
  ImageBannerEditor,
  AnnouncementEditor,
  PopupEditor,
} from "./storefront-section-editors";
import {
  updateStorefrontContentAction,
  resetStorefrontContentAction,
} from "@/lib/actions";
import { SECTION_TYPE_LABELS } from "@/lib/types";
import type {
  StorefrontContent,
  Section,
  SectionType,
} from "@/lib/types";
import {
  makeSection,
  isLastOfRequiredType,
  availableSectionTypes,
} from "@/lib/storefront-helpers";
import { cn } from "@/lib/utils";

interface StorefrontEditorProps {
  initial: StorefrontContent;
}

/** One-glance tagline under the card title so admins can see at a
 * glance what's in each collapsed section without expanding it. */
function summaryOf(section: Section): string {
  switch (section.type) {
    case "hero":
      return section.data.headline || "(no headline)";
    case "featured":
      return `${section.data.title} · up to ${section.data.limit}`;
    case "editorial":
      return section.data.headline || "(no headline)";
    case "categories":
      return section.data.title;
    case "promo":
      return section.data.headline || "(no headline)";
    case "services":
      return section.data.title;
    case "text-block":
      return section.data.headline || section.data.body.slice(0, 60) || "(empty)";
    case "image-banner":
      return section.data.headline || "(no headline)";
  }
}

/** Icon shown next to each section type in the library dropdown and
 * on the section card header */
const TYPE_ICONS: Record<SectionType, React.ComponentType<{ className?: string }>> = {
  hero: Layout,
  featured: Gift,
  editorial: BookOpen,
  categories: Grid3x3,
  promo: Megaphone,
  services: Wrench,
  "text-block": Type,
  "image-banner": ImageIcon,
};

export function StorefrontEditor({ initial }: StorefrontEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<StorefrontContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    {}
  );
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Announcement banner and popup — both are top-level fields on
  // StorefrontContent, not part of the sections array.
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const markDirty = () => setDirty(true);

  const update = (patch: Partial<StorefrontContent>) => {
    setContent((c) => ({ ...c, ...patch }));
    markDirty();
  };

  const updateSection = (id: string, next: Section) => {
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? next : s)),
    }));
    markDirty();
  };

  const toggleOpen = (id: string) =>
    setOpenSections((s) => ({ ...s, [id]: !s[id] }));

  const toggleVisibility = (id: string) => {
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s) =>
        s.id === id ? ({ ...s, visible: !s.visible } as Section) : s
      ),
    }));
    markDirty();
  };

  const deleteSection = (id: string) => {
    setContent((c) => ({
      ...c,
      sections: c.sections.filter((s) => s.id !== id),
    }));
    markDirty();
  };

  const addSection = (type: SectionType) => {
    const section = makeSection(type);
    setContent((c) => ({
      ...c,
      sections: [...c.sections, section],
    }));
    // Auto-open newly added sections so the admin can start editing
    // immediately.
    setOpenSections((o) => ({ ...o, [section.id]: true }));
    markDirty();
    // Scroll to the bottom after render so the new card is visible.
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = content.sections.findIndex((s) => s.id === active.id);
    const to = content.sections.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;
    setContent((c) => ({
      ...c,
      sections: arrayMove(c.sections, from, to),
    }));
    markDirty();
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateStorefrontContentAction(content);
      if (res.ok) {
        toast.success("Storefront saved", {
          description: "Your home page has been updated.",
        });
        setDirty(false);
        router.refresh();
      } else {
        toast.error("Couldn't save", { description: res.error });
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetStorefrontContentAction();
      if (res.ok) {
        setContent(res.content);
        setDirty(false);
        toast.success("Storefront reset", {
          description: "All content restored to defaults.",
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Announcement banner — lives above the site header, not part
       * of the home page itself, so it's handled separately. */}
      <div className="bg-background rounded-lg border">
        <div className="flex items-center gap-2 p-3">
          <div className="text-muted-foreground p-1">
            <Megaphone className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => setAnnouncementOpen((v) => !v)}
            className="hover:bg-accent/50 flex flex-1 items-center gap-2 rounded-md p-2 text-left"
            aria-expanded={announcementOpen}
          >
            {announcementOpen ? (
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Announcement banner</span>
                {!content.announcement.enabled && (
                  <Badge variant="outline" className="text-[10px]">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {content.announcement.enabled
                  ? content.announcement.message || "(no message)"
                  : "Site-wide banner, currently off"}
              </p>
            </div>
          </button>
        </div>
        {announcementOpen && (
          <>
            <Separator />
            <div className="p-4 sm:p-5">
              <AnnouncementEditor
                value={content.announcement}
                onChange={(next) => update({ announcement: next })}
              />
            </div>
          </>
        )}
      </div>

      {/* First-visit popup — modal that appears once per browser tab
       * session. Sits here next to the announcement because both are
       * site-wide concerns, not per-page sections. */}
      <div className="bg-background rounded-lg border">
        <div className="flex items-center gap-2 p-3">
          <div className="text-muted-foreground p-1">
            <MessageSquare className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => setPopupOpen((v) => !v)}
            className="hover:bg-accent/50 flex flex-1 items-center gap-2 rounded-md p-2 text-left"
            aria-expanded={popupOpen}
          >
            {popupOpen ? (
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">First-visit popup</span>
                {!content.popup.enabled && (
                  <Badge variant="outline" className="text-[10px]">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {content.popup.enabled
                  ? content.popup.title || "(no title)"
                  : "Modal on first session, currently off"}
              </p>
            </div>
          </button>
        </div>
        {popupOpen && (
          <>
            <Separator />
            <div className="p-4 sm:p-5">
              <PopupEditor
                value={content.popup}
                onChange={(next) => update({ popup: next })}
              />
            </div>
          </>
        )}
      </div>

      {/* Page sections — reorderable, deletable, every type mixable */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Page sections</h2>
          <p className="text-muted-foreground text-xs">
            Drag the handle to reorder. Hide, edit, or delete any section.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={content.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {content.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  allSections={content.sections}
                  isOpen={openSections[section.id] ?? false}
                  onToggleOpen={() => toggleOpen(section.id)}
                  onToggleVisibility={() => toggleVisibility(section.id)}
                  onChange={(next) => updateSection(section.id, next)}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {content.sections.length === 0 && (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            <p>No sections on the home page yet.</p>
            <p className="mt-1 text-xs">Add one below to get started.</p>
          </div>
        )}

        {/* Add section menu */}
        <AddSectionMenu
          onAdd={addSection}
          availableTypes={availableSectionTypes(content.sections)}
        />
      </div>

      {/* Sticky save/reset bar */}
      <div className="bg-background sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t px-6 py-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="text-muted-foreground text-xs">
          {dirty ? (
            <span className="text-foreground">Unsaved changes.</span>
          ) : (
            <>Last saved {new Date(content.updatedAt).toLocaleString()}</>
          )}
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={pending}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Reset to defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset storefront?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every section will revert to the seed copy. Any sections
                  you added will be lost. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={!dirty || pending}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Add-section dropdown ───────────────────────────────────────────

function AddSectionMenu({
  onAdd,
  availableTypes,
}: {
  onAdd: (type: SectionType) => void;
  availableTypes: SectionType[];
}) {
  // Split into "content" and "structure" groups for a cleaner menu.
  const contentTypes: SectionType[] = ["text-block", "image-banner"];
  const pageTypes: SectionType[] = [
    "hero",
    "featured",
    "editorial",
    "categories",
    "promo",
    "services",
  ];
  const availableContent = contentTypes.filter((t) =>
    availableTypes.includes(t)
  );
  const availablePage = pageTypes.filter((t) => availableTypes.includes(t));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {availableContent.length > 0 && (
          <>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Freeform
            </DropdownMenuLabel>
            {availableContent.map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <DropdownMenuItem key={t} onClick={() => onAdd(t)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {SECTION_TYPE_LABELS[t]}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Structured
        </DropdownMenuLabel>
        {availablePage.map((t) => {
          const Icon = TYPE_ICONS[t];
          return (
            <DropdownMenuItem key={t} onClick={() => onAdd(t)}>
              <Icon className="mr-2 h-4 w-4" />
              {SECTION_TYPE_LABELS[t]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sortable section card ──────────────────────────────────────────

function SortableSection({
  section,
  allSections,
  isOpen,
  onToggleOpen,
  onToggleVisibility,
  onChange,
  onDelete,
}: {
  section: Section;
  allSections: Section[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleVisibility: () => void;
  onChange: (next: Section) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const deleteBlocked = isLastOfRequiredType(allSections, section.id);
  const Icon = TYPE_ICONS[section.type];
  const typeLabel = SECTION_TYPE_LABELS[section.type];

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "bg-background rounded-lg border",
          !section.visible && "opacity-70"
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
            aria-label="Reorder section"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="hover:bg-accent/50 flex flex-1 items-center gap-2 rounded-md p-2 text-left"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
            <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{typeLabel}</span>
                {!section.visible && (
                  <Badge variant="outline" className="text-[10px]">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {summaryOf(section)}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {section.visible ? (
              <Eye className="text-muted-foreground h-4 w-4" />
            ) : (
              <EyeOff className="text-muted-foreground h-4 w-4" />
            )}
            <Switch
              checked={section.visible}
              onCheckedChange={onToggleVisibility}
              aria-label={`${section.visible ? "Hide" : "Show"} ${typeLabel}`}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    deleteBlocked
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground hover:text-destructive"
                  )}
                  disabled={deleteBlocked}
                  title={
                    deleteBlocked
                      ? `You must keep at least one ${typeLabel} section`
                      : `Delete ${typeLabel}`
                  }
                  aria-label={
                    deleteBlocked
                      ? `Cannot delete — at least one ${typeLabel} required`
                      : `Delete ${typeLabel}`
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this section?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the {typeLabel.toLowerCase()} section from
                    the home page. If you save after this, it&apos;s gone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {isOpen && (
          <>
            <Separator />
            <div className="p-4 sm:p-5">
              <SectionEditor section={section} onChange={onChange} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Dispatch to the right per-type editor. Types narrow via the
 * discriminated union on `section.type`. */
function SectionEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (next: Section) => void;
}) {
  switch (section.type) {
    case "hero":
      return (
        <HeroEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "featured":
      return (
        <FeaturedEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "editorial":
      return (
        <EditorialEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "categories":
      return (
        <CategoriesEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "promo":
      return (
        <PromoEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "services":
      return (
        <ServicesEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "text-block":
      return (
        <TextBlockEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
    case "image-banner":
      return (
        <ImageBannerEditor
          value={section.data}
          onChange={(data) => onChange({ ...section, data })}
        />
      );
  }
}
