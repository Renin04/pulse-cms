export type ToolbarActionType =
  | 'button'
  | 'toggle'
  | 'dropdown'
  | 'separator'
  | 'group'
  | 'custom';

export interface ToolbarAction {
  id: string;
  type: ToolbarActionType;
  label?: string;
  icon?: string;
  tooltip?: string;
  disabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  children?: ToolbarAction[];
  customRender?: (action: ToolbarAction) => HTMLElement;
  metadata?: Record<string, unknown>;
}

export interface ToolbarConfig {
  actions: ToolbarAction[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  sticky?: boolean;
  collapsible?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  maxVisibleActions?: number;
  overflowBehavior?: 'dropdown' | 'scroll' | 'wrap';
}

export interface ToolbarValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default toolbar configuration
 */
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  actions: [],
  position: 'top',
  sticky: false,
  collapsible: false,
  theme: 'auto',
  maxVisibleActions: 10,
  overflowBehavior: 'dropdown',
};

/**
 * Built-in toolbar actions
 */
export const BUILTIN_ACTIONS: Record<string, ToolbarAction> = {
  undo: {
    id: 'undo',
    type: 'button',
    label: 'Undo',
    icon: 'undo',
    tooltip: 'Undo last action (Ctrl+Z)',
  },
  redo: {
    id: 'redo',
    type: 'button',
    label: 'Redo',
    icon: 'redo',
    tooltip: 'Redo last action (Ctrl+Y)',
  },
  bold: {
    id: 'bold',
    type: 'toggle',
    label: 'Bold',
    icon: 'bold',
    tooltip: 'Bold text (Ctrl+B)',
  },
  italic: {
    id: 'italic',
    type: 'toggle',
    label: 'Italic',
    icon: 'italic',
    tooltip: 'Italic text (Ctrl+I)',
  },
  underline: {
    id: 'underline',
    type: 'toggle',
    label: 'Underline',
    icon: 'underline',
    tooltip: 'Underline text (Ctrl+U)',
  },
  link: {
    id: 'link',
    type: 'button',
    label: 'Link',
    icon: 'link',
    tooltip: 'Insert link (Ctrl+K)',
  },
  image: {
    id: 'image',
    type: 'button',
    label: 'Image',
    icon: 'image',
    tooltip: 'Insert image',
  },
  heading: {
    id: 'heading',
    type: 'dropdown',
    label: 'Heading',
    icon: 'heading',
    tooltip: 'Insert heading',
    children: [
      { id: 'h1', type: 'button', label: 'Heading 1' },
      { id: 'h2', type: 'button', label: 'Heading 2' },
      { id: 'h3', type: 'button', label: 'Heading 3' },
    ],
  },
  separator: {
    id: 'separator',
    type: 'separator',
  },
};

/**
 * Default toolbar actions for common use cases
 */
export const DEFAULT_EDITOR_ACTIONS: ToolbarAction[] = [
  BUILTIN_ACTIONS.undo,
  BUILTIN_ACTIONS.redo,
  BUILTIN_ACTIONS.separator,
  BUILTIN_ACTIONS.bold,
  BUILTIN_ACTIONS.italic,
  BUILTIN_ACTIONS.underline,
  BUILTIN_ACTIONS.separator,
  BUILTIN_ACTIONS.link,
  BUILTIN_ACTIONS.image,
  BUILTIN_ACTIONS.heading,
];

/**
 * Validate toolbar action
 */
export function validateToolbarAction(action: ToolbarAction): ToolbarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!action.id) {
    errors.push('Action must have an id');
  }

  if (!action.type) {
    errors.push('Action must have a type');
  }

  if (action.type === 'dropdown' && (!action.children || action.children.length === 0)) {
    warnings.push(`Dropdown action "${action.id}" has no children`);
  }

  if (action.type === 'group' && (!action.children || action.children.length === 0)) {
    warnings.push(`Group action "${action.id}" has no children`);
  }

  if (action.type === 'custom' && !action.customRender) {
    errors.push(`Custom action "${action.id}" must have customRender function`);
  }

  if (action.children) {
    action.children.forEach((child, index) => {
      const childResult = validateToolbarAction(child);
      errors.push(...childResult.errors.map((e) => `Child ${index}: ${e}`));
      warnings.push(...childResult.warnings.map((w) => `Child ${index}: ${w}`));
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate toolbar configuration
 */
export function validateToolbarConfig(config: ToolbarConfig): ToolbarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.actions || !Array.isArray(config.actions)) {
    errors.push('Config must have actions array');
    return { valid: false, errors, warnings };
  }

  const actionIds = new Set<string>();
  config.actions.forEach((action, index) => {
    const result = validateToolbarAction(action);
    errors.push(...result.errors.map((e) => `Action ${index}: ${e}`));
    warnings.push(...result.warnings.map((w) => `Action ${index}: ${w}`));

    if (actionIds.has(action.id)) {
      warnings.push(`Duplicate action id: "${action.id}"`);
    }
    actionIds.add(action.id);
  });

  if (config.maxVisibleActions !== undefined && config.maxVisibleActions < 1) {
    errors.push('maxVisibleActions must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Merge toolbar configurations
 */
export function mergeToolbarConfigs(
  base: ToolbarConfig,
  override: Partial<ToolbarConfig>
): ToolbarConfig {
  return {
    ...base,
    ...override,
    actions: override.actions ?? base.actions,
  };
}

/**
 * Get action by id from config
 */
export function getActionById(
  config: ToolbarConfig,
  actionId: string
): ToolbarAction | undefined {
  const findAction = (actions: ToolbarAction[]): ToolbarAction | undefined => {
    for (const action of actions) {
      if (action.id === actionId) return action;
      if (action.children) {
        const found = findAction(action.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  return findAction(config.actions);
}

/**
 * Filter visible actions
 */
export function getVisibleActions(actions: ToolbarAction[]): ToolbarAction[] {
  return actions.filter((action) => !action.hidden);
}

/**
 * Filter enabled actions
 */
export function getEnabledActions(actions: ToolbarAction[]): ToolbarAction[] {
  return actions.filter((action) => !action.disabled);
}

/**
 * Create toolbar config from action ids
 */
export function createToolbarConfig(
  actionIds: string[],
  options?: Partial<ToolbarConfig>
): ToolbarConfig {
  const actions = actionIds
    .map((id) => BUILTIN_ACTIONS[id])
    .filter((action): action is ToolbarAction => action !== undefined);

  return mergeToolbarConfigs(DEFAULT_TOOLBAR_CONFIG, {
    ...options,
    actions,
  });
}

/**
 * Clone toolbar action (deep copy)
 */
export function cloneToolbarAction(action: ToolbarAction): ToolbarAction {
  return {
    ...action,
    children: action.children?.map(cloneToolbarAction),
    metadata: action.metadata ? { ...action.metadata } : undefined,
  };
}

/**
 * Clone toolbar config (deep copy)
 */
export function cloneToolbarConfig(config: ToolbarConfig): ToolbarConfig {
  return {
    ...config,
    actions: config.actions.map(cloneToolbarAction),
  };
}
