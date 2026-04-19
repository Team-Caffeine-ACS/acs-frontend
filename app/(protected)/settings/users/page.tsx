"use client";

import Link from "next/link";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { UserManager } from "@/components/admin/UserManager";

export default function UsersPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center justify-center size-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Tagasi"
        >
          <ChevronLeftIcon className="!text-xl" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halda rakenduse kasutajaid
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <UserManager />
      </div>
    </div>
  );
}
