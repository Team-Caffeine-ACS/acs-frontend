"use client";

import Link from "next/link";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { LookupManager } from "@/components/admin/LookupManager";
import type { LookupRecord } from "@/lib/api/admin";

interface Api {
  list(): Promise<LookupRecord[]>;
  create(name: string): Promise<LookupRecord>;
  update(id: string, name: string): Promise<LookupRecord>;
  remove(id: string): Promise<void>;
}

interface Props {
  readonly title: string;
  readonly backHref: string;
  readonly api: Api;
}

export function LookupManagerWrapper({ title, backHref, api }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="flex items-center justify-center size-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Tagasi"
        >
          <ChevronLeftIcon className="!text-xl" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <LookupManager api={api} />
      </div>
    </div>
  );
}
