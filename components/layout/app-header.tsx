"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Brightness2OutlinedIcon from "@mui/icons-material/Brightness2Outlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/layout/current-user-provider";
import { getCurrentUserDisplay } from "@/lib/current-user";
import type { SxProps, Theme } from "@mui/material/styles";

const THEME_STORAGE_KEY = "theme";
const DATE_FORMATTER = new Intl.DateTimeFormat("et-EE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("et-EE", {
  hour: "2-digit",
  minute: "2-digit",
});

function getInitialDarkMode() {
  if (globalThis.window === undefined) {
    return false;
  }

  const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme !== null) {
    return storedTheme === "dark";
  }

  return globalThis.document.documentElement.classList.contains("dark");
}

function useCurrentMinute() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

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

  return currentDateTime;
}

function useDarkModeState() {
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

  return { isDarkMode, setIsDarkMode };
}

function getFormattedDateTime(currentDateTime: Date | null) {
  return {
    currentDate: currentDateTime
      ? DATE_FORMATTER.format(currentDateTime)
      : "--.--.----",
    currentTime: currentDateTime
      ? TIME_FORMATTER.format(currentDateTime)
      : "--:--",
  };
}

function getUserText(
  status: ReturnType<typeof useCurrentUser>["status"],
  user: ReturnType<typeof useCurrentUser>["user"],
  errorMessage: string | null,
) {
  if (status === "loading") {
    return {
      userNameText: "Laen kasutajat...",
      userRoleText: "Andmeid laaditakse",
    };
  }

  if (status === "error") {
    return {
      userNameText: "Kasutaja laadimata",
      userRoleText: errorMessage ?? "Andmeid ei saanud laadida",
    };
  }

  const userDisplay = user ? getCurrentUserDisplay(user) : null;

  return {
    userNameText: userDisplay?.displayName ?? "",
    userRoleText: userDisplay?.displayRole ?? "",
  };
}

function getUserMenuPaperSx(isDarkMode: boolean): SxProps<Theme> {
  return {
    mt: 2,
    translate: "6px 0",
    overflow: "visible",
    color: isDarkMode ? "rgb(226 232 240)" : "rgb(51 65 85)",
    backgroundColor: isDarkMode
      ? "rgba(15, 23, 42, 0.96)"
      : "rgba(255, 255, 255, 0.95)",
    border: "1px solid",
    borderColor: isDarkMode ? "rgb(51 65 85)" : "rgb(226 232 240)",
    boxShadow: isDarkMode
      ? "0 10px 28px rgba(2, 6, 23, 0.45)"
      : "0 8px 24px rgba(15, 23, 42, 0.12)",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 20,
      width: 14,
      height: 14,
      backgroundColor: "inherit",
      borderTop: "1px solid",
      borderLeft: "1px solid",
      borderColor: isDarkMode ? "rgb(51 65 85)" : "rgb(226 232 240)",
      transform: "translateY(-55%) rotate(45deg)",
      zIndex: 0,
    },
  };
}

function getUserMenuItemSx(isDarkMode: boolean): SxProps<Theme> {
  return {
    color: isDarkMode ? "rgb(226 232 240)" : "rgb(51 65 85)",
    "&:hover": {
      backgroundColor: isDarkMode ? "rgb(30 41 59)" : "rgb(241 245 249)",
    },
  };
}

function getUserMenuIconSx(isDarkMode: boolean): SxProps<Theme> {
  return {
    color: isDarkMode ? "rgb(148 163 184)" : "rgb(100 116 139)",
  };
}

function getUserMenuDividerSx(isDarkMode: boolean): SxProps<Theme> {
  return {
    borderColor: isDarkMode
      ? "rgba(51, 65, 85, 0.8)"
      : "rgba(226, 232, 240, 0.8)",
  };
}

export function AppHeader() {
  const router = useRouter();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const { errorMessage, status, user } = useCurrentUser();
  const currentDateTime = useCurrentMinute();
  const { isDarkMode, setIsDarkMode } = useDarkModeState();
  const isMenuOpen = Boolean(menuAnchorEl);
  const { currentDate, currentTime } = getFormattedDateTime(currentDateTime);
  const { userNameText, userRoleText } = getUserText(
    status,
    user,
    errorMessage,
  );
  const userMenuPaperSx = getUserMenuPaperSx(isDarkMode);
  const userMenuItemSx = getUserMenuItemSx(isDarkMode);
  const userMenuIconSx = getUserMenuIconSx(isDarkMode);
  const userMenuDividerSx = getUserMenuDividerSx(isDarkMode);

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
                {userNameText}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {userRoleText}
              </span>
            </div>

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              <AccountCircleIcon className="text-[32px]" />
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
            className: "w-[190px] rounded-2xl backdrop-blur-sm",
            sx: userMenuPaperSx,
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
          className="mx-1 my-1 rounded-xl"
          sx={userMenuItemSx}
        >
          <ListItemIcon sx={userMenuIconSx}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider sx={userMenuDividerSx} />
        <MenuItem
          onClick={handleLogout}
          className="mx-1 my-1 rounded-xl"
          sx={userMenuItemSx}
        >
          <ListItemIcon sx={userMenuIconSx}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logi välja</ListItemText>
        </MenuItem>
      </Menu>
    </header>
  );
}
