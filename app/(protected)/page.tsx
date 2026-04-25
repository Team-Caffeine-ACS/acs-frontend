"use client";

import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getRecentVisits,
  DashboardSummaryResponse,
  DashboardRecentVisitResponse,
} from "@/lib/api/dashboard";

import { AccessPointResponse, getAccessPoints } from "@/lib/api/accessPoints";

import Link from "next/link";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const DynamicAccessPointMap = dynamic(
  () => import("@/components/AccessPointMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl" />
    ),
  },
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [visits, setVisits] = useState<DashboardRecentVisitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [accessPoints, setAccessPoints] = useState<AccessPointResponse[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setCurrentDate(
          new Date().toLocaleDateString("et-EE", {
            day: "numeric",
            month: "long",
          }),
        );
        setLoading(true);
        // Teeme mõlemad päringud korraga
        const [summaryData, visitsData, apData] = await Promise.all([
          getDashboardSummary(),
          getRecentVisits(undefined, 5), // Küsime näiteks 5 viimast
          getAccessPoints(),
        ]);

        setSummary(summaryData);
        setAccessPoints(apData);
        setVisits(visitsData);
      } catch (error) {
        console.error("Dashboardi andmete laadimine ebaõnnestus:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div className="p-8">Laadin andmeid...</div>;

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 1. BREADCRUMBS & PEALKIRI */}
      <div className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
            <li className="inline-flex items-center">
              <Link
                href="/"
                className="text-slate-400 hover:text-primary flex items-center"
              >
                <HomeIcon className="mr-2 !text-base" /> Avaleht
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="text-slate-300 !text-base" />
              <span className="ml-1 text-primary">Töölaud</span>
            </li>
          </ol>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Töölaud
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
              Ülevaade külastustest ja ligipääsudest täna,{" "}
              <span className="text-primary font-bold">{currentDate}</span>
            </p>
          </div>
          <Link href="/visits/new">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg gap-2 uppercase tracking-widest text-xs px-6 py-5">
              <AddIcon className="!text-base" /> Lisa külastus
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI CARDS GRID (Sinu uued andmed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Aktiivsed külastajad"
          value={summary?.activeVisitors ?? "--"}
          change={summary?.trendIndicators?.visitors ?? "0%"}
          icon={<GroupsIcon />}
        />
        <KpiCard
          title="Broneeringud täna"
          value={summary?.bookingsToday ?? "--"}
          icon={<CalendarTodayIcon />}
        />
        <KpiCard
          title="Ootel taotlused"
          value={summary?.pendingRequests ?? "--"}
          icon={<PendingActionsIcon />}
        />
      </div>

      {/* 3. VIIMASED KÜLASTUSED & KAART (Kõrvuti vaade suurel ekraanil) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TABEL - võtab 2/3 laiust */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Viimased külastused
            </h3>
            <Button
              variant="link"
              className="text-sm font-bold text-primary px-0"
            >
              Vaata kõiki
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Külastaja</th>
                  <th className="px-6 py-4">Kellaaeg</th>
                  <th className="px-6 py-4 text-center">Staatus</th>
                  <th className="px-6 py-4 t">Pääsupunkt</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((visit, index) => {
                  return (
                    <VisitorRow
                      key={visit.id || `visit-${index}`}
                      name={visit.fullName || "Tundmatu"}
                      initials={getInitials(visit.fullName)}
                      org="Külastaja"
                      time={
                        visit.entryTime
                          ? new Date(visit.entryTime).toLocaleTimeString(
                              "et-EE",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "--:--"
                      }
                      status={visit.status || "Sees"}
                      accessPointName={visit.accessPointName || " "}
                      accessPointAddress={visit.accessPointAddress || " "}
                      color="emerald"
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KAART - võtab 1/3 laiust */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 uppercase text-sm tracking-wider mb-6">
            Pääsupunktide asukohad
          </h3>
          <DynamicAccessPointMap accessPoints={accessPoints} />
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (Arvutis võiks see olla kuskil nurgas) */}
      <button className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-primary/40">
        <AddIcon className="!text-3xl" />
      </button>
    </div>
  );
}

interface KpiCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly change?: string;
  readonly icon: React.ReactNode;
}

interface VisitorRowProps {
  readonly name: string;
  readonly org: string;
  readonly initials: string;
  readonly status: string;
  readonly color: "emerald" | "slate" | "amber";
  readonly time: string;
  readonly accessPointName: string;
  readonly accessPointAddress: string;
}

function KpiCard({ title, value, change, icon }: KpiCardProps) {
  type Trend = "up" | "down" | "neutral";
  const trendColors: Record<Trend, string> = {
    up: "text-emerald-600",
    down: "text-rose-600",
    neutral: "text-slate-400",
  };

  let trend: "up" | "down" | "neutral" = "neutral";

  if (change) {
    if (change.startsWith("+")) trend = "up";
    else if (change.startsWith("-")) trend = "down";
    // Kui on "0%" või muu ilma märgita tekst, jääb "neutral"
  }

  const trendIcons: Record<Trend, React.ReactNode> = {
    up: <ArrowUpwardIcon className="!text-xs" />,
    down: <ArrowDownwardIcon className="!text-xs" />,
    neutral: <HorizontalRuleIcon className="!text-xs" />,
  };
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <div className="text-primary/60">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">
          {value}
        </span>
        {change && change !== "0%" && change !== "--" && (
          <span
            className={`mb-1 flex items-center text-[10px] font-bold ${trendColors[trend]}`}
          >
            {trendIcons[trend]}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

function VisitorRow({
  name,
  org,
  initials,
  status,
  color,
  time,
  accessPointName,
  accessPointAddress,
}: VisitorRowProps) {
  const statusStyles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
            {initials}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">
              {name}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {org}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 italic font-medium">
        {time}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[color]}`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500">
        {accessPointName && <div>{accessPointName}</div>}
        {accessPointAddress && <div>{accessPointAddress}</div>}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-300 hover:text-primary">
          <MoreVertIcon />
        </button>
      </td>
    </tr>
  );
}

function getInitials(name: string | undefined | null) {
  if (!name) return "??";

  return name
    .trim() // Eemaldab tühikud nime algusest ja lõpust
    .split(" ")
    .filter((n) => n.length > 0) // Välistab tühjad osad topelt-tühikute puhul
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
