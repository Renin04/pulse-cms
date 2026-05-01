import type { Block, BlockData } from "../../../core/src/types/block";
import {
  type EditorCommandContext,
  type EditorCommandRegistry,
} from "../commands/CommandRegistry";

export type EditorPlatform = "mac" | "windows" | "linux";

export interface ShortcutKeystroke {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface ShortcutInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface ShortcutBinding<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  combo: string;
  commandId: string;
  description?: string;
  when?: (context: EditorCommandContext<TBlock>) => boolean;
}

export interface ShortcutConflict<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  signature: string;
  bindings: ShortcutBinding<TBlock>[];
}

export interface ShortcutHelpEntry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  combo: string;
  commandId: string;
  description?: string;
  isChord: boolean;
  source: "default" | "custom";
  binding: ShortcutBinding<TBlock>;
}

export interface PendingChordState {
  firstStroke: string;
  waitingFor: string[];
}

export interface ShortcutDispatchResult<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  type: "none" | "executed" | "conflict" | "pending";
  binding?: ShortcutBinding<TBlock>;
  commandId?: string;
  conflicts?: ShortcutConflict<TBlock>[];
  pending?: PendingChordState;
}

export interface ShortcutRegistryOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commandRegistry: EditorCommandRegistry<TBlock>;
  platform?: EditorPlatform;
  bindings?: ShortcutBinding<TBlock>[];
  chordTimeoutMs?: number;
}

interface NormalizedBinding {
  signatures: string[];
  sequenceSignature: string;
  isChord: boolean;
}

interface ActiveChordCandidate {
  bindingId: string;
  remainingSignatures: string[];
}

const DEFAULT_CHORD_TIMEOUT_MS = 1_500;

function normalizeKey(rawKey: string): string {
  const key = rawKey.trim().toLowerCase();
  if (key === "space") {
    return " ";
  }

  return key;
}

function assertKeyPresent(key: string): void {
  if (!key) {
    throw new Error("Shortcut combo must include a non-modifier key");
  }
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

function createSignature(keystroke: ShortcutKeystroke): string {
  return [
    keystroke.key,
    keystroke.ctrlKey ? "ctrl" : "",
    keystroke.metaKey ? "meta" : "",
    keystroke.altKey ? "alt" : "",
    keystroke.shiftKey ? "shift" : "",
  ]
    .filter(Boolean)
    .join("+");
}

function mapModToPlatform(platform: EditorPlatform): "ctrl" | "meta" {
  return platform === "mac" ? "meta" : "ctrl";
}

function isModifierKey(key: string): boolean {
  return key === "shift" || key === "alt" || key === "meta" || key === "ctrl";
}

export function detectEditorPlatform(): EditorPlatform {
  if (typeof navigator !== "undefined") {
    const platformValue = navigator.platform.toLowerCase();
    if (platformValue.includes("mac")) {
      return "mac";
    }

    if (platformValue.includes("win")) {
      return "windows";
    }

    return "linux";
  }

  if (typeof process !== "undefined") {
    if (process.platform === "darwin") {
      return "mac";
    }

    if (process.platform === "win32") {
      return "windows";
    }
  }

  return "linux";
}

export function normalizeShortcutCombo(
  combo: string,
  platform: EditorPlatform,
): ShortcutKeystroke {
  const tokens = combo.split("+").map(normalizeToken).filter(Boolean);

  let key = "";
  let ctrlKey = false;
  let metaKey = false;
  let altKey = false;
  let shiftKey = false;

  for (const token of tokens) {
    if (token === "mod") {
      if (mapModToPlatform(platform) === "meta") {
        metaKey = true;
      } else {
        ctrlKey = true;
      }
      continue;
    }

    if (token === "cmd" || token === "command" || token === "meta") {
      metaKey = true;
      continue;
    }

    if (token === "ctrl" || token === "control") {
      ctrlKey = true;
      continue;
    }

    if (token === "alt" || token === "option") {
      altKey = true;
      continue;
    }

    if (token === "shift") {
      shiftKey = true;
      continue;
    }

    if (key) {
      throw new Error(`Shortcut combo "${combo}" includes multiple primary keys`);
    }

    key = normalizeKey(token);
  }

  assertKeyPresent(key);

  return {
    key,
    ctrlKey,
    metaKey,
    altKey,
    shiftKey,
  };
}

function normalizeShortcutSequence(combo: string, platform: EditorPlatform): NormalizedBinding {
  const rawParts = combo
    .split(/\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  if (rawParts.length === 0) {
    throw new Error("Shortcut combo is empty");
  }

  const signatures = rawParts.map((part) =>
    createSignature(normalizeShortcutCombo(part, platform)),
  );

  return {
    signatures,
    sequenceSignature: signatures.join(" then "),
    isChord: signatures.length > 1,
  };
}

export function normalizeShortcutInput(input: ShortcutInput): ShortcutKeystroke {
  const key = normalizeKey(input.key);
  if (!key || isModifierKey(key)) {
    throw new Error("Shortcut input must include a non-modifier key");
  }

  return {
    key,
    ctrlKey: Boolean(input.ctrlKey),
    metaKey: Boolean(input.metaKey),
    altKey: Boolean(input.altKey),
    shiftKey: Boolean(input.shiftKey),
  };
}

export class ShortcutRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly platform: EditorPlatform;
  private readonly chordTimeoutMs: number;
  private readonly bindingsById = new Map<string, ShortcutBinding<TBlock>>();
  private readonly normalizedByBindingId = new Map<string, NormalizedBinding>();

  private readonly bindingIdsByFirstSignature = new Map<string, string[]>();
  private readonly bindingIdsBySequenceSignature = new Map<string, string[]>();

  private activeChord:
    | {
        startedAt: number;
        firstStroke: string;
        candidates: ActiveChordCandidate[];
      }
    | null = null;

  constructor(options: ShortcutRegistryOptions<TBlock>) {
    this.commandRegistry = options.commandRegistry;
    this.platform = options.platform ?? detectEditorPlatform();
    this.chordTimeoutMs = options.chordTimeoutMs ?? DEFAULT_CHORD_TIMEOUT_MS;

    for (const binding of options.bindings ?? []) {
      this.register(binding);
    }
  }

  getPlatform(): EditorPlatform {
    return this.platform;
  }

  register(binding: ShortcutBinding<TBlock>): void {
    if (!binding.id.trim()) {
      throw new Error("Shortcut binding id is required");
    }

    if (!this.commandRegistry.has(binding.commandId)) {
      throw new Error(`Shortcut binding references unknown command "${binding.commandId}"`);
    }

    if (this.bindingsById.has(binding.id)) {
      throw new Error(`Shortcut binding with id "${binding.id}" is already registered`);
    }

    const normalized = normalizeShortcutSequence(binding.combo, this.platform);

    this.bindingsById.set(binding.id, binding);
    this.normalizedByBindingId.set(binding.id, normalized);

    const firstSignature = normalized.signatures[0];
    const firstSignatureBindings = this.bindingIdsByFirstSignature.get(firstSignature) ?? [];
    this.bindingIdsByFirstSignature.set(firstSignature, [...firstSignatureBindings, binding.id]);

    const sequenceBindings =
      this.bindingIdsBySequenceSignature.get(normalized.sequenceSignature) ?? [];
    this.bindingIdsBySequenceSignature.set(normalized.sequenceSignature, [
      ...sequenceBindings,
      binding.id,
    ]);
  }

  registerCustomBinding(binding: ShortcutBinding<TBlock>): void {
    this.register(binding);
  }

  unregister(bindingId: string): boolean {
    const binding = this.bindingsById.get(bindingId);
    if (!binding) {
      return false;
    }

    const normalized = this.normalizedByBindingId.get(bindingId);
    if (normalized) {
      const firstSignature = normalized.signatures[0];
      const remainingFirst = (this.bindingIdsByFirstSignature.get(firstSignature) ?? []).filter(
        (candidate) => candidate !== bindingId,
      );

      if (remainingFirst.length === 0) {
        this.bindingIdsByFirstSignature.delete(firstSignature);
      } else {
        this.bindingIdsByFirstSignature.set(firstSignature, remainingFirst);
      }

      const remainingSequence = (
        this.bindingIdsBySequenceSignature.get(normalized.sequenceSignature) ?? []
      ).filter((candidate) => candidate !== bindingId);

      if (remainingSequence.length === 0) {
        this.bindingIdsBySequenceSignature.delete(normalized.sequenceSignature);
      } else {
        this.bindingIdsBySequenceSignature.set(normalized.sequenceSignature, remainingSequence);
      }
    }

    this.normalizedByBindingId.delete(bindingId);
    this.bindingsById.delete(bindingId);
    this.clearPendingChord();
    return true;
  }

  list(): ShortcutBinding<TBlock>[] {
    return [...this.bindingsById.values()];
  }

  getConflicts(): ShortcutConflict<TBlock>[] {
    const conflicts: ShortcutConflict<TBlock>[] = [];

    for (const [sequenceSignature, bindingIds] of this.bindingIdsBySequenceSignature.entries()) {
      if (bindingIds.length < 2) {
        continue;
      }

      conflicts.push({
        signature: sequenceSignature,
        bindings: bindingIds
          .map((bindingId) => this.bindingsById.get(bindingId))
          .filter(Boolean) as ShortcutBinding<TBlock>[],
      });
    }

    return conflicts;
  }

  getShortcutHelp(): ShortcutHelpEntry<TBlock>[] {
    const entries = [...this.bindingsById.values()].map((binding) => {
      const normalized = this.normalizedByBindingId.get(binding.id);
      return {
        id: binding.id,
        combo: binding.combo,
        commandId: binding.commandId,
        description: binding.description,
        isChord: Boolean(normalized?.isChord),
        source: binding.id.startsWith("shortcut.") ? "default" : "custom",
        binding,
      } satisfies ShortcutHelpEntry<TBlock>;
    });

    entries.sort((left, right) => {
      const leftScore = left.source === "default" ? 0 : 1;
      const rightScore = right.source === "default" ? 0 : 1;
      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return left.combo.localeCompare(right.combo);
    });

    return entries;
  }

  getConflictsForInput(input: ShortcutInput): ShortcutConflict<TBlock>[] {
    const signature = createSignature(normalizeShortcutInput(input));
    const bindingIds = this.bindingIdsByFirstSignature.get(signature) ?? [];

    if (bindingIds.length < 2) {
      return [];
    }

    const simpleBindings = bindingIds.filter((bindingId) => {
      const normalized = this.normalizedByBindingId.get(bindingId);
      return normalized?.signatures.length === 1;
    });

    if (simpleBindings.length < 2) {
      return [];
    }

    return [
      {
        signature,
        bindings: simpleBindings
          .map((bindingId) => this.bindingsById.get(bindingId))
          .filter(Boolean) as ShortcutBinding<TBlock>[],
      },
    ];
  }

  async dispatch(
    input: ShortcutInput,
    context: EditorCommandContext<TBlock>,
  ): Promise<ShortcutDispatchResult<TBlock>> {
    const signature = createSignature(normalizeShortcutInput(input));

    const pendingResult = await this.tryDispatchPendingChord(signature, context);
    if (pendingResult) {
      return pendingResult;
    }

    const bindingIds = this.bindingIdsByFirstSignature.get(signature) ?? [];
    if (bindingIds.length === 0) {
      return { type: "none" };
    }

    const simpleBindingIds = bindingIds.filter((bindingId) => {
      const normalized = this.normalizedByBindingId.get(bindingId);
      return normalized?.signatures.length === 1;
    });

    if (simpleBindingIds.length > 1) {
      return {
        type: "conflict",
        conflicts: this.getConflictsForInput(input),
      };
    }

    const simpleBinding =
      simpleBindingIds.length === 1 ? this.bindingsById.get(simpleBindingIds[0]) : undefined;
    if (simpleBinding) {
      if (simpleBinding.when && !simpleBinding.when(context)) {
        return { type: "none" };
      }

      await this.commandRegistry.execute(simpleBinding.commandId, context);
      return {
        type: "executed",
        binding: simpleBinding,
        commandId: simpleBinding.commandId,
      };
    }

    const chordCandidates: ActiveChordCandidate[] = bindingIds
      .map((bindingId) => {
        const normalized = this.normalizedByBindingId.get(bindingId);
        if (!normalized || normalized.signatures.length < 2) {
          return null;
        }

        return {
          bindingId,
          remainingSignatures: normalized.signatures.slice(1),
        };
      })
      .filter(Boolean) as ActiveChordCandidate[];

    if (chordCandidates.length === 0) {
      return { type: "none" };
    }

    this.activeChord = {
      startedAt: Date.now(),
      firstStroke: signature,
      candidates: chordCandidates,
    };

    return {
      type: "pending",
      pending: {
        firstStroke: signature,
        waitingFor: this.collectWaitingSignatures(chordCandidates),
      },
    };
  }

  private clearPendingChord(): void {
    this.activeChord = null;
  }

  private isPendingChordExpired(now: number): boolean {
    if (!this.activeChord) {
      return false;
    }

    return now - this.activeChord.startedAt > this.chordTimeoutMs;
  }

  private async tryDispatchPendingChord(
    signature: string,
    context: EditorCommandContext<TBlock>,
  ): Promise<ShortcutDispatchResult<TBlock> | null> {
    if (!this.activeChord) {
      return null;
    }

    const now = Date.now();
    if (this.isPendingChordExpired(now)) {
      this.clearPendingChord();
      return null;
    }

    const matchingCandidates = this.activeChord.candidates.filter((candidate) => {
      return candidate.remainingSignatures[0] === signature;
    });

    if (matchingCandidates.length === 0) {
      this.clearPendingChord();
      return null;
    }

    const executable = matchingCandidates.filter((candidate) => {
      const binding = this.bindingsById.get(candidate.bindingId);
      if (!binding) {
        return false;
      }

      if (binding.when && !binding.when(context)) {
        return false;
      }

      return true;
    });

    if (executable.length > 1) {
      const bindings = executable
        .map((candidate) => this.bindingsById.get(candidate.bindingId))
        .filter(Boolean) as ShortcutBinding<TBlock>[];

      this.clearPendingChord();
      return {
        type: "conflict",
        conflicts: [
          {
            signature: `${this.activeChord.firstStroke} then ${signature}`,
            bindings,
          },
        ],
      };
    }

    const selected = executable[0];
    if (!selected) {
      this.clearPendingChord();
      return { type: "none" };
    }

    const binding = this.bindingsById.get(selected.bindingId);
    if (!binding) {
      this.clearPendingChord();
      return { type: "none" };
    }

    await this.commandRegistry.execute(binding.commandId, context);
    this.clearPendingChord();

    return {
      type: "executed",
      binding,
      commandId: binding.commandId,
    };
  }

  private collectWaitingSignatures(candidates: ActiveChordCandidate[]): string[] {
    return [...new Set(candidates.map((candidate) => candidate.remainingSignatures[0]))];
  }
}

export function createShortcutRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: ShortcutRegistryOptions<TBlock>,
): ShortcutRegistry<TBlock> {
  return new ShortcutRegistry(options);
}
