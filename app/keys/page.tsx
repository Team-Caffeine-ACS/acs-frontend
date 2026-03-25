import Link from "next/link";
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Button } from "@/components/ui/button";

export default function KeycardsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMBS & HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">Pääsla</Link>
            <ChevronRightIcon className="!text-sm" />
            <span className="text-primary">Võtmekaardid</span>
          </nav>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Võtmekaartide haldus
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
              Monitor ja hallake kõrge turvalisusega RFID pääsukaarte. Sünkroniseeritud keskse läbipääsusüsteemiga.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 font-bold text-xs uppercase tracking-widest py-6">
            <FileDownloadIcon className="!text-lg" /> Ekspordi aruanne
          </Button>
          <Button className="gap-2 font-bold text-xs uppercase tracking-widest py-6 px-8 shadow-xl shadow-primary/20 bg-primary">
            <AddIcon className="!text-lg" /> Registreeri kaart
          </Button>
        </div>
      </div>

      {/* 2. FILTRITE TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FilterListIcon className="!text-lg" />
          </div>
          <input 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold placeholder:text-slate-300" 
            placeholder="Otsi kaardi numbri, kasutaja või osakonna järgi..." 
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterButton label="Staatus: Kõik" />
          <FilterButton label="Tase: Kõik" />
          <FilterButton label="Asukoht: Tallinn" />
          <div className="w-px h-6 bg-slate-100 mx-2" />
          <button className="p-2 text-slate-400 hover:text-primary transition-colors"><RefreshIcon /></button>
        </div>
      </div>

      {/* 3. ANDMETE TABEL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden font-display">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <tr>
                <th className="px-6 py-5">Kaardi number</th>
                <th className="px-6 py-5">Turvatase</th>
                <th className="px-6 py-5 text-center">Staatus</th>
                <th className="px-6 py-5">Määratud kasutaja</th>
                <th className="px-6 py-5">Viimati tagastatud</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <KeycardRow id="EE-4920-A1" level="Tase 5 (Piiratud)" status="Saadaval" user="—" date="24. okt, 2023" time="17:45" statusColor="green" />
              <KeycardRow id="EE-8821-B2" level="Tase 3 (Standard)" status="Kasutuses" user="Mihkel Lepik" date="Praegu väljas" time="" statusColor="blue" initials="ML" />
              <KeycardRow id="EE-1004-X9" level="Tase 1 (Sissepääs)" status="Deaktiveeritud" user="Arhiveeritud" date="12. sept, 2023" time="09:12" statusColor="red" />
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Näitan <span className="text-slate-900">1</span> kuni <span className="text-slate-900">10</span> / <span className="text-slate-900">128</span> kaardist
          </p>
          <div className="flex items-center gap-1">
            <PaginationBtn icon={<FirstPageIcon className="!text-sm" />} disabled />
            <PaginationBtn icon={<ChevronLeftIcon className="!text-sm" />} disabled />
            <div className="flex items-center gap-1 mx-4">
              <button className="size-8 bg-primary text-white rounded-lg font-black text-xs">1</button>
              <button className="size-8 text-slate-400 font-bold text-xs hover:bg-white rounded-lg transition-colors">2</button>
              <button className="size-8 text-slate-400 font-bold text-xs hover:bg-white rounded-lg transition-colors">3</button>
            </div>
            <PaginationBtn icon={<ChevronRightIcon className="!text-sm" />} />
            <PaginationBtn icon={<LastPageIcon className="!text-sm" />} />
          </div>
        </div>
      </div>

      {/* 4. ALUMINE STATISTIKA GRUPP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatSmall title="Kaarte kokku" value="4,250" trend="+12 sel nädalal" icon={<TrendingUpIcon className="!text-sm text-green-500" />} />
        <StatSmall title="Hetkel aktiivsed" value="842" trend="19% täituvus" icon={<InfoIcon className="!text-sm text-slate-400" />} />
        <StatSmall title="Tagastamata" value="14" trend="Vajab tähelepanu" icon={<WarningIcon className="!text-sm text-orange-500" />} color="text-orange-500" />
        <StatSmall title="Kaotatud/Varastatud" value="3" trend="Mustas nimekirjas" icon={<GppMaybeIcon className="!text-sm text-red-500" />} color="text-red-500" />
      </div>
    </div>
  );
}

// ABIKOMPONENDID

function FilterButton({ label }: { label: string }) {
  return (
    <button className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:shadow-sm transition-all">
      {label}
    </button>
  );
}

function KeycardRow({ id, level, status, user, date, time, statusColor, initials }: any) {
  const badgeStyles: any = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <CreditCardIcon className="!text-lg" />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-slate-900">{id}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <SecurityIcon className="!text-sm text-slate-300" />
          <span className="text-sm font-bold text-slate-700">{level}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgeStyles[statusColor]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        {user === "—" ? <span className="text-slate-300">—</span> : (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-black">{initials}</div>
            <span className="text-sm font-bold text-slate-900">{user}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-bold text-slate-900">{date}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{time}</div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-300 hover:text-primary transition-colors"><MoreVertIcon /></button>
      </td>
    </tr>
  );
}

function StatSmall({ title, value, trend, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter">
        {icon} {trend}
      </div>
    </div>
  );
}

function PaginationBtn({ icon, disabled }: any) {
  return (
    <button 
      disabled={disabled}
      className="p-2 text-slate-300 hover:bg-white hover:text-primary rounded-lg transition-all disabled:opacity-20"
    >
      {icon}
    </button>
  );
}