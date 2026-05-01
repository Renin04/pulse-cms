export interface ProgressTrackingConfig {
  enabled?: boolean;
  throttleMs?: number;
  milestones?: number[];
  precision?: number;
}

export interface ResolvedProgressTrackingConfig {
  enabled: boolean;
  throttleMs: number;
  milestones: number[];
  precision: number;
}

export interface ProgressViewportSnapshot {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
  timestampMs: number;
}

export interface ProgressSignalState {
  progress: number;
  lastEmittedMs: number;
  reachedMilestones: number[];
}

export type ProgressSignalType = "update" | "milestone";

export interface ProgressSignal {
  type: ProgressSignalType;
  progress: number;
  timestampMs: number;
  milestone?: number;
  direction?: "forward" | "backward";
}

export interface ProgressSignalResult {
  state: ProgressSignalState;
  signals: ProgressSignal[];
}

export const DEFAULT_PROGRESS_TRACKING_CONFIG: ResolvedProgressTrackingConfig = {
  enabled: true,
  throttleMs: 120,
  milestones: [0.25, 0.5, 0.75, 1],
  precision: 3,
};

function clamp(value: number, min: number, max: number): number {
  const numeric = Number.isFinite(value) ? value : min;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return numeric;
}

function normalizeInteger(value: number | undefined, fallback: number): number {
  const normalized = Math.floor(Number.isFinite(value) ? (value as number) : fallback);
  if (normalized < 0) return 0;
  return normalized;
}

function normalizeMilestones(values: number[] | undefined): number[] {
  const source = values && values.length > 0 ? values : DEFAULT_PROGRESS_TRACKING_CONFIG.milestones;

  return Array.from(
    new Set(source.map((value) => clamp(value, 0, 1)).filter((value) => value > 0)),
  ).sort((left, right) => left - right);
}

export function resolveProgressTrackingConfig(
  config: ProgressTrackingConfig = {},
): ResolvedProgressTrackingConfig {
  return {
    enabled: config.enabled ?? DEFAULT_PROGRESS_TRACKING_CONFIG.enabled,
    throttleMs: normalizeInteger(
      config.throttleMs,
      DEFAULT_PROGRESS_TRACKING_CONFIG.throttleMs,
    ),
    milestones: normalizeMilestones(config.milestones),
    precision: clamp(
      config.precision ?? DEFAULT_PROGRESS_TRACKING_CONFIG.precision,
      0,
      6,
    ),
  };
}

export function computeDocumentProgress(
  snapshot: Omit<ProgressViewportSnapshot, "timestampMs">,
): number {
  if (snapshot.documentHeight <= 0 || snapshot.viewportHeight <= 0) return 0;

  const maxScrollable = Math.max(0, snapshot.documentHeight - snapshot.viewportHeight);
  if (maxScrollable === 0) return 1;

  return clamp(snapshot.scrollY / maxScrollable, 0, 1);
}

function roundProgress(progress: number, precision: number): number {
  return Number(progress.toFixed(precision));
}

export function createProgressSignalState(initialProgress = 0): ProgressSignalState {
  return {
    progress: clamp(initialProgress, 0, 1),
    lastEmittedMs: -1,
    reachedMilestones: [],
  };
}

function shouldEmitUpdate(
  state: ProgressSignalState,
  snapshot: ProgressViewportSnapshot,
  resolved: ResolvedProgressTrackingConfig,
): boolean {
  if (state.lastEmittedMs < 0) return true;
  if (snapshot.timestampMs - state.lastEmittedMs >= resolved.throttleMs) return true;
  return false;
}

function refreshReachedMilestones(
  existing: number[],
  currentProgress: number,
): number[] {
  return existing.filter((milestone) => milestone <= currentProgress);
}

export function collectProgressSignals(
  state: ProgressSignalState,
  snapshot: ProgressViewportSnapshot,
  config: ProgressTrackingConfig = {},
): ProgressSignalResult {
  const resolved = resolveProgressTrackingConfig(config);
  if (!resolved.enabled) {
    return {
      state,
      signals: [],
    };
  }

  const rawProgress = computeDocumentProgress(snapshot);
  const progress = roundProgress(rawProgress, resolved.precision);
  const direction: "forward" | "backward" =
    progress >= state.progress ? "forward" : "backward";

  const signals: ProgressSignal[] = [];
  const reachedMilestones = refreshReachedMilestones(
    state.reachedMilestones,
    progress,
  );

  if (shouldEmitUpdate(state, snapshot, resolved)) {
    signals.push({
      type: "update",
      progress,
      timestampMs: snapshot.timestampMs,
      direction,
    });
  }

  for (const milestone of resolved.milestones) {
    if (progress < milestone) continue;
    if (reachedMilestones.includes(milestone)) continue;

    reachedMilestones.push(milestone);
    signals.push({
      type: "milestone",
      milestone,
      progress,
      timestampMs: snapshot.timestampMs,
      direction,
    });
  }

  reachedMilestones.sort((left, right) => left - right);

  const nextState: ProgressSignalState = {
    progress,
    lastEmittedMs:
      signals.length > 0 ? snapshot.timestampMs : state.lastEmittedMs,
    reachedMilestones,
  };

  return {
    state: nextState,
    signals,
  };
}

export function runProgressSignalTimeline(
  snapshots: ProgressViewportSnapshot[],
  config: ProgressTrackingConfig = {},
): ProgressSignal[] {
  let state = createProgressSignalState();
  const events: ProgressSignal[] = [];

  for (const snapshot of snapshots) {
    const result = collectProgressSignals(state, snapshot, config);
    state = result.state;
    events.push(...result.signals);
  }

  return events;
}
