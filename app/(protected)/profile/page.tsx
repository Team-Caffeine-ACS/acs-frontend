"use client";

import { useState } from "react";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import WorkIcon from "@mui/icons-material/Work";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import ShieldIcon from "@mui/icons-material/Shield";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useCurrentUser } from "@/components/layout/current-user-provider";
import { updateMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/apiClient";
import { getCurrentUserDisplay } from "@/lib/current-user";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

function validatePassword(password: string, confirm: string): string | null {
  if (password.length < 8)
    return "Parool peab olema vähemalt 8 tähemärki pikk.";
  if (!/[A-Z]/.test(password))
    return "Parool peab sisaldama vähemalt ühte suurtähte.";
  if (!/[a-z]/.test(password))
    return "Parool peab sisaldama vähemalt ühte väiketähte.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Parool peab sisaldama vähemalt ühte erimärki.";
  if (password !== confirm) return "Paroolid ei kattu.";
  return null;
}

export default function ProfilePage() {
  const { errorMessage, status, user: me } = useCurrentUser();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!newEmail && !newPassword) {
      setSaveError("Sisesta uus e-post ja/või uus parool.");
      return;
    }

    if (newPassword) {
      const passwordError = validatePassword(newPassword, confirmPassword);
      if (passwordError) {
        setSaveError(passwordError);
        return;
      }
    }

    const body: { email?: string; password?: string } = {};
    if (newEmail) body.email = newEmail;
    if (newPassword) body.password = newPassword;

    setIsSaving(true);
    try {
      await updateMe(body);
      if (newEmail) {
        // Token is now stale after email change — clear session and re-login.
        clearStoredAccessToken();
        await logout().catch(() => {});
        globalThis.window.location.href = "/login";
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Salvestamine ebaõnnestus. Proovi uuesti.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "error") {
    return (
      <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        {errorMessage ?? "Kasutaja andmete laadimine ebaõnnestus."}
      </p>
    );
  }

  if (status === "loading" || !me) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-pulse">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="h-16 rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const { person } = me;
  const { displayName, displayRole, roleLabel } = getCurrentUserDisplay(me);
  const initials = person
    ? `${person.givenName[0]}${person.surname[0]}`.toUpperCase()
    : me.email[0].toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-xl">
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {displayName}
          </h2>
          <p className="text-sm text-slate-500">{displayRole}</p>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <Row icon={<EmailIcon />} label="E-post" value={me.email} />
        <Row icon={<ShieldIcon />} label="Roll" value={roleLabel} />
        {person ? (
          <>
            <Row
              icon={<BadgeIcon />}
              label="Eesnimi"
              value={person.givenName}
            />
            <Row
              icon={<BadgeIcon />}
              label="Perekonnanimi"
              value={person.surname}
            />
            <Row
              icon={<FingerprintIcon />}
              label="Isikukood"
              value={person.socialSecurityNumber}
            />
            <Row
              icon={<WorkIcon />}
              label="Ametinimetus"
              value={person.jobTitle}
            />
            <Row
              icon={<AccountTreeIcon />}
              label="Osakond"
              value={person.department}
            />
            <Row
              icon={<BusinessIcon />}
              label="Organisatsioon"
              value={person.organization}
            />
          </>
        ) : (
          <div className="px-6 py-4 text-sm text-slate-400">
            Isikuandmed puuduvad — kasutajaga ei ole seotud isikukirjet.
          </div>
        )}
      </div>

      {/* Change email / password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <LockOutlinedIcon className="text-blue-700 !text-xl" />
          Muuda e-posti või parooli
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="new-email"
              className="block text-sm font-medium text-slate-700"
            >
              Uus e-post
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={me.email}
              maxLength={255}
              className={inputCls}
            />
            {newEmail && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Ettevaatust! E-posti vahetamisel logitakse teid automaatselt
                välja ja te peate uue e-posti aadressiga uuesti sisse logima.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-slate-700"
            >
              Uus parool{" "}
              <span className="text-xs font-normal text-slate-400">
                (vähemalt 1 väike täht, 1 suur täht, 1 erisümbol, vähemalt 8
                sümbolit)
              </span>
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Sisesta uus parool"
              className={inputCls}
            />
          </div>

          {newPassword && (
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-700"
              >
                Korda parooli
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Korda uut parooli"
                className={inputCls}
              />
            </div>
          )}

          {saveError && (
            <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircleIcon className="!text-base" />
              Andmed uuendatud.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {isSaving ? "Salvestan…" : "Salvesta muudatused"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <span className="text-slate-400 shrink-0 [&>svg]:text-[20px]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {value ?? <span className="text-slate-400 font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}
