"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { type ReactNode, useDeferredValue, useEffect, useState } from "react";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import InfoIcon from "@mui/icons-material/Info";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/components/layout/current-user-provider";
import { primaryCtaButtonClassName } from "@/components/ui/button-styles";
import { ApiError } from "@/lib/api/error";
import {
  getKeycard,
  getKeycards,
  getKeycardStatusLabel,
  type KeycardStatus,
  type KeycardResponse,
} from "@/lib/api/keycards";

const ALLOWED_ROLES = ["ADMIN", "SECURITY_CHIEF"] as const;

type StatusFilterValue = "all" | KeycardStatus;
type SortDirection = "default" | "asc" | "desc";
type LastReturnFilterMode = "all" | "before" | "after" | "on";
type HeaderSortKey = "number" | "status" | "user" | "issued" | "returned";

export default function KeycardsPage() {
  const { user } = useCurrentUser();
  const canRegister = user
    ? ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])
    : false;

  const [keycards, setKeycards] = useState<KeycardResponse[]>([]);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [numberSort, setNumberSort] = useState<SortDirection>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [statusSort, setStatusSort] = useState<SortDirection>("default");
  const [userSort, setUserSort] = useState<SortDirection>("default");
  const [issuedSort, setIssuedSort] = useState<SortDirection>("default");
  const [headerSortPriority, setHeaderSortPriority] = useState<HeaderSortKey[]>(
    ["number", "status", "user", "issued", "returned"],
  );
  const [lastReturnSort, setLastReturnSort] =
    useState<SortDirection>("default");
  const [lastReturnFilterMode, setLastReturnFilterMode] =
    useState<LastReturnFilterMode>("all");
  const [lastReturnDate, setLastReturnDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const searchFilteredKeycards = keycards.filter((keycard) => {
    if (!deferredSearch) return true;

    const haystack = [
      keycard.keycardNumber,
      keycard.assignedUser ?? "",
      getKeycardStatusLabel(keycard.status),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(deferredSearch);
  });

  const statusFilteredKeycards = searchFilteredKeycards.filter((keycard) =>
    statusFilter === "all" ? true : keycard.status === statusFilter,
  );

  const lastReturnFilteredKeycards = statusFilteredKeycards.filter((keycard) =>
    matchesLastReturnFilter(
      keycard.lastReturnTime,
      lastReturnFilterMode,
      lastReturnDate,
    ),
  );

  const filteredKeycards = sortKeycards(
    lastReturnFilteredKeycards,
    numberSort,
    statusSort,
    userSort,
    issuedSort,
    headerSortPriority,
    lastReturnSort,
  );

  const totalFilteredKeycards = filteredKeycards.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredKeycards / pageSize));
  const visiblePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageStart = visiblePageIndex * pageSize;
  const paginatedKeycards = filteredKeycards.slice(
    pageStart,
    pageStart + pageSize,
  );
  const visibleRangeStart =
    totalFilteredKeycards === 0 ? 0 : visiblePageIndex * pageSize + 1;
  const visibleRangeEnd =
    totalFilteredKeycards === 0
      ? 0
      : Math.min(visiblePageIndex * pageSize + pageSize, totalFilteredKeycards);
  const isFilteredResult = totalFilteredKeycards < keycards.length;

  const summary = keycards.reduce(
    (accumulator, keycard) => {
      accumulator.total += 1;

      if (keycard.status !== "disabled") {
        accumulator.active += 1;
      }

      if (keycard.status === "in_use") {
        accumulator.inUse += 1;
      }

      if (keycard.status === "available") {
        accumulator.available += 1;
      }

      return accumulator;
    },
    { total: 0, active: 0, inUse: 0, available: 0 },
  );

  useEffect(() => {
    let isMounted = true;

    const loadKeycards = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const page = await getKeycards({ size: 200 });
        if (!isMounted) return;

        const inUseWithoutAssignedTime = page.content.filter(
          (keycard) => keycard.status === "in_use" && !keycard.assignedTime,
        );

        if (inUseWithoutAssignedTime.length === 0) {
          setKeycards(page.content);
          return;
        }

        const detailedResults = await Promise.allSettled(
          inUseWithoutAssignedTime.map((keycard) => getKeycard(keycard.id)),
        );

        if (!isMounted) return;

        const detailsById = new Map(
          detailedResults.flatMap((result) =>
            result.status === "fulfilled"
              ? [[result.value.id, result.value] as const]
              : [],
          ),
        );

        setKeycards(
          page.content.map((keycard) => {
            const detail = detailsById.get(keycard.id);
            return detail ? { ...keycard, ...detail } : keycard;
          }),
        );
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Võtmekaartide laadimine ebaõnnestus.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadKeycards();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [
    deferredSearch,
    statusFilter,
    numberSort,
    statusSort,
    userSort,
    issuedSort,
    lastReturnSort,
    lastReturnFilterMode,
    lastReturnDate,
    headerSortPriority,
  ]);

  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [pageIndex, totalPages]);

  let tableBodyContent: ReactNode;

  if (isLoading) {
    tableBodyContent = <LoadingRow />;
  } else if (paginatedKeycards.length > 0) {
    tableBodyContent = paginatedKeycards.map((keycard) => (
      <KeycardRow key={keycard.id} keycard={keycard} />
    ));
  } else {
    tableBodyContent = (
      <EmptyRow
        title={
          error ? "Võtmekaartide laadimine ebaõnnestus" : "Tulemusi ei leitud"
        }
        description={
          error ??
          "Muuda otsingut või kontrolli, kas võtmekaardid on süsteemis olemas."
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="/" className="transition-colors hover:text-primary">
              Pääsla
            </Link>
            <ChevronRightIcon className="!text-sm" />
            <span className="text-primary">Võtmekaardid</span>
          </nav>
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Võtmekaartide haldus
            </h1>
            <p className="max-w-2xl text-slate-500 dark:text-slate-400">
              Ava üksik kaart, vaata selle hetke seisu, määramist ja viimaseid
              teadaolevaid aegu detaillehel.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {canRegister && (
            <Button asChild className={primaryCtaButtonClassName}>
              <Link href="/keys/new">
                <AddIcon className="!text-lg" /> Registreeri kaart
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatSmall
          title="Kaarte kokku"
          value={summary.total}
          trend="Kõik süsteemis nähtavad kaardid"
          icon={<TrendingUpIcon className="!text-sm text-emerald-500" />}
        />
        <StatSmall
          title="Aktiivsed"
          value={summary.active}
          trend="Saadaval või kasutuses"
          icon={<InfoIcon className="!text-sm text-slate-400" />}
        />
        <StatSmall
          title="Kasutuses"
          value={summary.inUse}
          trend="Praegu külastajate käes"
          icon={<CreditCardIcon className="!text-sm text-blue-600" />}
          color="text-blue-600 dark:text-blue-300"
        />
        <StatSmall
          title="Saadaval"
          value={summary.available}
          trend="Valmis uuesti väljastamiseks"
          icon={<MeetingRoomIcon className="!text-sm text-emerald-500" />}
          color="text-emerald-600 dark:text-emerald-300"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="min-w-[280px] flex-1 space-y-1">
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Otsi kaardi numbri või kasutaja järgi
          </span>
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 !text-lg -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-semibold text-slate-700 placeholder:text-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Sisesta otsing..."
            />
          </div>
        </label>
        <FilterField label="Staatus">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilterValue)
            }
            className={filterInputCls}
          >
            <option value="all">Kõik staatused</option>
            <option value="available">Saadaval</option>
            <option value="in_use">Kasutuses</option>
            <option value="disabled">Deaktiveeritud</option>
            <option value="expired">Aegunud</option>
          </select>
        </FilterField>
        <FilterField label="Viimati tagastatud">
          <select
            value={lastReturnSort}
            onChange={(event) =>
              setLastReturnSort(event.target.value as SortDirection)
            }
            className={filterInputCls}
          >
            <option value="default">Vaikimisi</option>
            <option value="desc">Uuem enne</option>
            <option value="asc">Vanem enne</option>
          </select>
        </FilterField>
        <FilterField label="Tagastuse kuupäev">
          <div className="flex min-w-[260px] gap-2">
            <select
              value={lastReturnFilterMode}
              onChange={(event) =>
                setLastReturnFilterMode(
                  event.target.value as LastReturnFilterMode,
                )
              }
              className={filterInputCls + " min-w-[120px]"}
            >
              <option value="all">Kõik</option>
              <option value="before">Enne</option>
              <option value="after">Pärast</option>
              <option value="on">Täpselt</option>
            </select>
            <input
              type="date"
              value={lastReturnDate}
              onChange={(event) => setLastReturnDate(event.target.value)}
              disabled={lastReturnFilterMode === "all"}
              className={filterInputCls + " min-w-[140px]"}
            />
          </div>
        </FilterField>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl text-slate-500"
          aria-label="Värskenda võtmekaarte"
          onClick={() => globalThis.location.reload()}
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
                    label="Kaardi number"
                    direction={numberSort}
                    onClick={() => {
                      setNumberSort((current) => getNextSortDirection(current));
                      setHeaderSortPriority((current) => [
                        "number",
                        ...current.filter((key) => key !== "number"),
                      ]);
                    }}
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Staatus"
                    direction={statusSort}
                    onClick={() => {
                      setStatusSort((current) => getNextSortDirection(current));
                      setHeaderSortPriority((current) => [
                        "status",
                        ...current.filter((key) => key !== "status"),
                      ]);
                    }}
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Kasutaja"
                    direction={userSort}
                    onClick={() => {
                      setUserSort((current) => getNextSortDirection(current));
                      setHeaderSortPriority((current) => [
                        "user",
                        ...current.filter((key) => key !== "user"),
                      ]);
                    }}
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Väljastatud"
                    direction={issuedSort}
                    onClick={() => {
                      setIssuedSort((current) => getNextSortDirection(current));
                      setHeaderSortPriority((current) => [
                        "issued",
                        ...current.filter((key) => key !== "issued"),
                      ]);
                    }}
                  />
                </th>
                <th className="px-6 py-5">
                  <SortableHeader
                    label="Viimati tagastatud"
                    direction={lastReturnSort}
                    onClick={() => {
                      setLastReturnSort((current) =>
                        getNextSortDirection(current),
                      );
                      setHeaderSortPriority((current) => [
                        "returned",
                        ...current.filter((key) => key !== "returned"),
                      ]);
                    }}
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
                onChange={(event) => setPageSize(Number(event.target.value))}
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
                {totalFilteredKeycards}
              </span>
              {isFilteredResult ? (
                <>
                  {" "}
                  filtreeritud, kokku{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {keycards.length}
                  </span>
                </>
              ) : null}
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
                onClick={() =>
                  setPageIndex((current) => Math.max(0, current - 1))
                }
                disabled={visiblePageIndex === 0}
                aria-label="Eelmine leht"
              >
                <ChevronLeftIcon className="!text-lg" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl text-slate-500"
                onClick={() =>
                  setPageIndex((current) =>
                    Math.min(totalPages - 1, current + 1),
                  )
                }
                disabled={visiblePageIndex >= totalPages - 1}
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

function KeycardRow({ keycard }: Readonly<{ keycard: KeycardResponse }>) {
  const href = `/keys/${keycard.id}`;
  const label = `Ava võtmekaart ${keycard.keycardNumber}`;

  return (
    <tr className="cursor-pointer transition-colors hover:bg-slate-50/70 focus-within:bg-slate-50/70 focus-within:outline-2 focus-within:outline-primary/40 dark:hover:bg-slate-800/50 dark:focus-within:bg-slate-800/50">
      <td className="relative px-6 py-4 whitespace-nowrap">
        <Link href={href} className="absolute inset-0 z-10" aria-label={label}>
          <span className="sr-only">{label}</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <CreditCardIcon className="!text-lg" />
          </div>
          <div>
            <p className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {keycard.keycardNumber}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              ID {keycard.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <StatusBadge status={keycard.status} />
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        {keycard.assignedUser ? (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {keycard.assignedUser}
          </p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Määramata
          </p>
        )}
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <DateTimeStack value={keycard.assignedTime} emptyLabel="Puudub" />
      </td>
      <td className="relative px-6 py-4">
        <Link href={href} className="absolute inset-0 z-10" tabIndex={-1} />
        <DateTimeStack
          value={keycard.lastReturnTime}
          emptyLabel="Tagastus puudub"
        />
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}: Readonly<{ status: KeycardResponse["status"] }>) {
  const styles: Record<KeycardResponse["status"], string> = {
    available:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    in_use:
      "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    disabled:
      "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    expired:
      "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}
    >
      {getKeycardStatusLabel(status)}
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
      <td colSpan={5} className="px-6 py-14 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Laen võtmekaarte...
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
      <td colSpan={5} className="px-6 py-14 text-center">
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

function StatSmall({
  title,
  value,
  trend,
  icon,
  color = "text-slate-900 dark:text-slate-100",
}: Readonly<{
  title: string;
  value: string | number;
  trend: string;
  icon: ReactNode;
  color?: string;
}>) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </p>
      <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">
        {icon} {trend}
      </div>
    </div>
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

function getSortIcon(direction: SortDirection) {
  switch (direction) {
    case "asc":
      return <ChevronDownIcon size={16} className="shrink-0 opacity-60" />;
    case "desc":
      return <ChevronUpIcon size={16} className="shrink-0 opacity-60" />;
    case "default":
      return null;
  }
}

function sortKeycards(
  keycards: KeycardResponse[],
  numberSort: SortDirection,
  statusSort: SortDirection,
  userSort: SortDirection,
  issuedSort: SortDirection,
  headerSortPriority: HeaderSortKey[],
  lastReturnSort: SortDirection,
) {
  if (
    numberSort === "default" &&
    statusSort === "default" &&
    userSort === "default" &&
    issuedSort === "default" &&
    lastReturnSort === "default"
  ) {
    return keycards;
  }

  return [...keycards].sort((left, right) => {
    for (const key of headerSortPriority) {
      const comparison = getKeycardComparison({
        key,
        left,
        right,
        numberSort,
        statusSort,
        userSort,
        issuedSort,
        lastReturnSort,
      });

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  });
}

function getKeycardComparison({
  key,
  left,
  right,
  numberSort,
  statusSort,
  userSort,
  issuedSort,
  lastReturnSort,
}: Readonly<{
  key: HeaderSortKey;
  left: KeycardResponse;
  right: KeycardResponse;
  numberSort: SortDirection;
  statusSort: SortDirection;
  userSort: SortDirection;
  issuedSort: SortDirection;
  lastReturnSort: SortDirection;
}>) {
  switch (key) {
    case "number":
      return compareNullableText(
        left.keycardNumber,
        right.keycardNumber,
        numberSort,
      );
    case "status":
      return compareStatus(left.status, right.status, statusSort);
    case "user":
      return compareNullableText(
        left.assignedUser,
        right.assignedUser,
        userSort,
      );
    case "issued":
      return compareNullableDate(
        left.assignedTime,
        right.assignedTime,
        issuedSort,
      );
    case "returned":
      return compareNullableDate(
        left.lastReturnTime,
        right.lastReturnTime,
        lastReturnSort,
      );
  }
}

function compareStatus(
  left: KeycardStatus,
  right: KeycardStatus,
  order: SortDirection,
) {
  if (order === "default") {
    return 0;
  }

  const comparison = getKeycardStatusLabel(left).localeCompare(
    getKeycardStatusLabel(right),
    "et",
    { sensitivity: "base" },
  );

  return order === "desc" ? -comparison : comparison;
}

function compareNullableDate(
  left: string | null,
  right: string | null,
  order: SortDirection,
) {
  if (order === "default") {
    return 0;
  }

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

function compareNullableText(
  left: string | null,
  right: string | null,
  order: SortDirection,
) {
  if (order === "default") {
    return 0;
  }

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

function matchesLastReturnFilter(
  value: string | null,
  mode: LastReturnFilterMode,
  date: string,
) {
  if (mode === "all" || !date) {
    return true;
  }

  if (!value) {
    return false;
  }

  const entryTime = new Date(value).getTime();
  const startOfSelectedDay = new Date(`${date}T00:00:00`).getTime();
  const endOfSelectedDay = new Date(`${date}T23:59:59.999`).getTime();

  switch (mode) {
    case "before":
      return entryTime < startOfSelectedDay;
    case "after":
      return entryTime > endOfSelectedDay;
    case "on":
      return entryTime >= startOfSelectedDay && entryTime <= endOfSelectedDay;
  }
}
