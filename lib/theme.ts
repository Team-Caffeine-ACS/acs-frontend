export const THEME_STORAGE_KEY = "theme";
const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

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

export function getThemeInitializationScript() {
  return `(function(){try{var storageKey=${JSON.stringify(THEME_STORAGE_KEY)};var storedTheme=window.localStorage.getItem(storageKey);var isDarkMode=storedTheme==="dark"||(storedTheme===null&&window.matchMedia(${JSON.stringify(DARK_THEME_MEDIA_QUERY)}).matches);var root=document.documentElement;root.classList.toggle("dark",isDarkMode);root.style.colorScheme=isDarkMode?"dark":"light";}catch(error){}})();`;
}
