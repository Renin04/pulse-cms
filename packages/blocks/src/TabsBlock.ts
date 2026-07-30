import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, stableRenderId } from "./types";

export interface TabItem {
  id: string;
  label: string;
  content: string;
}

export interface TabsBlockData extends Record<string, unknown> {
  activeTabId?: string;
  tabs: TabItem[];
}

const tabItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    content: z.string(),
  })
  .strict();

export const tabsBlockDataSchema = z
  .object({
    activeTabId: z.string().optional(),
    tabs: z.array(tabItemSchema).max(20),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const tab of value.tabs) {
      if (ids.has(tab.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate tab id "${tab.id}"`,
          path: ["tabs"],
        });
      }
      ids.add(tab.id);
    }

    if (value.activeTabId && !ids.has(value.activeTabId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Active tab "${value.activeTabId}" was not found`,
        path: ["activeTabId"],
      });
    }
  });

function createTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tab-${crypto.randomUUID()}`;
  }

  return `tab-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addTabItem(
  data: TabsBlockData,
  tab: Omit<TabItem, "id"> & { id?: string },
): TabsBlockData {
  const parsed = tabsBlockDataSchema.parse(data);
  const tabId = tab.id ?? createTabId();

  return tabsBlockDataSchema.parse({
    ...parsed,
    activeTabId: parsed.activeTabId ?? tabId,
    tabs: [
      ...parsed.tabs,
      {
        ...tab,
        id: tabId,
      },
    ],
  });
}

export function setActiveTab(data: TabsBlockData, tabId: string): TabsBlockData {
  const parsed = tabsBlockDataSchema.parse(data);

  if (!parsed.tabs.some((tab) => tab.id === tabId)) {
    throw new Error(`Tab "${tabId}" was not found`);
  }

  return tabsBlockDataSchema.parse({
    ...parsed,
    activeTabId: tabId,
  });
}

export const TabsBlock: BlockTypeDefinition<TabsBlockData> = {
  type: "tabs",
  name: "Tabs",
  icon: "TABS",
  schema: tabsBlockDataSchema,
  defaultData: {
    activeTabId: "tab-1",
    tabs: [
      {
        id: "tab-1",
        label: "Overview",
        content: "Summarize this section.",
      },
      {
        id: "tab-2",
        label: "Details",
        content: "Add deeper implementation details.",
      },
    ],
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = tabsBlockDataSchema.parse(data);
    const activeTabId = parsed.activeTabId ?? parsed.tabs[0].id;
    const tabsId = stableRenderId("tabs", JSON.stringify(parsed));
    const nav = parsed.tabs
      .map(
        (tab) =>
          `<button type="button" data-tab-id="${escapeHtml(tab.id)}" class="pulse-tab-btn" style="padding:8px 16px;border-radius:8px 8px 0 0;border:1px solid var(--neutral-200);border-bottom:none;background:${tab.id === activeTabId ? '#fff' : 'var(--neutral-50)'};cursor:pointer;font-weight:${tab.id === activeTabId ? '600' : '400'};color:${tab.id === activeTabId ? 'var(--pulse-black)' : 'var(--neutral-500)'};">${escapeHtml(tab.label)}</button>`,
      )
      .join("");
    const panels = parsed.tabs
      .map(
        (tab) =>
          `<div data-tab-panel="${escapeHtml(tab.id)}" style="display:${tab.id === activeTabId ? 'block' : 'none'};padding:16px;border:1px solid var(--neutral-200);border-radius:0 8px 8px 8px;background:#fff;"><p style="white-space:pre-wrap;">${escapeHtml(tab.content)}</p></div>`,
      )
      .join("");

    return `<section data-block-type="tabs" id="${tabsId}" class="pulse-tabs"><nav style="display:flex;gap:4px;border-bottom:1px solid var(--neutral-200);">${nav}</nav>${panels}</section>`;
  },
  serialize(data) {
    const parsed = tabsBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return tabsBlockDataSchema.parse(parseJson<TabsBlockData>(content));
  },
};
