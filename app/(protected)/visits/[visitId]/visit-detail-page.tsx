"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { getKeycardById, type KeycardResponse } from "@/lib/api/keycards";
import {
  deriveVisitStatus,
  getVisitDetail,
  getVisitTimeline,
  registerVisitDeparture,
  type VisitDetailResponse,
  type VisitStatusKey,
  type VisitTimelineEvent,
} from "@/lib/api/visits";
import { getCurrentUserRoleInfo } from "@/lib/session";
import { cn } from "@/lib/utils";

interface VisitDetailPageProps {
  readonly visitId: string;
}

interface RequestState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

const NOT_AVAILABLE = "Pole saadaval";
const EXIT_ALLOWED_ROLES = new Set(["ADMIN", "SECURITY_CHIEF", "RECEPTIONIST"]);
const EDIT_ALLOWED_ROLES = new Set(["ADMIN", "SECURITY_CHIEF"]);

function createInitialState<T>(data: T | null = null): RequestState<T> {
  return {
    data,
    isLoading: data === null,
    error: null,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return NOT_AVAILABLE;
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

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return NOT_AVAILABLE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFieldValue(value: string | null | undefined): string {
  return value?.trim() ? value : NOT_AVAILABLE;
}

function buildDisplayName(detail: VisitDetailResponse | null): string {
  const name = [detail?.firstName, detail?.lastName].filter(Boolean).join(" ");
  return name || "Külastaja";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getArrivalFromTimeline(events: VisitTimelineEvent[]): string | null {
  return (
    events.find((event) => event.eventType === "ARRIVAL_REGISTERED")
      ?.occurredAt ?? null
  );
}

function getDepartureFromTimeline(events: VisitTimelineEvent[]): string | null {
  return (
    events.find((event) => event.eventType === "DEPARTURE_REGISTERED")
      ?.occurredAt ?? null
  );
}

function getStatusPresentation(status: VisitStatusKey | "loading"): {
  label: string;
  className: string;
} {
  const presentations: Record<string, { label: string; className: string }> = {
    loading: {
      label: "Laadimisel",
      className: "bg-slate-100 text-slate-600",
    },
    planned: {
      label: "Planeeritud",
      className: "bg-sky-100 text-sky-700",
    },
    in_building: {
      label: "Aktiivne",
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

  return presentations[status];
}

function getTimelineEventCopy(eventType: string): {
  eyebrow: string;
  title: string;
  description: string;
  iconClassName: string;
} {
  switch (eventType) {
    case "ARRIVAL_REGISTERED":
      return {
        eyebrow: "Saabumine",
        title: "Registreeritud saabumine",
        description:
          "Külastaja saabumine registreeriti süsteemis. Ajajoones kuvatakse ainult backendist tagastatud sündmused.",
        iconClassName: "bg-primary text-white ring-primary/10",
      };
    case "DEPARTURE_REGISTERED":
      return {
        eyebrow: "Lahkumine",
        title: "Registreeritud lahkumine",
        description:
          "Külastaja lahkumine registreeriti süsteemis ja visiit on lõpetatud.",
        iconClassName: "bg-slate-100 text-slate-600 ring-slate-100",
      };
    default:
      return {
        eyebrow: "Sündmus",
        title: eventType.replace(/_/g, " ").toLowerCase(),
        description: "Sündmus tagastati backendist.",
        iconClassName: "bg-slate-100 text-slate-600 ring-slate-100",
      };
  }
}

export function VisitDetailPage({ visitId }: VisitDetailPageProps) {
  const router = useRouter();
  const [detailState, setDetailState] =
    useState<RequestState<VisitDetailResponse>>(createInitialState());
  const [timelineState, setTimelineState] =
    useState<RequestState<VisitTimelineEvent[]>>(createInitialState());
  const [keycardState, setKeycardState] = useState<
    RequestState<KeycardResponse>
  >(createInitialState<KeycardResponse>(null));
  const [isRegisteringDeparture, setIsRegisteringDeparture] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const roleInfo = useMemo(() => getCurrentUserRoleInfo(), []);
  const canEdit =
    roleInfo.hasRoleInfo &&
    roleInfo.roles.some((role) => EDIT_ALLOWED_ROLES.has(role));
  const canRegisterDeparture =
    !roleInfo.hasRoleInfo ||
    roleInfo.roles.some((role) => EXIT_ALLOWED_ROLES.has(role));

  const detail = detailState.data;
  const timeline = timelineState.data ?? [];
  const sortedTimeline = [...timeline].sort((left, right) => {
    const leftTime = left.occurredAt ? new Date(left.occurredAt).getTime() : 0;
    const rightTime = right.occurredAt
      ? new Date(right.occurredAt).getTime()
      : 0;
    return leftTime - rightTime;
  });
  const reversedTimeline = [...sortedTimeline].reverse();

  const statusKey: VisitStatusKey | "loading" =
    detail?.status != null
      ? deriveVisitStatus(detail.status, timeline)
      : timelineState.isLoading && !timelineState.data
        ? "loading"
        : timelineState.error && !timelineState.data
          ? "unknown"
          : deriveVisitStatus(null, timeline);
  const statusPresentation = getStatusPresentation(statusKey);

  const arrivalTime = detail?.arrivalTime ?? getArrivalFromTimeline(timeline);
  const departureTime = detail?.exitTime ?? getDepartureFromTimeline(timeline);
  const linkedCardId = detail?.cardId ?? null;
  const keycardNumber =
    detail?.keycardNumber ?? keycardState.data?.keycardNumber ?? null;
  const displayName = buildDisplayName(detail);

  async function refreshDetail(signal?: AbortSignal) {
    setDetailState((current) => ({
      data: signal ? null : current.data,
      isLoading: true,
      error: null,
    }));

    try {
      const nextDetail = await getVisitDetail(visitId, signal);
      setDetailState({
        data: nextDetail,
        isLoading: false,
        error: null,
      });
      return nextDetail;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }

      setDetailState({
        data: null,
        isLoading: false,
        error: getErrorMessage(
          error,
          "Külastuse andmete laadimine ebaõnnestus.",
        ),
      });
      return null;
    }
  }

  async function refreshTimeline(signal?: AbortSignal) {
    setTimelineState((current) => ({
      data: signal ? null : current.data,
      isLoading: true,
      error: null,
    }));

    try {
      const nextTimeline = await getVisitTimeline(visitId, signal);
      setTimelineState({
        data: nextTimeline,
        isLoading: false,
        error: null,
      });
      return nextTimeline;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }

      setTimelineState({
        data: null,
        isLoading: false,
        error: getErrorMessage(error, "Külastuse ajajoont ei saanud laadida."),
      });
      return null;
    }
  }

  async function refreshKeycard(cardId: string, signal?: AbortSignal) {
    setKeycardState((current) => ({
      data: signal ? null : current.data,
      isLoading: true,
      error: null,
    }));

    try {
      const nextKeycard = await getKeycardById(cardId, signal);
      setKeycardState({
        data: nextKeycard,
        isLoading: false,
        error: null,
      });
      return nextKeycard;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }

      setKeycardState({
        data: null,
        isLoading: false,
        error: getErrorMessage(error, "Seotud võtmekaarti ei saanud laadida."),
      });
      return null;
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    setActionError(null);
    setActionMessage(null);
    setDetailState(createInitialState());
    setTimelineState(createInitialState());
    setKeycardState(createInitialState<KeycardResponse>(null));

    void getVisitDetail(visitId, controller.signal)
      .then((nextDetail) => {
        setDetailState({
          data: nextDetail,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setDetailState({
          data: null,
          isLoading: false,
          error: getErrorMessage(
            error,
            "Külastuse andmete laadimine ebaõnnestus.",
          ),
        });
      });

    void getVisitTimeline(visitId, controller.signal)
      .then((nextTimeline) => {
        setTimelineState({
          data: nextTimeline,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setTimelineState({
          data: null,
          isLoading: false,
          error: getErrorMessage(
            error,
            "Külastuse ajajoont ei saanud laadida.",
          ),
        });
      });

    return () => controller.abort();
  }, [visitId]);

  useEffect(() => {
    const controller = new AbortController();

    if (!linkedCardId) {
      setKeycardState({
        data: null,
        isLoading: false,
        error: null,
      });
      return () => controller.abort();
    }

    setKeycardState({
      data: null,
      isLoading: true,
      error: null,
    });

    void getKeycardById(linkedCardId, controller.signal)
      .then((nextKeycard) => {
        setKeycardState({
          data: nextKeycard,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setKeycardState({
          data: null,
          isLoading: false,
          error: getErrorMessage(
            error,
            "Seotud võtmekaarti ei saanud laadida.",
          ),
        });
      });

    return () => controller.abort();
  }, [linkedCardId]);

  async function handleRegisterDeparture() {
    setActionError(null);
    setActionMessage(null);
    setIsRegisteringDeparture(true);

    try {
      await registerVisitDeparture(visitId);
      await Promise.all([refreshDetail(), refreshTimeline()]);
      setActionMessage("Lahkumine registreeriti edukalt.");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Lahkumise registreerimine ebaõnnestus."),
      );
    } finally {
      setIsRegisteringDeparture(false);
    }
  }

  if (detailState.isLoading && !detail) {
    return <VisitDetailSkeleton />;
  }

  if (detailState.error && !detail) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
        <Breadcrumb />
        <SectionError
          title="Külastuse andmeid ei saanud avada"
          description={detailState.error}
          actionLabel="Proovi uuesti"
          onAction={() => void refreshDetail()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-4">
          <Breadcrumb />
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Külastuse üksikasjad
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                  statusPresentation.className,
                )}
              >
                {statusPresentation.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm md:text-base">
              Külastuse ID{" "}
              <span className="font-semibold text-slate-700">{visitId}</span>
              {" · "}
              Alustatud{" "}
              <span className="font-semibold text-slate-700">
                {formatDateTime(arrivalTime)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="gap-2 bg-white px-6 py-6 text-base font-bold shadow-sm"
              title="Muutmise voog lisatakse eraldi sammuna."
            >
              <EditOutlinedIcon className="!text-base" />
              Muuda andmeid
            </Button>
          ) : null}
          <Button
            type="button"
            className="gap-2 bg-primary px-6 py-6 text-base font-bold text-white shadow-xl shadow-primary/20"
            disabled
            title="Printimise backend-tugi ei ole veel olemas."
          >
            <PrintOutlinedIcon className="!text-base" />
            Prindi luba
          </Button>
        </div>
      </div>

      {actionError ? (
        <InlineMessage variant="error">{actionError}</InlineMessage>
      ) : null}
      {actionMessage ? (
        <InlineMessage variant="success">{actionMessage}</InlineMessage>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1.05fr)] gap-8">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-3 bg-primary" />
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
                <BadgeOutlinedIcon className="text-primary !text-2xl" />
                Külastaja kaart
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)] gap-8 items-start">
                <div className="rounded-2xl bg-[linear-gradient(180deg,#ffd0b7_0%,#ffc1a3_100%)] p-6 shadow-inner">
                  <div className="aspect-[4/5] rounded-2xl bg-[radial-gradient(circle_at_top,#25354d_0%,#132033_65%,#0f172a_100%)] flex items-center justify-center text-6xl font-black text-white shadow-lg">
                    {getInitials(displayName)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <InfoField
                    label="Nimi"
                    value={displayName}
                    prominent
                    icon={<PersonOutlineOutlinedIcon className="!text-base" />}
                  />
                  <InfoField
                    label="Isikukood"
                    value={formatFieldValue(detail?.personalIdCode)}
                    icon={<BadgeOutlinedIcon className="!text-base" />}
                  />
                  <InfoField
                    label="Organisatsioon"
                    value={formatFieldValue(detail?.organization)}
                    icon={<BusinessOutlinedIcon className="!text-base" />}
                  />
                  <InfoField
                    label="Osakond"
                    value={formatFieldValue(detail?.department)}
                    icon={<BusinessOutlinedIcon className="!text-base" />}
                  />
                  <InfoField
                    label="Võõrustaja"
                    value={formatFieldValue(detail?.hostName)}
                    icon={<MeetingRoomOutlinedIcon className="!text-base" />}
                    linkLike={detail?.hostName != null}
                  />
                  <InfoField
                    label="Külastuse põhjus"
                    value={formatFieldValue(detail?.visitReason)}
                    icon={
                      <AssignmentTurnedInOutlinedIcon className="!text-base" />
                    }
                  />
                  <InfoField
                    label="Kaart"
                    value={formatFieldValue(keycardNumber ?? linkedCardId)}
                    icon={<CreditCardOutlinedIcon className="!text-base" />}
                  />
                  <InfoField
                    label="Lahkumise aeg"
                    value={formatDateTime(departureTime)}
                    icon={<AccessTimeIcon className="!text-base" />}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="py-6 text-base font-bold"
                onClick={() => router.push("/visits")}
              >
                <ArrowBackIcon className="!text-base" />
                Tagasta nimekirja
              </Button>
              {canRegisterDeparture ? (
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary/90 py-6 text-base font-black text-white shadow-lg shadow-primary/20"
                  disabled={isRegisteringDeparture || statusKey === "departed"}
                  onClick={() => void handleRegisterDeparture()}
                >
                  <LogoutIcon className="!text-base" />
                  {statusKey === "departed"
                    ? "Lahkumine registreeritud"
                    : isRegisteringDeparture
                      ? "Registreerin lahkumist..."
                      : "Registreeri lahkumine"}
                </Button>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
                <HistoryOutlinedIcon className="text-primary !text-2xl" />
                Auditi logi
              </div>
              <span className="text-sm font-bold text-primary">
                Vaata kõiki
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {timelineState.isLoading && !timelineState.data ? (
                <SectionSkeleton lines={3} />
              ) : null}

              {!timelineState.isLoading &&
              !timelineState.error &&
              reversedTimeline.length === 0 ? (
                <EmptyState
                  title="Auditi logi puudub"
                  description="Backend ei tagastanud selle külastuse kohta ühtegi logisündmust."
                />
              ) : null}

              {reversedTimeline.map((event) => {
                const copy = getTimelineEventCopy(event.eventType);

                return (
                  <div
                    key={`${event.id}-audit`}
                    className="px-8 py-5 flex items-start justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "mt-1 flex size-12 items-center justify-center rounded-full",
                          copy.iconClassName.includes("text-white")
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {event.eventType === "ARRIVAL_REGISTERED" ? (
                          <LoginIcon className="!text-lg" />
                        ) : (
                          <LogoutIcon className="!text-lg" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {copy.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {event.description ?? copy.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatTime(event.occurredAt)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {formatDateTime(event.occurredAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 mb-8">
              <TimelineOutlinedIcon className="text-primary !text-2xl" />
              Külastuse ajajoon
            </div>

            {timelineState.isLoading && !timelineState.data ? (
              <SectionSkeleton lines={4} />
            ) : null}

            {timelineState.error ? (
              <SectionError
                title="Ajajoont ei saanud laadida"
                description={timelineState.error}
                actionLabel="Proovi uuesti"
                onAction={() => void refreshTimeline()}
                compact
              />
            ) : null}

            {!timelineState.error && sortedTimeline.length > 0 ? (
              <ol className="space-y-10">
                {sortedTimeline.map((event, index) => {
                  const copy = getTimelineEventCopy(event.eventType);
                  const isLast = index === sortedTimeline.length - 1;

                  return (
                    <li key={event.id} className="relative flex gap-5">
                      <div className="relative flex shrink-0 flex-col items-center">
                        <div
                          className={cn(
                            "relative z-10 flex size-12 items-center justify-center rounded-full ring-4",
                            copy.iconClassName,
                          )}
                        >
                          {event.eventType === "ARRIVAL_REGISTERED" ? (
                            <LoginIcon className="!text-lg" />
                          ) : (
                            <LogoutIcon className="!text-lg" />
                          )}
                        </div>
                        {!isLast ? (
                          <div className="absolute top-12 h-[calc(100%+1.5rem)] w-px bg-primary/25" />
                        ) : null}
                      </div>

                      <div className="pb-2">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">
                          {copy.eyebrow} • {formatTime(event.occurredAt)}
                        </p>
                        <p className="mt-2 text-2xl font-bold leading-tight text-slate-900">
                          {copy.title}
                        </p>
                        <p className="mt-2 text-lg leading-8 text-slate-500">
                          {event.description ?? copy.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : null}

            {!timelineState.isLoading &&
            !timelineState.error &&
            sortedTimeline.length === 0 ? (
              <EmptyState
                title="Ajajoone sündmusi pole"
                description="MVP-s kuvatakse ainult sündmused, mida `/timeline` endpoint päriselt tagastab."
              />
            ) : null}

            <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex items-start gap-3">
              <InfoOutlinedIcon className="text-primary mt-0.5" />
              <div>
                <p className="text-lg font-bold text-primary">
                  Turvameeldetuletus
                </p>
                <p className="text-sm text-primary/80 leading-6">
                  Detailvaates kuvatakse ainult backendist saadaolevad väljad.
                  Auditlogi ja ajajoon põhinevad praegu samadel reaalselt
                  tagastatud sündmustel.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 mb-6">
              <CreditCardOutlinedIcon className="text-primary !text-2xl" />
              Seotud võtmekaart
            </div>

            {!linkedCardId ? (
              <EmptyState
                title="Kiipkaart puudub"
                description="Selle külastuse detailandmed ei sisalda seotud kaardi ID-d."
              />
            ) : null}

            {linkedCardId && keycardState.isLoading ? (
              <SectionSkeleton lines={2} />
            ) : null}

            {linkedCardId && keycardState.error ? (
              <SectionError
                title="Kiipkaardi andmeid ei saanud laadida"
                description={keycardState.error}
                actionLabel="Laadi kaart uuesti"
                onAction={() => void refreshKeycard(linkedCardId)}
                compact
              />
            ) : null}

            {linkedCardId && keycardState.data ? (
              <div className="space-y-5">
                <MetaRow
                  label="Kaardi number"
                  value={formatFieldValue(keycardState.data.keycardNumber)}
                />
                <MetaRow
                  label="Staatus"
                  value={formatFieldValue(keycardState.data.status)}
                />
                <MetaRow
                  label="Määratud kasutaja"
                  value={formatFieldValue(keycardState.data.assignedUser)}
                />
                <MetaRow
                  label="Viimati tagastatud"
                  value={formatDateTime(keycardState.data.lastReturnTime)}
                />
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400">
      <Link href="/" className="hover:text-primary transition-colors">
        Avaleht
      </Link>
      <ChevronRightIcon className="!text-xs text-slate-300" />
      <Link href="/visits" className="hover:text-primary transition-colors">
        Aktiivsed külastused
      </Link>
      <ChevronRightIcon className="!text-xs text-slate-300" />
      <span className="text-primary font-semibold">Külastuse andmed</span>
    </nav>
  );
}

function InfoField({
  label,
  value,
  icon,
  prominent = false,
  linkLike = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly prominent?: boolean;
  readonly linkLike?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <span className="text-slate-300">{icon}</span>
        {label}
      </div>
      <div
        className={cn(
          "text-slate-900",
          prominent
            ? "text-3xl font-black tracking-tight"
            : "text-xl font-semibold",
          linkLike && "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InlineMessage({
  children,
  variant,
}: {
  readonly children: React.ReactNode;
  readonly variant: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-semibold",
        variant === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function SectionError({
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700",
        compact && "rounded-2xl p-5",
      )}
    >
      <div className="flex items-start gap-3">
        <ErrorOutlineIcon className="mt-0.5 text-rose-500" />
        <div className="space-y-2">
          <p className="text-base font-bold">{title}</p>
          <p className="text-sm leading-6 text-rose-700/90">{description}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-rose-200 bg-white font-semibold text-rose-700 hover:bg-rose-100"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ lines }: { readonly lines: number }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-18 rounded-2xl bg-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}

function VisitDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="h-5 w-80 rounded-full bg-slate-200 animate-pulse" />
      <div className="flex justify-between gap-6">
        <div className="space-y-3">
          <div className="h-10 w-96 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-6 w-80 rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-14 w-52 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-14 w-44 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1.05fr)] gap-8">
        <div className="space-y-8">
          <div className="h-[520px] rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-[300px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-8">
          <div className="h-[720px] rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-[260px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
