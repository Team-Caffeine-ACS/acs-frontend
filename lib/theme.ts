export const THEME_STORAGE_KEY = "theme";
const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEME_CHANGE_EVENT = "theme-change";

export function resolveDarkModePreference() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark") {
    return true;
  }

  if (storedTheme === "light") {
    return false;
  }

  return window.matchMedia(DARK_THEME_MEDIA_QUERY).matches;
}

export function subscribeToThemePreference(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQueryList = window.matchMedia(DARK_THEME_MEDIA_QUERY);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) {
      onChange();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  mediaQueryList.addEventListener("change", onChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    mediaQueryList.removeEventListener("change", onChange);
  };
}

export function setThemePreference(isDarkMode: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getThemeInitializationScript() {
  return `(function(){try{var storageKey=${JSON.stringify(THEME_STORAGE_KEY)};var storedTheme=window.localStorage.getItem(storageKey);var isDarkMode=storedTheme==="dark"||(storedTheme===null&&window.matchMedia(${JSON.stringify(DARK_THEME_MEDIA_QUERY)}).matches);var root=document.documentElement;root.classList.toggle("dark",isDarkMode);root.style.colorScheme=isDarkMode?"dark":"light";}catch(error){}})();`;
}
