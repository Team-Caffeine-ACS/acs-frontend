"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
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
  type VisitListPage,
  type VisitListItemResponse,
  type VisitStatusKey,
} from "@/lib/api/visits";

type StatusFilter = "all" | "planned" | "in_building" | "departed" | "expired";
type VisitPageMetadata = VisitListPage["page"];

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => globalThis.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

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
      className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    in_building: {
      label: "Hoones",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    departed: {
      label: "Lahkunud",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
    },
    expired: {
      label: "Aegunud",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    cancelled: {
      label: "Tühistatud",
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
    unknown: {
      label: "Staatus puudub",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
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
  const [pageMeta, setPageMeta] = useState<VisitPageMetadata>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const totalVisits = pageMeta?.totalElements ?? visits.length;
  const totalPages = Math.max(
    1,
    pageMeta?.totalPages ?? Math.ceil(totalVisits / pageSize),
  );
  const visiblePageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleRangeStart =
    totalVisits === 0 ? 0 : visiblePageIndex * pageSize + 1;
  const visibleRangeEnd =
    totalVisits === 0
      ? 0
      : Math.min(visiblePageIndex * pageSize + pageSize, totalVisits);
  const isFilteredResult = debouncedSearch.length > 0 || status !== "all";

  function startLoading() {
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();

    void getVisits(
      {
        search: debouncedSearch || undefined,
        status,
        page: pageIndex,
        size: pageSize,
      },
      controller.signal,
    )
      .then((page) => {
        const nextTotalPages = page.page?.totalPages;
        if (nextTotalPages !== undefined) {
          const lastPageIndex = Math.max(0, nextTotalPages - 1);

          if (pageIndex > lastPageIndex) {
            setPageIndex(lastPageIndex);
            return;
          }
        }

        setVisits(page.content);
        setPageMeta(page.page);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        setError(getErrorMessage(loadError));
        setVisits([]);
        setPageMeta(null);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, pageIndex, pageSize, reloadKey, status]);

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
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display dark:text-white">
              Külastuste haldus
            </h1>
            <p className="max-w-2xl text-slate-500 font-medium dark:text-slate-400">
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

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex-1 min-w-[320px] relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <FilterListIcon className="!text-lg" />
          </div>
          <input
            value={search}
            onChange={(event) => {
              startLoading();
              setSearch(event.target.value);
              setPageIndex(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Otsi külastaja nime, dokumendi või hosti järgi..."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(event) => {
              startLoading();
              setStatus(event.target.value as StatusFilter);
              setPageIndex(0);
            }}
            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <option value="all">Staatus: kõik</option>
            <option value="planned">Staatus: planeeritud</option>
            <option value="in_building">Staatus: hoones</option>
            <option value="departed">Staatus: lahkunud</option>
            <option value="expired">Staatus: aegunud</option>
          </select>

          <button
            type="button"
            className="p-2 text-slate-400 hover:text-primary transition-colors dark:text-slate-500 dark:hover:text-slate-200"
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-display dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">
            Leitud{" "}
            <span className="text-slate-900 dark:text-slate-100">
              {totalVisits}
            </span>{" "}
            külastust
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">
            Andmeallikas:{" "}
            <span className="text-slate-900 dark:text-slate-100">
              GET /api/visits
            </span>
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-18 rounded-2xl bg-slate-100 animate-pulse dark:bg-slate-800"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          </div>
        ) : null}

        {!isLoading && !error && visits.length === 0 ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Külastusi ei leitud
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Muuda otsingut või lisa uus külastus.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && visits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-5">Külastaja</th>
                  <th className="px-6 py-5">Dokument</th>
                  <th className="px-6 py-5">Vastuvõtja</th>
                  <th className="px-6 py-5">Saabumine</th>
                  <th className="px-6 py-5 text-center">Staatus</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {visits.map((visit) => {
                  const badge = getStatusBadge(visit.status);

                  return (
                    <tr
                      key={visit.id}
                      className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs dark:bg-primary/20 dark:text-slate-100">
                            {getInitials(visit.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {visit.fullName ?? "Pole saadaval"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter font-mono dark:text-slate-500">
                              {visit.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 tracking-wider dark:text-slate-400">
                        {visit.documentNumber ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {visit.hostName ?? "Pole saadaval"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
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
                            className="text-primary hover:bg-primary/5 rounded-xl dark:text-slate-200 dark:hover:bg-slate-800"
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

        {error ? null : (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Ridu lehel</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    startLoading();
                    setPageSize(Number(event.target.value));
                    setPageIndex(0);
                  }}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition-colors focus:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Näitan{" "}
                <span className="text-slate-900 dark:text-slate-100">
                  {visibleRangeStart}
                </span>
                {" - "}
                <span className="text-slate-900 dark:text-slate-100">
                  {visibleRangeEnd}
                </span>{" "}
                /{" "}
                <span className="text-slate-900 dark:text-slate-100">
                  {totalVisits}
                </span>
                {isFilteredResult ? " filtreeritud" : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Leht{" "}
                <span className="text-slate-900 dark:text-slate-100">
                  {visiblePageIndex + 1}
                </span>{" "}
                /{" "}
                <span className="text-slate-900 dark:text-slate-100">
                  {totalPages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-slate-500"
                  onClick={() => {
                    startLoading();
                    setPageIndex((current) => Math.max(0, current - 1));
                  }}
                  disabled={isLoading || visiblePageIndex === 0}
                  aria-label="Eelmine leht"
                >
                  <ChevronLeftIcon className="!text-lg" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-slate-500"
                  onClick={() => {
                    startLoading();
                    setPageIndex((current) =>
                      Math.min(totalPages - 1, current + 1),
                    );
                  }}
                  disabled={isLoading || visiblePageIndex >= totalPages - 1}
                  aria-label="Järgmine leht"
                >
                  <ChevronRightIcon className="!text-lg" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
