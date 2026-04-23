"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import {
  deriveVisitStatus,
  getVisits,
  type VisitListItemResponse,
  type VisitStatusKey,
} from "@/lib/api/visits";

type StatusFilter = "all" | "planned" | "in_building" | "departed" | "expired";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Külastuste laadimine ebaõnnestus.";
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Pole saadaval";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadge(status: string | null): {
  label: string;
  className: string;
} {
  const derivedStatus = deriveVisitStatus(status, []);
  const presentations: Record<
    VisitStatusKey,
    { label: string; className: string }
  > = {
    planned: {
      label: "Planeeritud",
      className: "bg-sky-100 text-sky-700",
    },
    in_building: {
      label: "Hoones",
      className: "bg-emerald-100 text-emerald-700",
    },
    departed: {
      label: "Lahkunud",
      className: "bg-slate-100 text-slate-600",
    },
    expired: {
      label: "Aegunud",
      className: "bg-amber-100 text-amber-700",
    },
    cancelled: {
      label: "Tühistatud",
      className: "bg-rose-100 text-rose-700",
    },
    unknown: {
      label: "Staatus puudub",
      className: "bg-slate-100 text-slate-600",
    },
  };

  return presentations[derivedStatus];
}

function getInitials(fullName: string | null): string {
  if (!fullName) {
    return "KV";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitListItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  function startLoading() {
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();

    void getVisits(
      {
        search: search.trim() || undefined,
        status,
      },
      controller.signal,
    )
      .then((items) => {
        setVisits(items);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        setError(getErrorMessage(loadError));
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [search, status, reloadKey]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">
              Pääsla
            </Link>
            <ChevronRightIcon className="!text-sm" />
            <span className="text-primary">Külastused</span>
          </nav>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">
              Külastuste haldus
            </h1>
            <p className="max-w-2xl text-slate-500 font-medium">
              Vaata aktiivseid ja lõpetatud külastusi, otsi külastajat nime või
              dokumendi järgi ning ava detailvaade ühe klõpsuga.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 font-bold text-xs uppercase tracking-widest py-6"
            type="button"
          >
            <FileDownloadIcon className="!text-lg" />
            Ekspordi nimekiri
          </Button>
          <Link href="/visits/new">
            <Button className="gap-2 font-bold text-xs uppercase tracking-widest py-6 px-8 shadow-xl shadow-primary/20 bg-primary">
              <AddIcon className="!text-lg" />
              Lisa külastus
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[320px] relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FilterListIcon className="!text-lg" />
          </div>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                startLoading();
                setSearch(searchInput);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold placeholder:text-slate-300"
            placeholder="Otsi külastaja nime, dokumendi või hosti järgi..."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(event) => {
              startLoading();
              setStatus(event.target.value as StatusFilter);
            }}
            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
          >
            <option value="all">Staatus: kõik</option>
            <option value="planned">Staatus: planeeritud</option>
            <option value="in_building">Staatus: hoones</option>
            <option value="departed">Staatus: lahkunud</option>
            <option value="expired">Staatus: aegunud</option>
          </select>

          <Button
            type="button"
            className="bg-primary hover:bg-primary/90 text-white font-black py-5 px-8 rounded-xl shadow-xl shadow-primary/20 gap-2 uppercase tracking-widest text-xs"
            onClick={() => {
              startLoading();
              setSearch(searchInput);
            }}
          >
            <FilterListIcon className="!text-sm" />
            Teosta otsing
          </Button>

          <button
            type="button"
            className="p-2 text-slate-400 hover:text-primary transition-colors"
            aria-label="Värskenda filtreid"
            title="Värskenda filtreid"
            onClick={() => {
              startLoading();
              setReloadKey((current) => current + 1);
            }}
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-display">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Leitud <span className="text-slate-900">{visits.length}</span>{" "}
            külastust
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Andmeallikas:{" "}
            <span className="text-slate-900">GET /api/visits</span>
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-18 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          </div>
        ) : null}

        {!isLoading && !error && visits.length === 0 ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
              <p className="text-sm font-bold text-slate-900">
                Külastusi ei leitud
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Muuda otsingut või lisa uus külastus.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && visits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <tr>
                  <th className="px-6 py-5">Külastaja</th>
                  <th className="px-6 py-5">Dokument</th>
                  <th className="px-6 py-5">Vastuvõtja</th>
                  <th className="px-6 py-5">Saabumine</th>
                  <th className="px-6 py-5 text-center">Staatus</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visits.map((visit) => {
                  const badge = getStatusBadge(visit.status);

                  return (
                    <tr
                      key={visit.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            {getInitials(visit.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {visit.fullName ?? "Pole saadaval"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter font-mono">
                              {visit.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 tracking-wider">
                        {visit.documentNumber ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">
                          {visit.hostName ?? "Pole saadaval"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        {formatDateTime(visit.entryTime)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/visits/${visit.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/5 rounded-xl"
                            aria-label="Ava külastuse detail"
                          >
                            <VisibilityOutlinedIcon />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
