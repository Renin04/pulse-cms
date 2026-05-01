import {
  ToolbarAction,
  ToolbarConfig,
  DEFAULT_TOOLBAR_CONFIG,
  getVisibleActions,
  validateToolbarConfig,
} from './toolbarConfig';

export interface ToolbarRenderOptions {
  container?: HTMLElement;
  onAction?: (actionId: string, action: ToolbarAction) => void;
  activeActions?: Set<string>;
  disabledActions?: Set<string>;
}

export interface RenderedToolbar {
  element: HTMLElement;
  update: (options: Partial<ToolbarRenderOptions>) => void;
  destroy: () => void;
}

/**
 * Render a single toolbar action element
 */
export function renderToolbarAction(
  action: ToolbarAction,
  options: ToolbarRenderOptions = {}
): HTMLElement | null {
  const { onAction, activeActions = new Set(), disabledActions = new Set() } = options;

  if (action.hidden) return null;

  const isDisabled = action.disabled || disabledActions.has(action.id);
  const isActive = activeActions.has(action.id);

  switch (action.type) {
    case 'separator':
      return renderSeparator(action);

    case 'button':
      return renderButton(action, { isDisabled, isActive, onAction });

    case 'toggle':
      return renderToggle(action, { isDisabled, isActive, onAction });

    case 'dropdown':
      return renderDropdown(action, { isDisabled, isActive, onAction, activeActions, disabledActions });

    case 'group':
      return renderGroup(action, { isDisabled, onAction, activeActions, disabledActions });

    case 'custom':
      return renderCustom(action);

    default:
      return renderFallback(action, { isDisabled, onAction });
  }
}

function renderSeparator(action: ToolbarAction): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pulse-toolbar__separator';
  el.setAttribute('role', 'separator');
  el.setAttribute('aria-orientation', 'vertical');
  el.dataset.actionId = action.id;
  return el;
}

function renderButton(
  action: ToolbarAction,
  opts: { isDisabled: boolean; isActive: boolean; onAction?: ToolbarRenderOptions['onAction'] }
): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'pulse-toolbar__action pulse-toolbar__action--button';
  if (opts.isActive) btn.classList.add('pulse-toolbar__action--active');
  btn.dataset.actionId = action.id;
  btn.disabled = opts.isDisabled;
  btn.setAttribute('type', 'button');

  if (action.tooltip) btn.setAttribute('title', action.tooltip);
  if (action.label) btn.setAttribute('aria-label', action.label);

  if (action.icon) {
    const icon = document.createElement('span');
    icon.className = `pulse-toolbar__icon pulse-toolbar__icon--${action.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
  }

  if (action.label) {
    const label = document.createElement('span');
    label.className = 'pulse-toolbar__label';
    label.textContent = action.label;
    btn.appendChild(label);
  }

  btn.addEventListener('click', () => {
    if (!opts.isDisabled) {
      action.onClick?.();
      opts.onAction?.(action.id, action);
    }
  });

  return btn;
}

function renderToggle(
  action: ToolbarAction,
  opts: { isDisabled: boolean; isActive: boolean; onAction?: ToolbarRenderOptions['onAction'] }
): HTMLElement {
  const btn = renderButton(action, opts) as HTMLButtonElement;
  btn.classList.replace('pulse-toolbar__action--button', 'pulse-toolbar__action--toggle');
  btn.setAttribute('aria-pressed', String(opts.isActive));
  return btn;
}

function renderDropdown(
  action: ToolbarAction,
  opts: {
    isDisabled: boolean;
    isActive: boolean;
    onAction?: ToolbarRenderOptions['onAction'];
    activeActions: Set<string>;
    disabledActions: Set<string>;
  }
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'pulse-toolbar__dropdown';
  wrapper.dataset.actionId = action.id;

  const trigger = document.createElement('button');
  trigger.className = 'pulse-toolbar__action pulse-toolbar__action--dropdown-trigger';
  trigger.setAttribute('type', 'button');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.disabled = opts.isDisabled;
  if (action.tooltip) trigger.setAttribute('title', action.tooltip);
  if (action.label) trigger.setAttribute('aria-label', action.label);

  if (action.icon) {
    const icon = document.createElement('span');
    icon.className = `pulse-toolbar__icon pulse-toolbar__icon--${action.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    trigger.appendChild(icon);
  }

  if (action.label) {
    const label = document.createElement('span');
    label.className = 'pulse-toolbar__label';
    label.textContent = action.label;
    trigger.appendChild(label);
  }

  const menu = document.createElement('div');
  menu.className = 'pulse-toolbar__dropdown-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  (action.children ?? []).forEach((child) => {
    const childEl = renderToolbarAction(child, opts);
    if (childEl) {
      childEl.setAttribute('role', 'menuitem');
      menu.appendChild(childEl);
    }
  });

  trigger.addEventListener('click', () => {
    if (opts.isDisabled) return;
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node)) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);
  return wrapper;
}

function renderGroup(
  action: ToolbarAction,
  opts: {
    isDisabled: boolean;
    onAction?: ToolbarRenderOptions['onAction'];
    activeActions: Set<string>;
    disabledActions: Set<string>;
  }
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'pulse-toolbar__group';
  group.setAttribute('role', 'group');
  group.dataset.actionId = action.id;
  if (action.label) group.setAttribute('aria-label', action.label);

  (action.children ?? []).forEach((child) => {
    const childEl = renderToolbarAction(child, opts);
    if (childEl) group.appendChild(childEl);
  });

  return group;
}

function renderCustom(action: ToolbarAction): HTMLElement | null {
  if (!action.customRender) {
    return renderFallback(action, { isDisabled: false });
  }
  try {
    const el = action.customRender(action);
    el.dataset.actionId = action.id;
    el.classList.add('pulse-toolbar__action--custom');
    return el;
  } catch {
    return renderFallback(action, { isDisabled: true });
  }
}

function renderFallback(
  action: ToolbarAction,
  opts: { isDisabled: boolean; onAction?: ToolbarRenderOptions['onAction'] }
): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'pulse-toolbar__action pulse-toolbar__action--fallback';
  btn.dataset.actionId = action.id;
  btn.disabled = opts.isDisabled;
  btn.setAttribute('type', 'button');
  btn.textContent = action.label ?? action.id;
  if (action.tooltip) btn.setAttribute('title', action.tooltip);

  btn.addEventListener('click', () => {
    if (!opts.isDisabled) {
      action.onClick?.();
      opts.onAction?.(action.id, action);
    }
  });

  return btn;
}

/**
 * Render a full toolbar from config
 */
export function renderToolbar(
  config: ToolbarConfig,
  options: ToolbarRenderOptions = {}
): RenderedToolbar {
  const mergedConfig = { ...DEFAULT_TOOLBAR_CONFIG, ...config };

  // Validate — warn but don't throw
  const validation = validateToolbarConfig(mergedConfig);
  if (!validation.valid) {
    validation.errors.forEach((err) =>
      console.warn(`[pulse-toolbar] Config error: ${err}`)
    );
  }

  const toolbar = document.createElement('div');
  toolbar.className = `pulse-toolbar pulse-toolbar--${mergedConfig.position ?? 'top'}`;
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Editor toolbar');

  if (mergedConfig.sticky) toolbar.classList.add('pulse-toolbar--sticky');
  if (mergedConfig.collapsible) toolbar.classList.add('pulse-toolbar--collapsible');
  if (mergedConfig.theme) toolbar.dataset.theme = mergedConfig.theme;

  const visibleActions = getVisibleActions(mergedConfig.actions);
  const maxVisible = mergedConfig.maxVisibleActions ?? visibleActions.length;
  const primaryActions = visibleActions.slice(0, maxVisible);
  const overflowActions = visibleActions.slice(maxVisible);

  primaryActions.forEach((action) => {
    const el = renderToolbarAction(action, options);
    if (el) toolbar.appendChild(el);
  });

  if (overflowActions.length > 0 && mergedConfig.overflowBehavior === 'dropdown') {
    const overflowAction: ToolbarAction = {
      id: '__overflow__',
      type: 'dropdown',
      label: 'More',
      icon: 'more',
      tooltip: 'More actions',
      children: overflowActions,
    };
    const overflowEl = renderToolbarAction(overflowAction, options);
    if (overflowEl) toolbar.appendChild(overflowEl);
  }

  if (options.container) {
    options.container.appendChild(toolbar);
  }

  const update = (newOptions: Partial<ToolbarRenderOptions>) => {
    const merged = { ...options, ...newOptions };
    toolbar.innerHTML = '';
    const updatedVisible = getVisibleActions(mergedConfig.actions);
    updatedVisible.forEach((action) => {
      const el = renderToolbarAction(action, merged);
      if (el) toolbar.appendChild(el);
    });
  };

  const destroy = () => {
    toolbar.remove();
  };

  return { element: toolbar, update, destroy };
}
