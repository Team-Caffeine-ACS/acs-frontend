import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

interface KpiCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
}

export function KpiCard({ title, value, change, icon, trend }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <div className="text-primary/60">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        <span className={`mb-1 flex items-center text-[10px] font-bold ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-400"}`}>
          {trend === "up"      && <ArrowUpwardIcon className="!text-xs" />}
          {trend === "down"    && <ArrowDownwardIcon className="!text-xs" />}
          {trend === "neutral" && <HorizontalRuleIcon className="!text-xs" />}
          {change}
        </span>
      </div>
    </div>
  );
}