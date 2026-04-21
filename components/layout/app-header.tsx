"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Brightness2OutlinedIcon from "@mui/icons-material/Brightness2Outlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Input } from "@/components/ui/input";

const THEME_STORAGE_KEY = "theme";

export function AppHeader() {
  const router = useRouter();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (globalThis.window === undefined) {
      return false;
    }

    const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme !== null) {
      return storedTheme === "dark";
    }

    return globalThis.document.documentElement.classList.contains("dark");
  });
  const isMenuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    let intervalId: ReturnType<typeof globalThis.setInterval> | undefined;

    const updateDateTime = () => {
      setCurrentDateTime(new Date());
    };

    updateDateTime();

    const now = new Date();
    const millisecondsUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeoutId = globalThis.setTimeout(() => {
      updateDateTime();
      intervalId = globalThis.setInterval(updateDateTime, 60_000);
    }, millisecondsUntilNextMinute);

    return () => {
      globalThis.clearTimeout(timeoutId);

      if (intervalId) {
        globalThis.clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    const root = globalThis.document.documentElement;

    root.classList.toggle("dark", isDarkMode);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
    globalThis.localStorage.setItem(
      THEME_STORAGE_KEY,
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  const currentDate = currentDateTime
    ? new Intl.DateTimeFormat("et-EE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(currentDateTime)
    : "--.--.----";

  const currentTime = currentDateTime
    ? new Intl.DateTimeFormat("et-EE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(currentDateTime)
    : "--:--";

  function handleOpenUserMenu(event: React.MouseEvent<HTMLButtonElement>) {
    setMenuAnchorEl(event.currentTarget);
  }

  function handleCloseUserMenu() {
    setMenuAnchorEl(null);
  }

  function handleToggleTheme() {
    setIsDarkMode((currentValue) => !currentValue);
  }

  function handleLogout() {
    handleCloseUserMenu();
    globalThis.localStorage.removeItem("token");
    globalThis.document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <header className="z-10 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center text-primary">
          <div className="flex size-10 items-center justify-center rounded-xl">
            <VerifiedUserIcon className="text-[22px]" color="primary" />
          </div>
          <h2 className="whitespace-nowrap text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            Pääsla infosüsteem
          </h2>
        </Link>

        <div className="relative flex w-64 items-center">
          <SearchIcon className="absolute left-3 text-[18px] text-slate-400" />
          <Input
            className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary dark:bg-slate-800"
            placeholder="Otsi külalist või kaarti..."
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6 dark:border-slate-700">
          <div className="flex items-center gap-2 rounded-lg bg-[#1152d4] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-[#1152d4]/20">
            <ScheduleIcon className="text-sm" />
            <span>{currentTime}</span>
            <span className="text-white/60">|</span>
            <span>{currentDate}</span>
          </div>

          <button
            className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            aria-label="Ava teavitused"
            title="Ava teavitused"
            type="button"
          >
            <NotificationsIcon className="text-[20px]" />
          </button>

          <button
            className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            aria-label={isDarkMode ? "Lülita hele teema" : "Lülita tume teema"}
            title={isDarkMode ? "Lülita hele teema" : "Lülita tume teema"}
            type="button"
            onClick={handleToggleTheme}
          >
            {isDarkMode ? (
              <LightModeOutlinedIcon className="text-[20px]" />
            ) : (
              <Brightness2OutlinedIcon className="text-[20px]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenUserMenu}
            aria-label="Ava kasutajamenüü"
            aria-controls={isMenuOpen ? "user-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            className="flex items-center gap-3 border-l border-slate-200 pl-6 text-left dark:border-slate-700"
          >
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Mari Maasikas
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Administraator
              </span>
            </div>

            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-200 dark:border-slate-700">
              <Image
                alt="User Profile"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>

      <Menu
        id="user-menu"
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleCloseUserMenu}
        transitionDuration={0}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            className:
              "mt-2 min-w-[230px] rounded-xl border border-slate-200 shadow-lg",
          },
          transition: {
            timeout: 0,
          },
        }}
      >
        <MenuItem
          component={Link}
          href="/settings"
          onClick={handleCloseUserMenu}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logi välja</ListItemText>
        </MenuItem>
      </Menu>
    </header>
  );
}
