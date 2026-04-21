const VISIT_LIST_NAVIGATION_STORAGE_KEY = "acs:visits:list-navigation";
const VISIT_LIST_NAVIGATION_EVENT = "acs:visits:list-navigation-change";

export interface VisitListNavigationState {
  ids: string[];
}

export function saveVisitListNavigation(ids: string[]): void {
  if (globalThis.window === undefined) {
    return;
  }

  const normalizedIds = ids.filter(Boolean);

  try {
    if (normalizedIds.length === 0) {
      globalThis.window.sessionStorage.removeItem(
        VISIT_LIST_NAVIGATION_STORAGE_KEY,
      );
      globalThis.window.dispatchEvent(new Event(VISIT_LIST_NAVIGATION_EVENT));
      return;
    }

    globalThis.window.sessionStorage.setItem(
      VISIT_LIST_NAVIGATION_STORAGE_KEY,
      JSON.stringify({ ids: normalizedIds } satisfies VisitListNavigationState),
    );
    globalThis.window.dispatchEvent(new Event(VISIT_LIST_NAVIGATION_EVENT));
  } catch {
    // Ignore storage failures and keep navigation optional.
  }
}

export function readVisitListNavigation(): VisitListNavigationState | null {
  const rawValue = readVisitListNavigationSnapshot();

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("ids" in parsed) ||
      !Array.isArray(parsed.ids)
    ) {
      return null;
    }

    return {
      ids: parsed.ids.filter(
        (value: unknown): value is string => typeof value === "string",
      ),
    };
  } catch {
    return null;
  }
}

export function readVisitListNavigationSnapshot(): string | null {
  if (globalThis.window === undefined) {
    return null;
  }

  try {
    return globalThis.window.sessionStorage.getItem(
      VISIT_LIST_NAVIGATION_STORAGE_KEY,
    );
  } catch {
    return null;
  }
}

export function subscribeToVisitListNavigation(
  onStoreChange: () => void,
): () => void {
  if (globalThis.window === undefined) {
    return () => undefined;
  }

  globalThis.window.addEventListener(
    VISIT_LIST_NAVIGATION_EVENT,
    onStoreChange,
  );
  globalThis.window.addEventListener("storage", onStoreChange);

  return () => {
    globalThis.window.removeEventListener(
      VISIT_LIST_NAVIGATION_EVENT,
      onStoreChange,
    );
    globalThis.window.removeEventListener("storage", onStoreChange);
  };
}
