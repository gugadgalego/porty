"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowsOutLineVertical,
  DotsSixVertical,
  ImagesSquare,
  Image as ImageIcon,
  TextAa,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { uploadCmsImage } from "@/lib/cms-upload-client";
import type { ProjectBlock } from "@/lib/portfolio-project";
import { newBlock } from "@/lib/portfolio-project";
import { cn } from "@/lib/utils";
import { CmsRichTextEditor } from "./cms-rich-text-editor";

const fieldClass = cn(
  "w-full rounded-none border border-border bg-background px-2 py-1.5 font-mono text-[12px]",
  "outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
);

type Props = {
  blocks: ProjectBlock[];
  onChange: (blocks: ProjectBlock[]) => void;
};

type SortableDragProps = Pick<
  ReturnType<typeof useSortable>,
  "setActivatorNodeRef" | "listeners" | "attributes"
>;

function SortableBlockCard({
  id,
  children,
}: {
  id: string;
  children: (drag: SortableDragProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-none border border-border bg-card shadow-sm",
        isDragging && "z-20 opacity-[0.97] ring-1 ring-ring shadow-md",
      )}
    >
      {children({
        setActivatorNodeRef,
        listeners,
        attributes,
      })}
    </div>
  );
}

export function CmsBlocksEditor({ blocks, onChange }: Props) {
  const blocksRef = React.useRef(blocks);
  blocksRef.current = blocks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const patch = (id: string, next: ProjectBlock) => {
    onChange(blocks.map((b) => (b.id === id ? next : b)));
  };

  const remove = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const add = (type: ProjectBlock["type"]) => {
    onChange([...blocks, newBlock(type)]);
  };

  const [uploading, setUploading] = React.useState<string | null>(null);

  async function handleFile(
    blockId: string,
    kind: "image" | "carousel",
    slideIndex: number | null,
    file: File | null,
  ) {
    if (!file) return;
    const upKey =
      kind === "image"
        ? `${blockId}:img`
        : `${blockId}:car:${slideIndex ?? "add"}`;
    setUploading(upKey);
    try {
      const url = await uploadCmsImage(file);
      const list = blocksRef.current;
      const block = list.find((b) => b.id === blockId);
      if (!block) return;
      if (kind === "image" && block.type === "image") {
        onChange(
          list.map((b) => {
            if (b.id !== blockId) return b;
            if (b.type !== "image") return b;
            return { ...b, url };
          }),
        );
        return;
      }
      if (kind === "carousel" && block.type === "carousel") {
        if (slideIndex !== null) {
          const slides = [...block.slides];
          if (!slides[slideIndex]) return;
          slides[slideIndex] = { ...slides[slideIndex], url };
          onChange(
            list.map((b) => {
              if (b.id !== blockId) return b;
              if (b.type !== "carousel") return b;
              return { ...b, slides };
            }),
          );
        } else {
          onChange(
            list.map((b) => {
              if (b.id !== blockId) return b;
              if (b.type !== "carousel") return b;
              return { ...b, slides: [...b.slides, { url, alt: "" }] };
            }),
          );
        }
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Upload falhou");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-none font-mono text-[11px]"
          onClick={() => add("text")}
        >
          <TextAa className="size-3.5" aria-hidden />
          Texto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-none font-mono text-[11px]"
          onClick={() => add("image")}
        >
          <ImageIcon className="size-3.5" aria-hidden />
          Imagem
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-none font-mono text-[11px]"
          onClick={() => add("carousel")}
        >
          <ImagesSquare className="size-3.5" aria-hidden />
          Carrossel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-none font-mono text-[11px]"
          onClick={() => add("spacer")}
        >
          <ArrowsOutLineVertical className="size-3.5" aria-hidden />
          Espaço
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {blocks.map((block) => (
              <li key={block.id}>
                <SortableBlockCard id={block.id}>
                  {({ setActivatorNodeRef, listeners, attributes }) => (
                    <>
                      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            ref={setActivatorNodeRef}
                            className="flex size-8 shrink-0 items-center justify-center rounded-none text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Arrastar bloco"
                            {...attributes}
                            {...listeners}
                          >
                            <DotsSixVertical className="size-4" weight="bold" />
                          </button>
                          <span className="truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                            {block.type === "text" && "Texto"}
                            {block.type === "image" &&
                              (block.placement === "hero"
                                ? "Imagem · carrossel topo"
                                : "Imagem")}
                            {block.type === "carousel" && "Carrossel"}
                            {block.type === "spacer" && "Espaço"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 rounded-none text-muted-foreground hover:text-destructive"
                          aria-label="Remover bloco"
                          onClick={() => remove(block.id)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>

                      <div className="p-3">
                        {block.type === "text" ? (
                          <CmsRichTextEditor
                            value={block.html}
                            onChange={(html) =>
                              patch(block.id, { ...block, html })
                            }
                          />
                        ) : null}

                        {block.type === "image" ? (
                          <div className="space-y-3">
                            {block.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={block.url}
                                alt=""
                                className="max-h-48 w-full border border-border object-contain bg-muted/30"
                              />
                            ) : null}
                            <label className="block space-y-1">
                              <span className="font-mono text-[11px] text-muted-foreground">
                                URL da imagem
                              </span>
                              <input
                                className={fieldClass}
                                value={block.url}
                                onChange={(e) =>
                                  patch(block.id, {
                                    ...block,
                                    url: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="font-mono text-[11px] text-muted-foreground">
                                Legenda (opcional)
                              </span>
                              <input
                                className={fieldClass}
                                value={block.caption ?? ""}
                                onChange={(e) =>
                                  patch(block.id, {
                                    ...block,
                                    caption: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <fieldset className="space-y-1.5 border-0 p-0">
                              <legend className="font-mono text-[11px] text-muted-foreground">
                                Onde aparece
                              </legend>
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                                <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-foreground">
                                  <input
                                    type="radio"
                                    name={`placement-${block.id}`}
                                    className="size-3.5 accent-foreground"
                                    checked={block.placement !== "hero"}
                                    onChange={() =>
                                      patch(block.id, {
                                        ...block,
                                        placement: "body",
                                      })
                                    }
                                  />
                                  Corpo do projeto
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-foreground">
                                  <input
                                    type="radio"
                                    name={`placement-${block.id}`}
                                    className="size-3.5 accent-foreground"
                                    checked={block.placement === "hero"}
                                    onChange={() =>
                                      patch(block.id, {
                                        ...block,
                                        placement: "hero",
                                      })
                                    }
                                  />
                                  Carrossel do topo
                                </label>
                              </div>
                            </fieldset>
                            <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="sr-only"
                                disabled={uploading === `${block.id}:img`}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  void handleFile(block.id, "image", null, f ?? null);
                                }}
                              />
                              <span className="border border-border bg-muted/50 px-2 py-1">
                                {uploading === `${block.id}:img`
                                  ? "A enviar…"
                                  : "Enviar ficheiro"}
                              </span>
                            </label>
                          </div>
                        ) : null}

                        {block.type === "carousel" ? (
                          <div className="space-y-4">
                            <ol className="space-y-3">
                              {block.slides.map((slide, idx) => (
                                <li
                                  key={`${block.id}-s-${idx}`}
                                  className="border border-border bg-muted/20 p-2 space-y-2"
                                >
                                  {slide.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={slide.url}
                                      alt=""
                                      className="max-h-36 w-full object-contain bg-background"
                                    />
                                  ) : null}
                                  <input
                                    className={fieldClass}
                                    placeholder="URL"
                                    value={slide.url}
                                    onChange={(e) => {
                                      const slides = [...block.slides];
                                      slides[idx] = {
                                        ...slides[idx],
                                        url: e.target.value,
                                      };
                                      patch(block.id, { ...block, slides });
                                    }}
                                  />
                                  <input
                                    className={fieldClass}
                                    placeholder="alt (opcional)"
                                    value={slide.alt ?? ""}
                                    onChange={(e) => {
                                      const slides = [...block.slides];
                                      slides[idx] = {
                                        ...slides[idx],
                                        alt: e.target.value,
                                      };
                                      patch(block.id, { ...block, slides });
                                    }}
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <label className="cursor-pointer font-mono text-[11px] text-muted-foreground">
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="sr-only"
                                        disabled={
                                          uploading === `${block.id}:car:${idx}`
                                        }
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          e.target.value = "";
                                          void handleFile(
                                            block.id,
                                            "carousel",
                                            idx,
                                            f ?? null,
                                          );
                                        }}
                                      />
                                      <span className="border border-border bg-background px-2 py-1">
                                        {uploading === `${block.id}:car:${idx}`
                                          ? "…"
                                          : "Upload"}
                                      </span>
                                    </label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 rounded-none font-mono text-[11px]"
                                      onClick={() => {
                                        const slides = block.slides.filter(
                                          (_, i) => i !== idx,
                                        );
                                        patch(block.id, { ...block, slides });
                                      }}
                                    >
                                      Remover slide
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ol>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none font-mono text-[11px]"
                                onClick={() =>
                                  patch(block.id, {
                                    ...block,
                                    slides: [...block.slides, { url: "", alt: "" }],
                                  })
                                }
                              >
                                + Slide (URL)
                              </Button>
                              <label className="inline-flex cursor-pointer items-center rounded-none border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="sr-only"
                                  disabled={
                                    uploading === `${block.id}:car:add`
                                  }
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = "";
                                    void handleFile(
                                      block.id,
                                      "carousel",
                                      null,
                                      f ?? null,
                                    );
                                  }}
                                />
                                {uploading === `${block.id}:car:add`
                                  ? "A enviar…"
                                  : "+ Slide (ficheiro)"}
                              </label>
                            </div>
                          </div>
                        ) : null}

                        {block.type === "spacer" ? (
                          <label className="flex flex-col gap-1">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              Altura do espaço
                            </span>
                            <select
                              className={fieldClass}
                              value={block.size}
                              onChange={(e) =>
                                patch(block.id, {
                                  ...block,
                                  size: e.target.value as "sm" | "md" | "lg",
                                })
                              }
                            >
                              <option value="sm">Pequeno</option>
                              <option value="md">Médio</option>
                              <option value="lg">Grande</option>
                            </select>
                          </label>
                        ) : null}
                      </div>
                    </>
                  )}
                </SortableBlockCard>
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 ? (
        <p className="rounded-none border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Ainda não há blocos. Usa os botões acima para começar.
        </p>
      ) : null}
    </div>
  );
}
