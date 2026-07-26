import { describe, expect, it } from 'vitest';
import {
  orderSelection,
  pruneSelection,
  rangeSelection,
  toggleSelection,
} from './studio-block-selection';

const IDS = ['a', 'b', 'c', 'd', 'e'];

describe('rangeSelection', () => {
  it('returns the inclusive forward range in document order', () => {
    expect(rangeSelection(IDS, 'b', 'd')).toEqual(['b', 'c', 'd']);
  });

  it('normalizes a backward shift-click to document order', () => {
    expect(rangeSelection(IDS, 'd', 'b')).toEqual(['b', 'c', 'd']);
  });

  it('selects a single block when anchor and target match', () => {
    expect(rangeSelection(IDS, 'c', 'c')).toEqual(['c']);
  });

  it('falls back to the target when there is no anchor yet', () => {
    expect(rangeSelection(IDS, null, 'c')).toEqual(['c']);
  });

  it('falls back to the target when the anchor is no longer in the document', () => {
    expect(rangeSelection(IDS, 'zzz', 'c')).toEqual(['c']);
  });

  it('returns an empty list when the target is not in the document', () => {
    expect(rangeSelection(IDS, 'a', 'zzz')).toEqual([]);
  });

  it('handles first/last edges', () => {
    expect(rangeSelection(IDS, 'a', 'e')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(rangeSelection(IDS, 'e', 'a')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('toggleSelection', () => {
  it('appends an unselected id', () => {
    expect(toggleSelection(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes an already-selected id', () => {
    expect(toggleSelection(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('does not mutate the input', () => {
    const input = ['a', 'b'];
    toggleSelection(input, 'c');
    toggleSelection(input, 'a');
    expect(input).toEqual(['a', 'b']);
  });
});

describe('pruneSelection', () => {
  it('drops ids that disappeared from the document', () => {
    expect(pruneSelection(['a', 'x', 'c'], IDS)).toEqual(['a', 'c']);
  });

  it('keeps the selection content when everything still exists', () => {
    expect(pruneSelection(['b', 'd'], IDS)).toEqual(['b', 'd']);
  });

  it('handles an empty selection', () => {
    expect(pruneSelection([], IDS)).toEqual([]);
  });
});

describe('orderSelection', () => {
  it('returns selected ids in document order, not click order', () => {
    expect(orderSelection(IDS, new Set(['d', 'b']))).toEqual(['b', 'd']);
  });

  it('ignores ids that are not in the document', () => {
    expect(orderSelection(IDS, new Set(['zzz', 'c']))).toEqual(['c']);
  });

  it('returns an empty list for an empty set', () => {
    expect(orderSelection(IDS, new Set())).toEqual([]);
  });
});
