import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

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
    const nav = parsed.tabs
      .map(
        (tab) =>
          `<button data-tab-id="${escapeHtml(tab.id)}" data-active="${String(
            tab.id === activeTabId,
          )}">${escapeHtml(tab.label)}</button>`,
      )
      .join("");
    const activeTab = parsed.tabs.find((tab) => tab.id === activeTabId) ?? parsed.tabs[0];

    return `<section data-block-type="tabs"><nav>${nav}</nav><article>${escapeHtml(
      activeTab.content,
    )}</article></section>`;
  },
  serialize(data) {
    const parsed = tabsBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return tabsBlockDataSchema.parse(parseJson<TabsBlockData>(content));
  },
};
