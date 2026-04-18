"use client";

import Link from "next/link";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
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
        title: eventType.replaceAll("_", " ").toLowerCase(),
        description: "Sündmus tagastati backendist.",
        iconClassName: "bg-slate-100 text-slate-600 ring-slate-100",
      };
  }
}

interface VisitDetailViewModel {
  readonly detailState: RequestState<VisitDetailResponse>;
  readonly timelineState: RequestState<VisitTimelineEvent[]>;
  readonly keycardState: RequestState<KeycardResponse>;
  readonly detail: VisitDetailResponse | null;
  readonly canEdit: boolean;
  readonly canRegisterDeparture: boolean;
  readonly statusKey: VisitStatusKey | "loading";
  readonly statusPresentation: {
    label: string;
    className: string;
  };
  readonly arrivalTime: string | null;
  readonly departureTime: string | null;
  readonly linkedCardId: string | null;
  readonly keycardNumber: string | null;
  readonly displayName: string;
  readonly sortedTimeline: VisitTimelineEvent[];
  readonly reversedTimeline: VisitTimelineEvent[];
  readonly isRegisteringDeparture: boolean;
  readonly actionError: string | null;
  readonly actionMessage: string | null;
  readonly refreshDetail: (
    signal?: AbortSignal,
  ) => Promise<VisitDetailResponse | null>;
  readonly refreshTimeline: (
    signal?: AbortSignal,
  ) => Promise<VisitTimelineEvent[] | null>;
  readonly refreshKeycard: (
    cardId: string,
    signal?: AbortSignal,
  ) => Promise<KeycardResponse | null>;
  readonly handleRegisterDeparture: () => Promise<void>;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function loadIntoState<T>({
  load,
  setState,
  fallback,
  signal,
}: Readonly<{
  load: () => Promise<T>;
  setState: Dispatch<SetStateAction<RequestState<T>>>;
  fallback: string;
  signal?: AbortSignal;
}>): Promise<T | null> {
  setState((current) => ({
    data: signal ? null : current.data,
    isLoading: true,
    error: null,
  }));

  try {
    const data = await load();
    setState({
      data,
      isLoading: false,
      error: null,
    });
    return data;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }

    setState({
      data: null,
      isLoading: false,
      error: getErrorMessage(error, fallback),
    });
    return null;
  }
}

function getVisitPermissions() {
  const roleInfo = getCurrentUserRoleInfo();

  return {
    canEdit:
      roleInfo.hasRoleInfo &&
      roleInfo.roles.some((role) => EDIT_ALLOWED_ROLES.has(role)),
    canRegisterDeparture:
      !roleInfo.hasRoleInfo ||
      roleInfo.roles.some((role) => EXIT_ALLOWED_ROLES.has(role)),
  };
}

function sortTimelineEvents(
  events: VisitTimelineEvent[],
): VisitTimelineEvent[] {
  return [...events].sort((left, right) => {
    const leftTime = left.occurredAt ? new Date(left.occurredAt).getTime() : 0;
    const rightTime = right.occurredAt
      ? new Date(right.occurredAt).getTime()
      : 0;
    return leftTime - rightTime;
  });
}

function deriveStatusKey(
  detail: VisitDetailResponse | null,
  timelineState: RequestState<VisitTimelineEvent[]>,
  timeline: VisitTimelineEvent[],
): VisitStatusKey | "loading" {
  if (detail?.status != null) {
    return deriveVisitStatus(detail.status, timeline);
  }

  if (timelineState.isLoading && !timelineState.data) {
    return "loading";
  }

  if (timelineState.error && !timelineState.data) {
    return "unknown";
  }

  return deriveVisitStatus(null, timeline);
}

function getDepartureButtonLabel(
  statusKey: VisitStatusKey | "loading",
  isRegisteringDeparture: boolean,
): string {
  if (statusKey === "departed") {
    return "Lahkumine registreeritud";
  }

  if (isRegisteringDeparture) {
    return "Registreerin lahkumist...";
  }

  return "Registreeri lahkumine";
}

function getAuditEventIconClass(iconClassName: string): string {
  return iconClassName.includes("text-white")
    ? "bg-primary/10 text-primary"
    : "bg-slate-100 text-slate-500";
}

function TimelineEventIcon({ eventType }: { readonly eventType: string }) {
  if (eventType === "ARRIVAL_REGISTERED") {
    return <LoginIcon className="!text-lg" />;
  }

  return <LogoutIcon className="!text-lg" />;
}

function useVisitDetailPageModel(visitId: string): VisitDetailViewModel {
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

  const permissions = useMemo(() => getVisitPermissions(), []);
  const detail = detailState.data;
  const timeline = useMemo(
    () => timelineState.data ?? [],
    [timelineState.data],
  );
  const sortedTimeline = useMemo(
    () => sortTimelineEvents(timeline),
    [timeline],
  );
  const reversedTimeline = useMemo(
    () => [...sortedTimeline].reverse(),
    [sortedTimeline],
  );
  const statusKey = deriveStatusKey(detail, timelineState, timeline);
  const statusPresentation = getStatusPresentation(statusKey);
  const arrivalTime = detail?.arrivalTime ?? getArrivalFromTimeline(timeline);
  const departureTime = detail?.exitTime ?? getDepartureFromTimeline(timeline);
  const linkedCardId = detail?.cardId ?? null;
  const keycardNumber =
    detail?.keycardNumber ?? keycardState.data?.keycardNumber ?? null;
  const displayName = buildDisplayName(detail);

  async function refreshDetail(signal?: AbortSignal) {
    return loadIntoState({
      load: () => getVisitDetail(visitId, signal),
      setState: setDetailState,
      fallback: "Külastuse andmete laadimine ebaõnnestus.",
      signal,
    });
  }

  async function refreshTimeline(signal?: AbortSignal) {
    return loadIntoState({
      load: () => getVisitTimeline(visitId, signal),
      setState: setTimelineState,
      fallback: "Külastuse ajajoont ei saanud laadida.",
      signal,
    });
  }

  async function refreshKeycard(cardId: string, signal?: AbortSignal) {
    return loadIntoState({
      load: () => getKeycardById(cardId, signal),
      setState: setKeycardState,
      fallback: "Seotud võtmekaarti ei saanud laadida.",
      signal,
    });
  }

  useEffect(() => {
    const controller = new AbortController();

    setActionError(null);
    setActionMessage(null);
    setDetailState(createInitialState());
    setTimelineState(createInitialState());
    setKeycardState(createInitialState<KeycardResponse>(null));

    void loadIntoState({
      load: () => getVisitDetail(visitId, controller.signal),
      setState: setDetailState,
      fallback: "Külastuse andmete laadimine ebaõnnestus.",
      signal: controller.signal,
    });
    void loadIntoState({
      load: () => getVisitTimeline(visitId, controller.signal),
      setState: setTimelineState,
      fallback: "Külastuse ajajoont ei saanud laadida.",
      signal: controller.signal,
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

    void loadIntoState({
      load: () => getKeycardById(linkedCardId, controller.signal),
      setState: setKeycardState,
      fallback: "Seotud võtmekaarti ei saanud laadida.",
      signal: controller.signal,
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

  return {
    detailState,
    timelineState,
    keycardState,
    detail,
    canEdit: permissions.canEdit,
    canRegisterDeparture: permissions.canRegisterDeparture,
    statusKey,
    statusPresentation,
    arrivalTime,
    departureTime,
    linkedCardId,
    keycardNumber,
    displayName,
    sortedTimeline,
    reversedTimeline,
    isRegisteringDeparture,
    actionError,
    actionMessage,
    refreshDetail,
    refreshTimeline,
    refreshKeycard,
    handleRegisterDeparture,
  };
}

function VisitDetailErrorState({
  error,
  onRetry,
}: {
  readonly error: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <Breadcrumb />
      <SectionError
        title="Külastuse andmeid ei saanud avada"
        description={error}
        actionLabel="Proovi uuesti"
        onAction={onRetry}
      />
    </div>
  );
}

interface VisitDetailContentProps {
  readonly visitId: string;
  readonly model: VisitDetailViewModel;
}

function VisitDetailContent({ visitId, model }: VisitDetailContentProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <VisitPageHeader
        visitId={visitId}
        arrivalTime={model.arrivalTime}
        canEdit={model.canEdit}
        statusPresentation={model.statusPresentation}
      />

      {model.actionError ? (
        <InlineMessage variant="error">{model.actionError}</InlineMessage>
      ) : null}
      {model.actionMessage ? (
        <InlineMessage variant="success">{model.actionMessage}</InlineMessage>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1.05fr)] gap-8">
        <div className="space-y-8">
          <VisitVisitorCardSection
            detail={model.detail}
            displayName={model.displayName}
            departureTime={model.departureTime}
            keycardNumber={model.keycardNumber}
            linkedCardId={model.linkedCardId}
            canRegisterDeparture={model.canRegisterDeparture}
            isRegisteringDeparture={model.isRegisteringDeparture}
            statusKey={model.statusKey}
            onBack={() => router.push("/visits")}
            onRegisterDeparture={() => void model.handleRegisterDeparture()}
          />
          <VisitAuditLogSection
            timelineState={model.timelineState}
            reversedTimeline={model.reversedTimeline}
          />
        </div>

        <div className="space-y-8">
          <VisitTimelineSection
            timelineState={model.timelineState}
            sortedTimeline={model.sortedTimeline}
            onRetry={() => void model.refreshTimeline()}
          />
          <VisitKeycardSection
            linkedCardId={model.linkedCardId}
            keycardState={model.keycardState}
            onRetry={() =>
              model.linkedCardId
                ? void model.refreshKeycard(model.linkedCardId)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

function VisitPageHeader({
  visitId,
  arrivalTime,
  canEdit,
  statusPresentation,
}: {
  readonly visitId: string;
  readonly arrivalTime: string | null;
  readonly canEdit: boolean;
  readonly statusPresentation: {
    label: string;
    className: string;
  };
}) {
  return (
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
  );
}

function VisitVisitorCardSection({
  detail,
  displayName,
  departureTime,
  keycardNumber,
  linkedCardId,
  canRegisterDeparture,
  isRegisteringDeparture,
  statusKey,
  onBack,
  onRegisterDeparture,
}: {
  readonly detail: VisitDetailResponse | null;
  readonly displayName: string;
  readonly departureTime: string | null;
  readonly keycardNumber: string | null;
  readonly linkedCardId: string | null;
  readonly canRegisterDeparture: boolean;
  readonly isRegisteringDeparture: boolean;
  readonly statusKey: VisitStatusKey | "loading";
  readonly onBack: () => void;
  readonly onRegisterDeparture: () => void;
}) {
  return (
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
              icon={<AssignmentTurnedInOutlinedIcon className="!text-base" />}
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
          onClick={onBack}
        >
          <ArrowBackIcon className="!text-base" />
          Tagasta nimekirja
        </Button>
        {canRegisterDeparture ? (
          <Button
            type="button"
            className="bg-primary hover:bg-primary/90 py-6 text-base font-black text-white shadow-lg shadow-primary/20"
            disabled={isRegisteringDeparture || statusKey === "departed"}
            onClick={onRegisterDeparture}
          >
            <LogoutIcon className="!text-base" />
            {getDepartureButtonLabel(statusKey, isRegisteringDeparture)}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function VisitAuditLogSection({
  timelineState,
  reversedTimeline,
}: {
  readonly timelineState: RequestState<VisitTimelineEvent[]>;
  readonly reversedTimeline: VisitTimelineEvent[];
}) {
  const isLoadingInitialTimeline =
    timelineState.isLoading && !timelineState.data;
  const shouldShowEmptyAuditLog =
    !timelineState.isLoading &&
    !timelineState.error &&
    reversedTimeline.length === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
          <HistoryOutlinedIcon className="text-primary !text-2xl" />
          Auditi logi
        </div>
        <span className="text-sm font-bold text-primary">Vaata kõiki</span>
      </div>

      <div className="divide-y divide-slate-100">
        {isLoadingInitialTimeline ? <SectionSkeleton lines={3} /> : null}

        {shouldShowEmptyAuditLog ? (
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
                    getAuditEventIconClass(copy.iconClassName),
                  )}
                >
                  <TimelineEventIcon eventType={event.eventType} />
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
  );
}

function VisitTimelineSection({
  timelineState,
  sortedTimeline,
  onRetry,
}: {
  readonly timelineState: RequestState<VisitTimelineEvent[]>;
  readonly sortedTimeline: VisitTimelineEvent[];
  readonly onRetry: () => void;
}) {
  const isLoadingInitialTimeline =
    timelineState.isLoading && !timelineState.data;
  const hasTimelineError = timelineState.error != null;
  const hasTimelineEvents = !hasTimelineError && sortedTimeline.length > 0;
  const shouldShowEmptyTimeline =
    !timelineState.isLoading &&
    !hasTimelineError &&
    sortedTimeline.length === 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
      <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 mb-8">
        <TimelineOutlinedIcon className="text-primary !text-2xl" />
        Külastuse ajajoon
      </div>

      {isLoadingInitialTimeline ? <SectionSkeleton lines={4} /> : null}

      {hasTimelineError ? (
        <SectionError
          title="Ajajoont ei saanud laadida"
          description={timelineState.error}
          actionLabel="Proovi uuesti"
          onAction={onRetry}
          compact
        />
      ) : null}

      {hasTimelineEvents ? (
        <ol className="space-y-10">
          {sortedTimeline.map((event, index) => {
            const copy = getTimelineEventCopy(event.eventType);
            const isLast = index === sortedTimeline.length - 1;
            const hasTrailingConnector = !isLast;

            return (
              <li key={event.id} className="relative flex gap-5">
                <div className="relative flex shrink-0 flex-col items-center">
                  <div
                    className={cn(
                      "relative z-10 flex size-12 items-center justify-center rounded-full ring-4",
                      copy.iconClassName,
                    )}
                  >
                    <TimelineEventIcon eventType={event.eventType} />
                  </div>
                  {hasTrailingConnector ? (
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

      {shouldShowEmptyTimeline ? (
        <EmptyState
          title="Ajajoone sündmusi pole"
          description="MVP-s kuvatakse ainult sündmused, mida `/timeline` endpoint päriselt tagastab."
        />
      ) : null}

      <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex items-start gap-3">
        <InfoOutlinedIcon className="text-primary mt-0.5" />
        <div>
          <p className="text-lg font-bold text-primary">Turvameeldetuletus</p>
          <p className="text-sm text-primary/80 leading-6">
            Detailvaates kuvatakse ainult backendist saadaolevad väljad.
            Auditlogi ja ajajoon põhinevad praegu samadel reaalselt tagastatud
            sündmustel.
          </p>
        </div>
      </div>
    </section>
  );
}

function VisitKeycardSection({
  linkedCardId,
  keycardState,
  onRetry,
}: {
  readonly linkedCardId: string | null;
  readonly keycardState: RequestState<KeycardResponse>;
  readonly onRetry: () => void;
}) {
  const hasLinkedCard = linkedCardId != null;
  const hasKeycardData = keycardState.data != null;
  const hasKeycardError = keycardState.error != null;
  const shouldShowMissingCardState = !hasLinkedCard;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
      <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 mb-6">
        <CreditCardOutlinedIcon className="text-primary !text-2xl" />
        Seotud võtmekaart
      </div>

      {shouldShowMissingCardState ? (
        <EmptyState
          title="Kiipkaart puudub"
          description="Selle külastuse detailandmed ei sisalda seotud kaardi ID-d."
        />
      ) : null}

      {hasLinkedCard && keycardState.isLoading ? (
        <SectionSkeleton lines={2} />
      ) : null}

      {hasLinkedCard && hasKeycardError ? (
        <SectionError
          title="Kiipkaardi andmeid ei saanud laadida"
          description={keycardState.error}
          actionLabel="Laadi kaart uuesti"
          onAction={onRetry}
          compact
        />
      ) : null}

      {hasLinkedCard && hasKeycardData ? (
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
  );
}

export function VisitDetailPage({ visitId }: VisitDetailPageProps) {
  const model = useVisitDetailPageModel(visitId);

  if (model.detailState.isLoading && !model.detail) {
    return <VisitDetailSkeleton />;
  }

  if (model.detailState.error && !model.detail) {
    return (
      <VisitDetailErrorState
        error={model.detailState.error}
        onRetry={() => void model.refreshDetail()}
      />
    );
  }

  return <VisitDetailContent visitId={visitId} model={model} />;
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
