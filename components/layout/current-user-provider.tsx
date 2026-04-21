"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, type MeResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/apiClient";

type CurrentUserStatus = "loading" | "ready" | "error";

interface CurrentUserContextValue {
  errorMessage: string | null;
  refresh: () => Promise<void>;
  status: CurrentUserStatus;
  user: MeResponse | null;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<CurrentUserStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCurrentUser = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const currentUser = await getMe();
      setUser(currentUser);
      setStatus("ready");
    } catch (error) {
      setUser(null);
      setStatus("error");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Kasutaja andmete laadimine ebaõnnestus.",
      );
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function initializeCurrentUser() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const currentUser = await getMe();
        if (!isActive) {
          return;
        }

        setUser(currentUser);
        setStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setUser(null);
        setStatus("error");
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Kasutaja andmete laadimine ebaõnnestus.",
        );
      }
    }

    void initializeCurrentUser();

    return () => {
      isActive = false;
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      errorMessage,
      refresh: loadCurrentUser,
      status,
      user,
    }),
    [errorMessage, loadCurrentUser, status, user],
  );

  return (
    <CurrentUserContext.Provider value={contextValue}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (context === null) {
    throw new Error(
      "useCurrentUser peab olema kasutusel CurrentUserProvider sees.",
    );
  }

  return context;
}
