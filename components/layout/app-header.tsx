import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SearchIcon from '@mui/icons-material/Search';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900 z-10 shrink-0">
      {/* VASAK POOL: Logo ja Otsing */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary">
          <div className="size-8 flex items-center justify-center rounded-lg bg-primary/10">
            <VerifiedUserIcon className="text-[20px]" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight whitespace-nowrap">
            Pääsla infosüsteem
          </h2>
        </div>

        <div className="relative flex w-64 items-center">
          <SearchIcon className="absolute left-3 text-slate-400 text-[18px]" />
          <Input 
            className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary dark:bg-slate-800" 
            placeholder="Otsi külalist või kaarti..." 
          />
        </div>
      </div>

      {/* PAREM POOL: Navigatsioon ja Profiil */}
      <div className="flex items-center gap-6">
        <nav className="hidden items-center gap-6 lg:flex">
          <a className="text-sm font-semibold text-primary border-b-2 border-primary py-5" href="#">Töölaud</a>
          <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" href="#">Aruanded</a>
          <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" href="#">Seaded</a>
        </nav>

        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-6">
          <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm shadow-primary/20">
            <ScheduleIcon className="text-sm" />
            <span>14:30</span>
          </div>
          
          <button className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors">
            <NotificationsIcon className="text-[20px]" />
          </button>

          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 border border-slate-200 dark:border-slate-700">
            <img 
              alt="User Profile" 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}