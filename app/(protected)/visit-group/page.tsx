"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import {
  getGroupVisits,
  type GroupVisitListItemResponse,
  type GroupVisitPageMetadata,
} from "@/lib/api/visitGroups";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Grupp külastuste laadimine ebaõnnestus.";
}

function formatDateTime(value: string | null): string {
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

function GroupSummaryBadges({
  memberCount,
  checkedInCount,
  departedCount,
}: {
  memberCount: number;
  checkedInCount: number;
  departedCount: number;
}) {
  const waiting = memberCount - checkedInCount - departedCount;

  return (
    <div className="flex items-center gap-1.5">
      {waiting > 0 && (
        <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          {waiting} ootel
        </span>
      )}
      {checkedInCount > 0 && (
        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {checkedInCount} hoones
        </span>
      )}
      {departedCount > 0 && (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {departedCount} lahkunud
        </span>
      )}
    </div>
  );
}

function GroupRow({ group }: Readonly<{ group: GroupVisitListItemResponse }>) {
  const href = `/visit-group/${group.groupInVisitId}`;

  return (
    <tr className="cursor-pointer transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
      <td className="relative px-6 py-4 whitespace-nowrap">
        <Link href={href} className="absolute inset-0 z-10">
          <span className="sr-only">Ava grupp {group.groupName}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GroupsOutlinedIcon className="!text-[18px]" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {group.groupName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {group.memberCount} liiget
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {formatDateTime(group.plannedArrival)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {formatDateTime(group.plannedExit)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <GroupSummaryBadges
          memberCount={group.memberCount}
          checkedInCount={group.checkedInCount}
          departedCount={group.departedCount}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
        {group.comment ?? "—"}
      </td>
    </tr>
  );
}

export default function VisitGroupsPage() {
  const [groups, setGroups] = useState<GroupVisitListItemResponse[]>([]);
  const [pageMeta, setPageMeta] = useState<GroupVisitPageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, pageMeta?.totalPages ?? 1);
  const totalElements = pageMeta?.totalElements ?? groups.length;

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setError(null);

        const result = await getGroupVisits(
          {
            search: search.trim() || undefined,
            page: pageIndex,
            size: PAGE_SIZE,
          },
          controller.signal,
        );

        setGroups(result.content);
        setPageMeta(result.page);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(getErrorMessage(err));
        setGroups([]);
        setPageMeta(null);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    load();

    return () => controller.abort();
  }, [search, pageIndex, reloadKey]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">
              Pääsla
            </Link>
            <ChevronRightIcon className="!text-sm" />
            <span className="text-primary">Grupp külastused</span>
          </nav>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Grupp külastused
            </h1>
            <p className="max-w-2xl text-slate-500 dark:text-slate-400 font-medium">
              Halda grupp külastusi — loo uus grupp, jälgi liikmete staatuseid
              ja registreeri saabumine või lahkumine ühekaupa.
            </p>
          </div>
        </div>

        <Link
          href="/visit-group/new"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <AddIcon className="!text-lg" />
          Uus grupp külastus
        </Link>
      </div>

      {/* Search + refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 !text-lg text-slate-400" />
          <input
            type="text"
            placeholder="Otsi grupi nime järgi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(0);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-primary transition-colors"
          aria-label="Värskenda"
          onClick={() => {
            setReloadKey((k) => k + 1);
          }}
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Leitud{" "}
            <span className="text-slate-900 dark:text-slate-100">
              {totalElements}
            </span>{" "}
            gruppi
          </p>
        </div>

        {isLoading && (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          </div>
        )}

        {!isLoading && !error && groups.length === 0 && (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-5">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Grupp külastusi ei leitud
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Loo uus grupp külastus või muuda otsinguparameetreid.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && groups.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Grupp
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Saabumine
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Lahkumine
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Staatused
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Kommentaar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groups.map((g) => (
                  <GroupRow key={g.groupInVisitId} group={g} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Leht{" "}
              <span className="text-slate-900 dark:text-slate-100">
                {pageIndex + 1}
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
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <ChevronLeftIcon className="!text-lg" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl text-slate-500"
                onClick={() =>
                  setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={pageIndex >= totalPages - 1}
              >
                <ChevronRightIcon className="!text-lg" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
