import { escapeHtml } from "../render/render";

/**
 * Supported HTTP methods for form submission.
 */
export type FormMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Supported encoding types for form submission.
 */
export type FormEncType =
  | "application/x-www-form-urlencoded"
  | "multipart/form-data"
  | "application/json";

/**
 * A single form field descriptor.
 */
export interface FormField {
  /** HTML name attribute — used as the key in submission payload. */
  name: string;
  /** Field label shown to the user. */
  label: string;
  /** Input type. Defaults to "text". */
  type?: "text" | "email" | "number" | "textarea" | "checkbox" | "select" | "hidden";
  /** Placeholder text. */
  placeholder?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Default value. */
  defaultValue?: string;
  /** Options for select fields. */
  options?: Array<{ label: string; value: string }>;
  /** If true, field is rendered but not user-editable. */
  readOnly?: boolean;
}

/**
 * Validation rules applied to a form before submission.
 */
export interface FormValidationRule {
  /** Field name the rule applies to. */
  fieldName: string;
  /** Rule type. */
  rule: "required" | "minLength" | "maxLength" | "pattern" | "email";
  /** Argument for minLength/maxLength/pattern rules. */
  arg?: number | string;
  /** Custom error message override. */
  message?: string;
}

/**
 * Configuration for a Pulse interactive form block.
 */
export interface FormConfig {
  /** Stable form identifier used in data-pulse-form attributes. */
  formId: string;
  /** Submission endpoint URL. Required for POST/PUT/PATCH/DELETE. */
  action?: string;
  /** HTTP method. Defaults to "post". */
  method?: FormMethod;
  /** Encoding type. Defaults to "application/x-www-form-urlencoded". */
  encType?: FormEncType;
  /** Ordered list of fields. */
  fields: FormField[];
  /** Validation rules. */
  validation?: FormValidationRule[];
  /** Text on the submit button. Defaults to "Submit". */
  submitLabel?: string;
  /** Text shown on successful submission. */
  successMessage?: string;
  /** Text shown on submission error. */
  errorMessage?: string;
  /** If true, the form operates in SSR mode (no client-side JS attributes). */
  staticFallback?: boolean;
}

/**
 * Resolved FormConfig with all defaults filled in.
 */
export interface ResolvedFormConfig {
  formId: string;
  action: string;
  method: FormMethod;
  encType: FormEncType;
  fields: FormField[];
  validation: FormValidationRule[];
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
  staticFallback: boolean;
}

/**
 * Resolve a FormConfig, filling in all defaults.
 */
export function resolveFormConfig(config: FormConfig): ResolvedFormConfig {
  return {
    formId: config.formId,
    action: config.action ?? "",
    method: config.method ?? "post",
    encType: config.encType ?? "application/x-www-form-urlencoded",
    fields: config.fields,
    validation: config.validation ?? [],
    submitLabel: config.submitLabel ?? "Submit",
    successMessage: config.successMessage ?? "Form submitted successfully.",
    errorMessage: config.errorMessage ?? "Submission failed. Please try again.",
    staticFallback: config.staticFallback ?? false,
  };
}

/**
 * Validate a FormConfig descriptor.
 * Returns an array of human-readable error strings.
 * An empty array means the config is valid.
 */
export function validateFormConfig(config: FormConfig): string[] {
  const errors: string[] = [];

  if (!config.formId || config.formId.trim() === "") {
    errors.push("FormConfig.formId must not be empty.");
  }

  if (!Array.isArray(config.fields) || config.fields.length === 0) {
    errors.push("FormConfig.fields must be a non-empty array.");
  } else {
    for (const field of config.fields) {
      if (!field.name || field.name.trim() === "") {
        errors.push("FormField.name must not be empty.");
      }
      if (!field.label || field.label.trim() === "") {
        errors.push(`FormField "${field.name}" must have a label.`);
      }
      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        errors.push(`Select field "${field.name}" must have at least one option.`);
      }
    }
  }

  const method = config.method ?? "post";
  if (["post", "put", "patch", "delete"].includes(method) && !config.action) {
    errors.push(
      `FormConfig.action URL is required for method "${method}".`,
    );
  }

  return errors;
}

/**
 * Render a single FormField to an HTML string.
 */
function renderField(field: FormField): string {
  const nameAttr = `name="${escapeHtml(field.name)}"`;
  const idAttr = `id="${escapeHtml(field.name)}"`;
  const placeholderAttr = field.placeholder
    ? ` placeholder="${escapeHtml(field.placeholder)}"`
    : "";
  const requiredAttr = field.required ? " required" : "";
  const readOnlyAttr = field.readOnly ? " readonly" : "";
  const defaultVal = field.defaultValue ? escapeHtml(field.defaultValue) : "";

  const labelHtml = `<label for="${escapeHtml(field.name)}" class="pulse-form__label">${escapeHtml(field.label)}</label>`;

  let inputHtml: string;

  switch (field.type ?? "text") {
    case "textarea":
      inputHtml = `<textarea ${nameAttr} ${idAttr}${placeholderAttr}${requiredAttr}${readOnlyAttr} class="pulse-form__textarea">${defaultVal}</textarea>`;
      break;
    case "checkbox":
      inputHtml = `<input type="checkbox" ${nameAttr} ${idAttr}${requiredAttr} class="pulse-form__checkbox"${defaultVal === "true" ? " checked" : ""} />`;
      break;
    case "select": {
      const opts = (field.options ?? [])
        .map(
          (opt) =>
            `<option value="${escapeHtml(opt.value)}"${opt.value === defaultVal ? " selected" : ""}>${escapeHtml(opt.label)}</option>`,
        )
        .join("");
      inputHtml = `<select ${nameAttr} ${idAttr}${requiredAttr}${readOnlyAttr} class="pulse-form__select">${opts}</select>`;
      break;
    }
    case "hidden":
      inputHtml = `<input type="hidden" ${nameAttr} ${idAttr} value="${defaultVal}" />`;
      break;
    default: {
      const typeAttr = `type="${escapeHtml(field.type ?? "text")}"`;
      inputHtml = `<input ${typeAttr} ${nameAttr} ${idAttr}${placeholderAttr}${requiredAttr}${readOnlyAttr} class="pulse-form__input" value="${defaultVal}" />`;
    }
  }

  if (field.type === "hidden") return inputHtml;

  return `<div class="pulse-form__field">${labelHtml}${inputHtml}</div>`;
}

/**
 * Render a complete interactive form to an HTML string.
 *
 * In non-static mode, data-* attributes are added so a client-side runtime
 * can intercept submission and handle responses without full-page reload.
 * In staticFallback mode, the form uses a plain native HTML form action.
 */
export function renderForm(config: FormConfig): string {
  const resolved = resolveFormConfig(config);

  const formId = escapeHtml(resolved.formId);
  const methodAttr = `method="${resolved.method}"`;
  const actionAttr = resolved.action ? ` action="${escapeHtml(resolved.action)}"` : "";
  const encTypeAttr =
    resolved.method !== "get"
      ? ` enctype="${escapeHtml(resolved.encType)}"`
      : "";

  const interactiveAttrs = resolved.staticFallback
    ? ""
    : ` data-pulse-form="${formId}" data-pulse-success="${escapeHtml(resolved.successMessage)}" data-pulse-error="${escapeHtml(resolved.errorMessage)}"`;

  const fieldsHtml = resolved.fields.map(renderField).join("\n");

  const submitHtml = `<button type="submit" class="pulse-form__submit">${escapeHtml(resolved.submitLabel)}</button>`;

  return [
    `<form id="pulse-form-${formId}" ${methodAttr}${actionAttr}${encTypeAttr}${interactiveAttrs} class="pulse-form" novalidate>`,
    fieldsHtml,
    submitHtml,
    `</form>`,
  ].join("\n");
}

export type FormValue = string | number | boolean | null | undefined;
export type FormValues = Record<string, FormValue>;

export interface FormValidationError {
  fieldName: string;
  message: string;
}

export interface FormSubmissionRequest {
  formId: string;
  action: string;
  method: FormMethod;
  encType: FormEncType;
  values: Record<string, string>;
}

export interface FormSubmissionResponse {
  ok: boolean;
  status: number;
  message?: string;
  data?: Record<string, unknown>;
}

export interface FormSubmissionHooks {
  emit?: (eventName: string, payload?: Record<string, unknown>) => void;
  beforeSubmit?: (request: FormSubmissionRequest) => void | Promise<void>;
  transport?: (
    request: FormSubmissionRequest,
  ) => Promise<FormSubmissionResponse>;
  onSuccess?: (
    response: FormSubmissionResponse,
    request: FormSubmissionRequest,
  ) => void | Promise<void>;
  onError?: (
    error: {
      message: string;
      status?: number;
      validationErrors?: FormValidationError[];
    },
    request?: FormSubmissionRequest,
  ) => void | Promise<void>;
}

export interface FormSubmissionResult {
  ok: boolean;
  status: number;
  message: string;
  validationErrors: FormValidationError[];
  data?: Record<string, unknown>;
}

function getFieldValue(field: FormField, values: FormValues): FormValue {
  const runtimeValue = values[field.name];
  if (runtimeValue !== undefined) return runtimeValue;
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === "checkbox") return false;
  return "";
}

function normalizeFormValues(
  fields: FormField[],
  values: FormValues,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const field of fields) {
    const raw = getFieldValue(field, values);
    if (typeof raw === "boolean") {
      normalized[field.name] = raw ? "true" : "false";
      continue;
    }
    normalized[field.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return normalized;
}

function isEmpty(raw: FormValue): boolean {
  return raw === null || raw === undefined || String(raw).trim() === "";
}

function isCheckboxChecked(raw: FormValue): boolean {
  return raw === true || raw === "true";
}

/**
 * Validate concrete form values against required field attributes and
 * custom `FormValidationRule` entries.
 */
export function validateFormValues(
  config: FormConfig,
  values: FormValues,
): FormValidationError[] {
  const resolved = resolveFormConfig(config);
  const validationErrors: FormValidationError[] = [];

  for (const field of resolved.fields) {
    const value = getFieldValue(field, values);
    const valueStr = value === null || value === undefined ? "" : String(value);

    if (field.required) {
      if (field.type === "checkbox") {
        if (!isCheckboxChecked(value)) {
          validationErrors.push({
            fieldName: field.name,
            message: `${field.label} is required.`,
          });
        }
      } else if (isEmpty(value)) {
        validationErrors.push({
          fieldName: field.name,
          message: `${field.label} is required.`,
        });
      }
    }

    const rules = resolved.validation.filter(
      (rule) => rule.fieldName === field.name,
    );

    for (const rule of rules) {
      const failMessage =
        rule.message ?? `${field.label} failed validation (${rule.rule}).`;
      switch (rule.rule) {
        case "required":
          if (isEmpty(value)) {
            validationErrors.push({ fieldName: field.name, message: failMessage });
          }
          break;
        case "minLength":
          if (
            typeof rule.arg === "number" &&
            valueStr.length < Math.max(0, rule.arg)
          ) {
            validationErrors.push({ fieldName: field.name, message: failMessage });
          }
          break;
        case "maxLength":
          if (typeof rule.arg === "number" && valueStr.length > rule.arg) {
            validationErrors.push({ fieldName: field.name, message: failMessage });
          }
          break;
        case "pattern":
          if (typeof rule.arg === "string") {
            const regex = new RegExp(rule.arg);
            if (!regex.test(valueStr)) {
              validationErrors.push({
                fieldName: field.name,
                message: failMessage,
              });
            }
          }
          break;
        case "email": {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (valueStr.trim() !== "" && !emailRegex.test(valueStr)) {
            validationErrors.push({
              fieldName: field.name,
              message: failMessage,
            });
          }
          break;
        }
      }
    }
  }

  return validationErrors;
}

/**
 * Submit form values through a runtime transport and emit lifecycle events.
 * Event names:
 * - `pulse:form:before-submit`
 * - `pulse:form:validation-failed`
 * - `pulse:form:submitted`
 * - `pulse:form:error`
 */
export async function submitForm(
  config: FormConfig,
  values: FormValues,
  hooks: FormSubmissionHooks = {},
): Promise<FormSubmissionResult> {
  const configErrors = validateFormConfig(config);
  if (configErrors.length > 0) {
    const message = configErrors.join(" ");
    hooks.emit?.("pulse:form:error", {
      formId: config.formId,
      status: 400,
      reason: "config",
    });
    await hooks.onError?.({ message, status: 400 });
    return {
      ok: false,
      status: 400,
      message,
      validationErrors: [],
    };
  }

  const validationErrors = validateFormValues(config, values);
  if (validationErrors.length > 0) {
    hooks.emit?.("pulse:form:validation-failed", {
      formId: config.formId,
      count: validationErrors.length,
    });
    await hooks.onError?.({
      message: "Validation failed.",
      status: 422,
      validationErrors,
    });
    return {
      ok: false,
      status: 422,
      message: "Validation failed.",
      validationErrors,
    };
  }

  const resolved = resolveFormConfig(config);
  const request: FormSubmissionRequest = {
    formId: resolved.formId,
    action: resolved.action,
    method: resolved.method,
    encType: resolved.encType,
    values: normalizeFormValues(resolved.fields, values),
  };

  hooks.emit?.("pulse:form:before-submit", {
    formId: resolved.formId,
    method: resolved.method,
  });
  await hooks.beforeSubmit?.(request);

  if (!hooks.transport) {
    if (resolved.staticFallback) {
      const message = "Static fallback submission is delegated to the browser.";
      hooks.emit?.("pulse:form:submitted", {
        formId: resolved.formId,
        status: 200,
        mode: "static-fallback",
      });
      return {
        ok: true,
        status: 200,
        message,
        validationErrors: [],
      };
    }

    const message = "No form transport handler configured.";
    hooks.emit?.("pulse:form:error", {
      formId: resolved.formId,
      status: 501,
      reason: "missing-transport",
    });
    await hooks.onError?.({ message, status: 501 }, request);
    return {
      ok: false,
      status: 501,
      message,
      validationErrors: [],
    };
  }

  try {
    const response = await hooks.transport(request);
    if (response.ok) {
      hooks.emit?.("pulse:form:submitted", {
        formId: resolved.formId,
        status: response.status,
      });
      await hooks.onSuccess?.(response, request);
      return {
        ok: true,
        status: response.status,
        message: response.message ?? resolved.successMessage,
        validationErrors: [],
        data: response.data,
      };
    }

    hooks.emit?.("pulse:form:error", {
      formId: resolved.formId,
      status: response.status,
      reason: "transport-failed",
    });
    await hooks.onError?.(
      {
        message: response.message ?? resolved.errorMessage,
        status: response.status,
      },
      request,
    );
    return {
      ok: false,
      status: response.status,
      message: response.message ?? resolved.errorMessage,
      validationErrors: [],
      data: response.data,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown submission error.";
    hooks.emit?.("pulse:form:error", {
      formId: resolved.formId,
      status: 500,
      reason: "exception",
    });
    await hooks.onError?.({ message, status: 500 }, request);
    return {
      ok: false,
      status: 500,
      message,
      validationErrors: [],
    };
  }
}
