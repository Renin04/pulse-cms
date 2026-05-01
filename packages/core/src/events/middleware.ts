import type {
  EventMiddleware,
  EventPayloadMap,
  PulseEvent,
} from "../types/event";

export type EventLogLevel = "off" | "error" | "warn" | "info" | "debug";

export interface EventLogger {
  error(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}

export interface EventLoggerOptions<
  TEvents extends EventPayloadMap = EventPayloadMap,
> {
  level?: EventLogLevel;
  logger?: EventLogger;
  includePayload?: boolean;
  includeTimestamp?: boolean;
  filter?: <TType extends keyof TEvents & string>(
    event: PulseEvent<TType, TEvents[TType]>,
  ) => boolean;
}

const LEVEL_RANK: Record<Exclude<EventLogLevel, "off">, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

function shouldLog(currentLevel: EventLogLevel, target: Exclude<EventLogLevel, "off">): boolean {
  if (currentLevel === "off") {
    return false;
  }

  return LEVEL_RANK[currentLevel] >= LEVEL_RANK[target];
}

export function createEventLoggerMiddleware<
  TEvents extends EventPayloadMap = EventPayloadMap,
>(
  options: EventLoggerOptions<TEvents> = {},
): EventMiddleware<TEvents> {
  const level = options.level ?? "info";
  const logger = options.logger ?? console;
  const includePayload = options.includePayload ?? level === "debug";
  const includeTimestamp = options.includeTimestamp ?? true;

  if (level === "off") {
    return async (_event, next) => {
      await next();
    };
  }

  return async (event, next) => {
    if (options.filter && !options.filter(event)) {
      await next();
      return;
    }

    const timestampPart = includeTimestamp ? ` @ ${event.timestamp}` : "";
    const payloadMeta = includePayload ? [event.payload] : [];

    if (shouldLog(level, "debug")) {
      logger.debug(`[pulse:event] ${event.type} started${timestampPart}`, ...payloadMeta);
    } else if (shouldLog(level, "info")) {
      logger.info(`[pulse:event] ${event.type} started${timestampPart}`);
    }

    try {
      await next();
      if (shouldLog(level, "info")) {
        logger.info(`[pulse:event] ${event.type} completed${timestampPart}`);
      }
    } catch (error) {
      if (shouldLog(level, "error")) {
        logger.error(`[pulse:event] ${event.type} failed${timestampPart}`, error);
      }

      throw error;
    }
  };
}

export async function runMiddlewareChain<
  TEvents extends EventPayloadMap,
  TType extends keyof TEvents & string,
>(
  middlewares: EventMiddleware<TEvents>[],
  event: PulseEvent<TType, TEvents[TType]>,
  dispatch: () => Promise<void>,
): Promise<void> {
  let index = -1;

  const invoke = async (currentIndex: number): Promise<void> => {
    if (currentIndex <= index) {
      throw new Error("next() called multiple times in middleware chain");
    }

    index = currentIndex;
    const middleware = middlewares[currentIndex];

    if (!middleware) {
      await dispatch();
      return;
    }

    await middleware(event, async () => {
      await invoke(currentIndex + 1);
    });
  };

  await invoke(0);
}
