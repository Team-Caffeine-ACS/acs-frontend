"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PersonIcon from "@mui/icons-material/Person";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Button } from "@/components/ui/button";
import {
  getAccessPoints,
  type AccessPointResponse,
} from "@/lib/api/accessPoints";
import {
  getDocumentTypes,
  type DocumentTypeResponse,
} from "@/lib/api/documentTypes";
import { getAvailableKeycards, type KeycardResponse } from "@/lib/api/keycards";
import {
  createPerson,
  searchVisitors,
  searchEmployees,
  type PersonInRoleResponse,
} from "@/lib/api/persons";
import { createVisit } from "@/lib/api/visits";
import { ApiError } from "@/lib/api/error";

interface SelectedVisitor {
  personId: string;
  givenName: string;
  surname: string;
}

export default function NewVisitPage() {
  const router = useRouter();

  // Reference data
  const [accessPoints, setAccessPoints] = useState<AccessPointResponse[]>([]);
  const [keycards, setKeycards] = useState<KeycardResponse[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>(
    [],
  );

  // Visitor state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PersonInRoleResponse[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVisitor, setSelectedVisitor] =
    useState<SelectedVisitor | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New person form
  const [givenName, setGivenName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  // Visit details
  const [accessPointId, setAccessPointId] = useState("");
  const [hostQuery, setHostQuery] = useState("");
  const [hostResults, setHostResults] = useState<PersonInRoleResponse[]>([]);
  const [isSearchingHost, setIsSearchingHost] = useState(false);
  const [selectedHost, setSelectedHost] = useState<PersonInRoleResponse | null>(
    null,
  );
  const [comment, setComment] = useState("");
  const [keycardId, setKeycardId] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchAbortRef = useRef<AbortController | null>(null);
  const hostAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.all([getAccessPoints(), getAvailableKeycards(), getDocumentTypes()])
      .then(([ap, kc, dt]) => {
        setAccessPoints(ap);
        setKeycards(kc);
        setDocumentTypes(dt);
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          setSubmitError(err.message);
        }
      });
  }, []);

  const handleVisitorSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    searchAbortRef.current?.abort();
    searchAbortRef.current = new AbortController();
    setIsSearching(true);
    setHasSearched(false);
    setSearchResults([]);
    try {
      const results = await searchVisitors(
        searchQuery.trim(),
        searchAbortRef.current.signal,
      );
      setSearchResults(results);
      setHasSearched(true);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHostSearch = async () => {
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
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setHostResults([]);
    } finally {
      setIsSearchingHost(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedVisitor && !showCreateForm) {
      setSubmitError("Otsi ja vali külastaja või loo uus.");
      return;
    }
    if (!accessPointId) {
      setSubmitError("Vali ligipääsupunkt.");
      return;
    }

    setIsSubmitting(true);
    try {
      let personId: string;

      if (showCreateForm && !selectedVisitor) {
        if (
          !givenName.trim() ||
          !surname.trim() ||
          !identityCode.trim() ||
          !email.trim()
        ) {
          setSubmitError(
            "Täida eesnimi, perekonnanimi, isikukood ja e-posti aadress.",
          );
          setIsSubmitting(false);
          return;
        }
        const created = await createPerson({
          givenName: givenName.trim(),
          surname: surname.trim(),
          email: email.trim(),
          organization: organization.trim() || undefined,
          socialSecurityNumber: identityCode.trim() || undefined,
          documentTypeId: documentTypeId || undefined,
          documentNumber: documentNumber.trim() || undefined,
        });
        personId = created.id;
      } else {
        personId = selectedVisitor!.personId;
      }

      const createdVisit = await createVisit({
        personId,
        accessPointId,
        keycardId: keycardId || undefined,
        hostPersonInRoleId: selectedHost?.id || undefined,
        comment: comment.trim() || undefined,
      });

      router.push(`/visits/${createdVisit.visitId}`);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Viga salvestamisel. Proovi uuesti.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedKeycard = keycards.find((k) => k.id === keycardId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Lisa külastus
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Registreerige uus külastus ja määrake külastajale vajalikud
          pääsuõigused.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Section 1: Visitor ── */}
        <Card
          icon={<PersonIcon className="text-blue-700 !text-xl" />}
          title="Külalise andmed"
        >
          {/* Visitor search */}
          {!selectedVisitor && !showCreateForm && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHasSearched(false);
                    setSearchResults([]);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleVisitorSearch())
                  }
                  placeholder="Otsi olemasolevat külastajat nimega…"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleVisitorSearch}
                  disabled={isSearching || searchQuery.trim().length < 2}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {isSearching ? "…" : <SearchIcon className="!text-base" />}
                </button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVisitor({
                            personId: r.personId,
                            givenName: r.givenName,
                            surname: r.surname,
                          });
                          setShowCreateForm(false);
                          setSearchResults([]);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
                      >
                        <div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {r.givenName} {r.surname}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                            {r.roleName}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">
                          Vali
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {hasSearched && searchResults.length === 0 && (
                <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
                  Külastajat ei leitud.{" "}
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Loo uus profiil
                  </button>
                </p>
              )}

              {!hasSearched && !showCreateForm && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Ei leia?{" "}
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Lisa uus külaline
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Selected visitor chip */}
          {selectedVisitor && (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                  {selectedVisitor.givenName[0]}
                  {selectedVisitor.surname[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedVisitor.givenName} {selectedVisitor.surname}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Olemasolev külastaja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisitor(null);
                  setSearchQuery("");
                  setHasSearched(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
                aria-label="Eemalda valik"
              >
                <CloseIcon className="!text-base" />
              </button>
            </div>
          )}

          {/* Create new person form */}
          {showCreateForm && !selectedVisitor && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Uue külastaja andmed
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
                >
                  ← Tagasi otsingusse
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Eesnimi *">
                  <input
                    type="text"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    placeholder="Sisesta eesnimi"
                    maxLength={128}
                    className={inputCls}
                  />
                </Field>
                <Field label="Perekonnanimi *">
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Sisesta perekonnanimi"
                    maxLength={128}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Isikukood *">
                  <input
                    type="text"
                    value={identityCode}
                    onChange={(e) => setIdentityCode(e.target.value)}
                    placeholder="Sisesta isikukood"
                    maxLength={128}
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="Organisatsioon">
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Sisesta organisatsioon"
                    maxLength={255}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="E-posti aadress *">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nt. jaan@example.com"
                    maxLength={255}
                    className={inputCls}
                  />
                </Field>
                <Field label="Dokumendi tüüp">
                  <select
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Ilma dokumendita</option>
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {documentTypeId && (
                <Field label="Dokumendi nr">
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="nt. AB1234567"
                    maxLength={128}
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          )}
        </Card>

        {/* ── Section 2: Visit info ── */}
        <Card
          icon={<MeetingRoomIcon className="text-blue-700 !text-xl" />}
          title="Külastuse info"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pääsupunkt *">
              <select
                value={accessPointId}
                onChange={(e) => setAccessPointId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Vali pääsupunkt</option>
                {accessPoints.map((ap) => (
                  <option key={ap.id} value={ap.id}>
                    {ap.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Vastuvõtja (Host)">
              {selectedHost ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selectedHost.givenName} {selectedHost.surname}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHost(null);
                      setHostQuery("");
                      setHostResults([]);
                    }}
                    className="ml-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
                    aria-label="Eemalda host"
                  >
                    <CloseIcon className="!text-sm" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hostQuery}
                      onChange={(e) => {
                        setHostQuery(e.target.value);
                        setHostResults([]);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleHostSearch())
                      }
                      placeholder="Otsi töötajat…"
                      className={inputCls + " flex-1"}
                    />
                    <button
                      type="button"
                      onClick={handleHostSearch}
                      disabled={isSearchingHost || hostQuery.trim().length < 2}
                      className="rounded-lg bg-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <SearchIcon className="!text-sm text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                  {hostResults.length > 0 && (
                    <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                      {hostResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHost(r);
                              setHostResults([]);
                              setHostQuery("");
                            }}
                            className="w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-900 transition-colors hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-blue-500/10"
                          >
                            {r.givenName} {r.surname}
                            <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                              {r.roleName}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Field>
          </div>

          <Field label="Külastuse eesmärk">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Kirjelda külastuse eesmärki…"
              maxLength={1024}
              rows={3}
              className={inputCls + " resize-none"}
            />
          </Field>
        </Card>

        {/* ── Section 3: Keycard ── */}
        <Card
          icon={<CreditCardIcon className="text-blue-700 !text-xl" />}
          title="Võtmekaardi määramine"
        >
          <div className="flex items-center gap-3">
            <select
              value={keycardId}
              onChange={(e) => setKeycardId(e.target.value)}
              className={inputCls + " flex-1"}
            >
              <option value="">Ilma kaardita</option>
              {keycards.map((kc) => (
                <option key={kc.id} value={kc.id}>
                  Kaart {kc.keycardNumber}
                </option>
              ))}
            </select>
            {selectedKeycard && (
              <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircleIcon className="!text-sm" /> Kaart on vaba
              </span>
            )}
          </div>

          <div className="flex gap-2 rounded-lg bg-blue-50 px-3 py-3 text-xs text-slate-600 dark:bg-blue-500/10 dark:text-slate-300">
            <InfoOutlinedIcon className="mt-0.5 shrink-0 !text-base text-blue-500 dark:text-blue-300" />
            <span>
              Võtmekaardi väljastamisel aktiveerub see koheselt valitud
              pääsupunktides. Külaline on kohustatud kaardi tagastama külastuse
              lõpus. Kadunud kaardist teavitada viivitamatult administraatorit.
            </span>
          </div>
        </Card>

        {/* Error */}
        {submitError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            className="font-semibold rounded-xl px-6"
          >
            Tühista
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl px-8 gap-2"
          >
            <CheckCircleIcon className="!text-base" />
            {isSubmitting ? "Salvestan…" : "Registreeri külastus"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

// ── Sub-components ─────────────────────────────────────────
function Card({
  icon,
  title,
  children,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  const isRequired = label.endsWith(" *");
  const visibleLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <fieldset className="space-y-1.5">
      <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {visibleLabel}
        {isRequired && <span className="text-rose-600"> *</span>}
      </legend>
      {children}
    </fieldset>
  );
}
