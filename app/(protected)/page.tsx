"use client";

import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  DashboardSummaryResponse,
} from "@/lib/api/dashboard";
import { VisitListItemResponse, getRecentVisits } from "@/lib/api/visits";
import { AccessPointResponse, getAccessPoints } from "@/lib/api/accessPoints";
import "leaflet/dist/leaflet.css";

import Link from "next/link";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { Button } from "@/components/ui/button";
import { primaryCtaButtonClassName } from "@/components/ui/button-styles";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const DynamicAccessPointMap = dynamic(
  () => import("@/components/AccessPointMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 sm:h-[400px]" />
    ),
  },
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [visits, setVisits] = useState<VisitListItemResponse[]>([]);
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
          getRecentVisits({ page: 0, size: 5 }), // Küsime näiteks 5 viimast
          getAccessPoints(),
        ]);

        setSummary(summaryData);
        setAccessPoints(apData);
        setVisits(visitsData.content);
      } catch (error) {
        console.error("Dashboardi andmete laadimine ebaõnnestus:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Laadin andmeid...
      </div>
    );
  }

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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Töölaud
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
              Ülevaade külastustest ja ligipääsudest täna,{" "}
              <span className="text-primary font-bold">{currentDate}</span>
            </p>
          </div>
          <Link href="/visits/new" className="w-full sm:w-auto">
            <Button
              className={cn(
                primaryCtaButtonClassName,
                "w-full rounded-xl sm:w-auto",
              )}
            >
              <AddIcon className="!text-lg" /> Lisa külastus
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI CARDS GRID (Sinu uued andmed) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        {/* TABEL - võtab 2/3 laiust */}
        <div className="space-y-4 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Viimased külastused
            </h3>
            <Button
              asChild
              variant="link"
              className="w-fit px-0 text-sm font-bold text-primary"
            >
              <Link href="/visits">Vaata kõiki</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Leitud <span className="text-slate-900">{visits.length}</span>{" "}
                külastust
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Andmeallikas:{" "}
                <span className="text-slate-900">GET /api/visits</span>
              </p>
            </div>

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
                      visitId={visit.id}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KAART - võtab 1/3 laiust */}
        <div className="space-y-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white sm:mb-6">
            Pääsupunktide asukohad
          </h3>
          <DynamicAccessPointMap accessPoints={accessPoints} />
        </div>
      </div>
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
  readonly visitId: string;
}

function KpiCard({ title, value, change, icon }: KpiCardProps) {
  type Trend = "up" | "down" | "neutral";
  const trendColors: Record<Trend, string> = {
    up: "text-emerald-600 dark:text-emerald-300",
    down: "text-rose-600 dark:text-rose-300",
    neutral: "text-slate-400 dark:text-slate-500",
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
    <div className="flex min-h-32 flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {title}
        </span>
        <div className="text-primary/60 dark:text-blue-300/80">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
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
  visitId,
}: VisitorRowProps) {
  const statusStyles: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    slate:
      "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary dark:bg-primary/20 dark:text-blue-200">
            {initials}
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {name}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500">
              {org}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic dark:text-slate-400">
        {time}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[color]}`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
        {accessPointName && (
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            {accessPointName}
          </div>
        )}
        {accessPointAddress && <div>{accessPointAddress}</div>}
      </td>
      <td className="px-6 py-4 text-right">
        <Link href={`/visits/${visitId}`}>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/5 rounded-xl"
            aria-label="Ava külastuse detail"
          >
            <VisibilityOutlinedIcon />
          </Button>
        </Link>
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
