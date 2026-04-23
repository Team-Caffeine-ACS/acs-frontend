"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PersonIcon from "@mui/icons-material/Person";
import { Button } from "@/components/ui/button";
import {
  getAccessPoints,
  type AccessPointResponse,
} from "@/lib/api/accessPoints";
import { ApiError } from "@/lib/api/error";
import {
  getKeycard,
  getKeycardStatusLabel,
  returnKeycard,
  type KeycardDetailResponse,
} from "@/lib/api/keycards";

export default function ReturnKeycardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const keycardId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [keycard, setKeycard] = useState<KeycardDetailResponse | null>(null);
  const [accessPoints, setAccessPoints] = useState<AccessPointResponse[]>([]);
  const [selectedAccessPointId, setSelectedAccessPointId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!keycardId) {
      setIsLoading(false);
      setIsNotFound(true);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const [detail, points] = await Promise.all([
          getKeycard(keycardId),
          getAccessPoints(),
        ]);

        if (!isMounted) {
          return;
        }

        setKeycard(detail);
        setAccessPoints(points);

        if (points.length === 1) {
          setSelectedAccessPointId(points[0].id);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err instanceof ApiError && err.status === 404) {
          setIsNotFound(true);
          return;
        }

        setError(
          err instanceof ApiError
            ? err.message
            : "Kaardi tagastuse ettevalmistamine ebaõnnestus.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [keycardId]);

  if (isLoading) {
    return <PageState title="Valmistan kaardi tagastust ette..." />;
  }

  if (error && !keycard) {
    return (
      <PageState title="Tagastusvaadet ei saanud avada" description={error} />
    );
  }

  if (isNotFound || !keycard) {
    return (
      <PageState
        title="Võtmekaarti ei leitud"
        description="Kontrolli, kas valitud kaart on süsteemis olemas või ava see nimekirjast uuesti."
      />
    );
  }

  const canReturnKeycard =
    keycard.status === "in_use" &&
    Boolean(keycard.assignedUser || keycard.assignedTime);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAccessPointId) {
      setError("Vali tagastamise vastuvõtupunkt.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await returnKeycard(keycard.id, {
        returnAccessPointId: selectedAccessPointId,
      });

      router.replace(`/keys/${keycard.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Kaardi tagastamine ebaõnnestus.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canReturnKeycard) {
    return (
      <PageState
        title="Kaarti ei saa tagastada"
        description="See kaart ei ole praegu välja antud, seega tagastust ei saa registreerida."
        action={
          <Button asChild variant="outline" className="mt-4 gap-2 rounded-xl">
            <Link href={`/keys/${keycard.id}`}>
              <ArrowBackIcon className="!text-base" />
              Tagasi kaardi vaatesse
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
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
            href={`/keys/${keycard.id}`}
            className="transition-colors hover:text-primary"
          >
            {keycard.keycardNumber}
          </Link>
          <ChevronRightIcon className="!text-sm" />
          <span className="text-primary">Tagastus</span>
        </nav>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AssignmentReturnIcon className="!text-2xl text-primary" />
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">
                Tagasta võtmekaart
              </h1>
            </div>
            <p className="max-w-2xl text-slate-500">
              Registreeri kaardi tagastus, valides vastuvõtupunkti. Backend
              salvestab tagastuse aja automaatselt.
            </p>
          </div>

          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href={`/keys/${keycard.id}`}>
              <ArrowBackIcon className="!text-base" />
              Tagasi kaardi vaatesse
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
              <CreditCardIcon className="!text-lg text-primary" />
              Tagastatav kaart
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <DetailField label="Kaardi number" value={keycard.keycardNumber} />
            <DetailField
              label="Staatus"
              value={getKeycardStatusLabel(keycard.status)}
            />
            <DetailField
              label="Kaardi kasutaja"
              value={keycard.assignedUser ?? "Aktiivne kasutaja puudub"}
              accent={Boolean(keycard.assignedUser)}
            />
            <DetailField
              label="Väljastamise aeg"
              value={formatDateTime(keycard.assignedTime, "Puudub")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
              <MeetingRoomIcon className="!text-lg text-primary" />
              Tagastuse andmed
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="returnAccessPointId"
                className="flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <PersonIcon className="!text-base text-slate-400" />
                Vastuvõtupunkt
              </label>
              <select
                id="returnAccessPointId"
                value={selectedAccessPointId}
                onChange={(event) =>
                  setSelectedAccessPointId(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                disabled={isSubmitting || accessPoints.length === 0}
              >
                <option value="">Vali vastuvõtupunkt</option>
                {accessPoints.map((accessPoint) => (
                  <option key={accessPoint.id} value={accessPoint.id}>
                    {accessPoint.name}
                  </option>
                ))}
              </select>
              {accessPoints.length === 0 ? (
                <p className="text-sm text-amber-700">
                  Ühtegi vastuvõtupunkti ei leitud. Tagastust ei saa enne
                  registreerida.
                </p>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/keys/${keycard.id}`}>Loobu</Link>
              </Button>
              <Button
                type="submit"
                className="gap-2 rounded-xl px-5"
                disabled={
                  isSubmitting ||
                  accessPoints.length === 0 ||
                  !selectedAccessPointId
                }
              >
                <AssignmentReturnIcon className="!text-base" />
                {isSubmitting ? "Tagastan..." : "Kinnita tagastus"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function PageState({
  title,
  description,
  action,
}: Readonly<{
  title: string;
  description?: string;
  action?: ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-2 max-w-lg text-sm text-slate-500">{description}</p>
        ) : null}
        {action}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  accent = false,
}: Readonly<{
  label: string;
  value: string;
  accent?: boolean;
}>) {
  return (
    <div className="space-y-1 rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={
          accent
            ? "text-sm font-semibold text-primary"
            : "text-sm font-semibold text-slate-900"
        }
      >
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string | null, emptyLabel: string): string {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("et-EE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
