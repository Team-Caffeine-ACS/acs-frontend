"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import SecurityIcon from "@mui/icons-material/Security";
import LanguageIcon from "@mui/icons-material/Language";
import Brightness2OutlinedIcon from "@mui/icons-material/Brightness2Outlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useTheme } from "@/components/theme/theme-provider";
import { setStoredAccessToken } from "@/lib/auth/accessToken";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";

export default function LoginPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { accessToken } = await login({ email, password });
      setStoredAccessToken(accessToken);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Vale e-post või parool."
          : "Sisselogimine ebaõnnestus. Proovi uuesti.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 transition-colors dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center text-primary">
            <div className="flex size-10 items-center justify-center rounded-xl">
              <VerifiedUserIcon className="text-[22px]" color="primary" />
            </div>
            <h2 className="whitespace-nowrap text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Pääsla infosüsteem
            </h2>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <a
            href="https://github.com/Team-Caffeine-ACS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Github repository
          </a>

          <button
            type="button"
            aria-label="Vaheta teema"
            title={isDarkMode ? "Lülita hele teema" : "Lülita tume teema"}
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isDarkMode ? (
              <LightModeOutlinedIcon className="!text-lg" />
            ) : (
              <Brightness2OutlinedIcon className="!text-lg" />
            )}
          </button>
        </nav>
      </header>

      {/* Card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl transition-colors dark:bg-slate-900 dark:shadow-slate-950/40">
          {/* Card top — logo area */}
          <div className="flex items-center justify-center bg-[#e8edf8] py-10 dark:bg-slate-800">
            <div className="flex size-16 items-center justify-center rounded-full bg-blue-700 shadow-lg shadow-blue-900/20">
              <ShieldIcon className="text-white !text-3xl" />
            </div>
          </div>

          {/* Card body */}
          <div className="space-y-6 px-8 py-8">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Tere tulemast tagasi
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Palun logige sisse, et pääseda külastajate haldussüsteemi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Kasutajatunnus
                </label>
                <div className="relative">
                  <PersonOutlineIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Sisestage kasutajatunnus"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Parool
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Unustasid parooli?
                  </button>
                </div>
                <div className="relative">
                  <LockOutlinedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sisestage parool"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    aria-label={showPassword ? "Peida parool" : "Näita parooli"}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="!text-lg" />
                    ) : (
                      <VisibilityIcon className="!text-lg" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {isLoading ? (
                  "Sisselogimine…"
                ) : (
                  <>
                    Logi sisse <LoginIcon className="!text-base" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-400 dark:text-slate-500">
              <SecurityIcon className="!text-sm" />
              Turvaline ühendus krüpteeritud andmesidega
            </div>
          </div>
        </div>
      </main>

      {/* Page footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        © 2024 Pääsla infosüsteem. Kõik õigused kaitstud.
      </footer>
    </div>
  );
}
