export interface SlashTriggerRange {
  start: number;
  end: number;
}

export interface SlashTriggerMatch {
  trigger: "/" | "\\";
  query: string;
  range: SlashTriggerRange;
  text: string;
}

function isTriggerBoundary(character: string | undefined): boolean {
  if (!character) {
    return true;
  }

  return /[\s([{}\])\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(character);
}

function stripBidiControlChars(value: string): string {
  return value.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "");
}

export function parseSlashTrigger(
  text: string,
  cursorOffset: number = text.length,
): SlashTriggerMatch | null {
  if (!Number.isInteger(cursorOffset) || cursorOffset < 0 || cursorOffset > text.length) {
    throw new Error("Cursor offset is out of bounds for slash trigger parsing");
  }

  const beforeCursor = text.slice(0, cursorOffset);
  for (let triggerIndex = beforeCursor.length - 1; triggerIndex >= 0; triggerIndex -= 1) {
    const trigger = beforeCursor[triggerIndex];
    if (trigger !== "/" && trigger !== "\\") {
      continue;
    }

    const charBeforeTrigger = triggerIndex > 0 ? beforeCursor[triggerIndex - 1] : undefined;
    if (!isTriggerBoundary(charBeforeTrigger)) {
      continue;
    }

    const query = stripBidiControlChars(beforeCursor.slice(triggerIndex + 1));
    if (query.includes("\n") || query.includes("\r") || query.includes("\t")) {
      return null;
    }

    return {
      trigger,
      query,
      range: {
        start: triggerIndex,
        end: cursorOffset,
      },
      text,
    };
  }

  return null;
}

export function replaceSlashTrigger(
  text: string,
  match: SlashTriggerMatch,
  replacementText: string = "",
): string {
  return `${text.slice(0, match.range.start)}${replacementText}${text.slice(match.range.end)}`;
}
