import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, stableRenderId } from "./types";

const ALLOWED_CAROUSEL_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedCarouselProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_CAROUSEL_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface CarouselSlide {
  id: string;
  title?: string;
  body?: string;
  mediaUrl?: string;
  mediaFit?: "cover" | "contain" | "fill";
}

export interface CarouselBlockData extends Record<string, unknown> {
  slides: CarouselSlide[];
  autoplay: boolean;
  intervalMs: number;
  showIndicators: boolean;
  showArrows?: boolean;
  slideHeight?: string;
}

const carouselSlideSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    body: z.string().optional(),
    mediaUrl: z
      .string()
      .refine(hasAllowedCarouselProtocol, {
        message: "Unsupported carousel media URL protocol",
      })
      .optional(),
    mediaFit: z.enum(["cover", "contain", "fill"]).optional(),
  })
  .strict();

export const carouselBlockDataSchema = z
  .object({
    slides: z.array(carouselSlideSchema).max(30),
    autoplay: z.boolean(),
    intervalMs: z.number().int().min(1000).max(120_000),
    showIndicators: z.boolean(),
    showArrows: z.boolean().optional(),
    slideHeight: z.string().optional(),
  })
  .strict();

function createSlideId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `carousel-slide-${crypto.randomUUID()}`;
  }

  return `carousel-slide-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addCarouselSlide(
  data: CarouselBlockData,
  slide: Omit<CarouselSlide, "id"> & { id?: string } = {},
): CarouselBlockData {
  const parsed = carouselBlockDataSchema.parse(data);

  return carouselBlockDataSchema.parse({
    ...parsed,
    slides: [
      ...parsed.slides,
      {
        id: slide.id ?? createSlideId(),
        title: slide.title,
        body: slide.body,
        mediaUrl: slide.mediaUrl,
        mediaFit: slide.mediaFit,
      },
    ],
  });
}

const chevronLeftSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`;
const chevronRightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

export const CarouselBlock: BlockTypeDefinition<CarouselBlockData> = {
  type: "carousel",
  name: "Carousel",
  icon: "CAROUSEL",
  schema: carouselBlockDataSchema,
  defaultData: {
    slides: [
      {
        id: "carousel-slide-1",
        title: "Slide 1",
        body: "First carousel panel",
      },
      {
        id: "carousel-slide-2",
        title: "Slide 2",
        body: "Second carousel panel",
      },
    ],
    autoplay: false,
    intervalMs: 5000,
    showIndicators: true,
    showArrows: true,
    slideHeight: "360px",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = carouselBlockDataSchema.parse(data);
    const carouselId = stableRenderId("carousel", JSON.stringify(parsed));
    const height = parsed.slideHeight || "360px";
    const totalSlides = parsed.slides.length;

    const slides = parsed.slides
      .map((slide, index) => {
        const fit = slide.mediaFit ?? "cover";
        const label = slide.title ?? `Slide ${index + 1}`;
        const media = slide.mediaUrl
          ? `<div class="pulse-carousel__media"><img src="${escapeHtml(slide.mediaUrl)}" alt="${escapeHtml(
              label,
            )}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" style="width:100%;height:100%;object-fit:${fit};display:block;" /></div>`
          : "";
        const title = slide.title
          ? `<h4 class="pulse-carousel__slide-title">${escapeHtml(slide.title)}</h4>`
          : "";
        const body = slide.body ? `<p class="pulse-carousel__slide-body">${escapeHtml(slide.body)}</p>` : "";
        const activeAttr = index === 0 ? ' data-active="true"' : "";
        return `<article class="pulse-carousel__slide" data-slide-index="${index}"${activeAttr} role="listitem" aria-roledescription="slide" aria-label="${escapeHtml(
          label,
        )} — ${index + 1} of ${totalSlides}">${media}<div class="pulse-carousel__slide-content">${title}${body}</div></article>`;
      })
      .join("");

    const indicators = parsed.showIndicators
      ? `<div class="pulse-carousel__indicators" role="tablist" aria-label="Slide indicators">${parsed.slides
          .map(
            (_, index) =>
              `<button type="button" class="pulse-carousel__dot${index === 0 ? " pulse-carousel__dot--active" : ""}" data-target-index="${index}" role="tab" aria-label="Go to slide ${index + 1}"${index === 0 ? ' aria-selected="true"' : ""}></button>`,
          )
          .join("")}</div>`
      : "";

    const arrows = parsed.showArrows
      ? `<button type="button" class="pulse-carousel__arrow pulse-carousel__arrow--prev" aria-label="Previous slide">${chevronLeftSvg}</button><button type="button" class="pulse-carousel__arrow pulse-carousel__arrow--next" aria-label="Next slide">${chevronRightSvg}</button>`
      : "";

    const autoplayAttr = ` data-autoplay="${parsed.autoplay ? "true" : "false"}"${parsed.autoplay ? ` data-interval="${parsed.intervalMs}"` : ""}`;

    return `<section class="pulse-carousel" id="${carouselId}" data-block-type="carousel"${autoplayAttr} style="--carousel-height:${height};" role="group" aria-roledescription="carousel" aria-label="Image carousel"><div class="pulse-carousel__track" role="list">${slides}</div>${arrows}${indicators}</section>`;
  },
  serialize(data) {
    const parsed = carouselBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return carouselBlockDataSchema.parse(parseJson<CarouselBlockData>(content));
  },
};
