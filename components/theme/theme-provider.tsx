"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  THEME_STORAGE_KEY,
  resolveDarkModePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return resolveDarkModePreference();
}

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const root = globalThis.document.documentElement;
    root.classList.toggle("dark", isDarkMode);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
    globalThis.localStorage.setItem(
      THEME_STORAGE_KEY,
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  const value = useMemo(
    () => ({
      isDarkMode,
      setIsDarkMode,
      toggleDarkMode: () => {
        setIsDarkMode((currentValue) => !currentValue);
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
