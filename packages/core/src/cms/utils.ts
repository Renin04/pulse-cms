/**
 * CMS Utilities
 *
 * Helper functions for content management including slug generation,
 * ID generation, and date handling.
 */

import type { SlugPolicy } from "./types";

// ============================================================================
// ID Generation
// ============================================================================

let idCounter = 0;

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const counter = (idCounter++ % 1000).toString(36).padStart(3, "0");
  return `${timestamp}${random}${counter}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// Date Utilities
// ============================================================================

export function now(): string {
  return new Date().toISOString();
}

export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format) {
    // Simple format replacement
    return format
      .replace(/YYYY/g, d.getFullYear().toString())
      .replace(/MM/g, (d.getMonth() + 1).toString().padStart(2, "0"))
      .replace(/DD/g, d.getDate().toString().padStart(2, "0"))
      .replace(/HH/g, d.getHours().toString().padStart(2, "0"))
      .replace(/mm/g, d.getMinutes().toString().padStart(2, "0"))
      .replace(/ss/g, d.getSeconds().toString().padStart(2, "0"));
  }

  return d.toISOString();
}

// ============================================================================
// Slug Generation
// ============================================================================

const DEFAULT_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
]);

// Basic transliteration map for common non-ASCII characters
const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  æ: "ae",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ø: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  // Persian/Arabic
  ا: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "th",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "o",
  ه: "h",
  ی: "y",
  // Russian/Cyrillic
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const DEFAULT_SLUG_POLICY: SlugPolicy = {
  separator: "-",
  lowercase: true,
  maxLength: 100,
  transliterate: true,
  removeStopWords: false,
  enforceUniqueness: true,
  uniquenessScope: "contentType",
  reservedSlugs: ["admin", "api", "cms", "new", "edit", "delete"],
};

export function createSlugPolicy(overrides?: Partial<SlugPolicy>): SlugPolicy {
  return { ...DEFAULT_SLUG_POLICY, ...overrides };
}

export function transliterate(text: string): string {
  return text
    .split("")
    .map((char) => {
      // Try direct lookup first
      if (TRANSLITERATION_MAP[char]) {
        return TRANSLITERATION_MAP[char];
      }
      // Try lowercase lookup for uppercase characters
      const lowerChar = char.toLowerCase();
      if (TRANSLITERATION_MAP[lowerChar]) {
        return TRANSLITERATION_MAP[lowerChar];
      }
      return char;
    })
    .join("");
}

export function slugify(text: string, policy: Partial<SlugPolicy> = {}): string {
  const config = { ...DEFAULT_SLUG_POLICY, ...policy };

  let slug = text.trim();

  // Transliterate if enabled
  if (config.transliterate) {
    slug = transliterate(slug);
  }

  // Convert to lowercase if enabled
  if (config.lowercase) {
    slug = slug.toLowerCase();
  }

  // Remove stop words if enabled
  if (config.removeStopWords) {
    const stopWords = config.customStopWords
      ? new Set([...DEFAULT_STOP_WORDS, ...config.customStopWords])
      : DEFAULT_STOP_WORDS;

    const words = slug.split(/\s+/);
    slug = words.filter((word) => !stopWords.has(word.toLowerCase())).join(" ");
  }

  // Replace spaces and special characters with separator
  slug = slug
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_]+/g, config.separator) // Replace spaces and underscores with separator
    .replace(new RegExp(`${config.separator}+`, "g"), config.separator) // Remove consecutive separators
    .replace(new RegExp(`^${config.separator}|${config.separator}$`, "g"), ""); // Trim separators

  // Enforce max length
  if (slug.length > config.maxLength) {
    slug = slug.substring(0, config.maxLength).replace(new RegExp(`${config.separator}[^${config.separator}]*$`), "");
  }

  return slug;
}

export function isReservedSlug(slug: string, policy?: SlugPolicy): boolean {
  const config = policy ?? DEFAULT_SLUG_POLICY;
  if (!config.reservedSlugs) return false;
  return config.reservedSlugs.includes(slug.toLowerCase());
}

export function generateSlugFromPattern(
  pattern: string,
  data: Record<string, unknown>,
  policy?: Partial<SlugPolicy>,
): string {
  // Replace {{fieldName}} or {{fieldName:format}} patterns (case-insensitive field matching)
  const resolved = pattern.replace(/\{\{([\w]+)(?::([^}]+))?\}\}/g, (match, fieldName, format) => {
    // Find the actual key in data (case-insensitive)
    const actualKey = Object.keys(data).find((k) => k.toLowerCase() === fieldName.toLowerCase());
    const value = actualKey !== undefined ? data[actualKey] : data[fieldName];
    
    if (value === undefined || value === null) return "";

    // Check if this looks like a date field by name or if format looks like a date format
    const isDateField = fieldName.toLowerCase().includes("date") || 
                        fieldName.toLowerCase().includes("at");
    const isDateFormat = format && /YYYY|MM|DD/.test(format);
    
    if (format && (isDateField || isDateFormat)) {
      try {
        return formatDate(new Date(String(value)), format);
      } catch {
        return String(value);
      }
    }

    return String(value);
  });

  // Split by path separators, slugify each part, then rejoin
  const separator = policy?.separator ?? "-";
  const parts = resolved.split("/");
  const slugifiedParts = parts.map((part) => slugify(part, { ...policy, separator }));
  return slugifiedParts.join("/");
}

// ============================================================================
// Uniqueness Checking
// ============================================================================

export interface UniquenessChecker {
  (slug: string, scope?: string): boolean;
}

export function ensureUniqueSlug(
  baseSlug: string,
  checker: UniquenessChecker,
  policy?: Partial<SlugPolicy>,
): string {
  const config = { ...DEFAULT_SLUG_POLICY, ...policy };

  if (!config.enforceUniqueness) {
    return baseSlug;
  }

  let slug = baseSlug;
  let counter = 1;

  while (!checker(slug)) {
    slug = `${baseSlug}${config.separator}${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      throw new Error("Unable to generate unique slug after 1000 attempts");
    }
  }

  return slug;
}

// ============================================================================
// String Utilities
// ============================================================================

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

// ============================================================================
// Deep Clone
// ============================================================================

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  if (typeof obj === "object") {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}
