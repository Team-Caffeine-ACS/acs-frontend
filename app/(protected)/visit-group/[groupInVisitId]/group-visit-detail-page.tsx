"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import {
  cancelGroupVisit,
  deriveMemberStatus,
  getGroupVisit,
  getMemberStatusPresentation,
  type GroupMemberResponse,
  type GroupVisitResponse,
} from "@/lib/api/visitGroups";
import { registerVisitDeparture } from "@/lib/api/visits";
import { getCurrentUserRoleInfo } from "@/lib/session";
import { cn } from "@/lib/utils";

interface GroupVisitDetailPageProps {
  readonly groupInVisitId: string;
}

const CANCEL_ROLES = new Set(["ADMIN", "SECURITY_CHIEF"]);
const EXIT_ROLES = new Set(["ADMIN", "SECURITY_CHIEF", "RECEPTIONIST"]);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string | null): string {
  if (!name) return "KV";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }: { status: string | null }) {
  const key = deriveMemberStatus(status);
  const { label, className } = getMemberStatusPresentation(key);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold",
        className,
      )}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        <span className="text-slate-300 dark:text-slate-600">{icon}</span>
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-black tracking-tight",
          accent ?? "text-slate-900 dark:text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MemberRow({
  member,
  canExit,
  onExitClick,
  isExiting,
}: {
  member: GroupMemberResponse;
  canExit: boolean;
  onExitClick: (visitId: string) => void;
  isExiting: boolean;
}) {
  const statusKey = deriveMemberStatus(member.status);
  const showExitButton =
    canExit && (statusKey === "pre_registered" || statusKey === "active");

  return (
    <tr className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500">
            {getInitials(member.fullName)}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {member.fullName ?? "—"}
            </p>
            {member.email && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {member.email}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {member.personalIdCode ?? "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={member.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {formatDateTime(member.arrivalTime)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {formatDateTime(member.exitTime)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Link
            href={`/visits/${member.visitId}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ava
          </Link>
          {showExitButton && (
            <button
              type="button"
              disabled={isExiting}
              onClick={() => onExitClick(member.visitId)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <LogoutIcon className="!text-sm" />
              Registreeri lahkumine
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function GroupVisitDetailPage({
  groupInVisitId,
}: GroupVisitDetailPageProps) {
  const [group, setGroup] = useState<GroupVisitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [exitingVisitId, setExitingVisitId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const roleInfo = getCurrentUserRoleInfo();
  const canCancel =
    roleInfo.hasRoleInfo && roleInfo.roles.some((r) => CANCEL_ROLES.has(r));
  const canExit =
    !roleInfo.hasRoleInfo || roleInfo.roles.some((r) => EXIT_ROLES.has(r));

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getGroupVisit(groupInVisitId, controller.signal)
      .then((data) => {
        setGroup(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          getErrorMessage(err, "Grupp külastuse laadimine ebaõnnestus."),
        );
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [groupInVisitId]);

  async function reload() {
    setIsLoading(true);
    try {
      const data = await getGroupVisit(groupInVisitId);
      setGroup(data);
    } catch (err) {
      setError(getErrorMessage(err, "Värskendamine ebaõnnestus."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExitMember(visitId: string) {
    setExitingVisitId(visitId);
    setActionError(null);
    setActionMessage(null);

    try {
      await registerVisitDeparture(visitId);
      setActionMessage("Lahkumine registreeriti edukalt.");
      await reload();
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Lahkumise registreerimine ebaõnnestus."),
      );
    } finally {
      setExitingVisitId(null);
    }
  }

  async function handleCancel() {
    if (
      !globalThis.window.confirm(
        "Kas oled kindel, et soovid grupp külastuse tühistada? Ainult ootel liikmed tühistatakse.",
      )
    )
      return;

    setIsCancelling(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await cancelGroupVisit(groupInVisitId);
      setActionMessage("Grupp külastus tühistati edukalt.");
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err, "Tühistamine ebaõnnestus."));
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading && !group) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
        <div className="h-5 w-80 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-10 w-96 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-[400px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
        <Link
          href="/visit-group"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowBackIcon className="!text-lg" />
          Tagasi nimekirja
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30 p-6 text-rose-700 dark:text-rose-300">
          <p className="text-base font-bold">Viga</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl border-rose-200 bg-white font-semibold text-rose-700 hover:bg-rose-100"
            onClick={() => void reload()}
          >
            Proovi uuesti
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Link href="/" className="hover:text-primary transition-colors">
          Pääsla
        </Link>
        <ChevronRightIcon className="!text-sm text-slate-300" />
        <Link
          href="/visit-group"
          className="hover:text-primary transition-colors"
        >
          Grupp külastused
        </Link>
        <ChevronRightIcon className="!text-sm text-slate-300" />
        <span className="text-primary">Grupi andmed</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GroupsOutlinedIcon className="!text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {group?.groupName ?? "Grupp"}
              </h1>
              {group?.groupDescription && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {group.groupDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {canCancel && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/30 shrink-0"
            onClick={() => void handleCancel()}
            disabled={isCancelling}
          >
            <DeleteOutlineIcon className="!text-lg mr-1" />
            {isCancelling ? "Tühistamine..." : "Tühista grupp"}
          </Button>
        )}
      </div>

      {/* Action messages */}
      {actionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {actionError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Liikmeid"
          value={group?.memberCount ?? 0}
          icon={<PersonOutlineOutlinedIcon className="!text-sm" />}
        />
        <StatCard
          label="Hoones"
          value={group?.checkedInCount ?? 0}
          icon={<LoginIcon className="!text-sm" />}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Lahkunud"
          value={group?.departedCount ?? 0}
          icon={<LogoutIcon className="!text-sm" />}
        />
        <StatCard
          label="Hoone"
          value={group?.building ?? "—"}
          icon={<BusinessOutlinedIcon className="!text-sm" />}
        />
      </div>

      {/* Group info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Planeeritud saabumine
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
            {formatDateTime(group?.plannedArrival)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Planeeritud lahkumine
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
            {formatDateTime(group?.plannedExit)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Võõrustaja
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
            {group?.hostName ?? "—"}
          </p>
        </div>
      </div>

      {group?.comment && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Kommentaar
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {group.comment}
          </p>
        </div>
      )}

      {/* Members table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Grupi liikmed
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Nimi
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Isikukood
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Staatus
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Saabumine
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Lahkumine
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Tegevused
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {group?.members.map((member) => (
                <MemberRow
                  key={member.visitId}
                  member={member}
                  canExit={canExit}
                  onExitClick={(visitId) => void handleExitMember(visitId)}
                  isExiting={exitingVisitId === member.visitId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
