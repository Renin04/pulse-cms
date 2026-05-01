import {
  createEditorStateAdapter,
  type EditorStateAdapter,
} from "../../editor/src/state/EditorStateAdapter";
import type { Block, BlockData } from "../../core/src/types/block";
import type { EditorStateSnapshot } from "../../editor/src/types";
import type { UseEditorOptions, UseEditorReturn } from "./types";

type ReactLike = {
  useState: <T>(initial: T | (() => T)) => [T, (value: T | ((prev: T) => T)) => void];
  useEffect: (effect: () => (() => void) | void, deps?: unknown[]) => void;
  useRef: <T>(initial: T) => { current: T };
};

function assertReact(react: unknown): asserts react is ReactLike {
  if (
    !react ||
    typeof (react as ReactLike).useState !== "function" ||
    typeof (react as ReactLike).useEffect !== "function" ||
    typeof (react as ReactLike).useRef !== "function"
  ) {
    throw new Error(
      "@pulse/react requires React 18+ as a peer dependency. " +
        "Pass it via createUseEditor(React) or install react.",
    );
  }
}

export function createUseEditor(react: unknown) {
  assertReact(react);
  const { useState, useEffect, useRef } = react;

  return function useEditor<TBlock extends Block<BlockData> = Block<BlockData>>(
    options: UseEditorOptions<TBlock> = {},
  ): UseEditorReturn<TBlock> {
    const adapterRef = useRef<EditorStateAdapter<TBlock> | null>(null);

    if (!adapterRef.current) {
      adapterRef.current = createEditorStateAdapter<TBlock>(options);
    }

    const adapter = adapterRef.current;

    const [snapshot, setSnapshot] = useState<EditorStateSnapshot<TBlock>>(
      () => adapter.getSnapshot(),
    );

    useEffect(() => {
      const unsubscribe = adapter.subscribe((nextSnapshot) => {
        setSnapshot(nextSnapshot);
        if (options.onChange) {
          options.onChange(nextSnapshot);
        }
      });
      return unsubscribe;
    }, []);

    return {
      snapshot,
      insertBlock(block: TBlock, index?: number) {
        adapter.insertBlock(block, index);
      },
      updateBlock(blockId: string, updater: (block: TBlock) => TBlock) {
        adapter.updateBlock(blockId, updater);
      },
      removeBlock(blockId: string) {
        adapter.removeBlock(blockId);
      },
      moveBlock(blockId: string, toIndex: number) {
        adapter.moveBlock(blockId, toIndex);
      },
      setFocus(blockId: string | null) {
        adapter.setFocusedBlock(blockId);
      },
      clearFocus() {
        adapter.setFocusedBlock(null);
      },
      selectBlocks(blockIds: string[]) {
        adapter.selectBlocks(blockIds);
      },
      clearSelection() {
        adapter.clearSelection();
      },
    };
  };
}

export function useEditor<TBlock extends Block<BlockData> = Block<BlockData>>(
  options: UseEditorOptions<TBlock> & { react: unknown },
): UseEditorReturn<TBlock> {
  const { react, ...editorOptions } = options;
  return createUseEditor(react)(editorOptions as UseEditorOptions<TBlock>);
}
