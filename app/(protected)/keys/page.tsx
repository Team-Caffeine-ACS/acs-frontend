"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useEffect, useState } from "react";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import InfoIcon from "@mui/icons-material/Info";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import {
  getKeycards,
  getKeycardStatusLabel,
  type KeycardResponse,
} from "@/lib/api/keycards";

export default function KeycardsPage() {
  const [keycards, setKeycards] = useState<KeycardResponse[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredKeycards = keycards.filter((keycard) => {
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
        setKeycards(page.content);
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

  let tableBodyContent: ReactNode;

  if (isLoading) {
    tableBodyContent = <LoadingRow />;
  } else if (filteredKeycards.length > 0) {
    tableBodyContent = filteredKeycards.map((keycard) => (
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
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">
              Võtmekaartide haldus
            </h1>
            <p className="max-w-2xl text-slate-500">
              Ava üksik kaart, vaata selle hetke seisu, määramist ja viimaseid
              teadaolevaid aegu detaillehel.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 py-6 text-xs font-bold uppercase tracking-widest"
          >
            <FileDownloadIcon className="!text-lg" /> Ekspordi
          </Button>
          <Button className="gap-2 bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
            <AddIcon className="!text-lg" /> Registreeri kaart
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[280px] flex-1">
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
            <FilterListIcon className="!text-lg" />
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-semibold text-slate-700 placeholder:text-slate-300"
            placeholder="Otsi kaardi numbri või kasutaja järgi..."
          />
        </div>
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <tr>
                <th className="px-6 py-5">Kaardi number</th>
                <th className="px-6 py-5">Staatus</th>
                <th className="px-6 py-5">Kasutaja</th>
                <th className="px-6 py-5">Väljastatud</th>
                <th className="px-6 py-5">Viimati tagastatud</th>
                <th className="px-6 py-5 text-right">Tegevus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableBodyContent}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Näitan{" "}
            <span className="text-slate-900">{filteredKeycards.length}</span> /{" "}
            <span className="text-slate-900">{keycards.length}</span> kaardist
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Ava detailvaade, et näha määramist ja kaardi olekut
          </p>
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
          color="text-blue-600"
        />
        <StatSmall
          title="Saadaval"
          value={summary.available}
          trend="Valmis uuesti väljastamiseks"
          icon={<MeetingRoomIcon className="!text-sm text-emerald-500" />}
          color="text-emerald-600"
        />
      </div>
    </div>
  );
}

function KeycardRow({ keycard }: Readonly<{ keycard: KeycardResponse }>) {
  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <CreditCardIcon className="!text-lg" />
          </div>
          <div>
            <Link
              href={`/keys/${keycard.id}`}
              className="font-mono text-sm font-bold tracking-tight text-slate-900 transition-colors hover:text-primary"
            >
              {keycard.keycardNumber}
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              ID {keycard.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={keycard.status} />
      </td>
      <td className="px-6 py-4">
        {keycard.assignedUser ? (
          <p className="text-sm font-semibold text-slate-900">
            {keycard.assignedUser}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Määramata</p>
        )}
      </td>
      <td className="px-6 py-4">
        <DateTimeStack
          value={keycard.assignedTime}
          emptyLabel="Pole väljastatud"
        />
      </td>
      <td className="px-6 py-4">
        <DateTimeStack
          value={keycard.lastReturnTime}
          emptyLabel="Tagastus puudub"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <Button asChild variant="ghost" className="rounded-xl text-primary">
          <Link href={`/keys/${keycard.id}`}>
            Ava <VisibilityIcon className="!text-base" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}: Readonly<{ status: KeycardResponse["status"] }>) {
  const styles: Record<KeycardResponse["status"], string> = {
    available: "border-emerald-100 bg-emerald-50 text-emerald-700",
    in_use: "border-blue-100 bg-blue-50 text-blue-700",
    disabled: "border-rose-100 bg-rose-50 text-rose-700",
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
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  const date = new Date(value);

  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">
        {new Intl.DateTimeFormat("et-EE", { dateStyle: "medium" }).format(date)}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {new Intl.DateTimeFormat("et-EE", { timeStyle: "short" }).format(date)}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-14 text-center">
        <p className="text-sm font-semibold text-slate-600">
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
      <td colSpan={6} className="px-6 py-14 text-center">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </td>
    </tr>
  );
}

function StatSmall({
  title,
  value,
  trend,
  icon,
  color = "text-slate-900",
}: Readonly<{
  title: string;
  value: string | number;
  trend: string;
  icon: ReactNode;
  color?: string;
}>) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>
      <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
        {icon} {trend}
      </div>
    </div>
  );
}
