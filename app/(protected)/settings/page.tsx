import Link from "next/link";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ShieldIcon from "@mui/icons-material/Shield";
import BadgeIcon from "@mui/icons-material/Badge";
import PeopleIcon from "@mui/icons-material/People";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const sections = [
  {
    href: "/settings/users",
    icon: <PeopleIcon className="text-blue-700 !text-2xl" />,
    title: "Halda rakenduse kasutajaid",
    description: "Lisa, muuda või kustuta rakenduse kasutajakontosid.",
  },
  {
    href: "/settings/countries",
    icon: <PublicIcon className="text-blue-700 !text-2xl" />,
    title: "Halda riike",
    description: "Lisa, muuda või kustuta riikide kirjeid.",
  },
  {
    href: "/settings/organizations",
    icon: <BusinessIcon className="text-blue-700 !text-2xl" />,
    title: "Halda organisatsioone",
    description: "Lisa, muuda või kustuta organisatsioonide kirjeid.",
  },
  {
    href: "/settings/departments",
    icon: <AccountTreeIcon className="text-blue-700 !text-2xl" />,
    title: "Halda osakondi",
    description: "Lisa, muuda või kustuta osakondade kirjeid.",
  },
  {
    href: "/settings/roles",
    icon: <ShieldIcon className="text-blue-700 !text-2xl" />,
    title: "Halda rolle",
    description: "Lisa, muuda või kustuta rollide kirjeid.",
  },
  {
    href: "/settings/document-types",
    icon: <BadgeIcon className="text-blue-700 !text-2xl" />,
    title: "Halda dokumendi tüüpe",
    description: "Lisa, muuda või kustuta dokumendi tüüpide kirjeid.",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Admin seadistused
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Halda süsteemi otsingutabeleid ja põhiandmeid.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group"
          >
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
            </div>
            <ChevronRightIcon className="text-slate-300 group-hover:text-slate-500 transition-colors !text-xl shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
