"use client"; // 1. Lisa see rida faili algusesse, et kasutada konksusid

import Link from "next/link";
import { usePathname } from "next/navigation"; // 2. Impordi asukoha kontrollija
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import KeyIcon from '@mui/icons-material/Key';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

export function AppSidebar() {
  const pathname = usePathname(); // 3. Haara praegune aadress (nt "/" või "/visitors")

  // 4. Mugavam on hoida linke massiivis
  const menuItems = [
    { name: "Ülevaade", href: "/", icon: <DashboardIcon className="text-[20px]" /> },
    { name: "Külalised", href: "/visitors", icon: <GroupIcon className="text-[20px]" /> },
    { name: "Võtmekaardid", href: "/keys", icon: <KeyIcon className="text-[20px]" /> },
    { name: "Logid", href: "/logs", icon: <HistoryIcon className="text-[20px]" /> },
  ];

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shrink-0 h-full">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <MonitorHeartIcon className="text-[22px]" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Operatiivvaade</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Aktiivne seanss</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          // 5. Kontrollime, kas see rida on parajasti aktiivne
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                isActive 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" // Aktiivne stiil
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800" // Tavaline stiil
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="my-4 h-px bg-slate-100 dark:bg-slate-800" />

        {/* Seadistused eraldi, kui soovid */}
        <Link 
          href="/settings" 
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
            pathname === "/settings" ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <SettingsIcon className="text-[20px]" />
          <span className="text-sm">Seadistused</span>
        </Link>
      </nav>

      <div className="mt-auto rounded-xl bg-slate-50 p-4 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Süsteemi olek</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Kõik töökorras</p>
        </div>
      </div>
    </aside>
  );
}