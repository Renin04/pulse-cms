# Security Audit Checklist — Launch Readiness Gate

> Validate security boundaries before launch. Each check must pass or be explicitly accepted
> as a known limitation with rationale.

---

## Input Sanitization

- [ ] **Block data sanitization:** HTML/script tags injected into block `data` fields are
  sanitized or escaped before renderer output.
- [ ] **URL validation:** Image, video, audio, file, embed, and link URLs are validated
  (protocol allowlist, malformed rejection).
- [ ] **Paste sanitization:** Pasted HTML content is stripped of dangerous tags/attributes
  (or paste cleanup is documented as deferred).
- [ ] **Alt text/metadata sanitization:** User-provided alt text, captions, credits do not
  execute scripts when rendered.

## XSS Prevention

- [ ] **Stored XSS:** No block type allows persistent script execution through saved data.
- [ ] **Reflected XSS:** URL parameters or query strings in website/blog routes do not
  reflect unsanitized user input.
- [ ] **DOM XSS:** Renderer does not use `innerHTML` or `dangerouslySetInnerHTML` with
  unsanitized block data.

## CSP & Headers

- [ ] **CSP recommendations:** A documented CSP policy exists for consumers.
- [ ] **Frame options:** Embed/iframes use `sandbox` attributes where appropriate.
- [ ] **Trusted types:** If applicable, trusted-types policy is documented.

## CORS & Network

- [ ] **CORS allowlist:** Cross-origin media/embed requests use configured allowlists.
- [ ] **Preflight behavior:** Custom endpoints handle preflight correctly.
- [ ] **Proxy sanitization:** Any proxy paths sanitize responses.

## Secrets & Encryption

- [ ] **API key encryption:** Encryption/decryption utilities are tested and documented.
- [ ] **Key rotation:** Rotation metadata and utilities behave correctly.
- [ ] **Redaction:** Keys are redacted from logs and UI.

## Schema & Validation

- [ ] **Zod strictness:** Block schemas reject unexpected/malicious data shapes.
- [ ] **Max length/size limits:** String and array fields have reasonable max bounds.

---

**Auditor:** _______________  
**Date:** _______________  
**Result:** `PASS` / `PASS WITH DEFERRALS` / `FAIL`
