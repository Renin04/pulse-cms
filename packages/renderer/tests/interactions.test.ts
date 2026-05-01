import { describe, expect, it, vi } from "vitest";
import {
  clickActionToAttributes,
  dispatchClickAction,
  renderAttributeString,
  renderClickable,
  renderForm,
  resolveFormConfig,
  submitForm,
  validateClickAction,
  validateFormConfig,
  validateFormValues,
} from "../src/index";

describe("click interactions runtime", () => {
  it("validates navigate actions", () => {
    const errors = validateClickAction({
      type: "navigate",
      url: "",
    });

    expect(errors).toContain("NavigateAction.url must not be empty.");
  });

  it("serializes emit action payload into data attributes", () => {
    const attrs = clickActionToAttributes({
      type: "emit",
      eventName: "pulse:cta",
      payload: { intent: "signup" },
    });

    expect(attrs["data-pulse-action"]).toBe("emit");
    expect(attrs["data-pulse-event"]).toBe("pulse:cta");
    expect(attrs["data-pulse-payload"]).toContain("signup");
  });

  it("renders button wrapper for interactive actions", () => {
    const html = renderClickable("Click me", {
      type: "toggle",
      toggleKey: "faq-1",
      initialState: true,
    });

    expect(html.startsWith("<button")).toBe(true);
    expect(html).toContain('data-pulse-toggle="faq-1"');
    expect(html).toContain('data-pulse-toggle-state="true"');
  });

  it("renders anchor wrapper for navigate actions", () => {
    const html = renderClickable("Read", {
      type: "navigate",
      url: "/docs/getting-started",
      newTab: true,
    });

    expect(html.startsWith("<a")).toBe(true);
    expect(html).toContain('data-pulse-url="/docs/getting-started"');
    expect(html).toContain('data-pulse-new-tab="true"');
  });

  it("returns unwrapped HTML for disabled actions", () => {
    const html = renderClickable("Disabled", {
      type: "copy",
      text: "hello",
      disabled: true,
    });

    expect(html).toBe("Disabled");
  });

  it("renders attribute maps as stable HTML attribute strings", () => {
    const rendered = renderAttributeString({
      "data-pulse-action": "copy",
      "data-pulse-copy": "hello",
    });

    expect(rendered).toBe('data-pulse-action="copy" data-pulse-copy="hello"');
  });

  it("dispatches navigate actions and emits runtime events", async () => {
    const emitted: string[] = [];
    const navigate = vi.fn();

    const result = await dispatchClickAction(
      {
        type: "navigate",
        url: "/pricing",
      },
      {
        emit: (eventName) => emitted.push(eventName),
        navigate,
      },
    );

    expect(result.handled).toBe(true);
    expect(emitted).toContain("pulse:interaction:click");
    expect(emitted).toContain("pulse:interaction:click:navigate");
    expect(navigate).toHaveBeenCalledWith("/pricing", { newTab: false });
  });

  it("dispatches toggle actions with computed next state", async () => {
    const toggle = vi.fn();

    const result = await dispatchClickAction(
      {
        type: "toggle",
        toggleKey: "section-a",
      },
      {
        getToggleState: () => false,
        toggle,
      },
    );

    expect(result.handled).toBe(true);
    expect(result.emittedEvents).toContain("pulse:interaction:toggle:changed");
    expect(toggle).toHaveBeenCalledWith("section-a", true);
  });
});

describe("form interaction runtime", () => {
  it("resolves form defaults", () => {
    const resolved = resolveFormConfig({
      formId: "contact",
      action: "/api/contact",
      fields: [
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
        },
      ],
    });

    expect(resolved.method).toBe("post");
    expect(resolved.encType).toBe("application/x-www-form-urlencoded");
    expect(resolved.submitLabel).toBe("Submit");
    expect(resolved.staticFallback).toBe(false);
  });

  it("validates missing fields and action constraints", () => {
    const errors = validateFormConfig({
      formId: "",
      method: "post",
      fields: [],
    });

    expect(errors).toContain("FormConfig.formId must not be empty.");
    expect(errors).toContain("FormConfig.fields must be a non-empty array.");
    expect(errors).toContain('FormConfig.action URL is required for method "post".');
  });

  it("renders interactive form with data-pulse attributes", () => {
    const html = renderForm({
      formId: "newsletter",
      action: "/api/newsletter",
      method: "post",
      successMessage: "Saved",
      errorMessage: "Failed",
      fields: [
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "you@example.com",
        },
      ],
    });

    expect(html).toContain('data-pulse-form="newsletter"');
    expect(html).toContain('data-pulse-success="Saved"');
    expect(html).toContain('data-pulse-error="Failed"');
    expect(html).toContain('class="pulse-form__submit"');
  });

  it("renders static fallback forms without interaction attributes", () => {
    const html = renderForm({
      formId: "feedback",
      action: "/api/feedback",
      staticFallback: true,
      fields: [
        {
          name: "message",
          label: "Message",
          type: "textarea",
        },
      ],
    });

    expect(html).not.toContain("data-pulse-form=");
    expect(html).toContain('<form id="pulse-form-feedback"');
  });

  it("renders select fields with options and selected defaults", () => {
    const html = renderForm({
      formId: "prefs",
      action: "/api/prefs",
      fields: [
        {
          name: "theme",
          label: "Theme",
          type: "select",
          defaultValue: "dark",
          options: [
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ],
        },
      ],
    });

    expect(html).toContain('<option value="dark" selected>Dark</option>');
  });

  it("validates concrete form values against field rules", () => {
    const errors = validateFormValues(
      {
        formId: "signup",
        action: "/api/signup",
        fields: [
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
          },
        ],
        validation: [
          {
            fieldName: "email",
            rule: "email",
            message: "Email must be valid.",
          },
        ],
      },
      { email: "not-an-email" },
    );

    expect(errors).toEqual([
      { fieldName: "email", message: "Email must be valid." },
    ]);
  });

  it("submits form through transport and emits success events", async () => {
    const emitted: string[] = [];
    const beforeSubmit = vi.fn();
    const onSuccess = vi.fn();

    const result = await submitForm(
      {
        formId: "newsletter",
        action: "/api/newsletter",
        fields: [
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
          },
        ],
      },
      {
        email: "user@example.com",
      },
      {
        emit: (eventName) => emitted.push(eventName),
        beforeSubmit,
        onSuccess,
        transport: async (request) => ({
          ok: true,
          status: 201,
          data: { id: "sub-1", email: request.values.email },
        }),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
    expect(emitted).toContain("pulse:form:before-submit");
    expect(emitted).toContain("pulse:form:submitted");
    expect(beforeSubmit).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("returns validation failure before transport is called", async () => {
    const transport = vi.fn();
    const onError = vi.fn();
    const emitted: string[] = [];

    const result = await submitForm(
      {
        formId: "signup",
        action: "/api/signup",
        fields: [
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
          },
        ],
      },
      {
        email: "",
      },
      {
        emit: (eventName) => emitted.push(eventName),
        onError,
        transport,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(422);
    expect(result.validationErrors).toHaveLength(1);
    expect(transport).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(emitted).toContain("pulse:form:validation-failed");
  });
});
