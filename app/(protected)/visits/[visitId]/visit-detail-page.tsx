"use client";

import Link from "next/link";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { getKeycardById, type KeycardResponse } from "@/lib/api/keycards";
import {
  editVisit,
  deriveVisitStatus,
  getVisitDetail,
  getVisitTimeline,
  registerVisitDeparture,
  type EditVisitRequest,
  type VisitDetailResponse,
  type VisitStatusKey,
  type VisitTimelineEvent,
} from "@/lib/api/visits";
import {
  getAccessPoints,
  type AccessPointResponse,
} from "@/lib/api/accessPoints";
import { searchEmployees, type PersonInRoleResponse } from "@/lib/api/persons";
import { getCurrentUserRoleInfo } from "@/lib/session";
import { cn } from "@/lib/utils";
import { getMe, type MeResponse } from "@/lib/api/auth";

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
  return { data, isLoading: data === null, error: null };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE;
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

function formatTime(value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
    events.find((e) => e.eventType === "ARRIVAL_REGISTERED")?.occurredAt ?? null
  );
}

function getDepartureFromTimeline(events: VisitTimelineEvent[]): string | null {
  return (
    events.find((e) => e.eventType === "DEPARTURE_REGISTERED")?.occurredAt ??
    null
  );
}

/** True when the ISO timestamp is strictly in the future. */
function isInFuture(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date > new Date();
}

/** Converts any Date-parseable string to "YYYY-MM-DDTHH:mm" for datetime-local input. */
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Converts datetime-local value to ISO local string Spring's LocalDateTime can parse. */
function fromDatetimeLocal(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function getStatusPresentation(status: VisitStatusKey | "loading"): {
  label: string;
  className: string;
} {
  const map: Record<string, { label: string; className: string }> = {
    loading: { label: "Laadimisel", className: "bg-slate-100 text-slate-600" },
    planned: { label: "Planeeritud", className: "bg-sky-100 text-sky-700" },
    in_building: {
      label: "Aktiivne",
      className: "bg-emerald-100 text-emerald-700",
    },
    departed: { label: "Lahkunud", className: "bg-slate-100 text-slate-600" },
    expired: { label: "Aegunud", className: "bg-amber-100 text-amber-700" },
    cancelled: { label: "Tühistatud", className: "bg-rose-100 text-rose-700" },
    unknown: {
      label: "Staatus puudub",
      className: "bg-slate-100 text-slate-600",
    },
  };
  return map[status];
}

function isFuture(value: string | null | undefined): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d > new Date();
}

function getTimelineEventCopy(eventType: string, occurredAt?: string | null) {
  const future = isFuture(occurredAt);

  switch (eventType) {
    case "ARRIVAL_REGISTERED":
      if (future) {
        return {
          eyebrow: "Saabumine",
          title: "Oodatav registreerimine",
          description:
            "Külastaja eeldatav saabumise aeg. Registreerimine toimub saabumisel.",
          iconClassName: "bg-sky-100 text-sky-700 ring-sky-100",
        };
      }
      return {
        eyebrow: "Saabumine",
        title: "Registreeritud saabumine",
        description: "Külastaja saabumine registreeriti süsteemis.",
        iconClassName: "bg-primary text-white ring-primary/10",
      };

    case "DEPARTURE_REGISTERED":
      if (future) {
        return {
          eyebrow: "Lahkumine",
          title: "Oodatav lahkumine",
          description: "Külastaja eeldatav lahkumise aeg.",
          iconClassName: "bg-amber-100 text-amber-700 ring-amber-100",
        };
      }
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

// View model

interface VisitDetailViewModel {
  readonly detailState: RequestState<VisitDetailResponse>;
  readonly timelineState: RequestState<VisitTimelineEvent[]>;
  readonly keycardState: RequestState<KeycardResponse>;
  readonly detail: VisitDetailResponse | null;
  readonly canEdit: boolean;
  readonly canRegisterDeparture: boolean;
  readonly statusKey: VisitStatusKey | "loading";
  readonly statusPresentation: { label: string; className: string };
  readonly arrivalTime: string | null;
  readonly departureTime: string | null;
  readonly linkedCardId: string | null;
  readonly keycardNumber: string | null;
  readonly displayName: string;
  readonly reversedTimeline: VisitTimelineEvent[];
  readonly isRegisteringDeparture: boolean;
  readonly actionError: string | null;
  readonly actionMessage: string | null;
  readonly isEditModalOpen: boolean;
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
  readonly openEditModal: () => void;
  readonly closeEditModal: () => void;
  readonly handleEditSuccess: () => Promise<void>;
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
    setState({ data, isLoading: false, error: null });
    return data;
  } catch (error) {
    if (isAbortError(error)) return null;
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
  return [...events].sort((a, b) => {
    const at = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
    const bt = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
    return at - bt;
  });
}

function deriveStatusKey(
  detail: VisitDetailResponse | null,
  timelineState: RequestState<VisitTimelineEvent[]>,
  timeline: VisitTimelineEvent[],
): VisitStatusKey | "loading" {
  if (detail?.status != null) return deriveVisitStatus(detail.status, timeline);
  if (timelineState.isLoading && !timelineState.data) return "loading";
  if (timelineState.error && !timelineState.data) return "unknown";
  return deriveVisitStatus(null, timeline);
}

function getDepartureButtonLabel(
  statusKey: VisitStatusKey | "loading",
  isRegistering: boolean,
): string {
  if (statusKey === "departed") return "Lahkumine registreeritud";
  if (isRegistering) return "Registreerin lahkumist...";
  return "Registreeri lahkumine";
}

function getAuditEventIconClass(iconClassName: string): string {
  return iconClassName.includes("text-white")
    ? "bg-primary/10 text-primary"
    : "bg-slate-100 text-slate-500";
}

function TimelineEventIcon({ eventType }: { readonly eventType: string }) {
  if (eventType === "ARRIVAL_REGISTERED")
    return <LoginIcon className="!text-lg" />;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      setKeycardState({ data: null, isLoading: false, error: null });
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

  async function handleEditSuccess() {
    setActionMessage("Külastuse andmed uuendati edukalt.");
    await Promise.all([refreshDetail(), refreshTimeline()]);
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
    reversedTimeline,
    isRegisteringDeparture,
    actionError,
    actionMessage,
    isEditModalOpen,
    refreshDetail,
    refreshTimeline,
    refreshKeycard,
    handleRegisterDeparture,
    handleEditSuccess,
    openEditModal: () => {
      setActionError(null);
      setActionMessage(null);
      setIsEditModalOpen(true);
    },
    closeEditModal: () => setIsEditModalOpen(false),
  };
}

// Edit Visit Modal

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

interface EditVisitModalProps {
  readonly visitId: string;
  readonly detail: VisitDetailResponse | null;
  readonly onClose: () => void;
  readonly onSuccess: () => Promise<void>;
}

function EditVisitModal({
  visitId,
  detail,
  onClose,
  onSuccess,
}: EditVisitModalProps) {
  const [accessPoints, setAccessPoints] = useState<AccessPointResponse[]>([]);
  const [accessPointId, setAccessPointId] = useState(
    detail?.accessPointId ?? "",
  );
  const [entryTime, setEntryTime] = useState(
    toDatetimeLocal(detail?.arrivalTime),
  );
  const [exitTime, setExitTime] = useState(toDatetimeLocal(detail?.exitTime));
  const [comment, setComment] = useState(detail?.visitReason ?? "");

  // Host (optional)
  const [hostQuery, setHostQuery] = useState("");
  const [hostResults, setHostResults] = useState<PersonInRoleResponse[]>([]);
  const [isSearchingHost, setIsSearchingHost] = useState(false);
  const [selectedHost, setSelectedHost] = useState<PersonInRoleResponse | null>(
    null,
  );
  const hostAbortRef = useRef<AbortController | null>(null);

  // Assignor (required)
  const [assignorQuery, setAssignorQuery] = useState("");
  const [assignorResults, setAssignorResults] = useState<
    PersonInRoleResponse[]
  >([]);
  const [isSearchingAssignor, setIsSearchingAssignor] = useState(false);
  const [selectedAssignor, setSelectedAssignor] =
    useState<PersonInRoleResponse | null>(null);
  const assignorAbortRef = useRef<AbortController | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getAccessPoints()
      .then(setAccessPoints)
      .catch(() => {});
    getMe()
      .then((me: MeResponse) => {
        if (me.person) {
          searchEmployees(me.person.givenName)
            .then((results: PersonInRoleResponse[]) => {
              const match = results.find(
                (r: PersonInRoleResponse) => r.personId === me.personId,
              );
              if (match) {
                setSelectedAssignor(match);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleHostSearch() {
    if (hostQuery.trim().length < 2) return;
    hostAbortRef.current?.abort();
    hostAbortRef.current = new AbortController();
    setIsSearchingHost(true);
    try {
      const results = await searchEmployees(
        hostQuery.trim(),
        hostAbortRef.current.signal,
      );
      setHostResults(results);
    } catch {
      setHostResults([]);
    } finally {
      setIsSearchingHost(false);
    }
  }

  async function handleAssignorSearch() {
    if (assignorQuery.trim().length < 2) return;
    assignorAbortRef.current?.abort();
    assignorAbortRef.current = new AbortController();
    setIsSearchingAssignor(true);
    try {
      const results = await searchEmployees(
        assignorQuery.trim(),
        assignorAbortRef.current.signal,
      );
      setAssignorResults(results);
    } catch {
      setAssignorResults([]);
    } finally {
      setIsSearchingAssignor(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedAssignor) {
      setSubmitError("Vali muudatuse tegija.");
      return;
    }

    if (entryTime && exitTime) {
      const entry = new Date(entryTime);
      const exit = new Date(exitTime);

      if (exit < entry) {
        setSubmitError("Lahkumise aeg ei saa olla enne saabumist.");
        return;
      }
    }

    const body: EditVisitRequest = {
      accessPointId: accessPointId || detail?.accessPointId || undefined,
      assignorId: selectedAssignor.id,
      entryTime: entryTime ? fromDatetimeLocal(entryTime) : undefined,
      exitTime: exitTime ? fromDatetimeLocal(exitTime) : undefined,
      comment:
        comment.trim() !== ""
          ? comment.trim()
          : detail?.visitReason || undefined,
      hostId: selectedHost ? selectedHost.personId : undefined,
    };

    setIsSubmitting(true);
    try {
      await editVisit(visitId, body);
      await onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        getErrorMessage(err, "Külastuse muutmine ebaõnnestus. Proovi uuesti."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl md:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300">
        {/* Sticky header */}
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-7 py-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <EditOutlinedIcon className="text-primary !text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Muuda külastust
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Sulge"
          >
            <CloseIcon className="!text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto space-y-6 p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Osakond">
                <select
                  value={accessPointId}
                  onChange={(e) => setAccessPointId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Vali Osakond</option>
                  {accessPoints.map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.name}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Saabumise aeg">
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className={inputCls}
                />
              </ModalField>

              <ModalField label="Lahkumise aeg">
                <input
                  type="datetime-local"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className={inputCls}
                />
              </ModalField>
            </div>

            <ModalField label="Külastuse eesmärk / kommentaar">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kirjelda külastuse eesmärki…"
                maxLength={1024}
                rows={3}
                className={inputCls + " resize-none"}
              />
            </ModalField>

            <ModalField label="Võõrustaja">
              {detail?.hostName ? (
                <p className="mb-2 text-xs text-slate-400">
                  Võõrustaja:{" "}
                  <span className="font-semibold text-slate-600">
                    {detail.hostName}
                  </span>{" "}
                  — otsi allalt muutmiseks, jäta tühjaks eemaldamiseks.
                </p>
              ) : null}
              <PersonSearchField
                query={hostQuery}
                results={hostResults}
                isSearching={isSearchingHost}
                selected={selectedHost}
                placeholder="Otsi töötajat nimega…"
                onQueryChange={(v) => {
                  setHostQuery(v);
                  setHostResults([]);
                }}
                onSearch={handleHostSearch}
                onSelect={(p) => {
                  setSelectedHost(p);
                  setHostResults([]);
                  setHostQuery("");
                }}
                onClear={() => {
                  setSelectedHost(null);
                  setHostQuery("");
                  setHostResults([]);
                }}
                clearLabel="Eemalda Võõrustaja"
                highlightSelected={false}
              />
            </ModalField>

            {submitError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <ErrorOutlineIcon className="mt-0.5 shrink-0 text-rose-500" />
                {submitError}
              </div>
            ) : null}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-7 py-5 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-6 font-semibold"
            >
              Tühista
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="rounded-xl px-6 font-semibold"
            >
              Salvesta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable employee search widget used for both host and assignor
function PersonSearchField({
  query,
  results,
  isSearching,
  selected,
  placeholder,
  onQueryChange,
  onSearch,
  onSelect,
  onClear,
  clearLabel,
  highlightSelected,
}: {
  readonly query: string;
  readonly results: PersonInRoleResponse[];
  readonly isSearching: boolean;
  readonly selected: PersonInRoleResponse | null;
  readonly placeholder: string;
  readonly onQueryChange: (v: string) => void;
  readonly onSearch: () => void;
  readonly onSelect: (p: PersonInRoleResponse) => void;
  readonly onClear: () => void;
  readonly clearLabel: string;
  readonly highlightSelected: boolean;
}) {
  if (selected) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border px-3 py-2.5",
          highlightSelected
            ? "border-primary/30 bg-primary/5"
            : "border-slate-200 bg-slate-50",
        )}
      >
        <span className="text-sm font-semibold text-slate-800">
          {selected.givenName} {selected.surname}
          <span className="ml-2 text-xs font-normal text-slate-400">
            {selected.roleName}
          </span>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-2 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={clearLabel}
        >
          <CloseIcon className="!text-sm" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), onSearch())
          }
          placeholder={placeholder}
          className={inputCls + " flex-1"}
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching || query.trim().length < 2}
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
        >
          {isSearching ? (
            <span className="text-xs font-bold">…</span>
          ) : (
            <SearchIcon className="!text-base" />
          )}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-900 transition-colors hover:bg-primary/5"
              >
                {r.givenName} {r.surname}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {r.roleName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModalField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

// Page shell

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

function VisitDetailContent({
  visitId,
  model,
}: {
  readonly visitId: string;
  readonly model: VisitDetailViewModel;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <VisitPageHeader
        arrivalTime={model.arrivalTime}
        statusPresentation={model.statusPresentation}
        onEdit={model.openEditModal}
      />

      {model.actionError ? (
        <InlineMessage variant="error">{model.actionError}</InlineMessage>
      ) : null}
      {model.actionMessage ? (
        <InlineMessage variant="success">{model.actionMessage}</InlineMessage>
      ) : null}

      <div className="space-y-8">
        <VisitVisitorCardSection
          detail={model.detail}
          displayName={model.displayName}
          arrivalTime={model.arrivalTime}
          departureTime={model.departureTime}
          keycardNumber={model.keycardNumber}
          linkedCardId={model.linkedCardId}
          canRegisterDeparture={model.canRegisterDeparture}
          isRegisteringDeparture={model.isRegisteringDeparture}
          statusKey={model.statusKey}
          onRegisterDeparture={() => void model.handleRegisterDeparture()}
        />
        <VisitAuditLogSection
          timelineState={model.timelineState}
          reversedTimeline={model.reversedTimeline}
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

      {model.isEditModalOpen ? (
        <EditVisitModal
          visitId={visitId}
          detail={model.detail}
          onClose={model.closeEditModal}
          onSuccess={async () => {
            await Promise.all([model.refreshDetail(), model.refreshTimeline()]);
          }}
        />
      ) : null}
    </div>
  );
}

// Header

function VisitPageHeader({
  arrivalTime,
  statusPresentation,
  onEdit,
}: {
  readonly arrivalTime: string | null;
  readonly statusPresentation: { label: string; className: string };
  readonly onEdit: () => void;
}) {
  const arrivalIsFuture = isInFuture(arrivalTime);

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      <div className="space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit px-0 text-sm font-semibold text-slate-500 hover:bg-transparent hover:text-slate-900"
        >
          <Link href="/visits" aria-label="Tagasi külastuste nimekirja">
            <ArrowBackIcon className="!text-base" />
            Tagasi
          </Link>
        </Button>
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
            {arrivalIsFuture ? (
              <span className="font-medium text-sky-600">Oodatav algus</span>
            ) : (
              "Alustatud"
            )}{" "}
            <span className="font-semibold text-slate-700">
              {formatDateTime(arrivalTime)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="gap-2 bg-white px-6 py-6 text-base font-bold shadow-sm"
        >
          <EditOutlinedIcon className="!text-base" />
          Muuda andmeid
        </Button>
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

// Visitor card section

function VisitVisitorCardSection({
  detail,
  displayName,
  arrivalTime,
  departureTime,
  keycardNumber,
  linkedCardId,
  canRegisterDeparture,
  isRegisteringDeparture,
  statusKey,
  onRegisterDeparture,
}: {
  readonly detail: VisitDetailResponse | null;
  readonly displayName: string;
  readonly arrivalTime: string | null;
  readonly departureTime: string | null;
  readonly keycardNumber: string | null;
  readonly linkedCardId: string | null;
  readonly canRegisterDeparture: boolean;
  readonly isRegisteringDeparture: boolean;
  readonly statusKey: VisitStatusKey | "loading";
  readonly onRegisterDeparture: () => void;
}) {
  const arrivalIsFuture = isInFuture(arrivalTime);
  const departureIsFuture = isInFuture(departureTime);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-3 bg-primary" />
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
          <BadgeOutlinedIcon className="text-primary !text-2xl" />
          Külastaja andmed
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
              label={
                arrivalIsFuture ? "Oodatav saabumise aeg" : "Saabumise aeg"
              }
              value={formatDateTime(arrivalTime)}
              icon={<AccessTimeIcon className="!text-base" />}
              future={arrivalIsFuture}
            />
            <InfoField
              label={
                departureIsFuture ? "Oodatav lahkumise aeg" : "Lahkumise aeg"
              }
              value={formatDateTime(departureTime)}
              icon={<AccessTimeIcon className="!text-base" />}
              future={departureIsFuture}
            />
          </div>
        </div>
      </div>

      {canRegisterDeparture ? (
        <div className="border-t border-slate-100 bg-slate-50/60 p-6 flex justify-stretch md:justify-end">
          <Button
            type="button"
            className="w-full md:w-auto bg-primary hover:bg-primary/90 py-6 text-base font-black text-white shadow-lg shadow-primary/20"
            disabled={isRegisteringDeparture || statusKey === "departed"}
            onClick={onRegisterDeparture}
          >
            <LogoutIcon className="!text-base" />
            {getDepartureButtonLabel(statusKey, isRegisteringDeparture)}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

// Audit log section

function VisitAuditLogSection({
  timelineState,
  reversedTimeline,
  onRetry,
}: {
  readonly timelineState: RequestState<VisitTimelineEvent[]>;
  readonly reversedTimeline: VisitTimelineEvent[];
  readonly onRetry: () => void;
}) {
  const isLoadingInitialTimeline =
    timelineState.isLoading && !timelineState.data;
  const timelineError = timelineState.error;
  const hasTimelineError = timelineError != null;
  const shouldShowEmpty =
    !timelineState.isLoading &&
    !hasTimelineError &&
    reversedTimeline.length === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-8 py-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
          <HistoryOutlinedIcon className="text-primary !text-2xl" />
          Ajajoon
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {isLoadingInitialTimeline ? <SectionSkeleton lines={3} /> : null}

        {hasTimelineError ? (
          <div className="px-8 py-6">
            <SectionError
              title="Ajajoont ei saanud laadida"
              description={timelineError}
              actionLabel="Proovi uuesti"
              onAction={onRetry}
              compact
            />
          </div>
        ) : null}

        {shouldShowEmpty ? (
          <EmptyState
            title="Ajajoone sündmusi pole"
            description="Backend ei tagastanud selle külastuse kohta ühtegi sündmust."
          />
        ) : null}

        {reversedTimeline.map((event) => {
          const copy = getTimelineEventCopy(event.eventType, event.occurredAt);
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

// Keycard section

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
  const keycardData = keycardState.data;
  const hasKeycardData = keycardData != null;
  const keycardError = keycardState.error;
  const hasKeycardError = keycardError != null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
      <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 mb-6">
        <CreditCardOutlinedIcon className="text-primary !text-2xl" />
        Seotud võtmekaart
      </div>

      {!hasLinkedCard ? (
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
          description={keycardError}
          actionLabel="Laadi kaart uuesti"
          onAction={onRetry}
          compact
        />
      ) : null}

      {hasLinkedCard && hasKeycardData ? (
        <div className="space-y-5">
          <MetaRow
            label="Kaardi number"
            value={formatFieldValue(keycardData.keycardNumber)}
          />
          <MetaRow
            label="Staatus"
            value={formatFieldValue(keycardData.status)}
          />
          <MetaRow
            label="Määratud kasutaja"
            value={formatFieldValue(keycardData.assignedUser)}
          />
          <MetaRow
            label="Viimati tagastatud"
            value={formatDateTime(keycardData.lastReturnTime)}
          />
        </div>
      ) : null}
    </section>
  );
}

// Root export

export function VisitDetailPage({ visitId }: VisitDetailPageProps) {
  const model = useVisitDetailPageModel(visitId);
  const detailError = model.detailState.error;

  if (model.detailState.isLoading && !model.detail)
    return <VisitDetailSkeleton />;

  if (detailError && !model.detail) {
    return (
      <VisitDetailErrorState
        error={detailError}
        onRetry={() => void model.refreshDetail()}
      />
    );
  }

  return <VisitDetailContent visitId={visitId} model={model} />;
}

// Shared small components

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
  future = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly prominent?: boolean;
  readonly linkLike?: boolean;
  readonly future?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]",
          future ? "text-sky-500" : "text-slate-400",
        )}
      >
        <span className={future ? "text-sky-400" : "text-slate-300"}>
          {icon}
        </span>
        {label}
      </div>
      <div
        className={cn(
          "text-slate-900",
          prominent
            ? "text-3xl font-black tracking-tight"
            : "text-xl font-semibold",
          linkLike && "text-primary",
          future && "text-sky-700",
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
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-18 rounded-2xl bg-slate-100 animate-pulse" />
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
