"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  resolveDarkModePreference,
  setThemePreference,
  subscribeToThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isDarkMode = useSyncExternalStore(
    subscribeToThemePreference,
    resolveDarkModePreference,
    () => false,
  );

  useEffect(() => {
    const root = globalThis.document.documentElement;
    root.classList.toggle("dark", isDarkMode);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode: () => {
        setThemePreference(!isDarkMode);
      },
    }),
    [isDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useTheme peab olema kasutusel ThemeProvider sees.");
  }

  return context;
}
