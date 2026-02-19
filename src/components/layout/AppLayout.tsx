import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 safe-top">
            <SidebarTrigger />
            <NotificationsPopover />
          </header>
          <main className="flex-1 bg-background overflow-x-hidden safe-bottom">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
