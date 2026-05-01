export type ShareChannel =
  | "native"
  | "clipboard"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "email";

export interface SharePayload {
  url: string;
  title?: string;
  text?: string;
  tags?: string[];
}

export interface ShareAction {
  channel: ShareChannel;
  label: string;
  url?: string;
  method: "native" | "url" | "clipboard";
}

export interface ShareConfig {
  channels?: ShareChannel[];
  includeClipboardFallback?: boolean;
  preferredOrder?: ShareChannel[];
}

export interface ShareExecutionHooks {
  openUrl?: (url: string) => void;
  copyText?: (text: string) => void | Promise<void>;
  nativeShare?: (payload: SharePayload) => void | Promise<void>;
}

export interface ShareExecutionResult {
  ok: boolean;
  channel: ShareChannel;
  method: ShareAction["method"];
  target?: string;
}

const DEFAULT_CHANNELS: ShareChannel[] = [
  "native",
  "twitter",
  "linkedin",
  "facebook",
  "email",
];

const DEFAULT_ORDER: ShareChannel[] = [
  "native",
  "twitter",
  "linkedin",
  "facebook",
  "email",
  "clipboard",
];

function sanitizeUrl(url: string): string {
  const normalized = url.trim();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("/")) {
    return normalized;
  }
  return `https://${normalized}`;
}

function encode(value: string | undefined): string {
  return encodeURIComponent((value ?? "").trim());
}

function uniqueChannels(channels: ShareChannel[]): ShareChannel[] {
  return Array.from(new Set(channels));
}

export function resolveShareChannels(config: ShareConfig = {}): ShareChannel[] {
  const requested =
    config.channels && config.channels.length > 0
      ? uniqueChannels(config.channels)
      : [...DEFAULT_CHANNELS];

  if (config.includeClipboardFallback ?? true) {
    if (!requested.includes("clipboard")) {
      requested.push("clipboard");
    }
  }

  const order = config.preferredOrder && config.preferredOrder.length > 0
    ? uniqueChannels(config.preferredOrder)
    : DEFAULT_ORDER;

  const rank = new Map(order.map((channel, index) => [channel, index]));

  return requested.sort((left, right) => {
    const leftRank = rank.get(left) ?? 999;
    const rightRank = rank.get(right) ?? 999;
    return leftRank - rightRank;
  });
}

function buildShareUrl(channel: ShareChannel, payload: SharePayload): string | null {
  const url = sanitizeUrl(payload.url);
  const title = payload.title ?? "";
  const text = payload.text ?? "";
  const tags = payload.tags && payload.tags.length > 0 ? payload.tags.join(",") : "";

  switch (channel) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encode(url)}&text=${encode(text || title)}&hashtags=${encode(tags)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`;
    case "email": {
      const subject = title || "Shared via Pulse";
      const body = [text, url].filter(Boolean).join("\n\n");
      return `mailto:?subject=${encode(subject)}&body=${encode(body)}`;
    }
    default:
      return null;
  }
}

function channelLabel(channel: ShareChannel): string {
  switch (channel) {
    case "native":
      return "Share";
    case "clipboard":
      return "Copy link";
    case "twitter":
      return "Share on X";
    case "linkedin":
      return "Share on LinkedIn";
    case "facebook":
      return "Share on Facebook";
    case "email":
      return "Share by email";
  }
}

export function buildShareActions(
  payload: SharePayload,
  config: ShareConfig = {},
): ShareAction[] {
  const channels = resolveShareChannels(config);

  return channels
    .map((channel): ShareAction | null => {
      if (channel === "native") {
        return {
          channel,
          label: channelLabel(channel),
          method: "native",
        };
      }

      if (channel === "clipboard") {
        return {
          channel,
          label: channelLabel(channel),
          method: "clipboard",
        };
      }

      const url = buildShareUrl(channel, payload);
      if (!url) return null;

      return {
        channel,
        label: channelLabel(channel),
        method: "url",
        url,
      };
    })
    .filter((action): action is ShareAction => action !== null);
}

export async function executeShareAction(
  action: ShareAction,
  payload: SharePayload,
  hooks: ShareExecutionHooks = {},
): Promise<ShareExecutionResult> {
  if (action.method === "native") {
    await hooks.nativeShare?.(payload);
    return {
      ok: true,
      channel: action.channel,
      method: action.method,
    };
  }

  if (action.method === "clipboard") {
    const url = sanitizeUrl(payload.url);
    await hooks.copyText?.(url);
    return {
      ok: true,
      channel: action.channel,
      method: action.method,
      target: url,
    };
  }

  if (action.url) {
    hooks.openUrl?.(action.url);
    return {
      ok: true,
      channel: action.channel,
      method: action.method,
      target: action.url,
    };
  }

  return {
    ok: false,
    channel: action.channel,
    method: action.method,
  };
}
