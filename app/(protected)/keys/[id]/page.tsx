"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PersonIcon from "@mui/icons-material/Person";
import LinkIcon from "@mui/icons-material/Link";
import HistoryIcon from "@mui/icons-material/History";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import {
  getKeycard,
  getKeycardStatusLabel,
  type KeycardDetailResponse,
} from "@/lib/api/keycards";

export default function KeycardDetailsPage() {
  const params = useParams<{ id: string }>();
  const keycardId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [keycard, setKeycard] = useState<KeycardDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!keycardId) {
      setIsLoading(false);
      setIsNotFound(true);
      return;
    }

    let isMounted = true;

    const loadKeycard = async () => {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const detail = await getKeycard(keycardId);

        if (!isMounted) {
          return;
        }

        setKeycard(detail);
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
            : "Võtmekaardi detailide laadimine ebaõnnestus.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadKeycard();

    return () => {
      isMounted = false;
    };
  }, [keycardId]);

  if (isLoading) {
    return <PageState title="Laen võtmekaardi andmeid..." />;
  }

  if (error) {
    return <PageState title="Detailvaadet ei saanud avada" description={error} />;
  }

  if (isNotFound || !keycard) {
    return (
      <PageState
        title="Võtmekaarti ei leitud"
        description="Kontrolli, kas valitud kaart on süsteemis olemas või ava see nimekirjast uuesti."
      />
    );
  }

  const currentStateText = keycard.assignedUser
    ? "Kaart on hetkel välja antud. Aktiivne hoidja ja väljastamise aeg on teada."
    : keycard.lastReturnTime
      ? "Kaart ei ole hetkel välja antud. Viimane teadaolev sündmus on tagastus."
      : "Kaardil ei ole praegu aktiivset hoidjat ega tagastusajalugu.";

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
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
          <span className="text-primary">{keycard.keycardNumber}</span>
        </nav>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">
                Kiipkaardi üksikasjad
              </h1>
              <StatusBadge status={keycard.status} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              ID: {keycard.keycardNumber}
            </p>
            <p className="max-w-2xl text-slate-500">{currentStateText}</p>
          </div>

          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/keys">
              <ArrowBackIcon className="!text-base" />
              Tagasi nimekirja
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <InfoOutlinedIcon className="mt-0.5 !text-base text-blue-600" />
          <p>
            Praegune `GET /api/keycards/{"{cardId}"}` endpoint tagastab
            aktiivse hoidja, hoidja `person_in_role` ID ning viimased teadaolevad
            väljastus- või tagastusajad. Väljastaja, vastuvõtulaud ja täielik
            ajalugu ei tule sellest response’ist veel kaasa.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            icon={<CreditCardIcon className="!text-lg text-primary" />}
            title="Kaardi informatsioon"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <DetailField label="Kaardi number" value={keycard.keycardNumber} />
              <DetailField
                label="Staatus"
                value={getKeycardStatusLabel(keycard.status)}
              />
              <DetailField
                label="Aktiivne"
                value={keycard.active ? "Jah" : "Ei"}
              />
              <DetailField
                label="Kehtib kuni"
                value={formatDateTime(keycard.validUntil, "Määramata")}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<PersonIcon className="!text-lg text-primary" />}
            title="Määramise üksikasjad"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <DetailField
                label="Praegune kasutaja"
                value={keycard.assignedUser ?? "Aktiivne kasutaja puudub"}
                accent={Boolean(keycard.assignedUser)}
              />
              <DetailField
                label="Hoidja person_in_role ID"
                value={keycard.assignedPersonInRoleId ?? "Seos puudub"}
              />
              <DetailField
                label="Väljastamise aeg"
                value={formatDateTime(keycard.assignedTime, "Puudub")}
              />
              <DetailField
                label="Viimati tagastatud"
                value={formatDateTime(keycard.lastReturnTime, "Puudub")}
              />
              <DetailField
                label="Külastaja seos"
                value={
                  keycard.assignedPersonInRoleId
                    ? "Aktiivne"
                    : "Eemaldatud või puudub"
                }
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          icon={<HistoryIcon className="!text-lg text-primary" />}
          title="Ajaloo kokkuvõte"
        >
          <div className="space-y-4">
            <SummaryEvent
              icon={<EventAvailableIcon className="!text-base" />}
              title="Praegune või viimane väljastus"
              value={formatDateTime(keycard.assignedTime, "Puudub")}
              description={
                keycard.assignedUser
                  ? `Kaart on hetkel välja antud kasutajale ${keycard.assignedUser}.`
                  : "Kui kaart ei ole aktiivselt välja antud, on see väli null."
              }
              accentClass="border-blue-200 bg-blue-50 text-blue-700"
            />
            <SummaryEvent
              icon={<AssignmentReturnIcon className="!text-base" />}
              title="Viimane tagastus"
              value={formatDateTime(keycard.lastReturnTime, "Puudub")}
              description="Tagastatud kaardi korral näitab backend viimase tagastuse aega."
              accentClass="border-amber-200 bg-amber-50 text-amber-700"
            />
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Täieliku issue/return ajaloo, väljastaja ja vastuvõtulaua
              kuvamiseks on vaja eraldi history-andmeid või detailsemat
              response’i backendist.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PageState({
  title,
  description,
}: Readonly<{
  title: string;
  description?: string;
}>) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-2 max-w-lg text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: Readonly<{
  icon: ReactNode;
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
          {icon} {title}
        </h2>
      </div>
      {children}
    </section>
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
        className={`break-all text-sm font-semibold ${accent ? "text-primary" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryEvent({
  icon,
  title,
  value,
  description,
  accentClass,
}: Readonly<{
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  accentClass: string;
}>) {
  return (
    <div className="flex gap-4">
      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${accentClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-4">
        <div className="flex items-start gap-2">
          <LinkIcon className="mt-0.5 !text-base text-slate-400" />
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: Readonly<{ status: KeycardDetailResponse["status"] }>) {
  const styles: Record<KeycardDetailResponse["status"], string> = {
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

function formatDateTime(value: string | null, emptyLabel: string): string {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("et-EE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
