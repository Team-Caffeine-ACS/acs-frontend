"use client";
import {
  FilterList,
  Search,
  FileDownload,
  Print,
  Person,
  Badge,
  MeetingRoom,
  CalendarMonth,
  Visibility,
  ChevronRight,
} from "@mui/icons-material";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VisitorsSearchPage() {
  const [searchParams, setSearchParams] = useState({
    name: "",
    doc: "",
    host: "",
    date: "",
    status: "Kõik staatused",
  });
  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* 1. Breadcrumbs / Header sisu */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className="text-slate-400">Pääsla</span>
        <ChevronRight className="!text-xs text-slate-300" />
        <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Külastajate täpsem otsing
        </span>
      </div>

      {/* 2. Filtrite sektsioon */}
      <section className="mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 font-display uppercase tracking-tight">
              <FilterList className="text-primary" /> Otsingu filtrid
            </h2>
            <Button
              variant="link"
              className="text-primary font-bold uppercase text-xs"
            >
              Tühjenda kõik filtrid
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FilterInput
              label="Külastaja nimi"
              placeholder="Ees- ja perekonnanimi"
              icon={<Person className="!text-sm" />}
              value={searchParams.name}
              onChange={(val) => updateParam("name", val)}
            />
            <FilterInput
              label="Dokumendi nr"
              placeholder="Pass või ID-kaart"
              icon={<Badge className="!text-sm" />}
              value={searchParams.doc}
              onChange={(val) => updateParam("doc", val)}
            />
            <FilterInput
              label="Vastuvõtja (Host)"
              placeholder="Töötaja nimi"
              icon={<MeetingRoom className="!text-sm" />}
              value={searchParams.host}
              onChange={(val) => updateParam("host", val)}
            />
            <FilterInput
              label="Ajavahemik"
              placeholder="01.01 - 31.01"
              icon={<CalendarMonth className="!text-sm" />}
              value={searchParams.date}
              onChange={(val) => updateParam("date", val)}
            />

            <div className="space-y-1.5 font-display">
              <label
                htmlFor="visitors-status-filter"
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1"
              >
                Staatus
              </label>
              <select
                id="visitors-status-filter"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700"
                value={searchParams.status}
                onChange={(e) => updateParam("status", e.target.value)}
              >
                <option>Kõik staatused</option>
                <option>Hoones</option>
                <option>Lahkunud</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-white font-black py-6 px-10 rounded-xl shadow-xl shadow-primary/20 gap-2 uppercase tracking-widest text-xs">
              <Search /> Teosta otsing
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Tulemuste tabel */}
      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Leitud <span className="text-slate-900 dark:text-white">128</span>{" "}
            tulemust
          </p>
          <div className="flex gap-2">
            <TableActionButton
              icon={<FileDownload className="!text-sm" />}
              label="EXCEL"
            />
            <TableActionButton
              icon={<Print className="!text-sm" />}
              label="PRINDI"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800 border-b border-slate-100 z-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Külastaja</th>
                <th className="px-6 py-4">Dokument</th>
                <th className="px-6 py-4">Vastuvõtja</th>
                <th className="px-6 py-4 text-center">Staatus</th>
                <th className="px-6 py-4 text-right">Tegevused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <VisitorResultRow
                name="Jüri Tamm"
                org="AS Logistika Grupp"
                doc="AA1234567"
                host="Andres Kuusk"
                status="Lahkunud"
                color="slate"
              />
              <VisitorResultRow
                name="Anna-Maria Sepp"
                org="Eraisik"
                doc="EE9876543"
                host="Kati Karu"
                status="Hoones"
                color="emerald"
                isActive
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface FilterInputProps {
  readonly label: string;
  readonly placeholder: string;
  readonly icon: React.ReactNode;
  readonly value: string; // Lisa see
  readonly onChange: (val: string) => void;
}

interface VisitorResultRowProps {
  readonly name: string;
  readonly org: string;
  readonly doc: string;
  readonly host: string;
  readonly status: string;
  readonly color: "emerald" | "slate" | "amber";
  readonly isActive?: boolean;
}

interface TableActionButtonProps {
  readonly icon: React.ReactNode;
  readonly label: string;
}

// ABIKOMPONENDID
function FilterInput({
  label,
  placeholder,
  icon,
  value,
  onChange,
}: Readonly<FilterInputProps>) {
  const inputId = `visitors-filter-${label
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")}`;

  return (
    <div className="space-y-1.5 font-display">
      <label
        htmlFor={inputId}
        className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20"
          placeholder={placeholder}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function VisitorResultRow({
  name,
  org,
  doc,
  host,
  status,
  color,
  isActive,
}: VisitorResultRowProps) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-black text-xs ${isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}
          >
            {name
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {org}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 tracking-wider">
        {doc}
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-slate-700">{host}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">
          IT osakond
        </p>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${color === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/5 rounded-xl"
          aria-label="Vaata külastaja detaili"
        >
          <Visibility />
        </Button>
      </td>
    </tr>
  );
}

function TableActionButton({ icon, label }: TableActionButtonProps) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black border border-slate-100 rounded-xl bg-white hover:bg-slate-50 transition-all uppercase tracking-widest text-slate-500 shadow-sm">
      {icon} {label}
    </button>
  );
}
