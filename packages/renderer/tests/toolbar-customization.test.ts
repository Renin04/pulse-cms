// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import {
  validateToolbarAction,
  validateToolbarConfig,
  mergeToolbarConfigs,
  getActionById,
  getVisibleActions,
  getEnabledActions,
  createToolbarConfig,
  cloneToolbarAction,
  cloneToolbarConfig,
  DEFAULT_TOOLBAR_CONFIG,
  BUILTIN_ACTIONS,
  DEFAULT_EDITOR_ACTIONS,
  type ToolbarAction,
  type ToolbarConfig,
} from '../src/ui/toolbarConfig';
import {
  renderToolbarAction,
  renderToolbar,
} from '../src/ui/toolbarRenderer';

describe('ToolbarConfig', () => {
  describe('validateToolbarAction', () => {
    it('should pass for valid button action', () => {
      const action: ToolbarAction = { id: 'bold', type: 'button', label: 'Bold' };
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when id is missing', () => {
      const action = { type: 'button', label: 'Bold' } as unknown as ToolbarAction;
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action must have an id');
    });

    it('should fail when type is missing', () => {
      const action = { id: 'bold', label: 'Bold' } as unknown as ToolbarAction;
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action must have a type');
    });

    it('should warn for dropdown with no children', () => {
      const action: ToolbarAction = { id: 'heading', type: 'dropdown', label: 'Heading' };
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail for custom action without customRender', () => {
      const action: ToolbarAction = { id: 'custom', type: 'custom', label: 'Custom' };
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('customRender'))).toBe(true);
    });

    it('should pass for custom action with customRender', () => {
      const action: ToolbarAction = {
        id: 'custom',
        type: 'custom',
        label: 'Custom',
        customRender: () => document.createElement('div'),
      };
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(true);
    });

    it('should validate children recursively', () => {
      const action: ToolbarAction = {
        id: 'group',
        type: 'group',
        children: [
          { id: '', type: 'button', label: 'Bad child' },
        ],
      };
      const result = validateToolbarAction(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateToolbarConfig', () => {
    it('should pass for valid config', () => {
      const config: ToolbarConfig = {
        actions: [
          { id: 'bold', type: 'button', label: 'Bold' },
          { id: 'italic', type: 'button', label: 'Italic' },
        ],
      };
      const result = validateToolbarConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should fail when actions is missing', () => {
      const config = {} as ToolbarConfig;
      const result = validateToolbarConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should warn for duplicate action ids', () => {
      const config: ToolbarConfig = {
        actions: [
          { id: 'bold', type: 'button' },
          { id: 'bold', type: 'button' },
        ],
      };
      const result = validateToolbarConfig(config);
      expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true);
    });

    it('should fail for invalid maxVisibleActions', () => {
      const config: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button' }],
        maxVisibleActions: 0,
      };
      const result = validateToolbarConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('mergeToolbarConfigs', () => {
    it('should merge configs with override taking precedence', () => {
      const base: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button' }],
        position: 'top',
        sticky: false,
      };
      const override: Partial<ToolbarConfig> = {
        position: 'bottom',
        sticky: true,
      };
      const merged = mergeToolbarConfigs(base, override);
      expect(merged.position).toBe('bottom');
      expect(merged.sticky).toBe(true);
      expect(merged.actions).toEqual(base.actions);
    });

    it('should use override actions when provided', () => {
      const base: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button' }],
      };
      const override: Partial<ToolbarConfig> = {
        actions: [{ id: 'italic', type: 'button' }],
      };
      const merged = mergeToolbarConfigs(base, override);
      expect(merged.actions).toEqual(override.actions);
    });
  });

  describe('getActionById', () => {
    it('should find top-level action', () => {
      const config: ToolbarConfig = {
        actions: [
          { id: 'bold', type: 'button' },
          { id: 'italic', type: 'button' },
        ],
      };
      const action = getActionById(config, 'italic');
      expect(action?.id).toBe('italic');
    });

    it('should find nested action in children', () => {
      const config: ToolbarConfig = {
        actions: [
          {
            id: 'heading',
            type: 'dropdown',
            children: [
              { id: 'h1', type: 'button', label: 'H1' },
              { id: 'h2', type: 'button', label: 'H2' },
            ],
          },
        ],
      };
      const action = getActionById(config, 'h2');
      expect(action?.id).toBe('h2');
    });

    it('should return undefined for missing action', () => {
      const config: ToolbarConfig = { actions: [] };
      expect(getActionById(config, 'missing')).toBeUndefined();
    });
  });

  describe('getVisibleActions', () => {
    it('should filter out hidden actions', () => {
      const actions: ToolbarAction[] = [
        { id: 'bold', type: 'button' },
        { id: 'hidden', type: 'button', hidden: true },
        { id: 'italic', type: 'button' },
      ];
      const visible = getVisibleActions(actions);
      expect(visible).toHaveLength(2);
      expect(visible.map((a) => a.id)).not.toContain('hidden');
    });
  });

  describe('getEnabledActions', () => {
    it('should filter out disabled actions', () => {
      const actions: ToolbarAction[] = [
        { id: 'bold', type: 'button' },
        { id: 'disabled', type: 'button', disabled: true },
      ];
      const enabled = getEnabledActions(actions);
      expect(enabled).toHaveLength(1);
      expect(enabled[0].id).toBe('bold');
    });
  });

  describe('createToolbarConfig', () => {
    it('should create config from action ids', () => {
      const config = createToolbarConfig(['bold', 'italic']);
      expect(config.actions).toHaveLength(2);
      expect(config.actions[0].id).toBe('bold');
      expect(config.actions[1].id).toBe('italic');
    });

    it('should skip unknown action ids', () => {
      const config = createToolbarConfig(['bold', 'nonexistent']);
      expect(config.actions).toHaveLength(1);
    });

    it('should apply options', () => {
      const config = createToolbarConfig(['bold'], { position: 'bottom', sticky: true });
      expect(config.position).toBe('bottom');
      expect(config.sticky).toBe(true);
    });
  });

  describe('cloneToolbarAction', () => {
    it('should deep clone action', () => {
      const action: ToolbarAction = {
        id: 'heading',
        type: 'dropdown',
        children: [{ id: 'h1', type: 'button' }],
        metadata: { key: 'value' },
      };
      const clone = cloneToolbarAction(action);
      expect(clone).toEqual(action);
      expect(clone).not.toBe(action);
      expect(clone.children).not.toBe(action.children);
      expect(clone.metadata).not.toBe(action.metadata);
    });
  });

  describe('cloneToolbarConfig', () => {
    it('should deep clone config', () => {
      const config: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button' }],
        position: 'top',
      };
      const clone = cloneToolbarConfig(config);
      expect(clone).toEqual(config);
      expect(clone).not.toBe(config);
      expect(clone.actions).not.toBe(config.actions);
    });
  });

  describe('BUILTIN_ACTIONS', () => {
    it('should have expected built-in actions', () => {
      expect(BUILTIN_ACTIONS.bold).toBeDefined();
      expect(BUILTIN_ACTIONS.italic).toBeDefined();
      expect(BUILTIN_ACTIONS.undo).toBeDefined();
      expect(BUILTIN_ACTIONS.redo).toBeDefined();
      expect(BUILTIN_ACTIONS.separator).toBeDefined();
    });

    it('should have heading dropdown with children', () => {
      expect(BUILTIN_ACTIONS.heading.type).toBe('dropdown');
      expect(BUILTIN_ACTIONS.heading.children?.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_EDITOR_ACTIONS', () => {
    it('should be a non-empty array', () => {
      expect(DEFAULT_EDITOR_ACTIONS.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_TOOLBAR_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_TOOLBAR_CONFIG.position).toBe('top');
      expect(DEFAULT_TOOLBAR_CONFIG.sticky).toBe(false);
      expect(DEFAULT_TOOLBAR_CONFIG.overflowBehavior).toBe('dropdown');
    });
  });
});

describe('ToolbarRenderer', () => {
  describe('renderToolbarAction', () => {
    it('should render button action', () => {
      const action: ToolbarAction = { id: 'bold', type: 'button', label: 'Bold', tooltip: 'Bold text' };
      const el = renderToolbarAction(action);
      expect(el).not.toBeNull();
      expect(el?.tagName).toBe('BUTTON');
      expect(el?.classList.contains('pulse-toolbar__action--button')).toBe(true);
      expect(el?.getAttribute('aria-label')).toBe('Bold');
      expect(el?.getAttribute('title')).toBe('Bold text');
    });

    it('should render toggle action with aria-pressed', () => {
      const action: ToolbarAction = { id: 'bold', type: 'toggle', label: 'Bold' };
      const el = renderToolbarAction(action, { activeActions: new Set(['bold']) });
      expect(el?.getAttribute('aria-pressed')).toBe('true');
      expect(el?.classList.contains('pulse-toolbar__action--toggle')).toBe(true);
    });

    it('should render separator', () => {
      const action: ToolbarAction = { id: 'sep', type: 'separator' };
      const el = renderToolbarAction(action);
      expect(el?.getAttribute('role')).toBe('separator');
      expect(el?.classList.contains('pulse-toolbar__separator')).toBe(true);
    });

    it('should render dropdown with menu', () => {
      const action: ToolbarAction = {
        id: 'heading',
        type: 'dropdown',
        label: 'Heading',
        children: [
          { id: 'h1', type: 'button', label: 'H1' },
          { id: 'h2', type: 'button', label: 'H2' },
        ],
      };
      const el = renderToolbarAction(action);
      expect(el?.classList.contains('pulse-toolbar__dropdown')).toBe(true);
      const menu = el?.querySelector('[role="menu"]');
      expect(menu).not.toBeNull();
      expect(menu?.children.length).toBe(2);
    });

    it('should render group with children', () => {
      const action: ToolbarAction = {
        id: 'format',
        type: 'group',
        label: 'Format',
        children: [
          { id: 'bold', type: 'button', label: 'Bold' },
          { id: 'italic', type: 'button', label: 'Italic' },
        ],
      };
      const el = renderToolbarAction(action);
      expect(el?.getAttribute('role')).toBe('group');
      expect(el?.children.length).toBe(2);
    });

    it('should render custom action', () => {
      const customEl = document.createElement('span');
      customEl.textContent = 'Custom';
      const action: ToolbarAction = {
        id: 'custom',
        type: 'custom',
        customRender: () => customEl,
      };
      const el = renderToolbarAction(action);
      expect(el?.classList.contains('pulse-toolbar__action--custom')).toBe(true);
    });

    it('should render fallback for custom action with failing customRender', () => {
      const action: ToolbarAction = {
        id: 'broken',
        type: 'custom',
        label: 'Broken',
        customRender: () => { throw new Error('fail'); },
      };
      const el = renderToolbarAction(action);
      expect(el?.classList.contains('pulse-toolbar__action--fallback')).toBe(true);
    });

    it('should return null for hidden action', () => {
      const action: ToolbarAction = { id: 'hidden', type: 'button', hidden: true };
      const el = renderToolbarAction(action);
      expect(el).toBeNull();
    });

    it('should disable button when disabled', () => {
      const action: ToolbarAction = { id: 'bold', type: 'button', label: 'Bold', disabled: true };
      const el = renderToolbarAction(action) as HTMLButtonElement;
      expect(el.disabled).toBe(true);
    });

    it('should call onAction callback on click', () => {
      const onAction = vi.fn();
      const action: ToolbarAction = { id: 'bold', type: 'button', label: 'Bold' };
      const el = renderToolbarAction(action, { onAction }) as HTMLButtonElement;
      el.click();
      expect(onAction).toHaveBeenCalledWith('bold', action);
    });

    it('should not call onAction when disabled', () => {
      const onAction = vi.fn();
      const action: ToolbarAction = { id: 'bold', type: 'button', label: 'Bold', disabled: true };
      const el = renderToolbarAction(action, { onAction }) as HTMLButtonElement;
      el.click();
      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('renderToolbar', () => {
    it('should render toolbar element with correct role', () => {
      const config: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button', label: 'Bold' }],
      };
      const { element } = renderToolbar(config);
      expect(element.getAttribute('role')).toBe('toolbar');
      expect(element.classList.contains('pulse-toolbar')).toBe(true);
    });

    it('should apply position class', () => {
      const config: ToolbarConfig = { actions: [], position: 'bottom' };
      const { element } = renderToolbar(config);
      expect(element.classList.contains('pulse-toolbar--bottom')).toBe(true);
    });

    it('should apply sticky class when sticky is true', () => {
      const config: ToolbarConfig = { actions: [], sticky: true };
      const { element } = renderToolbar(config);
      expect(element.classList.contains('pulse-toolbar--sticky')).toBe(true);
    });

    it('should render all visible actions', () => {
      const config: ToolbarConfig = {
        actions: [
          { id: 'bold', type: 'button', label: 'Bold' },
          { id: 'italic', type: 'button', label: 'Italic' },
          { id: 'hidden', type: 'button', label: 'Hidden', hidden: true },
        ],
      };
      const { element } = renderToolbar(config);
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('should overflow extra actions into dropdown', () => {
      const config: ToolbarConfig = {
        actions: [
          { id: 'a1', type: 'button', label: 'A1' },
          { id: 'a2', type: 'button', label: 'A2' },
          { id: 'a3', type: 'button', label: 'A3' },
        ],
        maxVisibleActions: 2,
        overflowBehavior: 'dropdown',
      };
      const { element } = renderToolbar(config);
      const overflow = element.querySelector('.pulse-toolbar__dropdown');
      expect(overflow).not.toBeNull();
    });

    it('should append to container when provided', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const config: ToolbarConfig = { actions: [] };
      renderToolbar(config, { container });
      expect(container.querySelector('.pulse-toolbar')).not.toBeNull();
      document.body.removeChild(container);
    });

    it('should destroy toolbar on destroy()', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const config: ToolbarConfig = { actions: [] };
      const { destroy } = renderToolbar(config, { container });
      destroy();
      expect(container.querySelector('.pulse-toolbar')).toBeNull();
      document.body.removeChild(container);
    });

    it('should update toolbar on update()', () => {
      const config: ToolbarConfig = {
        actions: [{ id: 'bold', type: 'button', label: 'Bold' }],
      };
      const { element, update } = renderToolbar(config);
      update({ activeActions: new Set(['bold']) });
      expect(element.children.length).toBeGreaterThan(0);
    });
  });
});
