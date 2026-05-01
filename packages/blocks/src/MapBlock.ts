import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type MapProvider = "openstreetmap" | "google" | "mapbox";

export interface MapBlockData extends Record<string, unknown> {
  provider: MapProvider;
  latitude: number;
  longitude: number;
  zoom: number;
  label?: string;
}

export const mapBlockDataSchema = z
  .object({
    provider: z.enum(["openstreetmap", "google", "mapbox"]),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    zoom: z.number().int().min(1).max(20),
    label: z.string().optional(),
  })
  .strict();

export const MapBlock: BlockTypeDefinition<MapBlockData> = {
  type: "map",
  name: "Map",
  icon: "MAP",
  schema: mapBlockDataSchema,
  defaultData: {
    provider: "openstreetmap",
    latitude: 35.6892,
    longitude: 51.389,
    zoom: 10,
    label: "Default map",
  },
  config: {
    category: "advanced",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = mapBlockDataSchema.parse(data);
    const label = parsed.label ? `<figcaption>${escapeHtml(parsed.label)}</figcaption>` : "";

    return `<figure data-block-type="map" data-provider="${parsed.provider}" data-latitude="${escapeHtml(
      String(parsed.latitude),
    )}" data-longitude="${escapeHtml(String(parsed.longitude))}" data-zoom="${parsed.zoom}"><div>Map placeholder (${escapeHtml(
      parsed.provider,
    )})</div>${label}</figure>`;
  },
  serialize(data) {
    const parsed = mapBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return mapBlockDataSchema.parse(parseJson<MapBlockData>(content));
  },
};
