"use client";

import Link from "next/link";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
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
type SortDirection = "default" | "desc" | "asc";
type DateFilterMode = "all" | "before" | "after" | "on";
type VisitPageMetadata = VisitListPage["page"];
type VisitSortKey =
  | "fullName"
  | "documentNumber"
  | "hostName"
  | "entryTime"
  | "exitTime"
  | "status";

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

function toLocalDateTimeParameter(date: Date): string {
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join("T");
}

function getDateBoundary(dateValue: string, endOfDay = false): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return toLocalDateTimeParameter(date);
}

function getVisitDateRange(
  mode: DateFilterMode,
  dateValue: string,
): { dateFrom?: string; dateTo?: string } {
  if (mode === "all" || !dateValue) {
    return {};
  }

  switch (mode) {
    case "before": {
      const dateTo = getDateBoundary(dateValue);
      return dateTo ? { dateTo } : {};
    }
    case "after": {
      const dateFrom = getDateBoundary(dateValue, true);
      return dateFrom ? { dateFrom } : {};
    }
    case "on": {
      const dateFrom = getDateBoundary(dateValue);
      const dateTo = getDateBoundary(dateValue, true);
      return dateFrom && dateTo ? { dateFrom, dateTo } : {};
    }
  }
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
      className:
        "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    },
    in_building: {
      label: "Hoones",
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    departed: {
      label: "Lahkunud",
      className:
        "border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    expired: {
      label: "Aegunud",
      className:
        "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    },
    cancelled: {
      label: "Tühistatud",
      className:
        "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    },
    unknown: {
      label: "Staatus puudub",
      className:
        "border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
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

function sortVisits(
  visits: VisitListItemResponse[],
  sortDirections: Record<VisitSortKey, SortDirection>,
  headerSortPriority: VisitSortKey[],
): VisitListItemResponse[] {
  if (
    Object.values(sortDirections).every((direction) => direction === "default")
  ) {
    return visits;
  }

  return [...visits].sort((left, right) => {
    for (const sortKey of headerSortPriority) {
      const sortDirection = sortDirections[sortKey];

      if (sortDirection === "default") {
        continue;
      }

      let comparison = 0;

      switch (sortKey) {
        case "fullName":
          comparison = compareNullableText(
            left.fullName,
            right.fullName,
            sortDirection,
          );
          break;
        case "documentNumber":
          comparison = compareNullableText(
            left.documentNumber,
            right.documentNumber,
            sortDirection,
          );
          break;
        case "hostName":
          comparison = compareNullableText(
            left.hostName,
            right.hostName,
            sortDirection,
          );
          break;
        case "entryTime":
          comparison = compareNullableDate(
            left.entryTime,
            right.entryTime,
            sortDirection,
          );
          break;
        case "exitTime":
          comparison = compareNullableDate(
            left.exitTime,
            right.exitTime,
            sortDirection,
          );
          break;
        case "status":
          comparison = compareStatus(left.status, right.status, sortDirection);
          break;
      }

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  });
}

function compareNullableText(
  left: string | null,
  right: string | null,
  order: SortDirection,
): number {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  const comparison = left.localeCompare(right, "et", {
    sensitivity: "base",
  });

  return order === "desc" ? -comparison : comparison;
}

function compareNullableDate(
  left: string | null,
  right: string | null,
  order: SortDirection,
): number {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  return order === "desc" ? rightTime - leftTime : leftTime - rightTime;
}

function compareStatus(
  left: string | null,
  right: string | null,
  order: SortDirection,
): number {
  const comparison = getStatusBadge(left).label.localeCompare(
    getStatusBadge(right).label,
    "et",
    { sensitivity: "base" },
  );

  return order === "desc" ? -comparison : comparison;
}

function getNextSortDirection(direction: SortDirection): SortDirection {
  switch (direction) {
    case "default":
      return "asc";
    case "asc":
      return "desc";
    case "desc":
      return "default";
  }
}

function getSortIcon(direction: SortDirection): ReactNode {
  switch (direction) {
    case "asc":
      return <ChevronDownIcon size={16} className="shrink-0 opacity-60" />;
    case "desc":
      return <ChevronUpIcon size={16} className="shrink-0 opacity-60" />;
    case "default":
      return null;
  }
}

function SortableHeader({
  label,
  direction,
  onClick,
}: Readonly<{
  label: string;
  direction: SortDirection;
  onClick: () => void;
}>) {
  const sortIcon = getSortIcon(direction);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full cursor-pointer items-center justify-between gap-2 text-left select-none transition-colors hover:text-slate-700 dark:hover:text-slate-200"
    >
      <span>{label}</span>
      {sortIcon}
    </button>
  );
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitListItemResponse[]>([]);
  const [pageMeta, setPageMeta] = useState<VisitPageMetadata>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fullNameSort, setFullNameSort] = useState<SortDirection>("default");
  const [documentNumberSort, setDocumentNumberSort] =
    useState<SortDirection>("default");
  const [hostNameSort, setHostNameSort] = useState<SortDirection>("default");
  const [entrySort, setEntrySort] = useState<SortDirection>("default");
  const [exitTimeSort, setExitTimeSort] = useState<SortDirection>("default");
  const [statusSort, setStatusSort] = useState<SortDirection>("default");
  const [headerSortPriority, setHeaderSortPriority] = useState<VisitSortKey[]>(
    [
      "fullName",
      "documentNumber",
      "hostName",
      "entryTime",
      "exitTime",
      "status",
    ],
  );
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("all");
  const [visitDate, setVisitDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const dateRange = getVisitDateRange(dateFilterMode, visitDate);
  const sortDirections: Record<VisitSortKey, SortDirection> = {
    fullName: fullNameSort,
    documentNumber: documentNumberSort,
    hostName: hostNameSort,
    entryTime: entrySort,
    exitTime: exitTimeSort,
    status: statusSort,
  };
  const sortedVisits = sortVisits(
    visits,
    sortDirections,
    headerSortPriority,
  );
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
  const isFilteredResult =
    debouncedSearch.length > 0 ||
    statusFilter !== "all" ||
    Boolean(dateRange.dateFrom || dateRange.dateTo);

  function startLoading() {
    setIsLoading(true);
    setError(null);
  }

  function updateHeaderSort(
    sortKey: VisitSortKey,
    setSort: Dispatch<SetStateAction<SortDirection>>,
  ) {
    setSort((current) => getNextSortDirection(current));
    setHeaderSortPriority((current) => [
      sortKey,
      ...current.filter((key) => key !== sortKey),
    ]);
    setPageIndex(0);
  }

  useEffect(() => {
    const controller = new AbortController();

    void getVisits(
      {
        search: debouncedSearch || undefined,
        status: statusFilter,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
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
  }, [
    dateRange.dateFrom,
    dateRange.dateTo,
    debouncedSearch,
    pageIndex,
    pageSize,
    reloadKey,
    statusFilter,
  ]);

  let tableBodyContent: ReactNode;

  if (isLoading) {
    tableBodyContent = <LoadingRow />;
  } else if (error) {
    tableBodyContent = (
      <EmptyRow title="Külastuste laadimine ebaõnnestus" description={error} />
    );
  } else if (sortedVisits.length > 0) {
    tableBodyContent = sortedVisits.map((visit) => (
      <VisitRow key={visit.id} visit={visit} />
    ));
  } else {
    tableBodyContent = (
      <EmptyRow
        title="Külastusi ei leitud"
        description="Muuda otsingut või lisa uus külastus."
      />
    );
  }

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
            <Button className="gap-2 bg-blue-700 px-8 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800">
              <AddIcon className="!text-lg" />
              Lisa külastus
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="min-w-[280px] flex-1 space-y-1">
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Otsi külastaja nime, dokumendi või saatja järgi
          </span>
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 !text-lg -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(event) => {
                startLoading();
                setSearch(event.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-semibold text-slate-700 placeholder:text-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Sisesta otsing..."
            />
          </div>
        </label>

        <FilterField label="Staatus">
          <select
            value={statusFilter}
            onChange={(event) => {
              startLoading();
              setStatusFilter(event.target.value as StatusFilter);
              setPageIndex(0);
            }}
            className={filterInputCls}
          >
            <option value="all">Kõik staatused</option>
            <option value="planned">Planeeritud</option>
            <option value="in_building">Hoones</option>
            <option value="departed">Lahkunud</option>
            <option value="expired">Aegunud</option>
          </select>
        </FilterField>

        <FilterField label="Saabumise aeg">
          <select
            value={entrySort}
            onChange={(event) => {
              setEntrySort(event.target.value as SortDirection);
              setPageIndex(0);
            }}
            className={filterInputCls}
          >
            <option value="default">Vaikimisi</option>
            <option value="desc">Uuem enne</option>
            <option value="asc">Vanem enne</option>
          </select>
        </FilterField>

        <FilterField label="Külastuse kuupäev">
          <div className="flex min-w-[260px] gap-2">
            <select
              value={dateFilterMode}
              onChange={(event) => {
                startLoading();
                setDateFilterMode(event.target.value as DateFilterMode);
                setPageIndex(0);
              }}
              className={filterInputCls + " min-w-[120px]"}
            >
              <option value="all">Kõik</option>
              <option value="before">Enne</option>
              <option value="after">Pärast</option>
              <option value="on">Täpselt</option>
            </select>
            <input
              type="date"
              value={visitDate}
              onChange={(event) => {
                startLoading();
                setVisitDate(event.target.value);
                setPageIndex(0);
              }}
              disabled={dateFilterMode === "all"}
              className={filterInputCls + " min-w-[140px]"}
            />
          </div>
        </FilterField>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl text-slate-500"
          aria-label="Värskenda filtreid"
          title="Värskenda filtreid"
          onClick={() => {
            startLoading();
            setReloadKey((current) => current + 1);
          }}
        >
          <RefreshIcon />
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Külastaja"
                    direction={fullNameSort}
                    onClick={() =>
                      updateHeaderSort("fullName", setFullNameSort)
                    }
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Dokument"
                    direction={documentNumberSort}
                    onClick={() =>
                      updateHeaderSort("documentNumber", setDocumentNumberSort)
                    }
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Võõrustaja"
                    direction={hostNameSort}
                    onClick={() =>
                      updateHeaderSort("hostName", setHostNameSort)
                    }
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Saabumine"
                    direction={entrySort}
                    onClick={() => updateHeaderSort("entryTime", setEntrySort)}
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Lahkumine"
                    direction={exitTimeSort}
                    onClick={() =>
                      updateHeaderSort("exitTime", setExitTimeSort)
                    }
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Staatus"
                    direction={statusSort}
                    onClick={() => updateHeaderSort("status", setStatusSort)}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableBodyContent}
            </tbody>
          </table>
        </div>

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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
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
      </div>
    </div>
  );
}

function VisitRow({ visit }: Readonly<{ visit: VisitListItemResponse }>) {
  const href = `/visits/${visit.id}`;
  const label = `Ava külastuse ${visit.id} detail`;

  return (
    <tr className="cursor-pointer transition-colors hover:bg-slate-50/70 focus-within:bg-slate-50/70 focus-within:outline-2 focus-within:outline-primary/40 dark:hover:bg-slate-800/50 dark:focus-within:bg-slate-800/50">
      <td className="relative px-6 py-4 whitespace-nowrap">
        <Link href={href} className="absolute inset-0 z-10" aria-label={label}>
          <span className="sr-only">{label}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            {getInitials(visit.fullName)}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {visit.fullName ?? "Pole saadaval"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              ID {visit.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        {visit.documentNumber ? (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {visit.documentNumber}
          </p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">Puudub</p>
        )}
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        {visit.hostName ? (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {visit.hostName}
          </p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Määramata
          </p>
        )}
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <DateTimeStack value={visit.entryTime} emptyLabel="Puudub" />
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <DateTimeStack value={visit.exitTime} emptyLabel="Lahkumine puudub" />
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <VisitStatusBadge status={visit.status} />
      </td>
    </tr>
  );
}

function VisitStatusBadge({ status }: Readonly<{ status: string | null }>) {
  const badge = getStatusBadge(status);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function DateTimeStack({
  value,
  emptyLabel,
}: Readonly<{
  value: string | null;
  emptyLabel: string;
}>) {
  if (!value) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">{emptyLabel}</p>
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return (
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {new Intl.DateTimeFormat("et-EE", { dateStyle: "medium" }).format(date)}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {new Intl.DateTimeFormat("et-EE", { timeStyle: "short" }).format(date)}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-14 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Laen külastusi...
        </p>
      </td>
    </tr>
  );
}

function EmptyRow({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-14 text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </td>
    </tr>
  );
}

function FilterField({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="space-y-1">
      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const filterInputCls =
  "h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-primary/40 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800";
