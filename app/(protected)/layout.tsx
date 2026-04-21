import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CurrentUserProvider } from "@/components/layout/current-user-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
