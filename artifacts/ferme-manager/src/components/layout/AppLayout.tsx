import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  PiggyBank,
  HeartPulse,
  Baby,
  Wheat,
  Home as HomeIcon,
  Wrench,
  Users,
  Stethoscope,
  Truck,
  Calculator,
  LogOut,
  Menu,
  Clock,
  UserCog,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useGetMaintenances } from "@workspace/api-client-react";
import { getGetMaintenancesQueryKey } from "@workspace/api-client-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role, permissions, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: maintenances } = useGetMaintenances(
    { statut: "en_cours" },
    { query: { enabled: true, queryKey: getGetMaintenancesQueryKey({ statut: "en_cours" }) } }
  );

  const activeMaintenancesCount = maintenances?.length || 0;
  const hasAccess = (href: string) => role === "admin" || permissions.includes("all") || permissions.includes(href.replace("/", ""));

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "Navigation",
      items: [{ href: "/", label: "Accueil", icon: Home }],
    },
    {
      title: "Élevage",
      items: [
        { href: "/animaux", label: "Animaux", icon: PiggyBank },
        { href: "/sante", label: "Santé & Vaccins", icon: HeartPulse },
        { href: "/reproduction", label: "Reproduction", icon: Baby },
        { href: "/alimentation", label: "Alimentation", icon: Wheat },
      ].filter((item) => hasAccess(item.href)),
    },
    {
      title: "Infrastructure",
      items: [
        { href: "/loges", label: "Loges & Bâtiments", icon: HomeIcon },
        { href: "/maintenance", label: "Maintenance", icon: Wrench, badge: activeMaintenancesCount },
      ].filter((item) => hasAccess(item.href)),
    },
    {
      title: "Gestion",
      items: [
        { href: "/employes", label: "Employés", icon: Users },
        { href: "/fournisseurs", label: "Fournisseurs", icon: Truck },
        { href: "/veterinaire", label: "Vétérinaire", icon: Stethoscope },
      ].filter((item) => hasAccess(item.href)),
    },
    {
      title: "Système",
      items: [
        ...(role === "admin" ? [{ href: "/budget", label: "Budgétisation", icon: Calculator }] : []),
        ...(role === "admin" ? [{ href: "/utilisateurs", label: "Utilisateurs", icon: UserCog }] : []),
        ...(role === "admin" ? [{ href: "/systeme", label: "Paramètres système", icon: Settings }] : []),
      ].filter((item) => hasAccess(item.href)),
    },
  ];
  const navFlatItems = navSections.flatMap((section) => section.items);

  const NavLinks = () => (
    <div className="flex flex-col py-3">
      {navSections.map((section) => (
        <div key={section.title} className="mb-3">
          <div className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
            {section.title}
          </div>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center justify-between px-4 py-2 mx-2 rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer ${
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      {item.label}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 flex items-center justify-center rounded-full text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-[220px] bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <PiggyBank size={24} className="text-primary" />
            <span>FermeManager<span className="text-foreground">Pro</span></span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${role === 'admin' ? 'bg-amber-500' : 'bg-blue-500'}`}>
              {role === 'admin' ? 'AD' : 'EM'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground capitalize">{role}</span>
              <span className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                <Clock size={10} />
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive" onClick={logout}>
            <LogOut size={16} className="mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <header className="md:hidden h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <PiggyBank size={24} />
            <span>FermeManager</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r-sidebar-border">
              <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <PiggyBank size={24} />
                  <span>FermeManager<span className="text-foreground">Pro</span></span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pb-28" onClick={() => setIsMobileMenuOpen(false)}>
                <NavLinks />
              </div>
              <div className="p-4 border-t border-sidebar-border absolute bottom-0 w-full bg-sidebar">
                <Button variant="outline" className="w-full justify-start" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut size={16} className="mr-2" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <header className="hidden md:flex h-16 bg-card border-b border-border items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">
            {navFlatItems.find((i) => location === i.href || (i.href !== "/" && location.startsWith(i.href)))?.label || ""}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="text-sm font-medium flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
              <Clock size={16} />
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
          <div className="max-w-[1400px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
