import MoreVertIcon from "@mui/icons-material/MoreVert";
import { StatusColor } from "../../lib/api/preRegistration";

interface VisitorRowProps {
  name: string;
  org: string;
  initials: string;
  status: string;
  color: StatusColor;
  time: string;
}

const statusStyles: Record<StatusColor, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  slate:   "bg-slate-100 text-slate-600",
  amber:   "bg-amber-100 text-amber-700",
  rose:    "bg-rose-100 text-rose-700",
};

export function VisitorRow({ name, org, initials, status, color, time }: VisitorRowProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
            {initials}
          </div>
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
        <button className="text-slate-300 hover:text-primary">
          <MoreVertIcon />
        </button>
      </td>
    </tr>
  );
}