import Link from "next/link";
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMBS & PEALKIRI */}
      <div className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
            <li className="inline-flex items-center">
              <Link href="/" className="text-slate-400 hover:text-primary flex items-center">
                <HomeIcon className="mr-2 !text-base" /> Avaleht
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="text-slate-300 !text-base" />
              <span className="ml-1 text-primary">Töölaud</span>
            </li>
          </ol>
        </nav>
        
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Töölaud</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
            Ülevaade külastustest ja ligipääsudest täna, <span className="text-primary font-bold">24. mai</span>
          </p>
        </div>
      </div>

      {/* 2. KPI CARDS GRID (Sinu uued andmed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Aktiivsed külastajad" value="124" change="5%" icon={<GroupsIcon />} trend="up" />
        <KpiCard title="Broneeringud täna" value="45" change="2%" icon={<CalendarTodayIcon />} trend="down" />
        <KpiCard title="Ootel taotlused" value="8" change="10%" icon={<PendingActionsIcon />} trend="down" />
        <KpiCard title="Vabad kohad" value="12" change="0%" icon={<LocalParkingIcon />} trend="neutral" />
      </div>

      {/* 3. VIIMASED KÜLASTUSED & KAART (Kõrvuti vaade suurel ekraanil) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABEL - võtab 2/3 laiust */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">Viimased külastused</h3>
            <Button variant="link" className="text-sm font-bold text-primary px-0">Vaata kõiki</Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Külastaja</th>
                  <th className="px-6 py-4">Kellaaeg</th>
                  <th className="px-6 py-4 text-center">Staatus</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <VisitorRow name="Karl Tamm" org="Riigikantselei" initials="KT" time="09:15 - 11:30" status="Sees" color="emerald" />
                <VisitorRow name="Mari Lepik" org="MKM" initials="ML" time="08:45 - 09:45" status="Väljas" color="slate" />
                <VisitorRow name="Jüri Sepp" org="Cybernetica AS" initials="JS" time="10:00 - ..." status="Ootel" color="amber" />
              </tbody>
            </table>
          </div>
        </div>

        {/* KAART - võtab 1/3 laiust */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">Hoone täituvus</h3>
          <div className="relative h-[320px] w-full overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-white shadow-inner flex items-center justify-center">
            <div className="text-center opacity-30">
              <MapIcon className="text-6xl mb-2 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">A-Korpus: 1. korrus</p>
            </div>
            {/* Täpid kaardil */}
            <div className="absolute top-10 left-1/4 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
            <div className="absolute bottom-24 right-1/4 h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]"></div>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (Arvutis võiks see olla kuskil nurgas) */}
      <button className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-primary/40">
        <AddIcon className="!text-3xl" />
      </button>
    </div>
  );
}

// ABIKOMPONENDID

function KpiCard({ title, value, change, icon, trend }: any) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <div className="text-primary/60">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        <span className={`mb-1 flex items-center text-[10px] font-bold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400'}`}>
          {trend === 'up' && <ArrowUpwardIcon className="!text-xs" />}
          {trend === 'down' && <ArrowDownwardIcon className="!text-xs" />}
          {trend === 'neutral' && <HorizontalRuleIcon className="!text-xs" />}
          {change}
        </span>
      </div>
    </div>
  );
}

function VisitorRow({ name, org, initials, status, color, time }: any) {
  const statusStyles: any = {
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-700"
  };
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{initials}</div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">{name}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{org}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 italic font-medium">{time}</td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[color]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-300 hover:text-primary"><MoreVertIcon /></button>
      </td>
    </tr>
  );
}