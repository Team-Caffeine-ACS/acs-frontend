"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShieldIcon from "@mui/icons-material/Shield";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import SecurityIcon from "@mui/icons-material/Security";
import LanguageIcon from "@mui/icons-material/Language";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
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
      const { token } = await login({ email, password });
      document.cookie = `token=${token}; path=/; SameSite=Strict`;
      router.push("/");
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-widest text-sm">
          <ShieldIcon className="text-blue-700 !text-xl" />
          Pääsla infosüsteem
        </div>
        <nav className="flex items-center gap-6">
          <a
            href="#"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Abi
          </a>
          <a
            href="#"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Kontakt
          </a>
          <button
            aria-label="Vaheta teema"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <DarkModeIcon className="!text-lg" />
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <LanguageIcon className="!text-lg" /> ET
          </button>
        </nav>
      </header>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
          {/* Card top — logo area */}
          <div className="bg-[#e8edf8] flex items-center justify-center py-10">
            <div className="size-16 rounded-full bg-blue-700 flex items-center justify-center shadow-lg">
              <ShieldIcon className="text-white !text-3xl" />
            </div>
          </div>

          {/* Card body */}
          <div className="px-8 py-8 space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Tere tulemast tagasi
              </h1>
              <p className="text-sm text-slate-500">
                Palun logige sisse, et pääseda külastajate haldussüsteemi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">
                  Kasutajatunnus
                </label>
                <div className="relative">
                  <PersonOutlineIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Sisestage kasutajatunnus"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Parool
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Unustasid parooli?
                  </a>
                </div>
                <div className="relative">
                  <LockOutlinedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sisestage parool"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wide"
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
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
              <SecurityIcon className="!text-sm" />
              Turvaline ühendus krüpteeritud andmesidega
            </div>
          </div>
        </div>
      </main>

      {/* Page footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        © 2024 Pääsla infosüsteem. Kõik õigused kaitstud.
      </footer>
    </div>
  );
}
