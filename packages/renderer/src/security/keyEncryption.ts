/**
 * API key encryption utilities for Pulse renderer.
 * Provides secure storage and handling of API keys for AI providers and external services.
 */

/**
 * Encrypted key container with metadata.
 */
export interface EncryptedKey {
  /** The encrypted key data (base64-encoded). */
  ciphertext: string;
  /** Initialization vector (base64-encoded). */
  iv: string;
  /** Salt used for key derivation (base64-encoded). */
  salt: string;
  /** Encryption algorithm identifier. */
  algorithm: string;
  /** Timestamp when the key was encrypted. */
  timestamp: number;
}

/**
 * Key metadata for display and management.
 */
export interface KeyMetadata {
  /** Unique identifier for this key. */
  id: string;
  /** Human-readable label (e.g., "OpenAI Production"). */
  label: string;
  /** Service provider (e.g., "openai", "anthropic"). */
  provider: string;
  /** Last 4 characters of the key for verification. */
  lastFour: string;
  /** When the key was created. */
  createdAt: number;
  /** Optional expiration timestamp. */
  expiresAt?: number;
}

/**
 * Check if the Web Crypto API is available.
 * Returns true in modern browsers and Node 15+.
 */
export function isCryptoAvailable(): boolean {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return true;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return true;
  }
  return false;
}

/**
 * Convert a Uint8Array to base64 string.
 */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

/**
 * Convert a base64 string to Uint8Array.
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

/**
 * Generate a cryptographic key from a password using PBKDF2.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<CryptoKey> {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt an API key using AES-GCM with a password-derived key.
 *
 * @param apiKey - The plaintext API key to encrypt
 * @param password - Master password for encryption
 * @returns Encrypted key container with all necessary metadata
 */
export async function encryptApiKey(
  apiKey: string,
  password: string,
): Promise<EncryptedKey> {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(apiKey),
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    algorithm: "AES-GCM-256",
    timestamp: Date.now(),
  };
}

/**
 * Decrypt an API key using the same password used for encryption.
 *
 * @param encrypted - The encrypted key container
 * @param password - Master password for decryption
 * @returns The plaintext API key
 */
export async function decryptApiKey(
  encrypted: EncryptedKey,
  password: string,
): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const crypto = globalThis.crypto;
  const decoder = new TextDecoder();

  const salt = fromBase64(encrypted.salt);
  const iv = fromBase64(encrypted.iv);
  const ciphertext = fromBase64(encrypted.ciphertext);

  const key = await deriveKey(password, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer,
    );

    return decoder.decode(plaintext);
  } catch {
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}

/**
 * Create metadata for an API key without storing the key itself.
 */
export function createKeyMetadata(
  apiKey: string,
  label: string,
  provider: string,
): KeyMetadata {
  const lastFour = apiKey.slice(-4);
  const id = generateKeyId(provider, lastFour);

  return {
    id,
    label,
    provider,
    lastFour,
    createdAt: Date.now(),
  };
}

/**
 * Generate a unique identifier for a key based on provider and last 4 chars.
 */
function generateKeyId(provider: string, lastFour: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${provider}-${lastFour}-${timestamp}-${random}`;
}

/**
 * Validate an API key format for common providers.
 * Returns true if the format looks valid, false otherwise.
 */
export function validateApiKeyFormat(apiKey: string, provider: string): boolean {
  if (!apiKey || apiKey.length < 10) return false;

  switch (provider.toLowerCase()) {
    case "openai":
      return apiKey.startsWith("sk-") && apiKey.length > 20;
    case "anthropic":
      return apiKey.startsWith("sk-ant-") && apiKey.length > 30;
    case "google":
      return apiKey.length >= 39;
    case "cohere":
      return apiKey.length >= 40;
    default:
      return apiKey.length >= 10;
  }
}

/**
 * Mask an API key for display purposes.
 * Shows only the first 4 and last 4 characters.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "****";
  const first = apiKey.slice(0, 4);
  const last = apiKey.slice(-4);
  const masked = "*".repeat(Math.min(apiKey.length - 8, 20));
  return `${first}${masked}${last}`;
}

/**
 * Check if an encrypted key has expired.
 */
export function isKeyExpired(metadata: KeyMetadata): boolean {
  if (!metadata.expiresAt) return false;
  return Date.now() > metadata.expiresAt;
}

/**
 * Rotate an API key by encrypting a new key and returning updated containers.
 */
export async function rotateApiKey(
  oldMetadata: KeyMetadata,
  newApiKey: string,
  password: string,
): Promise<{ encrypted: EncryptedKey; metadata: KeyMetadata }> {
  const encrypted = await encryptApiKey(newApiKey, password);
  const metadata = createKeyMetadata(newApiKey, oldMetadata.label, oldMetadata.provider);
  return { encrypted, metadata };
}
