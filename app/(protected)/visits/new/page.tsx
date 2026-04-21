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

  const handleSubmit = async (e: React.FormEvent) => {
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
        if (!givenName.trim() || !surname.trim() || !email.trim()) {
          setSubmitError("Täida eesnimi, perekonnanimi ja e-posti aadress.");
          setIsSubmitting(false);
          return;
        }
        const created = await createPerson({
          givenName: givenName.trim(),
          surname: surname.trim(),
          email: email.trim(),
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Lisa külastus
        </h2>
        <p className="text-sm text-slate-500 mt-1">
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
          {!selectedVisitor && (
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
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
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
                <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
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
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm font-semibold text-slate-900">
                            {r.givenName} {r.surname}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
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
                <p className="text-sm text-slate-500 px-1">
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
                <p className="text-xs text-slate-400">
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
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                  {selectedVisitor.givenName[0]}
                  {selectedVisitor.surname[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedVisitor.givenName} {selectedVisitor.surname}
                  </p>
                  <p className="text-xs text-slate-500">Olemasolev külastaja</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisitor(null);
                  setSearchQuery("");
                  setHasSearched(false);
                }}
                className="text-slate-400 hover:text-slate-600"
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Uue külastaja andmed
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
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
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedHost.givenName} {selectedHost.surname}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHost(null);
                      setHostQuery("");
                      setHostResults([]);
                    }}
                    className="text-slate-400 hover:text-slate-600 ml-2"
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
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
                    >
                      <SearchIcon className="!text-sm text-slate-600" />
                    </button>
                  </div>
                  {hostResults.length > 0 && (
                    <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {hostResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHost(r);
                              setHostResults([]);
                              setHostQuery("");
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm font-semibold text-slate-900 transition-colors"
                          >
                            {r.givenName} {r.surname}
                            <span className="ml-2 text-xs text-slate-400 font-normal">
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
              <span className="flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg whitespace-nowrap">
                <CheckCircleIcon className="!text-sm" /> Kaart on vaba
              </span>
            )}
          </div>

          <div className="flex gap-2 px-3 py-3 bg-blue-50 rounded-lg text-xs text-slate-600">
            <InfoOutlinedIcon className="!text-base text-blue-500 shrink-0 mt-0.5" />
            <span>
              Võtmekaardi väljastamisel aktiveerub see koheselt valitud
              pääsupunktides. Külaline on kohustatud kaardi tagastama külastuse
              lõpus. Kadunud kaardist teavitada viivitamatult administraatorit.
            </span>
          </div>
        </Card>

        {/* Error */}
        {submitError && (
          <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
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
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition";

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
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
  return (
    <fieldset className="space-y-1.5">
      <legend className="block text-sm font-medium text-slate-700">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
