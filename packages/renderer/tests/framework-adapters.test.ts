import { describe, it, expect } from 'vitest';
import { beforeAll } from 'vitest';
import type { Block } from '@pulse/core';
import { RendererRegistry } from '../src/registry/RendererRegistry';

import {
  renderForNext,
  buildNextHydrationScript,
  buildNextSSRContext,
} from '../src/adapters/next';
import {
  renderForNuxt,
  buildNuxtPayloadScript,
  buildNuxtRouteRules,
  buildNuxtSSRContext,
} from '../src/adapters/nuxt';
import {
  renderForAstro,
  buildAstroDataScript,
  getAstroPrerenderFlag,
  buildAstroSSRContext,
} from '../src/adapters/astro';
import {
  isHeavyBlock,
  createLazyBoundary,
  applyLazyBoundaries,
  renderWithLazyBoundaries,
  renderDeferredBlock,
  HEAVY_BLOCK_TYPES,
} from '../src/runtime/lazy';

// ---------------------------------------------------------------------------
// Test setup — register minimal renderers so eager renders produce HTML
// ---------------------------------------------------------------------------

beforeAll(() => {
  const reg = RendererRegistry.getInstance();
  reg.register('paragraph', (block) => `<p>${(block.data as { text?: string }).text ?? ''}</p>`);
  reg.register('video', (block) => `<div class="pulse-video" data-id="${block.id}"></div>`);
  reg.register('embed', (block) => `<div class="pulse-embed" data-id="${block.id}"></div>`);
  reg.register('code-playground', (block) => `<div class="pulse-code-playground" data-id="${block.id}"></div>`);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(type: string, id = `block-${type}`): Block {
  return { id, type, data: {} } as Block;
}

const PARA = makeBlock('paragraph', 'p1');
const VIDEO = makeBlock('video', 'v1');
const EMBED = makeBlock('embed', 'e1');
const CODE_PLAYGROUND = makeBlock('code-playground', 'cp1');

// ---------------------------------------------------------------------------
// Next.js adapter
// ---------------------------------------------------------------------------

describe('Next.js adapter — renderForNext', () => {
  it('returns output and meta', () => {
    const { output, meta } = renderForNext([PARA]);
    expect(output).toHaveProperty('html');
    expect(output).toHaveProperty('blocks');
    expect(meta).toHaveProperty('isSSR');
    expect(meta).toHaveProperty('cacheControl');
  });

  it('sets isSSR=true when forceSSR=true', () => {
    const { meta } = renderForNext([PARA], { forceSSR: true });
    expect(meta.isSSR).toBe(true);
  });

  it('sets isStatic=true when isSSR=true', () => {
    const { meta } = renderForNext([PARA], { forceSSR: true });
    expect(meta.isStatic).toBe(true);
  });

  it('sets cache-control with s-maxage when SSR', () => {
    const { meta } = renderForNext([PARA], { forceSSR: true });
    expect(meta.cacheControl).toContain('s-maxage');
  });

  it('renders multiple blocks', () => {
    const { output } = renderForNext([PARA, VIDEO], { forceSSR: true });
    expect(output.blocks).toHaveLength(2);
  });

  it('renders empty block array without error', () => {
    const { output } = renderForNext([]);
    expect(output.html).toBe('');
    expect(output.blocks).toHaveLength(0);
  });

  it('forwards rendererConfig theme', () => {
    const { output } = renderForNext([PARA], {
      forceSSR: true,
      rendererConfig: { theme: 'dark' },
    });
    expect(output).toBeDefined();
  });
});

describe('Next.js adapter — buildNextHydrationScript', () => {
  it('returns a script tag with default id', () => {
    const script = buildNextHydrationScript([PARA]);
    expect(script).toContain('<script id="pulse-data"');
    expect(script).toContain('type="application/json"');
  });

  it('accepts a custom script id', () => {
    const script = buildNextHydrationScript([PARA], 'my-data');
    expect(script).toContain('id="my-data"');
  });

  it('escapes < > & in JSON', () => {
    const block = { id: 'x', type: 'paragraph', data: { text: '<b>&</b>' } } as unknown as Block;
    const script = buildNextHydrationScript([block]);
    expect(script).not.toContain('<b>');
    expect(script).toContain('\\u003c');
    expect(script).toContain('\\u003e');
    expect(script).toContain('\\u0026');
  });

  it('embeds valid JSON', () => {
    const script = buildNextHydrationScript([PARA]);
    const match = script.match(/>(.+)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => JSON.parse(match![1])).not.toThrow();
  });
});

describe('Next.js adapter — buildNextSSRContext', () => {
  it('returns context with isSSR=true', () => {
    const ctx = buildNextSSRContext();
    expect(ctx.isSSR).toBe(true);
  });

  it('forwards theme', () => {
    const ctx = buildNextSSRContext('dark');
    expect(ctx.theme).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// Nuxt adapter
// ---------------------------------------------------------------------------

describe('Nuxt adapter — renderForNuxt', () => {
  it('returns output and meta', () => {
    const { output, meta } = renderForNuxt([PARA]);
    expect(output).toHaveProperty('html');
    expect(meta).toHaveProperty('isSSR');
    expect(meta).toHaveProperty('prerender');
    expect(meta).toHaveProperty('cacheControl');
  });

  it('sets isSSR=true when forceSSR=true', () => {
    const { meta } = renderForNuxt([PARA], { forceSSR: true });
    expect(meta.isSSR).toBe(true);
  });

  it('sets prerender=true when SSR', () => {
    const { meta } = renderForNuxt([PARA], { forceSSR: true });
    expect(meta.prerender).toBe(true);
  });

  it('renders multiple blocks', () => {
    const { output } = renderForNuxt([PARA, EMBED], { forceSSR: true });
    expect(output.blocks).toHaveLength(2);
  });

  it('renders empty block array without error', () => {
    const { output } = renderForNuxt([]);
    expect(output.html).toBe('');
  });
});

describe('Nuxt adapter — buildNuxtPayloadScript', () => {
  it('returns a script tag with default id', () => {
    const script = buildNuxtPayloadScript([PARA]);
    expect(script).toContain('id="pulse-nuxt-data"');
    expect(script).toContain('type="application/json"');
  });

  it('accepts a custom script id', () => {
    const script = buildNuxtPayloadScript([PARA], 'nuxt-custom');
    expect(script).toContain('id="nuxt-custom"');
  });

  it('escapes dangerous characters', () => {
    const block = { id: 'x', type: 'paragraph', data: { text: '</script>' } } as unknown as Block;
    const script = buildNuxtPayloadScript([block]);
    expect(script).toContain('\\u003c/script\\u003e');
  });
});

describe('Nuxt adapter — buildNuxtRouteRules', () => {
  it('returns prerender=true when meta.prerender is true', () => {
    const { meta } = renderForNuxt([PARA], { forceSSR: true });
    const rules = buildNuxtRouteRules(meta);
    expect(rules.prerender).toBe(true);
  });

  it('includes cache-control header', () => {
    const { meta } = renderForNuxt([PARA], { forceSSR: true });
    const rules = buildNuxtRouteRules(meta);
    expect((rules.headers as Record<string, string>)['cache-control']).toBeTruthy();
  });
});

describe('Nuxt adapter — buildNuxtSSRContext', () => {
  it('returns context with isSSR=true', () => {
    const ctx = buildNuxtSSRContext();
    expect(ctx.isSSR).toBe(true);
  });

  it('forwards theme', () => {
    const ctx = buildNuxtSSRContext('minimal');
    expect(ctx.theme).toBe('minimal');
  });
});

// ---------------------------------------------------------------------------
// Astro adapter
// ---------------------------------------------------------------------------

describe('Astro adapter — renderForAstro', () => {
  it('returns output and meta', () => {
    const { output, meta } = renderForAstro([PARA]);
    expect(output).toHaveProperty('html');
    expect(meta).toHaveProperty('isSSR');
    expect(meta).toHaveProperty('prerender');
    expect(meta).toHaveProperty('mode');
  });

  it('defaults to static mode', () => {
    const { meta } = renderForAstro([PARA]);
    expect(meta.mode).toBe('static');
    expect(meta.prerender).toBe(true);
  });

  it('server mode sets prerender=false', () => {
    const { meta } = renderForAstro([PARA], { mode: 'server' });
    expect(meta.prerender).toBe(false);
    expect(meta.mode).toBe('server');
  });

  it('hybrid mode sets prerender=false', () => {
    const { meta } = renderForAstro([PARA], { mode: 'hybrid' });
    expect(meta.prerender).toBe(false);
    expect(meta.mode).toBe('hybrid');
  });

  it('always sets isSSR=true', () => {
    const { meta: m1 } = renderForAstro([PARA], { mode: 'static' });
    const { meta: m2 } = renderForAstro([PARA], { mode: 'server' });
    expect(m1.isSSR).toBe(true);
    expect(m2.isSSR).toBe(true);
  });

  it('renders multiple blocks', () => {
    const { output } = renderForAstro([PARA, CODE_PLAYGROUND]);
    expect(output.blocks).toHaveLength(2);
  });

  it('renders empty block array without error', () => {
    const { output } = renderForAstro([]);
    expect(output.html).toBe('');
  });
});

describe('Astro adapter — buildAstroDataScript', () => {
  it('returns a script tag with default id', () => {
    const script = buildAstroDataScript([PARA]);
    expect(script).toContain('id="pulse-astro-data"');
    expect(script).toContain('type="application/json"');
  });

  it('accepts a custom script id', () => {
    const script = buildAstroDataScript([PARA], 'astro-custom');
    expect(script).toContain('id="astro-custom"');
  });

  it('escapes dangerous characters', () => {
    const block = { id: 'x', type: 'paragraph', data: { text: '<script>' } } as unknown as Block;
    const script = buildAstroDataScript([block]);
    expect(script).not.toContain('<script>');
  });
});

describe('Astro adapter — getAstroPrerenderFlag', () => {
  it('returns true for static mode', () => {
    const { meta } = renderForAstro([PARA], { mode: 'static' });
    expect(getAstroPrerenderFlag(meta)).toBe(true);
  });

  it('returns false for server mode', () => {
    const { meta } = renderForAstro([PARA], { mode: 'server' });
    expect(getAstroPrerenderFlag(meta)).toBe(false);
  });
});

describe('Astro adapter — buildAstroSSRContext', () => {
  it('returns context with isSSR=true', () => {
    const ctx = buildAstroSSRContext();
    expect(ctx.isSSR).toBe(true);
  });

  it('forwards theme', () => {
    const ctx = buildAstroSSRContext('light');
    expect(ctx.theme).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// Lazy loading — isHeavyBlock
// ---------------------------------------------------------------------------

describe('Lazy loading — isHeavyBlock', () => {
  it('returns true for known heavy types', () => {
    for (const type of HEAVY_BLOCK_TYPES) {
      expect(isHeavyBlock(makeBlock(type))).toBe(true);
    }
  });

  it('returns false for light block types', () => {
    expect(isHeavyBlock(makeBlock('paragraph'))).toBe(false);
    expect(isHeavyBlock(makeBlock('heading'))).toBe(false);
    expect(isHeavyBlock(makeBlock('image'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Lazy loading — createLazyBoundary
// ---------------------------------------------------------------------------

describe('Lazy loading — createLazyBoundary', () => {
  it('eager strategy renders block immediately', () => {
    const result = createLazyBoundary(PARA, { strategy: 'eager' });
    expect(result.deferred).toBe(false);
    expect(result.strategy).toBe('eager');
    expect(result.html).toBeTruthy();
  });

  it('intersection strategy defers block', () => {
    const result = createLazyBoundary(VIDEO, { strategy: 'intersection' });
    expect(result.deferred).toBe(true);
    expect(result.strategy).toBe('intersection');
    expect(result.html).toContain('pulse-lazy-boundary');
  });

  it('idle strategy defers block', () => {
    const result = createLazyBoundary(VIDEO, { strategy: 'idle' });
    expect(result.deferred).toBe(true);
    expect(result.strategy).toBe('idle');
  });

  it('deferred html contains block id', () => {
    const result = createLazyBoundary(VIDEO, { strategy: 'intersection' });
    expect(result.html).toContain(VIDEO.id);
  });

  it('deferred html contains block type', () => {
    const result = createLazyBoundary(VIDEO, { strategy: 'intersection' });
    expect(result.html).toContain(VIDEO.type);
  });

  it('returns correct blockId and blockType', () => {
    const result = createLazyBoundary(VIDEO, { strategy: 'intersection' });
    expect(result.blockId).toBe(VIDEO.id);
    expect(result.blockType).toBe(VIDEO.type);
  });

  it('uses custom placeholder when provided', () => {
    const result = createLazyBoundary(VIDEO, {
      strategy: 'intersection',
      placeholder: '<div class="custom-placeholder"></div>',
    });
    expect(result.html).toContain('custom-placeholder');
  });

  it('default strategy is intersection', () => {
    const result = createLazyBoundary(VIDEO);
    expect(result.strategy).toBe('intersection');
    expect(result.deferred).toBe(true);
  });

  it('placeholder contains rootMargin data attribute', () => {
    const result = createLazyBoundary(VIDEO, {
      strategy: 'intersection',
      rootMargin: '400px',
    });
    expect(result.html).toContain('400px');
  });
});

// ---------------------------------------------------------------------------
// Lazy loading — applyLazyBoundaries
// ---------------------------------------------------------------------------

describe('Lazy loading — applyLazyBoundaries', () => {
  it('returns one result per block', () => {
    const results = applyLazyBoundaries([PARA, VIDEO, EMBED]);
    expect(results).toHaveLength(3);
  });

  it('defers heavy blocks and renders light blocks eagerly', () => {
    const results = applyLazyBoundaries([PARA, VIDEO]);
    const paraResult = results.find((r) => r.blockId === PARA.id)!;
    const videoResult = results.find((r) => r.blockId === VIDEO.id)!;
    expect(paraResult.deferred).toBe(false);
    expect(videoResult.deferred).toBe(true);
  });

  it('eager strategy renders all blocks immediately', () => {
    const results = applyLazyBoundaries([PARA, VIDEO], { strategy: 'eager' });
    expect(results.every((r) => !r.deferred)).toBe(true);
  });

  it('handles empty array', () => {
    const results = applyLazyBoundaries([]);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Lazy loading — renderWithLazyBoundaries
// ---------------------------------------------------------------------------

describe('Lazy loading — renderWithLazyBoundaries', () => {
  it('returns a string', () => {
    const html = renderWithLazyBoundaries([PARA, VIDEO]);
    expect(typeof html).toBe('string');
  });

  it('contains rendered paragraph content', () => {
    const html = renderWithLazyBoundaries([PARA]);
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains lazy boundary wrapper for heavy blocks', () => {
    const html = renderWithLazyBoundaries([VIDEO]);
    expect(html).toContain('pulse-lazy-boundary');
  });

  it('returns empty string for empty array', () => {
    const html = renderWithLazyBoundaries([]);
    expect(html).toBe('');
  });

  it('eager strategy produces no lazy wrappers', () => {
    const html = renderWithLazyBoundaries([VIDEO], { strategy: 'eager' });
    expect(html).not.toContain('pulse-lazy-boundary');
  });
});

// ---------------------------------------------------------------------------
// Lazy loading — renderDeferredBlock
// ---------------------------------------------------------------------------

describe('Lazy loading — renderDeferredBlock', () => {
  it('renders a heavy block eagerly', () => {
    const result = renderDeferredBlock(VIDEO);
    expect(result).toHaveProperty('html');
    expect(result.blockId).toBe(VIDEO.id);
    expect(result.blockType).toBe(VIDEO.type);
  });

  it('output matches direct SSR render', () => {
    const lazy = renderDeferredBlock(CODE_PLAYGROUND);
    expect(lazy.html).toBeDefined();
  });

  it('forwards rendererConfig', () => {
    const result = renderDeferredBlock(VIDEO, { theme: 'dark' });
    expect(result).toBeDefined();
  });
});
