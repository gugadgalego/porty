export type ProjectTextBlock = {
  type: "text";
  id: string;
  html: string;
};

export type ProjectImageBlock = {
  type: "image";
  id: string;
  url: string;
  caption?: string;
  /**
   * `hero` — carrossel horizontal no topo da página do projeto (board «PROJETO ABERTO»).
   * `body` — imagem no corpo, entre os outros blocos (comportamento por defeito).
   */
  placement?: "hero" | "body";
};

export type ProjectCarouselSlide = { url: string; alt?: string };

export type ProjectCarouselBlock = {
  type: "carousel";
  id: string;
  slides: ProjectCarouselSlide[];
};

/** Espaço vertical entre blocos. */
export type ProjectSpacerBlock = {
  type: "spacer";
  id: string;
  size: "sm" | "md" | "lg";
};

export type ProjectBlock =
  | ProjectTextBlock
  | ProjectImageBlock
  | ProjectCarouselBlock
  | ProjectSpacerBlock;

export type PortfolioProject = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  /** Conteúdo da página do projeto (Design, ao seguir o link do cartão). */
  blocks?: ProjectBlock[];
  /**
   * Se `false`, o projeto não aparece na grelha pública nem em `/design/[id]`.
   * Rascunhos no CMS. Omisso = visível.
   */
  implemented?: boolean;
};

export function newBlock(type: ProjectBlock["type"]): ProjectBlock {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  switch (type) {
    case "text":
      return { type: "text", id, html: "<p></p>" };
    case "image":
      return { type: "image", id, url: "", caption: "", placement: "body" };
    case "carousel":
      return { type: "carousel", id, slides: [] };
    case "spacer":
      return { type: "spacer", id, size: "md" };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function isCarouselSlide(v: unknown): v is ProjectCarouselSlide {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.url === "string";
}

export function isBlock(v: unknown): v is ProjectBlock {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.type !== "string") return false;
  if (o.type === "text") return typeof o.html === "string";
  if (o.type === "image") {
    if (typeof o.url !== "string") return false;
    if (
      o.placement !== undefined &&
      o.placement !== "hero" &&
      o.placement !== "body"
    ) {
      return false;
    }
    return true;
  }
  if (o.type === "carousel")
    return (
      Array.isArray(o.slides) &&
      (o.slides as unknown[]).every(isCarouselSlide)
    );
  if (o.type === "spacer")
    return o.size === "sm" || o.size === "md" || o.size === "lg";
  return false;
}

export function isProject(v: unknown): v is PortfolioProject {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.title !== "string" ||
    typeof o.subtitle !== "string" ||
    typeof o.image !== "string"
  ) {
    return false;
  }
  if (o.blocks !== undefined) {
    if (!Array.isArray(o.blocks)) return false;
    if (!(o.blocks as unknown[]).every(isBlock)) return false;
  }
  if (o.implemented !== undefined && typeof o.implemented !== "boolean") {
    return false;
  }
  return true;
}

export function normalizeBlock(b: ProjectBlock): ProjectBlock {
  switch (b.type) {
    case "text":
      return { ...b, id: b.id.trim(), html: b.html };
    case "image":
      return {
        type: "image",
        id: b.id.trim(),
        url: b.url.trim(),
        caption: b.caption?.trim() || undefined,
        placement: b.placement === "hero" ? "hero" : "body",
      };
    case "carousel":
      return {
        type: "carousel",
        id: b.id.trim(),
        slides: b.slides.map((s) => ({
          url: s.url.trim(),
          alt: s.alt?.trim() || undefined,
        })),
      };
    case "spacer":
      return { ...b, id: b.id.trim() };
    default: {
      const _e: never = b;
      return _e;
    }
  }
}

export function normalizeProject(p: PortfolioProject): PortfolioProject {
  const blocks = Array.isArray(p.blocks)
    ? p.blocks.filter(isBlock).map(normalizeBlock)
    : [];
  return {
    id: p.id.trim(),
    title: p.title.trim(),
    subtitle: p.subtitle.trim(),
    image: p.image.trim(),
    blocks,
    implemented: p.implemented === false ? false : true,
  };
}

/** Slides do carrossel do topo (board «PROJETO ABERTO»): imagens com `placement: "hero"` por ordem dos blocos; senão a capa `image`. */
export function heroCarouselSlidesFromProject(
  project: PortfolioProject,
): ProjectCarouselSlide[] {
  const fromBlocks = (project.blocks ?? [])
    .filter(
      (b): b is Extract<ProjectBlock, { type: "image" }> =>
        b.type === "image" &&
        b.placement === "hero" &&
        typeof b.url === "string" &&
        b.url.trim().length > 0,
    )
    .map((b) => ({
      url: b.url.trim(),
      alt: b.caption?.trim() || undefined,
    }));
  if (fromBlocks.length > 0) return fromBlocks;
  if (project.image.trim().length > 0)
    return [{ url: project.image.trim(), alt: undefined }];
  return [];
}

export const defaultPortfolioProjects: PortfolioProject[] = [
  {
    id: "p1",
    title: "Papelzinho",
    subtitle: "Orla — Mobile",
    image: "https://paper.design/flowers.webp",
    blocks: [
      {
        type: "text" as const,
        id: "p1-intro",
        html: "<p>Adiciona blocos de texto, imagens e carrosséis no <strong>CMS</strong>.</p>",
      },
    ],
  },
  {
    id: "p2",
    title: "SME",
    subtitle: "Mackenzie — Web",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p3",
    title: "Porty",
    subtitle: "Portfolio",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p4",
    title: "Academy",
    subtitle: "Apple Developer Academy",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p5",
    title: "Case #5",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p6",
    title: "Case #6",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p7",
    title: "Case #7",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p8",
    title: "Case #8",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p9",
    title: "Case #9",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
].map((p) => normalizeProject({ ...p, blocks: p.blocks ?? [] }));
