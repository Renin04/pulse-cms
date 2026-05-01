import { describe, it, expect } from "vitest";
import type { Block, BlockData } from "@pulse/core";
import {
  renderCodePlayground,
  generatePlaygroundSrcdoc,
  isPlaygroundLanguageSupported,
  type CodePlaygroundBlockData,
} from "../src/blocks/CodePlaygroundRenderer";
import {
  renderBranch,
  resolveBranchOption,
  validateBranchData,
  type BranchBlockData,
} from "../src/blocks/BranchRenderer";
import {
  renderConditional,
  evaluateRule,
  evaluateCondition,
  renderConditionalSSR,
  validateConditionalData,
  type ConditionalBlockData,
  type ConditionRule,
} from "../src/blocks/ConditionalRenderer";
import {
  isOriginAllowed,
  generateCorsHeaders,
  validatePreflightRequest,
  sanitizeCorsUrl,
  createProxyUrl,
  DEFAULT_PUBLIC_CORS_POLICY,
  createStrictCorsPolicy,
} from "../src/security/cors";
import {
  encryptApiKey,
  decryptApiKey,
  createKeyMetadata,
  validateApiKeyFormat,
  maskApiKey,
  isKeyExpired,
  isCryptoAvailable,
} from "../src/security/keyEncryption";

function createBlock<T extends BlockData>(id: string, type: string, data: T): Block<T> {
  return {
    id,
    type,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("CodePlaygroundRenderer", () => {
  it("renders a basic JavaScript playground", () => {
    const block = createBlock<CodePlaygroundBlockData>("playground-1", "code-playground", {
      code: "console.log('Hello, World!');",
      language: "javascript",
    });

    const html = renderCodePlayground(block, { depth: 0, isSSR: false });

    expect(html).toContain('class="pulse-code-playground"');
    expect(html).toContain('data-pulse-block-id="playground-1"');
    expect(html).toContain('data-pulse-language="javascript"');
    expect(html).toContain("console.log(&#39;Hello, World!&#39;);");
    expect(html).toContain('<iframe');
    expect(html).toContain('sandbox="allow-scripts allow-popups allow-forms"');
  });

  it("renders playground without output panel when showOutput is false", () => {
    const block = createBlock<CodePlaygroundBlockData>("playground-2", "code-playground", {
      code: "const x = 42;",
      language: "javascript",
      showOutput: false,
    });

    const html = renderCodePlayground(block, { depth: 0, isSSR: false });

    expect(html).not.toContain('<iframe');
    expect(html).toContain('data-pulse-show-output="false"');
  });

  it("renders non-editable playground", () => {
    const block = createBlock<CodePlaygroundBlockData>("playground-3", "code-playground", {
      code: "const x = 42;",
      language: "javascript",
      editable: false,
    });

    const html = renderCodePlayground(block, { depth: 0, isSSR: false });

    expect(html).toContain('contenteditable="false"');
    expect(html).toContain('data-pulse-editable="false"');
  });

  it("checks supported playground languages", () => {
    expect(isPlaygroundLanguageSupported("javascript")).toBe(true);
    expect(isPlaygroundLanguageSupported("typescript")).toBe(true);
    expect(isPlaygroundLanguageSupported("html")).toBe(true);
    expect(isPlaygroundLanguageSupported("python")).toBe(true);
    expect(isPlaygroundLanguageSupported("ruby")).toBe(false);
  });

  it("generates srcdoc for JavaScript execution", () => {
    const code = "console.log('test');";
    const srcdoc = generatePlaygroundSrcdoc(code, "javascript");

    expect(srcdoc).toContain("<!DOCTYPE html>");
    expect(srcdoc).toContain("console.log('test');");
    expect(srcdoc).toContain("const output = document.getElementById");
  });

  it("generates srcdoc for HTML content", () => {
    const code = "<h1>Hello</h1>";
    const srcdoc = generatePlaygroundSrcdoc(code, "html");

    expect(srcdoc).toBe(code);
  });

  it("generates srcdoc for CSS preview", () => {
    const code = "body { background: red; }";
    const srcdoc = generatePlaygroundSrcdoc(code, "css");

    expect(srcdoc).toContain("<style>");
    expect(srcdoc).toContain(code);
    expect(srcdoc).toContain("CSS Preview");
  });

  it("generates placeholder for unsupported languages", () => {
    const code = "print('hello')";
    const srcdoc = generatePlaygroundSrcdoc(code, "python");

    expect(srcdoc).toContain("requires server-side runtime");
  });
});

describe("BranchRenderer", () => {
  const sampleBranchData: BranchBlockData = {
    prompt: "Choose your adventure:",
    options: [
      { id: "opt-1", label: "Go left", content: "<p>You went left.</p>" },
      { id: "opt-2", label: "Go right", content: "<p>You went right.</p>", icon: "➡️" },
    ],
    layout: "vertical",
    allowReset: true,
  };

  it("renders a branch block with options", () => {
    const block = createBlock<BranchBlockData>("branch-1", "branch", sampleBranchData);

    const html = renderBranch(block, { depth: 0, isSSR: false });

    expect(html).toContain('class="pulse-branch');
    expect(html).toContain("Choose your adventure:");
    expect(html).toContain("Go left");
    expect(html).toContain("Go right");
    expect(html).toContain("➡️");
    expect(html).toContain('data-pulse-branch-option="opt-1"');
    expect(html).toContain('data-pulse-branch-option="opt-2"');
  });

  it("renders branch content panels as hidden", () => {
    const block = createBlock<BranchBlockData>("branch-2", "branch", sampleBranchData);

    const html = renderBranch(block, { depth: 0, isSSR: false });

    expect(html).toContain('data-pulse-branch-content="opt-1"');
    expect(html).toContain("hidden");
    expect(html).toContain("<p>You went left.</p>");
    expect(html).toContain("<p>You went right.</p>");
  });

  it("renders reset button when allowReset is true", () => {
    const block = createBlock<BranchBlockData>("branch-3", "branch", sampleBranchData);

    const html = renderBranch(block, { depth: 0, isSSR: false });

    expect(html).toContain('class="pulse-branch__reset"');
    expect(html).toContain("Reset");
  });

  it("does not render reset button when allowReset is false", () => {
    const block = createBlock<BranchBlockData>("branch-4", "branch", {
      ...sampleBranchData,
      allowReset: false,
    });

    const html = renderBranch(block, { depth: 0, isSSR: false });

    expect(html).not.toContain('class="pulse-branch__reset"');
  });

  it("resolves branch option by id", () => {
    const option = resolveBranchOption(sampleBranchData, "opt-1");
    expect(option).toBeDefined();
    expect(option?.label).toBe("Go left");
  });

  it("returns undefined for non-existent option", () => {
    const option = resolveBranchOption(sampleBranchData, "opt-999");
    expect(option).toBeUndefined();
  });

  it("validates branch data with errors", () => {
    const invalidData: BranchBlockData = {
      prompt: "",
      options: [{ id: "opt-1", label: "", content: "" }],
    };

    const errors = validateBranchData(invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("at least 2 options"))).toBe(true);
  });

  it("validates branch data with duplicate ids", () => {
    const invalidData: BranchBlockData = {
      prompt: "Test",
      options: [
        { id: "opt-1", label: "A", content: "A" },
        { id: "opt-1", label: "B", content: "B" },
      ],
    };

    const errors = validateBranchData(invalidData);
    expect(errors.some((e) => e.includes("must be unique"))).toBe(true);
  });
});

describe("ConditionalRenderer", () => {
  const sampleConditionalData: ConditionalBlockData = {
    rules: [{ variable: "user.role", operator: "equals", value: "admin" }],
    logic: "and",
    content: "<p>Admin content</p>",
    fallbackContent: "<p>Public content</p>",
    evaluationMode: "client",
  };

  it("renders conditional block in client mode", () => {
    const block = createBlock<ConditionalBlockData>("cond-1", "conditional", sampleConditionalData);

    const html = renderConditional(block, { depth: 0, isSSR: false });

    expect(html).toContain('class="pulse-conditional pulse-conditional--client"');
    expect(html).toContain('data-pulse-condition-rules');
    expect(html).toContain('data-pulse-condition-logic="and"');
    expect(html).toContain("<p>Admin content</p>");
    expect(html).toContain("<p>Public content</p>");
  });

  it("renders conditional block in static mode", () => {
    const block = createBlock<ConditionalBlockData>("cond-2", "conditional", {
      ...sampleConditionalData,
      evaluationMode: "static",
    });

    const html = renderConditional(block, { depth: 0, isSSR: false });

    expect(html).toContain('pulse-conditional--static');
    expect(html).toContain("<p>Admin content</p>");
    expect(html).not.toContain("fallback");
  });

  it("evaluates equals rule correctly", () => {
    const rule: ConditionRule = { variable: "user.role", operator: "equals", value: "admin" };
    expect(evaluateRule(rule, { "user.role": "admin" })).toBe(true);
    expect(evaluateRule(rule, { "user.role": "user" })).toBe(false);
  });

  it("evaluates not_equals rule correctly", () => {
    const rule: ConditionRule = { variable: "status", operator: "not_equals", value: "draft" };
    expect(evaluateRule(rule, { status: "published" })).toBe(true);
    expect(evaluateRule(rule, { status: "draft" })).toBe(false);
  });

  it("evaluates contains rule correctly", () => {
    const rule: ConditionRule = { variable: "tags", operator: "contains", value: "tech" };
    expect(evaluateRule(rule, { tags: "tech,news" })).toBe(true);
    expect(evaluateRule(rule, { tags: "sports" })).toBe(false);
  });

  it("evaluates is_set rule correctly", () => {
    const rule: ConditionRule = { variable: "user.email", operator: "is_set" };
    expect(evaluateRule(rule, { "user.email": "test@example.com" })).toBe(true);
    expect(evaluateRule(rule, { "user.email": "" })).toBe(false);
    expect(evaluateRule(rule, {})).toBe(false);
  });

  it("evaluates greater_than rule correctly", () => {
    const rule: ConditionRule = { variable: "age", operator: "greater_than", value: 18 };
    expect(evaluateRule(rule, { age: 25 })).toBe(true);
    expect(evaluateRule(rule, { age: 15 })).toBe(false);
  });

  it("evaluates AND logic correctly", () => {
    const data: ConditionalBlockData = {
      rules: [
        { variable: "user.role", operator: "equals", value: "admin" },
        { variable: "user.active", operator: "equals", value: true },
      ],
      logic: "and",
      content: "Content",
    };

    expect(evaluateCondition(data, { "user.role": "admin", "user.active": true })).toBe(true);
    expect(evaluateCondition(data, { "user.role": "admin", "user.active": false })).toBe(false);
  });

  it("evaluates OR logic correctly", () => {
    const data: ConditionalBlockData = {
      rules: [
        { variable: "user.role", operator: "equals", value: "admin" },
        { variable: "user.role", operator: "equals", value: "editor" },
      ],
      logic: "or",
      content: "Content",
    };

    expect(evaluateCondition(data, { "user.role": "admin" })).toBe(true);
    expect(evaluateCondition(data, { "user.role": "editor" })).toBe(true);
    expect(evaluateCondition(data, { "user.role": "viewer" })).toBe(false);
  });

  it("renders conditional SSR with context", () => {
    const html = renderConditionalSSR(sampleConditionalData, { "user.role": "admin" });
    expect(html).toBe("<p>Admin content</p>");
  });

  it("renders fallback in SSR when condition fails", () => {
    const html = renderConditionalSSR(sampleConditionalData, { "user.role": "user" });
    expect(html).toBe("<p>Public content</p>");
  });

  it("validates conditional data", () => {
    const invalidData: ConditionalBlockData = {
      rules: [],
      content: "",
    };

    const errors = validateConditionalData(invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("CORS utilities", () => {
  it("checks if origin is allowed with wildcard", () => {
    expect(isOriginAllowed("https://example.com", DEFAULT_PUBLIC_CORS_POLICY)).toBe(true);
    expect(isOriginAllowed("https://any-origin.com", DEFAULT_PUBLIC_CORS_POLICY)).toBe(true);
  });

  it("checks if origin is allowed with allowlist", () => {
    const policy = createStrictCorsPolicy(["https://trusted.com", "https://app.com"]);
    expect(isOriginAllowed("https://trusted.com", policy)).toBe(true);
    expect(isOriginAllowed("https://untrusted.com", policy)).toBe(false);
  });

  it("generates CORS headers for allowed origin", () => {
    const headers = generateCorsHeaders("https://example.com", DEFAULT_PUBLIC_CORS_POLICY);
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
  });

  it("generates CORS headers for strict policy", () => {
    const policy = createStrictCorsPolicy(["https://trusted.com"]);
    const headers = generateCorsHeaders("https://trusted.com", policy);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://trusted.com");
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
  });

  it("returns empty headers for disallowed origin", () => {
    const policy = createStrictCorsPolicy(["https://trusted.com"]);
    const headers = generateCorsHeaders("https://untrusted.com", policy);
    expect(Object.keys(headers).length).toBe(0);
  });

  it("validates preflight request", () => {
    const policy = DEFAULT_PUBLIC_CORS_POLICY;
    expect(validatePreflightRequest("https://example.com", "GET", ["Content-Type"], policy)).toBe(true);
    expect(validatePreflightRequest("https://example.com", "POST", ["Content-Type"], policy)).toBe(false);
  });

  it("sanitizes valid URLs", () => {
    expect(sanitizeCorsUrl("https://example.com/api")).toBe("https://example.com/api");
    expect(sanitizeCorsUrl("http://example.com")).toBe("http://example.com");
  });

  it("rejects invalid URL protocols", () => {
    expect(sanitizeCorsUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeCorsUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeCorsUrl("file:///etc/passwd")).toBeNull();
  });

  it("creates proxy URL", () => {
    const proxyUrl = createProxyUrl("https://api.example.com/data", "https://myproxy.com/proxy");
    expect(proxyUrl).toContain("https://myproxy.com/proxy?url=");
    expect(proxyUrl).toContain(encodeURIComponent("https://api.example.com/data"));
  });
});

describe("API Key Encryption", () => {
  const testPassword = "test-master-password-123";
  const testApiKey = "sk-test-1234567890abcdefghijklmnop";

  it("checks crypto availability", () => {
    const available = isCryptoAvailable();
    expect(typeof available).toBe("boolean");
  });

  it("encrypts and decrypts an API key", async () => {
    if (!isCryptoAvailable()) {
      console.log("Skipping encryption test: Web Crypto API not available");
      return;
    }

    const encrypted = await encryptApiKey(testApiKey, testPassword);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.algorithm).toBe("AES-GCM-256");

    const decrypted = await decryptApiKey(encrypted, testPassword);
    expect(decrypted).toBe(testApiKey);
  });

  it("fails to decrypt with wrong password", async () => {
    if (!isCryptoAvailable()) return;

    const encrypted = await encryptApiKey(testApiKey, testPassword);
    await expect(decryptApiKey(encrypted, "wrong-password")).rejects.toThrow();
  });

  it("creates key metadata", () => {
    const metadata = createKeyMetadata(testApiKey, "Test Key", "openai");
    expect(metadata.label).toBe("Test Key");
    expect(metadata.provider).toBe("openai");
    expect(metadata.lastFour).toBe("mnop");
    expect(metadata.id).toContain("openai-mnop");
  });

  it("validates OpenAI key format", () => {
    expect(validateApiKeyFormat("sk-1234567890abcdefghijklmnop", "openai")).toBe(true);
    expect(validateApiKeyFormat("invalid-key", "openai")).toBe(false);
    expect(validateApiKeyFormat("sk-short", "openai")).toBe(false);
  });

  it("validates Anthropic key format", () => {
    expect(validateApiKeyFormat("sk-ant-1234567890abcdefghijklmnopqrstuvwxyz", "anthropic")).toBe(true);
    expect(validateApiKeyFormat("sk-1234567890", "anthropic")).toBe(false);
  });

  it("masks API key for display", () => {
    const masked = maskApiKey(testApiKey);
    expect(masked).toContain("sk-t");
    expect(masked).toContain("mnop");
    expect(masked).toContain("****");
    expect(masked).not.toContain("1234567890abcdefghijkl");
  });

  it("checks if key is expired", () => {
    const metadata = createKeyMetadata(testApiKey, "Test", "openai");
    expect(isKeyExpired(metadata)).toBe(false);

    const expiredMetadata = { ...metadata, expiresAt: Date.now() - 1000 };
    expect(isKeyExpired(expiredMetadata)).toBe(true);
  });
});
