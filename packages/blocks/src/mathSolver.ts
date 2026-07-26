/**
 * Scoped symbolic equation solver (NO AI, zero dependencies).
 *
 * Supported subset — anything else returns `ok: false` with a human reason
 * so the UI can show a graceful "cannot auto-solve this yet" state:
 *
 * - Linear equations in one variable: `ax + b = cx + d`, including
 *   parentheses (distributive expansion) and fractional coefficients
 *   (`x/2 + 1 = 3`, `0.5x = 2`).
 * - Quadratic equations in one variable: `ax^2 + bx + c = 0` solved via the
 *   discriminant and the quadratic formula, with perfect-square and
 *   square-factor simplification of `√D` and rational root reduction.
 *   Negative discriminant → "no real solutions" step.
 * - Implicit multiplication (`2x`, `2(x+1)`, `(x+1)(x+2)`), explicit `*`,
 *   division by constants (`x/2`, `(x+1)/2`), decimal numbers, unary minus,
 *   `^0…^2` powers.
 *
 * NOT supported (reported honestly): degree > 2, more than one variable,
 * division by a variable expression, missing `=`, identities (`0 = 0`) and
 * contradictions (`1 = 2`), non-numeric syntax.
 */

/* ─── Rational arithmetic ─── */

interface Rat {
  n: number;
  d: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function rat(n: number, d = 1): Rat {
  if (d === 0) throw new Error("division by zero");
  let num = n;
  let den = d;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { n: num / g, d: den / g };
}

const R_ZERO = rat(0);
const R_ONE = rat(1);

const rAdd = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
const rDiv = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n);
const rNeg = (a: Rat): Rat => rat(-a.n, a.d);
const rIsZero = (a: Rat): boolean => a.n === 0;
const rIsOne = (a: Rat): boolean => a.n === 1 && a.d === 1;
const rIsInt = (a: Rat): boolean => a.d === 1;
const rAbs = (a: Rat): Rat => rat(Math.abs(a.n), a.d);

function ratToPlain(a: Rat): string {
  return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
}

/** Math-source form: `3`, `-2`, `\frac{-3}{4}` (renderer turns it into a fraction). */
function ratToMath(a: Rat): string {
  return a.d === 1 ? String(a.n) : `\\frac{${a.n}}{${a.d}}`;
}

/* ─── Polynomials (degree ≤ 2): a·x² + b·x + c ─── */

interface Poly {
  a: Rat;
  b: Rat;
  c: Rat;
}

const polyConst = (value: Rat): Poly => ({ a: R_ZERO, b: R_ZERO, c: value });
const polyVar = (): Poly => ({ a: R_ZERO, b: R_ONE, c: R_ZERO });

const pAdd = (p: Poly, q: Poly): Poly => ({ a: rAdd(p.a, q.a), b: rAdd(p.b, q.b), c: rAdd(p.c, q.c) });
const pSub = (p: Poly, q: Poly): Poly => ({ a: rSub(p.a, q.a), b: rSub(p.b, q.b), c: rSub(p.c, q.c) });
const pNeg = (p: Poly): Poly => ({ a: rNeg(p.a), b: rNeg(p.b), c: rNeg(p.c) });

function degree(p: Poly): number {
  if (!rIsZero(p.a)) return 2;
  if (!rIsZero(p.b)) return 1;
  return 0;
}

function pMul(p: Poly, q: Poly): Poly {
  const result: Poly = {
    a: rAdd(rAdd(rMul(p.a, q.c), rMul(p.b, q.b)), rMul(p.c, q.a)),
    b: rAdd(rMul(p.b, q.c), rMul(p.c, q.b)),
    c: rMul(p.c, q.c),
  };
  // Terms beyond x² (from a·x² · x² etc.) — detect before discarding.
  const overflow =
    !rIsZero(rMul(p.a, q.a)) || !rIsZero(rMul(p.a, q.b)) || !rIsZero(rMul(p.b, q.a));
  if (overflow || degree(result) > 2) {
    throw new SolveUnsupported("higher-degree");
  }
  return result;
}

function pDiv(p: Poly, q: Poly): Poly {
  if (degree(q) > 0) throw new SolveUnsupported("division-by-variable");
  if (rIsZero(q.c)) throw new SolveUnsupported("division-by-zero");
  return { a: rDiv(p.a, q.c), b: rDiv(p.b, q.c), c: rDiv(p.c, q.c) };
}

function pPow(p: Poly, exponent: number): Poly {
  if (exponent === 0) return polyConst(R_ONE);
  if (exponent === 1) return p;
  if (exponent === 2) return pMul(p, p);
  throw new SolveUnsupported("higher-degree");
}

class SolveUnsupported extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "SolveUnsupported";
  }
}

/* ─── Pretty printer: polynomial → math-renderer source ─── */

interface Term {
  coef: Rat;
  suffix: string;
}

function termBody(term: Term): string {
  const abs = rAbs(term.coef);
  if (rIsOne(abs) && term.suffix) return term.suffix;
  return `${ratToMath(abs)}${term.suffix}`;
}

/** Signed single term, e.g. `-2x`, `x`, `\frac{3}{4}x`. */
function signedTermMath(coef: Rat, suffix: string): string {
  return `${coef.n < 0 ? "-" : ""}${termBody({ coef, suffix })}`;
}

function polyToMath(p: Poly, variable: string): string {
  const terms: Term[] = [];
  if (!rIsZero(p.a)) terms.push({ coef: p.a, suffix: `${variable}^2` });
  if (!rIsZero(p.b)) terms.push({ coef: p.b, suffix: variable });
  if (!rIsZero(p.c)) terms.push({ coef: p.c, suffix: "" });
  if (terms.length === 0) return "0";

  let out = "";
  terms.forEach((term, index) => {
    const negative = term.coef.n < 0;
    const body = termBody(term);
    if (index === 0) {
      out = negative ? `-${body}` : body;
    } else {
      out += negative ? ` - ${body}` : ` + ${body}`;
    }
  });
  return out;
}

/* ─── Tokenizer / parser ─── */

type SolverToken =
  | { type: "num"; value: string }
  | { type: "var"; name: string }
  | { type: "op"; value: string };

function tokenizeEquation(source: string): SolverToken[] {
  const tokens: SolverToken[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const match = /^\d+(\.\d+)?|^\.\d+/.exec(source.slice(i));
      if (!match) throw new SolveUnsupported("parse");
      tokens.push({ type: "num", value: match[0] });
      i += match[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      tokens.push({ type: "var", name: ch });
      i += 1;
      continue;
    }
    if ("+-*/^()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i += 1;
      continue;
    }
    throw new SolveUnsupported("parse");
  }
  return tokens;
}

interface ParseState {
  tokens: SolverToken[];
  pos: number;
}

function peekToken(state: ParseState): SolverToken | undefined {
  return state.tokens[state.pos];
}

function startsFactor(token: SolverToken | undefined): boolean {
  if (!token) return false;
  if (token.type === "num" || token.type === "var") return true;
  return token.type === "op" && token.value === "(";
}

function parseExpression(state: ParseState): Poly {
  let result = parseTerm(state);
  for (;;) {
    const token = peekToken(state);
    if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
      state.pos += 1;
      const next = parseTerm(state);
      result = token.value === "+" ? pAdd(result, next) : pSub(result, next);
      continue;
    }
    return result;
  }
}

function parseTerm(state: ParseState): Poly {
  let result = parseFactor(state);
  for (;;) {
    const token = peekToken(state);
    if (token?.type === "op" && token.value === "*") {
      state.pos += 1;
      result = pMul(result, parseFactor(state));
      continue;
    }
    if (token?.type === "op" && token.value === "/") {
      state.pos += 1;
      result = pDiv(result, parseFactor(state));
      continue;
    }
    if (startsFactor(token)) {
      // Implicit multiplication: `2x`, `2(x+1)`, `(x+1)(x+2)`.
      result = pMul(result, parseFactor(state));
      continue;
    }
    return result;
  }
}

function parseFactor(state: ParseState): Poly {
  const token = peekToken(state);
  if (!token) throw new SolveUnsupported("parse");

  if (token.type === "op" && token.value === "-") {
    state.pos += 1;
    return pNeg(parseFactor(state));
  }
  if (token.type === "op" && token.value === "+") {
    state.pos += 1;
    return parseFactor(state);
  }

  let base: Poly;
  if (token.type === "num") {
    state.pos += 1;
    if (token.value.includes(".")) {
      const [intPart, fracPart = ""] = token.value.split(".");
      const denominator = 10 ** fracPart.length;
      const numerator = Number(intPart || "0") * denominator + Number(fracPart || "0");
      base = polyConst(rat(numerator, denominator));
    } else {
      base = polyConst(rat(Number(token.value)));
    }
  } else if (token.type === "var") {
    state.pos += 1;
    base = polyVar();
  } else if (token.type === "op" && token.value === "(") {
    state.pos += 1;
    base = parseExpression(state);
    const closing = peekToken(state);
    if (!closing || closing.type !== "op" || closing.value !== ")") {
      throw new SolveUnsupported("parse");
    }
    state.pos += 1;
  } else {
    throw new SolveUnsupported("parse");
  }

  // Postfix power: only small integer exponents.
  const power = peekToken(state);
  if (power?.type === "op" && power.value === "^") {
    state.pos += 1;
    const exp = peekToken(state);
    if (!exp || exp.type !== "num" || exp.value.includes(".")) {
      throw new SolveUnsupported("parse");
    }
    state.pos += 1;
    const exponent = Number(exp.value);
    if (!Number.isInteger(exponent) || exponent < 0) throw new SolveUnsupported("parse");
    base = pPow(base, exponent);
  }

  return base;
}

/* ─── Solver ─── */

export interface SolveStep {
  /** Plain-text explanation shown above the math line. */
  note: string;
  /** Math source rendered through the Pulse math renderer. */
  math: string;
  /** Marks the final result step(s) for distinct styling. */
  final?: boolean;
}

export type SolveResult =
  | { ok: true; kind: "linear" | "quadratic"; variable: string; steps: SolveStep[] }
  | { ok: false; reason: string };

function integerSqrt(value: number): number {
  return Math.floor(Math.sqrt(value) + 1e-9);
}

/** Largest k with k² dividing `value` (positive integer). */
function squareFactor(value: number): { k: number; m: number } {
  for (let k = integerSqrt(value); k >= 2; k -= 1) {
    if (value % (k * k) === 0) return { k, m: value / (k * k) };
  }
  return { k: 1, m: value };
}

function formatApprox(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

/** `(num ± rootRad·√m) / den`, fully simplified by the common factor. */
function quadraticRootMath(
  numeratorConst: number,
  rootRad: number,
  radicand: number,
  denominator: number,
  sign: 1 | -1,
): string {
  // Normalize so the denominator is positive.
  let numC = numeratorConst;
  let numK = rootRad;
  let den = denominator;
  if (den < 0) {
    numC = -numC;
    numK = -numK;
    den = -den;
  }
  const common = gcd(gcd(Math.abs(numC), numK), Math.abs(den)) || 1;
  const c = numC / common;
  let k = numK / common;
  const d = den / common;

  // Fold a negative root coefficient into the ± sign: `b + (-k)√m` → `b - k√m`.
  let effSign = sign;
  if (k < 0) {
    k = -k;
    effSign = effSign === 1 ? -1 : 1;
  }

  const constPart = c === 0 ? "" : String(c);
  const rootPart = radicand === 1 ? "" : `${k === 1 ? "" : String(k)}\\sqrt{${radicand}}`;
  const signPart = effSign === 1 ? (constPart ? " + " : "") : constPart ? " - " : "-";
  const numerator = radicand === 1
    ? String(c + effSign * k)
    : `${constPart}${signPart}${rootPart}`;

  if (d === 1 || d === -1) {
    return d === 1 ? numerator : `-(${numerator})`;
  }
  return `\\frac{${numerator}}{${d}}`;
}

function unsupportedReason(code: string): string {
  switch (code) {
    case "higher-degree":
      return "Equations of degree 3 or higher are not supported — the local solver handles linear and quadratic equations.";
    case "division-by-variable":
      return "Division by an expression containing the variable is not supported.";
    case "division-by-zero":
      return "This equation divides by zero somewhere, so it cannot be solved.";
    case "multiple-variables":
      return "More than one variable found — the solver works with a single variable only.";
    case "no-variable":
      return "No variable found — there is nothing to solve for.";
    case "identity":
      return "This is an identity: it is true for every value, so there is nothing to solve.";
    case "contradiction":
      return "This equation is a contradiction — no value of the variable can satisfy it.";
    case "missing-equals":
      return "Missing `=` sign — enter a full equation like 2x + 5 = 11.";
    default:
      return "Could not parse this equation — check the syntax and try again.";
  }
}

export function solveEquation(input: string): SolveResult {
  const trimmed = input.trim();
  if (!trimmed || !trimmed.includes("=")) {
    return { ok: false, reason: unsupportedReason("missing-equals") };
  }

  const sides = trimmed.split("=");
  if (sides.length !== 2) {
    return { ok: false, reason: unsupportedReason("parse") };
  }

  try {
    const leftTokens = tokenizeEquation(sides[0]);
    const rightTokens = tokenizeEquation(sides[1]);
    const variables = new Set<string>();
    [...leftTokens, ...rightTokens].forEach((token) => {
      if (token.type === "var") variables.add(token.name);
    });
    if (variables.size === 0) {
      // Constant vs constant — identity or contradiction.
      const left = parseExpression({ tokens: leftTokens, pos: 0 });
      const right = parseExpression({ tokens: rightTokens, pos: 0 });
      return {
        ok: false,
        reason: unsupportedReason(rIsZero(rSub(left.c, right.c)) ? "identity" : "contradiction"),
      };
    }
    if (variables.size > 1) {
      return { ok: false, reason: unsupportedReason("multiple-variables") };
    }
    const variable = [...variables][0];

    const left = parseExpression({ tokens: leftTokens, pos: 0 });
    const right = parseExpression({ tokens: rightTokens, pos: 0 });
    const standard = pSub(left, right);

    const steps: SolveStep[] = [{ note: "Equation to solve", math: trimmed }];

    const prettyLeft = polyToMath(left, variable);
    const prettyRight = polyToMath(right, variable);
    const prettyOriginal = `${prettyLeft} = ${prettyRight}`;
    if (prettyOriginal.replace(/\s+/g, "") !== trimmed.replace(/\s+/g, "")) {
      steps.push({ note: "Expand the parentheses and simplify both sides", math: prettyOriginal });
    }

    if (!rIsZero(right.a) || !rIsZero(right.b) || !rIsZero(right.c)) {
      steps.push({
        note: "Move all terms to the left side",
        math: `${polyToMath(standard, variable)} = 0`,
      });
    }

    if (!rIsZero(standard.a)) {
      solveQuadratic(standard, variable, steps);
      return { ok: true, kind: "quadratic", variable, steps };
    }

    if (!rIsZero(standard.b)) {
      solveLinear(standard, variable, steps);
      return { ok: true, kind: "linear", variable, steps };
    }

    return {
      ok: false,
      reason: unsupportedReason(rIsZero(standard.c) ? "identity" : "contradiction"),
    };
  } catch (error) {
    if (error instanceof SolveUnsupported) {
      return { ok: false, reason: unsupportedReason(error.code) };
    }
    return { ok: false, reason: unsupportedReason("parse") };
  }
}

function solveLinear(standard: Poly, variable: string, steps: SolveStep[]): void {
  const { b, c } = standard;

  if (!rIsZero(c)) {
    steps.push({
      note: "Move the constant term to the right side",
      math: `${signedTermMath(b, variable)} = ${ratToMath(rNeg(c))}`,
    });
  }

  const solution = rDiv(rNeg(c), b);
  if (!rIsOne(b)) {
    steps.push({
      note: `Divide both sides by ${ratToPlain(b)}`,
      math: `${variable} = ${ratToMath(solution)}`,
      final: true,
    });
  } else if (steps.length > 0) {
    steps[steps.length - 1].final = true;
  }
}

function solveQuadratic(standard: Poly, variable: string, steps: SolveStep[]): void {
  // Clear fractional coefficients by scaling to integers.
  const lcm = (x: number, y: number) => (x * y) / gcd(x, y);
  const scale = lcm(lcm(standard.a.d, standard.b.d), standard.c.d);
  let a = standard.a;
  let b = standard.b;
  let c = standard.c;
  if (scale > 1) {
    const multiplier = rat(scale);
    a = rMul(a, multiplier);
    b = rMul(b, multiplier);
    c = rMul(c, multiplier);
    steps.push({
      note: `Multiply both sides by ${scale} to clear the fractions`,
      math: `${polyToMath({ a, b, c }, variable)} = 0`,
    });
  }

  steps.push({
    note: "Identify the coefficients",
    math: `a = ${ratToMath(a)}, b = ${ratToMath(b)}, c = ${ratToMath(c)}`,
  });

  const discriminant = rSub(rMul(b, b), rMul(rat(4), rMul(a, c)));
  // Parenthesize negative coefficients: `4 · (-6)` reads better than `4 · -6`.
  const coefMath = (value: Rat): string => (value.n < 0 ? `(${ratToMath(value)})` : ratToMath(value));
  steps.push({
    note: "Compute the discriminant",
    math: `D = b^2 - 4ac = (${ratToMath(b)})^2 - 4 \\cdot ${coefMath(a)} \\cdot ${coefMath(c)} = ${ratToMath(discriminant)}`,
  });

  if (discriminant.n < 0) {
    steps.push({
      note: "The discriminant is negative, so the equation has no real solutions",
      math: `D = ${ratToMath(discriminant)} < 0`,
      final: true,
    });
    return;
  }

  const denominator = rMul(rat(2), a);

  if (rIsZero(discriminant)) {
    steps.push({
      note: "The discriminant is zero, so there is exactly one solution",
      math: `D = 0`,
    });
    const root = rDiv(rNeg(b), denominator);
    steps.push({
      note: "Apply the quadratic formula",
      math: `${variable} = \\frac{-b}{2a} = \\frac{${ratToMath(rNeg(b))}}{${ratToMath(denominator)}} = ${ratToMath(root)}`,
      final: true,
    });
    return;
  }

  steps.push({
    note: "The discriminant is positive, so there are two real solutions",
    math: `D = ${ratToMath(discriminant)} > 0`,
  });

  if (rIsInt(discriminant)) {
    const dValue = discriminant.n;
    const root = integerSqrt(dValue);
    if (root * root === dValue) {
      // Perfect square → rational solutions.
      steps.push({
        note: "Apply the quadratic formula",
        math: `${variable} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${ratToMath(rNeg(b))} \\pm ${root}}{${ratToMath(denominator)}}`,
      });
      const plus = rDiv(rAdd(rNeg(b), rat(root)), denominator);
      const minus = rDiv(rSub(rNeg(b), rat(root)), denominator);
      steps.push({ note: "First solution", math: `${variable}_1 = ${ratToMath(plus)}`, final: true });
      steps.push({ note: "Second solution", math: `${variable}_2 = ${ratToMath(minus)}`, final: true });
      return;
    }

    // Extract square factors: √D = k·√m.
    const { k, m } = squareFactor(dValue);
    const rootText = k > 1 ? `${k}\\sqrt{${m}}` : `\\sqrt{${m}}`;
    steps.push({
      note: "Apply the quadratic formula",
      math: `${variable} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${ratToMath(rNeg(b))} \\pm ${rootText}}{${ratToMath(denominator)}}`,
    });

    if (rIsInt(b) && rIsInt(denominator)) {
      const bInt = -b.n;
      const denInt = denominator.n;
      const plusExact = quadraticRootMath(bInt, k, m, denInt, 1);
      const minusExact = quadraticRootMath(bInt, k, m, denInt, -1);
      const approx = Math.sqrt(m);
      const plusApprox = formatApprox((bInt + k * approx) / denInt);
      const minusApprox = formatApprox((bInt - k * approx) / denInt);
      steps.push({
        note: "First solution (exact and approximate)",
        math: `${variable}_1 = ${plusExact} \\approx ${plusApprox}`,
        final: true,
      });
      steps.push({
        note: "Second solution (exact and approximate)",
        math: `${variable}_2 = ${minusExact} \\approx ${minusApprox}`,
        final: true,
      });
      return;
    }
  }

  // Fallback: non-integer discriminant — present the formula only.
  steps.push({
    note: "Exact solutions",
    math: `${variable} = \\frac{${ratToMath(rNeg(b))} \\pm \\sqrt{${ratToMath(discriminant)}}}{${ratToMath(denominator)}}`,
    final: true,
  });
}
