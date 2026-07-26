import { escapeHtml } from "./types";

/**
 * Lightweight zero-dependency TeX-like math renderer.
 *
 * Supported subset (documented contract — anything outside it degrades
 * gracefully to literal text, never throws):
 *
 * - Numbers: `42`, `3.14`
 * - Variables: single letters, rendered italic (`x`, `E`, `mc` → m c)
 * - Operators: `+ - * = < > , ; : ! ' ( ) [ ] |`
 * - Superscripts: `x^2`, `x^{n+1}` (single atom or brace group)
 * - Subscripts: `x_1`, `x_{i+1}`; combined `x_1^2` stacks
 * - Fractions: `\frac{a}{b}` and infix `a/b` (single preceding/following
 *   atom — use `(x+1)/2` or `\frac{x+1}{2}` for complex numerators)
 * - Radicals: `\sqrt{x}`, `\sqrt[n]{x}`, plus `sqrt(x)` convenience
 * - Greek letters: `\alpha` … `\omega` and uppercase variants
 * - Big operators: `\sum \prod \int \iint \oint \bigcup \bigcap` with
 *   `_`/`^` limits (under/over in display mode, scripts inline)
 * - Symbols: `\infty \pm \mp \times \cdot \div \leq \geq \neq \approx
 *   \sim \propto \partial \nabla \in \notin \subset \supset \cup \cap
 *   \to \rightarrow \leftarrow \Rightarrow \leftrightarrow \ldots \cdots
 *   \dots \degree \circ \bullet \perp \parallel \angle \emptyset`
 * - Functions (upright): `sin cos tan cot sec csc log ln exp min max lim det`
 * - `\left( … \right)`, `\left[ … \right]`, `\left| … \right|` (rendered
 *   as plain delimiters)
 * - `\text{…}` for upright text fragments
 * - Change-highlight markers (consumed by stepped equations, transparent
 *   otherwise): `\change{…}` forces highlight, `\nochange{…}` suppresses it
 *
 * Output is styled HTML (no MathML, no KaTeX/MathJax) with `pulse-math*`
 * classes; SSR-deterministic and safe to embed (all text escaped).
 */

export type MathTokenType = "number" | "ident" | "func" | "command" | "symbol" | "text";

export interface MathToken {
  type: MathTokenType;
  value: string;
  /** Position in the token array — stable id used for change highlighting. */
  index: number;
  /** Highlight mark propagated from an enclosing \change / \nochange group. */
  mark?: "force" | "off";
}

const FUNCTION_NAMES = new Set([
  "sqrt",
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "log",
  "ln",
  "exp",
  "min",
  "max",
  "lim",
  "det",
]);

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
  eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ",
  nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ",
  upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

/** Symbols rendered as operators (get operator spacing). */
const SYMBOL_OPS: Record<string, string> = {
  infty: "∞", pm: "±", mp: "∓", times: "×", cdot: "·", div: "÷",
  leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠",
  approx: "≈", sim: "∼", propto: "∝", to: "→", rightarrow: "→",
  leftarrow: "←", Rightarrow: "⇒", Leftarrow: "⇐", leftrightarrow: "↔",
  mapsto: "↦", ldots: "…", dots: "…", cdots: "⋯", degree: "°",
  circ: "∘", bullet: "∙", oplus: "⊕", otimes: "⊗", perp: "⊥",
  parallel: "∥", angle: "∠", emptyset: "∅", partial: "∂", nabla: "∇",
  in: "∈", notin: "∉", subset: "⊂", supset: "⊃", cup: "∪", cap: "∩",
  forall: "∀", exists: "∃", hbar: "ℏ", ell: "ℓ", aleph: "ℵ", wp: "℘",
  prime: "′",
};

const BIGOP_CHARS: Record<string, string> = {
  sum: "∑", prod: "∏", int: "∫", iint: "∬", oint: "∮",
  bigcup: "⋃", bigcap: "⋂", bigoplus: "⨁", bigotimes: "⨂",
};

const MARKER_COMMANDS = new Set(["change", "nochange"]);

/**
 * Tokenize math source. `\change{…}` / `\nochange{…}` markers are consumed
 * here: they emit no token of their own, but every token inside their group
 * carries a `mark` flag. Whitespace is insignificant (except inside \text).
 */
export function tokenizeMath(source: string): MathToken[] {
  const tokens: MathToken[] = [];
  const markStack: Array<{ depth: number; mark: "force" | "off" }> = [];
  let braceDepth = 0;
  let i = 0;

  const currentMark = (): "force" | "off" | undefined =>
    markStack.length > 0 ? markStack[markStack.length - 1].mark : undefined;

  const push = (type: MathTokenType, value: string) => {
    const mark = currentMark();
    tokens.push(mark ? { type, value, index: tokens.length, mark } : { type, value, index: tokens.length });
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const match = /^\d+(\.\d+)?/.exec(source.slice(i));
      const value = match ? match[0] : ch;
      push("number", value);
      i += value.length;
      continue;
    }

    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < source.length && /[A-Za-z]/.test(source[j])) j += 1;
      const word = source.slice(i, j);
      if (FUNCTION_NAMES.has(word)) {
        push("func", word);
      } else {
        for (const letter of word) push("ident", letter);
      }
      i = j;
      continue;
    }

    if (ch === "\\") {
      let j = i + 1;
      if (j < source.length && /[A-Za-z]/.test(source[j])) {
        const start = j;
        while (j < source.length && /[A-Za-z]/.test(source[j])) j += 1;
        const name = source.slice(start, j);
        i = j;

        if (MARKER_COMMANDS.has(name)) {
          // Consume the following group silently, marking its tokens.
          while (i < source.length && source[i] === " ") i += 1;
          if (source[i] === "{") {
            markStack.push({ depth: braceDepth, mark: name === "change" ? "force" : "off" });
            push("symbol", "{");
            braceDepth += 1;
            i += 1;
          }
          // A marker without a group is ignored entirely.
          continue;
        }

        if (name === "text") {
          while (i < source.length && source[i] === " ") i += 1;
          if (source[i] === "{") {
            let depth = 1;
            let k = i + 1;
            while (k < source.length && depth > 0) {
              if (source[k] === "{") depth += 1;
              else if (source[k] === "}") depth -= 1;
              if (depth > 0) k += 1;
            }
            push("text", source.slice(i + 1, k));
            i = k + 1;
          } else {
            push("command", name);
          }
          continue;
        }

        push("command", name);
        continue;
      }
      // `\` + non-letter (e.g. `\\`, `\%`, `\,`) — keep the escaped char.
      if (j < source.length) {
        const escaped = source[j];
        if (escaped === "%") push("symbol", "%");
        else if (escaped === "\\") push("symbol", "\\");
        else if (escaped === "{" || escaped === "}") push("symbol", escaped);
        else if (escaped === " " || escaped === "," || escaped === ";") {
          // spacing commands — emit nothing
        } else push("symbol", escaped);
        i = j + 1;
        continue;
      }
      i = j;
      continue;
    }

    if (ch === "{") {
      push("symbol", "{");
      braceDepth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      push("symbol", "}");
      if (markStack.length > 0 && markStack[markStack.length - 1].depth === braceDepth) {
        markStack.pop();
      }
      i += 1;
      continue;
    }

    push("symbol", ch);
    i += 1;
  }

  return tokens;
}

/* ─── AST ─── */

export type MathNode =
  | { kind: "num"; value: string; tokenIndex: number }
  | { kind: "var"; name: string; tokenIndex: number }
  | { kind: "op"; value: string; tokenIndex: number }
  | { kind: "greek"; char: string; upper: boolean; tokenIndex: number }
  | { kind: "sym"; char: string; tokenIndex: number }
  | { kind: "func"; name: string; tokenIndex: number }
  | { kind: "text"; text: string; tokenIndex: number }
  | { kind: "unknown"; name: string; tokenIndex: number }
  | { kind: "seq"; children: MathNode[]; tokenIndex: number }
  | { kind: "group"; children: MathNode[]; open: string; close: string; tokenIndex: number }
  | { kind: "frac"; numerator: MathNode; denominator: MathNode; tokenIndex: number }
  | { kind: "sqrt"; body: MathNode; index: MathNode | null; tokenIndex: number }
  | { kind: "script"; base: MathNode; sub: MathNode | null; sup: MathNode | null; tokenIndex: number }
  | { kind: "bigop"; char: string; lower: MathNode | null; upper: MathNode | null; tokenIndex: number };

const EMPTY_SEQ: MathNode = { kind: "seq", children: [], tokenIndex: -1 };

interface ParserState {
  tokens: MathToken[];
  pos: number;
}

function peek(state: ParserState): MathToken | undefined {
  return state.tokens[state.pos];
}

function isStopToken(token: MathToken | undefined, stopValues: ReadonlySet<string>): boolean {
  if (!token) return true;
  if (token.type === "symbol" && stopValues.has(token.value)) return true;
  if (token.type === "command" && stopValues.has(`\\${token.value}`)) return true;
  return false;
}

function parseSequence(state: ParserState, stopValues: ReadonlySet<string>): MathNode[] {
  const children: MathNode[] = [];

  while (state.pos < state.tokens.length) {
    const token = peek(state);
    if (isStopToken(token, stopValues)) break;

    if (token && token.type === "symbol" && token.value === "/") {
      state.pos += 1;
      const numerator = children.pop();
      const denominator = parseScriptedAtom(state);
      if (!numerator) {
        // Nothing to the left of `/` — render it as a plain operator.
        children.push({ kind: "op", value: "/", tokenIndex: token.index });
        if (denominator) children.push(denominator);
      } else {
        children.push({
          kind: "frac",
          numerator,
          denominator: denominator ?? EMPTY_SEQ,
          tokenIndex: token.index,
        });
      }
      continue;
    }

    const atom = parseScriptedAtom(state);
    if (atom) children.push(atom);
  }

  return children;
}

function parseScriptedAtom(state: ParserState): MathNode | null {
  const atom = parseAtom(state);
  if (!atom) return null;

  let sub: MathNode | null = null;
  let sup: MathNode | null = null;
  let scriptTokenIndex = -1;

  for (let guard = 0; guard < 2; guard += 1) {
    const token = peek(state);
    if (!token || token.type !== "symbol") break;
    if (token.value === "_" && !sub) {
      state.pos += 1;
      if (scriptTokenIndex === -1) scriptTokenIndex = token.index;
      sub = parseAtom(state) ?? EMPTY_SEQ;
      continue;
    }
    if (token.value === "^" && !sup) {
      state.pos += 1;
      if (scriptTokenIndex === -1) scriptTokenIndex = token.index;
      sup = parseAtom(state) ?? EMPTY_SEQ;
      continue;
    }
    break;
  }

  if (!sub && !sup) return atom;

  if (atom.kind === "bigop") {
    return { ...atom, lower: sub, upper: sup };
  }

  return { kind: "script", base: atom, sub, sup, tokenIndex: scriptTokenIndex };
}

const PAREN_DELIMS: Record<string, { open: string; close: string }> = {
  "(": { open: "(", close: ")" },
  "[": { open: "[", close: "]" },
  "|": { open: "|", close: "|" },
  ".": { open: "", close: "" },
};

function parseSqrt(state: ParserState, token: MathToken): MathNode {
  let index: MathNode | null = null;
  const next = peek(state);
  if (next && next.type === "symbol" && next.value === "[") {
    state.pos += 1;
    const children = parseSequence(state, new Set(["]"]));
    if (peek(state)?.value === "]") state.pos += 1;
    index = { kind: "seq", children, tokenIndex: next.index };
  }
  const body = parseAtom(state) ?? EMPTY_SEQ;
  return { kind: "sqrt", body, index, tokenIndex: token.index };
}

function parseAtom(state: ParserState): MathNode | null {
  const token = state.tokens[state.pos];
  if (!token) return null;
  state.pos += 1;

  switch (token.type) {
    case "number":
      return { kind: "num", value: token.value, tokenIndex: token.index };
    case "ident":
      return { kind: "var", name: token.value, tokenIndex: token.index };
    case "func":
      if (token.value === "sqrt") return parseSqrt(state, token);
      return { kind: "func", name: token.value, tokenIndex: token.index };
    case "text":
      return { kind: "text", text: token.value, tokenIndex: token.index };
    case "command": {
      const name = token.value;
      if (name === "frac") {
        const numerator = parseAtom(state) ?? EMPTY_SEQ;
        const denominator = parseAtom(state) ?? EMPTY_SEQ;
        return { kind: "frac", numerator, denominator, tokenIndex: token.index };
      }
      if (name === "sqrt") return parseSqrt(state, token);
      if (name === "left") {
        const delim = state.tokens[state.pos];
        state.pos += 1;
        const delimSpec = delim && delim.type === "symbol" ? PAREN_DELIMS[delim.value] : undefined;
        const children = parseSequence(state, new Set(["\\right"]));
        // consume \right + its delimiter
        if (peek(state)?.type === "command" && peek(state)?.value === "right") {
          state.pos += 1;
          if (peek(state)?.type === "symbol") state.pos += 1;
        }
        const spec = delimSpec ?? { open: "(", close: ")" };
        return { kind: "group", children, open: spec.open, close: spec.close, tokenIndex: token.index };
      }
      if (name === "right") {
        // Stray \right — invisible, skip.
        if (peek(state)?.type === "symbol") state.pos += 1;
        return null;
      }
      if (GREEK[name]) {
        return { kind: "greek", char: GREEK[name], upper: /^[A-Z]/.test(name), tokenIndex: token.index };
      }
      if (BIGOP_CHARS[name]) {
        return { kind: "bigop", char: BIGOP_CHARS[name], lower: null, upper: null, tokenIndex: token.index };
      }
      if (SYMBOL_OPS[name]) {
        return { kind: "sym", char: SYMBOL_OPS[name], tokenIndex: token.index };
      }
      return { kind: "unknown", name, tokenIndex: token.index };
    }
    case "symbol": {
      const value = token.value;
      if (value === "(" || value === "[" || value === "{") {
        const closeValue = value === "(" ? ")" : value === "[" ? "]" : "}";
        const children = parseSequence(state, new Set([closeValue]));
        if (peek(state)?.value === closeValue) state.pos += 1;
        if (value === "{") {
          return { kind: "group", children, open: "", close: "", tokenIndex: token.index };
        }
        return { kind: "group", children, open: value, close: closeValue, tokenIndex: token.index };
      }
      if (value === ")" || value === "]" || value === "}" || value === "_" || value === "^") {
        // Stray delimiter/script marker — skip gracefully.
        return null;
      }
      return { kind: "op", value, tokenIndex: token.index };
    }
    default:
      return null;
  }
}

/* ─── Change highlighting (token-level diff) ─── */

function tokenKey(token: MathToken): string {
  return `${token.type}:${token.value}`;
}

/**
 * LCS-based diff between two token streams. Returns the set of token
 * indices in `currTokens` that have no counterpart in `prevTokens`
 * (i.e. the added/changed parts). O(n·m) — fine for equation sources.
 */
export function computeChangedTokenIndices(
  prevTokens: MathToken[],
  currTokens: MathToken[],
): Set<number> {
  const n = prevTokens.length;
  const m = currTokens.length;
  const changed = new Set<number>();
  if (m === 0) return changed;
  if (n === 0) {
    for (let j = 0; j < m; j += 1) changed.add(j);
    return changed;
  }

  // dp[i][j] = LCS length of prev[0..i) and curr[0..j)
  const dp: number[] = new Array((n + 1) * (m + 1)).fill(0);
  const at = (i: number, j: number) => i * (m + 1) + j;

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (tokenKey(prevTokens[i - 1]) === tokenKey(currTokens[j - 1])) {
        dp[at(i, j)] = dp[at(i - 1, j - 1)] + 1;
      } else {
        dp[at(i, j)] = Math.max(dp[at(i - 1, j)], dp[at(i, j - 1)]);
      }
    }
  }

  // Backtrack: any curr token not consumed by the LCS is "changed".
  const matched = new Array<boolean>(m).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (tokenKey(prevTokens[i - 1]) === tokenKey(currTokens[j - 1])) {
      matched[j - 1] = true;
      i -= 1;
      j -= 1;
    } else if (dp[at(i - 1, j)] >= dp[at(i, j - 1)]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  for (let k = 0; k < m; k += 1) {
    if (!matched[k]) changed.add(k);
  }
  return changed;
}

/* ─── HTML renderer ─── */

export interface MathRenderOptions {
  displayMode?: boolean;
  /** Token indices (in `tokens`) whose nodes get the changed highlight. */
  changed?: ReadonlySet<number>;
  /** Master switch for change highlighting (markers + diff). Default true. */
  highlight?: boolean;
}

interface RenderContext {
  tokens: MathToken[];
  display: boolean;
  changed?: ReadonlySet<number>;
  highlight: boolean;
}

function markFor(ctx: RenderContext, tokenIndex: number): "force" | "off" | undefined {
  if (tokenIndex < 0) return undefined;
  return ctx.tokens[tokenIndex]?.mark;
}

function wrapChanged(ctx: RenderContext, tokenIndex: number, inner: string): string {
  if (!ctx.highlight) return inner;
  const mark = markFor(ctx, tokenIndex);
  if (mark === "off") return inner;
  if (mark === "force" || (ctx.changed?.has(tokenIndex) ?? false)) {
    return `<span class="pulse-math__changed">${inner}</span>`;
  }
  return inner;
}

const UNARY_OPS = new Set(["-", "+"]);

function renderChildren(children: MathNode[], ctx: RenderContext): string {
  let html = "";
  let prevKind: MathNode["kind"] | null = null;

  for (const child of children) {
    if (child.kind === "op" && UNARY_OPS.has(child.value)) {
      const unary = prevKind === null || prevKind === "op";
      const cls = unary ? "pulse-math__op pulse-math__op--unary" : "pulse-math__op";
      html += wrapChanged(ctx, child.tokenIndex, `<span class="${cls}">${escapeHtml(child.value)}</span>`);
      prevKind = "op";
      continue;
    }
    html += renderNode(child, ctx);
    prevKind = child.kind;
  }

  return html;
}

function renderNode(node: MathNode, ctx: RenderContext): string {
  switch (node.kind) {
    case "num":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__num">${escapeHtml(node.value)}</span>`);
    case "var":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__var">${escapeHtml(node.name)}</span>`);
    case "op":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__op">${escapeHtml(node.value)}</span>`);
    case "greek":
      return wrapChanged(
        ctx,
        node.tokenIndex,
        `<span class="pulse-math__greek${node.upper ? " pulse-math__greek--upper" : ""}">${escapeHtml(node.char)}</span>`,
      );
    case "sym":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__sym">${escapeHtml(node.char)}</span>`);
    case "func":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__func">${escapeHtml(node.name)}</span>`);
    case "text":
      return wrapChanged(ctx, node.tokenIndex, `<span class="pulse-math__text">${escapeHtml(node.text)}</span>`);
    case "unknown":
      return wrapChanged(
        ctx,
        node.tokenIndex,
        `<span class="pulse-math__unknown">\\${escapeHtml(node.name)}</span>`,
      );
    case "seq":
      return renderChildren(node.children, ctx);
    case "group": {
      const open = node.open
        ? `<span class="pulse-math__delim">${escapeHtml(node.open)}</span>`
        : "";
      const close = node.close
        ? `<span class="pulse-math__delim">${escapeHtml(node.close)}</span>`
        : "";
      return wrapChanged(
        ctx,
        node.tokenIndex,
        `<span class="pulse-math__group">${open}${renderChildren(node.children, ctx)}${close}</span>`,
      );
    }
    case "frac": {
      const num = renderNode(node.numerator, ctx);
      const den = renderNode(node.denominator, ctx);
      return wrapChanged(
        ctx,
        node.tokenIndex,
        `<span class="pulse-math__frac"><span class="pulse-math__frac-num">${num}</span><span class="pulse-math__frac-den">${den}</span></span>`,
      );
    }
    case "sqrt": {
      const index = node.index
        ? `<span class="pulse-math__sqrt-index">${renderNode(node.index, ctx)}</span>`
        : "";
      const body = renderNode(node.body, ctx);
      return wrapChanged(
        ctx,
        node.tokenIndex,
        `<span class="pulse-math__sqrt">${index}<span class="pulse-math__radical" aria-hidden="true">√</span><span class="pulse-math__sqrt-body">${body}</span></span>`,
      );
    }
    case "script": {
      const base = renderNode(node.base, ctx);
      let core: string;
      if (node.sub && node.sup) {
        core =
          `<span class="pulse-math__script">${base}<span class="pulse-math__script-stack">` +
          `<span class="pulse-math__sup">${renderNode(node.sup, ctx)}</span>` +
          `<span class="pulse-math__sub">${renderNode(node.sub, ctx)}</span>` +
          `</span></span>`;
      } else if (node.sup) {
        core = `<span class="pulse-math__script">${base}<span class="pulse-math__sup">${renderNode(node.sup, ctx)}</span></span>`;
      } else {
        core = `<span class="pulse-math__script">${base}<span class="pulse-math__sub">${renderNode(node.sub as MathNode, ctx)}</span></span>`;
      }
      return wrapChanged(ctx, node.tokenIndex, core);
    }
    case "bigop": {
      const symbol = `<span class="pulse-math__bigop-symbol" aria-hidden="true">${escapeHtml(node.char)}</span>`;
      let core: string;
      if (ctx.display && (node.lower || node.upper)) {
        const upper = node.upper
          ? `<span class="pulse-math__bigop-limit pulse-math__bigop-limit--upper">${renderNode(node.upper, ctx)}</span>`
          : "";
        const lower = node.lower
          ? `<span class="pulse-math__bigop-limit pulse-math__bigop-limit--lower">${renderNode(node.lower, ctx)}</span>`
          : "";
        core = `<span class="pulse-math__bigop pulse-math__bigop--limits">${upper}${symbol}${lower}</span>`;
      } else {
        const lower = node.lower ? `<span class="pulse-math__sub">${renderNode(node.lower, ctx)}</span>` : "";
        const upper = node.upper ? `<span class="pulse-math__sup">${renderNode(node.upper, ctx)}</span>` : "";
        core = `<span class="pulse-math__bigop">${symbol}${lower}${upper}</span>`;
      }
      return wrapChanged(ctx, node.tokenIndex, core);
    }
    default:
      return "";
  }
}

/**
 * Render TeX-subset source to styled HTML. Never throws: unparseable input
 * degrades to an escaped literal rendering of the source.
 */
export function renderMath(source: string, options?: MathRenderOptions): string {
  const display = options?.displayMode ?? true;
  const highlight = options?.highlight ?? true;
  const ariaLabel = escapeHtml(source.trim() || "Empty equation");

  try {
    const trimmed = source.trim();
    if (!trimmed) {
      return `<span class="pulse-math pulse-math--empty" data-display="${String(display)}" role="math" aria-label="${ariaLabel}"></span>`;
    }
    const tokens = tokenizeMath(trimmed);
    const state: ParserState = { tokens, pos: 0 };
    const children = parseSequence(state, new Set());
    const ctx: RenderContext = { tokens, display, changed: options?.changed, highlight };
    const body = renderChildren(children, ctx);
    return `<span class="pulse-math" data-display="${String(display)}" role="math" aria-label="${ariaLabel}">${body}</span>`;
  } catch {
    return `<span class="pulse-math pulse-math--unparsed" data-display="${String(display)}" role="math" aria-label="${ariaLabel}"><code>${escapeHtml(source)}</code></span>`;
  }
}
