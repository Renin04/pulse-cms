import { escapeHtml, sanitizeUrl } from "./types";
import { formatReferenceNumber, type ReferenceStyle } from "./ReferenceBlock";

/* ─── Pulse inline markdown ────────────────────────────────────────────────
 * Single source of truth for the inline (in-paragraph) syntax used by every
 * block renderer, the studio editor fields and the blog renderer.
 *
 * Supported syntax (composes/nests freely, innermost delimiters first):
 *   `code`                      inline code (content is escaped verbatim)
 *   **bold**                    <strong>
 *   *italic*                    <em>
 *   __underline__               <u>
 *   ==highlight==               <mark class="pulse-mark"> (article/website default color)
 *   ==#hex:highlight==          <mark class="pulse-mark" style="--mark-color:#hex">
 *   {color:#hex}text{/color}    <span class="pulse-colored" style="--text-color:#hex">
 *   {color:}text{/color}        <span class="pulse-colored"> (article/website default color)
 *   [label](url){attrs}         link (label supports the marks above)
 *   [ref](url){attrs}           reference/citation
 *
 * Legacy-safety rules (plain text must survive untouched):
 *   - An opener must be followed by a non-space character.
 *   - A closer must be preceded by a non-space character.
 *   So "2 * 3 * 4", "a == b" and unmatched "==x" stay literal.
 *   - `{color:…}` directly after `](url)` is NOT treated as link attributes
 *     (negative lookahead in the link regex), so colored text can follow a link.
 *
 * Rendered mark/color elements carry the color in a scoped CSS variable, so
 * per-article defaults (--pulse-article-mark-color / --pulse-article-text-color)
 * re-theme all default-colored marks without touching the stored markdown.
 * ─────────────────────────────────────────────────────────────────────────── */

export const INLINE_HEX_COLOR_PATTERN =
  "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})";

const INLINE_HEX_COLOR_REGEX = new RegExp(`^${INLINE_HEX_COLOR_PATTERN}$`);

export function isValidInlineHexColor(value: string): boolean {
  return INLINE_HEX_COLOR_REGEX.test(value.trim());
}

/** Normalizes a hex color to lowercase, or returns undefined when invalid. */
export function normalizeInlineHexColor(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return isValidInlineHexColor(trimmed) ? trimmed.toLowerCase() : undefined;
}

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function isSpace(char: string | undefined): boolean {
  return char === undefined || /\s/.test(char);
}

interface ParsedInlineElement {
  html: string;
  /** Index just past the parsed element. */
  end: number;
}

/** Finds `delim` at/after `from` whose preceding character is not whitespace. */
function findClosingDelimiter(text: string, delim: string, from: number): number {
  let index = text.indexOf(delim, from);
  while (index !== -1) {
    if (index > from && !isSpace(text[index - 1])) return index;
    index = text.indexOf(delim, index + delim.length);
  }
  return -1;
}

/** Finds a single `*` closer (not part of a `**` pair) with a non-space predecessor. */
function findItalicClosing(text: string, from: number): number {
  let index = text.indexOf("*", from);
  while (index !== -1) {
    const precededOk = index > from && !isSpace(text[index - 1]);
    const standalone = text[index - 1] !== "*" && text[index + 1] !== "*";
    if (precededOk && standalone) return index;
    index = text.indexOf("*", index + 1);
  }
  return -1;
}

/**
 * Renders the emphasis/highlight/color/code layer of a text segment (no link
 * parsing — that lives in renderInlineMarkdown). Recursive so marks nest.
 */
export function renderInlineMarks(text: string, inlineSuffix = ""): string {
  let result = "";
  let literalStart = 0;
  let pos = 0;

  while (pos < text.length) {
    const char = text[pos];
    if (char === "`" || char === "*" || char === "_" || char === "=" || char === "{") {
      const parsed = tryParseInlineElement(text, pos, inlineSuffix);
      if (parsed) {
        result += escapeAndBreaks(text.slice(literalStart, pos));
        result += parsed.html;
        pos = parsed.end;
        literalStart = pos;
        continue;
      }
    }
    pos += 1;
  }

  result += escapeAndBreaks(text.slice(literalStart));
  return result;
}

function tryParseInlineElement(
  text: string,
  pos: number,
  inlineSuffix: string,
): ParsedInlineElement | null {
  // Inline code — content is verbatim (no nested parsing), matching the
  // studio editor's historical backtick handling.
  if (text[pos] === "`") {
    const closing = text.indexOf("`", pos + 1);
    if (closing === -1) return null;
    const inner = text.slice(pos + 1, closing);
    return {
      html: `<code>${escapeHtml(inner).replace(/\n/g, "<br />")}</code>${inlineSuffix}`,
      end: closing + 1,
    };
  }

  // Bold+italic ***text***
  if (text.startsWith("***", pos)) {
    if (isSpace(text[pos + 3])) return null;
    const closing = findClosingDelimiter(text, "***", pos + 3);
    if (closing === -1) return null;
    const inner = text.slice(pos + 3, closing);
    return {
      html: `<strong><em>${renderInlineMarks(inner, inlineSuffix)}</em></strong>${inlineSuffix}`,
      end: closing + 3,
    };
  }

  // Bold **text**
  if (text.startsWith("**", pos)) {
    if (isSpace(text[pos + 2])) return null;
    const closing = findClosingDelimiter(text, "**", pos + 2);
    if (closing === -1) return null;
    const inner = text.slice(pos + 2, closing);
    return {
      html: `<strong>${renderInlineMarks(inner, inlineSuffix)}</strong>${inlineSuffix}`,
      end: closing + 2,
    };
  }

  // Italic *text* (single asterisk only)
  if (text[pos] === "*" && text[pos + 1] !== "*") {
    if (isSpace(text[pos + 1])) return null;
    const closing = findItalicClosing(text, pos + 1);
    if (closing === -1) return null;
    const inner = text.slice(pos + 1, closing);
    return {
      html: `<em>${renderInlineMarks(inner, inlineSuffix)}</em>${inlineSuffix}`,
      end: closing + 1,
    };
  }

  // Underline __text__
  if (text.startsWith("__", pos)) {
    if (isSpace(text[pos + 2])) return null;
    const closing = findClosingDelimiter(text, "__", pos + 2);
    if (closing === -1) return null;
    const inner = text.slice(pos + 2, closing);
    return {
      html: `<u>${renderInlineMarks(inner, inlineSuffix)}</u>${inlineSuffix}`,
      end: closing + 2,
    };
  }

  // Highlight ==text== or ==#hex:text==
  if (text.startsWith("==", pos)) {
    let color: string | undefined;
    let contentStart = pos + 2;
    if (text[contentStart] === "#") {
      const colorMatch = text
        .slice(contentStart)
        .match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}):/);
      // "==#" without a valid hex color stays literal text.
      if (!colorMatch) return null;
      color = `#${colorMatch[1].toLowerCase()}`;
      contentStart += colorMatch[0].length;
    }
    if (isSpace(text[contentStart])) return null;
    const closing = findClosingDelimiter(text, "==", contentStart);
    if (closing === -1) return null;
    const inner = text.slice(contentStart, closing);
    const styleAttr = color ? ` style="--mark-color:${color}"` : "";
    return {
      html: `<mark class="pulse-mark"${styleAttr}>${renderInlineMarks(inner, inlineSuffix)}</mark>${inlineSuffix}`,
      end: closing + 2,
    };
  }

  // Text color {color:#hex}text{/color} or {color:}text{/color} (default)
  if (text.startsWith("{color:", pos)) {
    const openMatch = text
      .slice(pos)
      .match(/^\{color:(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8})?\}/);
    if (!openMatch) return null;
    const color = openMatch[1] ? openMatch[1].toLowerCase() : undefined;
    const contentStart = pos + openMatch[0].length;
    if (isSpace(text[contentStart])) return null;
    const closing = text.indexOf("{/color}", contentStart);
    if (closing === -1 || isSpace(text[closing - 1])) return null;
    const inner = text.slice(contentStart, closing);
    const styleAttr = color ? ` style="--text-color:${color}"` : "";
    return {
      html: `<span class="pulse-colored"${styleAttr}>${renderInlineMarks(inner, inlineSuffix)}</span>${inlineSuffix}`,
      end: closing + "{/color}".length,
    };
  }

  return null;
}

/* ─── Link/reference layer ─── */

export interface InlineMarkdownHandlers {
  /**
   * Renders a link. `labelHtml` already has inline marks applied.
   * Return null to fall back to the escaped raw markdown.
   */
  renderLink?: (labelHtml: string, url: string, attrs: string, raw: string) => string | null;
  /** Renders a reference. Return null to fall back to the escaped raw markdown. */
  renderRef?: (url: string, attrs: string, raw: string) => string | null;
  /**
   * Appended after every generated inline element (mark, colored span,
   * emphasis, code). The studio editor passes a zero-width space so the caret
   * lands outside the element when typing right after it; renderers pass "".
   */
  inlineSuffix?: string;
}

// `{color:…}` right after `](url)` must be parsed as a color span opener, not
// swallowed as link attributes — hence the (?!color:) lookahead.
const INLINE_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)(?:\{((?!color:)[^}]*)\})?/g;

// Private-use sentinels stand in for link/ref tokens while the marks layer
// runs, so ==highlights==, **bold** etc. can span across links. They are
// non-space (flanking rules keep working) and untouched by escaping.
const SENTINEL_OPEN = "\uE000";
const SENTINEL_CLOSE = "\uE001";
const SENTINEL_REGEX = /\uE000(\d+)\uE001/g;

function defaultRenderLink(labelHtml: string, url: string, attrs: string): string | null {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return null;
  const relMatch = attrs.match(/rel="([^"]*)"/);
  const rel = relMatch ? relMatch[1] : "";
  const targetMatch = attrs.match(/target="([^"]*)"/);
  const target = targetMatch ? targetMatch[1] : "";
  const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
  const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
  return `<a href="${escapeHtml(safeUrl)}" class="pulse-inline-link"${relAttr}${targetAttr}>${labelHtml}</a>`;
}

function defaultRenderRef(url: string, attrs: string): string | null {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return null;
  const textMatch = attrs.match(/text="([^"]*)"/);
  const styleMatch = attrs.match(/style="([^"]*)"/);
  const targetMatch = attrs.match(/target="([^"]*)"/);
  const relMatch = attrs.match(/rel="([^"]*)"/);
  const refText = textMatch ? textMatch[1] : "";
  const style = (styleMatch ? styleMatch[1] : "numeric") as ReferenceStyle;
  const target = targetMatch ? targetMatch[1] : "";
  const rel = relMatch ? relMatch[1] : "";
  const num = formatReferenceNumber(1, style);
  const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
  const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
  const supRef = `<sup class="pulse-reference"><a href="${escapeHtml(safeUrl)}"${targetAttr}${relAttr}>${num}</a></sup>`;
  if (refText) {
    return `<span class="pulse-reference-group"><a href="${escapeHtml(safeUrl)}" class="pulse-reference-text"${targetAttr}${relAttr}>${escapeHtml(refText)}</a>${supRef}</span>`;
  }
  return supRef;
}

interface InlineToken {
  label: string;
  url: string;
  attrs: string;
  raw: string;
}

/**
 * Full inline pipeline: links/references are masked with sentinels (document
 * order preserved), the marks layer (bold/italic/underline/highlight/color/
 * code) runs over the masked text so marks can nest inside link labels AND
 * span across links, then tokens are substituted back as HTML. Consumers
 * inject their own link/ref renderers; the default policy matches the block
 * renderers (sanitizeUrl + pulse classes).
 */
export function renderInlineMarkdown(text: string, handlers: InlineMarkdownHandlers = {}): string {
  const inlineSuffix = handlers.inlineSuffix ?? "";
  const renderLink = handlers.renderLink ?? defaultRenderLink;
  const renderRef = handlers.renderRef ?? defaultRenderRef;

  const tokens: InlineToken[] = [];
  INLINE_LINK_REGEX.lastIndex = 0;
  const masked = text.replace(INLINE_LINK_REGEX, (raw, label: string, url: string, attrs?: string) => {
    tokens.push({ label, url, attrs: attrs ?? "", raw });
    return `${SENTINEL_OPEN}${tokens.length - 1}${SENTINEL_CLOSE}`;
  });

  const renderToken = (token: InlineToken): string => {
    if (token.label === "ref") {
      return renderRef(token.url, token.attrs, token.raw) ?? escapeAndBreaks(token.raw);
    }
    const labelHtml = renderInlineMarks(token.label, inlineSuffix);
    return renderLink(labelHtml, token.url, token.attrs, token.raw) ?? escapeAndBreaks(token.raw);
  };

  SENTINEL_REGEX.lastIndex = 0;
  return renderInlineMarks(masked, inlineSuffix).replace(SENTINEL_REGEX, (_match, index: string) =>
    renderToken(tokens[Number(index)]),
  );
}
