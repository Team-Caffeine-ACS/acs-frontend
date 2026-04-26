"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentUser } from "@/components/layout/current-user-provider";
import {
  getKeycard,
  updateKeycard,
  type KeycardDetailResponse,
} from "@/lib/api/keycards";
import { ApiError } from "@/lib/api/error";

const ALLOWED_ROLES = ["ADMIN", "SECURITY_CHIEF"] as const;

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

const DATE_FORMATTER = new Intl.DateTimeFormat("et-EE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function parseDateFromIso(iso: string | null): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseTimeFromIso(iso: string | null): string {
  if (!iso) return "00:00";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "00:00";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function EditKeycardPage() {
  const params = useParams<{ id: string }>();
  const keycardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user, status: userStatus } = useCurrentUser();

  const [keycard, setKeycard] = useState<KeycardDetailResponse | null>(null);
  const [isLoadingKeycard, setIsLoadingKeycard] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [keycardNumber, setKeycardNumber] = useState("");
  const [active, setActive] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("00:00");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!keycardId) {
      setIsLoadingKeycard(false);
      setLoadError("Võtmekaardi ID puudub.");
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const detail = await getKeycard(keycardId);
        if (!isMounted) return;
        setKeycard(detail);
        setKeycardNumber(detail.keycardNumber);
        setActive(detail.active);
        setSelectedDate(parseDateFromIso(detail.validUntil));
        setSelectedTime(parseTimeFromIso(detail.validUntil));
      } catch (err) {
        if (!isMounted) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Võtmekaardi andmete laadimine ebaõnnestus.",
        );
      } finally {
        if (isMounted) setIsLoadingKeycard(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [keycardId]);

  if (userStatus === "loading" || isLoadingKeycard) {
    return (
      <div className="mx-auto max-w-xl animate-pulse space-y-4">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (
    !user ||
    !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])
  ) {
    return (
      <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        Sul puudub õigus võtmekaarti muuta.
      </p>
    );
  }

  if (loadError || !keycard) {
    return (
      <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        {loadError ?? "Võtmekaarti ei leitud."}
      </p>
    );
  }

  function buildValidUntil(): string | null {
    if (!selectedDate) return null;
    const datePart = format(selectedDate, "yyyy-MM-dd");
    return `${datePart}T${selectedTime}:00`;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);

    if (!keycardNumber.trim()) {
      setSaveError("Kaardi number on kohustuslik.");
      return;
    }

    setIsSaving(true);
    try {
      await updateKeycard(keycardId, {
        keycardNumber: keycardNumber.trim(),
        active,
        validUntil: buildValidUntil(),
      });
      router.push(`/keys/${keycardId}`);
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

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/" className="transition-colors hover:text-primary">
            Pääsla
          </Link>
          <ChevronRightIcon className="!text-sm" />
          <Link href="/keys" className="transition-colors hover:text-primary">
            Võtmekaardid
          </Link>
          <ChevronRightIcon className="!text-sm" />
          <Link
            href={`/keys/${keycardId}`}
            className="transition-colors hover:text-primary"
          >
            {keycard.keycardNumber}
          </Link>
          <ChevronRightIcon className="!text-sm" />
          <span className="text-primary">Muuda</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCardIcon className="text-[22px]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Muuda võtmekaarti
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="keycard-number"
            className="block text-sm font-medium text-slate-700"
          >
            Kaardi number <span className="text-rose-500">*</span>
          </label>
          <input
            id="keycard-number"
            type="text"
            value={keycardNumber}
            onChange={(e) => setKeycardNumber(e.target.value)}
            maxLength={128}
            required
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">
            Kehtiv kuni{" "}
            <span className="text-xs font-normal text-slate-400">
              (tühjaks jätmine eemaldab aegumiskuupäeva)
            </span>
          </span>

          <div className="flex gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <CalendarMonthIcon className="shrink-0 text-slate-400 !text-[18px]" />
                  <span
                    className={
                      selectedDate ? "text-slate-800" : "text-slate-400"
                    }
                  >
                    {selectedDate
                      ? DATE_FORMATTER.format(selectedDate)
                      : "Vali kuupäev…"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  captionLayout="dropdown"
                  autoFocus
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  aria-label="Kellaaeg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setSelectedTime("00:00");
                  }}
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition"
                  aria-label="Eemalda kuupäev"
                >
                  <CloseIcon className="!text-[18px]" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-primary"
          />
          <label
            htmlFor="active"
            className="text-sm font-medium text-slate-700"
          >
            Kaart on aktiivne
          </label>
        </div>

        {!active && (
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Deaktiveeritud kaart ei ole kasutuses ega saadaval väljastamiseks.
          </p>
        )}

        {saveError && (
          <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {saveError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/keys/${keycardId}`)}
          >
            Tühista
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary px-6 hover:bg-primary/90"
          >
            {isSaving ? "Salvestan…" : "Salvesta muudatused"}
          </Button>
        </div>
      </form>
    </div>
  );
}
