import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

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
}

export interface CarouselBlockData extends Record<string, unknown> {
  slides: CarouselSlide[];
  autoplay: boolean;
  intervalMs: number;
  showIndicators: boolean;
}

const carouselSlideSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    body: z.string().optional(),
    mediaUrl: z.string().refine(hasAllowedCarouselProtocol, {
      message: "Unsupported carousel media URL protocol",
    }).optional(),
  })
  .strict();

export const carouselBlockDataSchema = z
  .object({
    slides: z.array(carouselSlideSchema).max(30),
    autoplay: z.boolean(),
    intervalMs: z.number().int().min(1000).max(120_000),
    showIndicators: z.boolean(),
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
      },
    ],
  });
}

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
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = carouselBlockDataSchema.parse(data);
    const slides = parsed.slides
      .map((slide, index) => {
        const media = slide.mediaUrl
          ? `<img src="${escapeHtml(slide.mediaUrl)}" alt="${escapeHtml(slide.title ?? `Slide ${index + 1}`)}" />`
          : "";
        const title = slide.title ? `<h4>${escapeHtml(slide.title)}</h4>` : "";
        const body = slide.body ? `<p>${escapeHtml(slide.body)}</p>` : "";
        return `<article data-slide-index="${index}" data-active="${String(index === 0)}">${media}${title}${body}</article>`;
      })
      .join("");
    const indicators = parsed.showIndicators
      ? `<div data-indicators="true">${parsed.slides
          .map((_, index) => `<button type="button" data-target-index="${index}"></button>`)
          .join("")}</div>`
      : "";

    return `<section data-block-type="carousel" data-autoplay="${String(
      parsed.autoplay,
    )}" data-interval-ms="${parsed.intervalMs}">${slides}${indicators}</section>`;
  },
  serialize(data) {
    const parsed = carouselBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return carouselBlockDataSchema.parse(parseJson<CarouselBlockData>(content));
  },
};
