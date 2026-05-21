import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Settings2, Menu, X, Zap, Sun, Moon, BarChart3, Webhook, FileUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "next-themes";

const navItems = [
  { name: "Dashboard", label: "Panel", icon: LayoutDashboard },
  { name: "Clients", label: "Clientes", icon: Users },
  { name: "ClientHistory", label: "Historial de Clientes", icon: Users },
  { name: "Automations", label: "Automatizaciones", icon: Zap },
  { name: "Metrics", label: "Métricas", icon: BarChart3 },
  { name: "ServiceSettings", label: "Servicios", icon: Settings2 },
  { name: "Integrations", label: "Integraciones", icon: Webhook },
  { name: "WebhookHistory", label: "Historial Webhooks", icon: Settings2 },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function AppLayout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center px-4 justify-between backdrop-blur-xl">
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-foreground/70 hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-bold text-foreground text-lg">CRM Post-Atención</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur-xl border-r border-border transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">CRM</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">CRM Post-Atención</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Seguimiento de clientes</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppLayout currentPageName={currentPageName}>{children}</AppLayout>
    </ThemeProvider>
  );
}