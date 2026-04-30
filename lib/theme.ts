export const THEME_STORAGE_KEY = "theme";
const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEME_CHANGE_EVENT = "theme-change";

export function resolveDarkModePreference() {
  if (globalThis.window === undefined) {
    return false;
  }

  const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark") {
    return true;
  }

  if (storedTheme === "light") {
    return false;
  }

  return globalThis.window.matchMedia(DARK_THEME_MEDIA_QUERY).matches;
}

export function subscribeToThemePreference(onChange: () => void) {
  if (globalThis.window === undefined) {
    return () => undefined;
  }

  const mediaQueryList = globalThis.window.matchMedia(DARK_THEME_MEDIA_QUERY);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) {
      onChange();
    }
  };

  globalThis.window.addEventListener("storage", handleStorageChange);
  globalThis.window.addEventListener(THEME_CHANGE_EVENT, onChange);
  mediaQueryList.addEventListener("change", onChange);

  return () => {
    globalThis.window.removeEventListener("storage", handleStorageChange);
    globalThis.window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    mediaQueryList.removeEventListener("change", onChange);
  };
}

export function setThemePreference(isDarkMode: boolean) {
  if (globalThis.window === undefined) {
    return;
  }

  globalThis.localStorage.setItem(
    THEME_STORAGE_KEY,
    isDarkMode ? "dark" : "light",
  );
  globalThis.window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getThemeInitializationScript() {
  return `(function(){try{var storageKey=${JSON.stringify(THEME_STORAGE_KEY)};var storedTheme=window.localStorage.getItem(storageKey);var isDarkMode=storedTheme==="dark"||(storedTheme===null&&window.matchMedia(${JSON.stringify(DARK_THEME_MEDIA_QUERY)}).matches);var root=document.documentElement;root.classList.toggle("dark",isDarkMode);root.style.colorScheme=isDarkMode?"dark":"light";}catch(error){}})();`;
}
