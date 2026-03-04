import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useThemeSync } from "@/hooks/useThemeSync";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useThemeSync();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full safe-top">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 safe-top">
            <SidebarTrigger />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationsPopover />
            </div>
          </header>
          <InstallBanner />
          <main className="flex-1 bg-background overflow-x-hidden safe-bottom">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
