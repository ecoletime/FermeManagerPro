import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetNotifications,
  useGetNotificationsStats,
  useMarkNotificationLue,
  useMarkAllNotificationsLues,
  getMarkNotificationLueUrl,
  getGetNotificationsQueryKey,
  getGetNotificationsStatsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, CheckCheck, Clock, User, Activity, Search, Layers, Trash2 } from "lucide-react";

const MODULE_ICONS: Record<string, string> = {
  Animaux: "🐖",
  "Santé": "🩺",
  Reproduction: "🐣",
  Alimentation: "🌾",
  Loges: "🏠",
  Maintenance: "🔧",
  Employés: "👷",
  Fournisseurs: "🚛",
  Vétérinaire: "💉",
  Budget: "💰",
  Utilisateurs: "👤",
  Système: "⚙️",
  Connexion: "🔑",
};

const ACTION_COLORS: Record<string, string> = {
  Création: "bg-green-100 text-green-800 border-green-200",
  Modification: "bg-blue-100 text-blue-800 border-blue-200",
  Suppression: "bg-red-100 text-red-800 border-red-200",
  Connexion: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Déconnexion: "bg-slate-100 text-slate-800 border-slate-200",
  Vaccination: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Traitement: "bg-amber-100 text-amber-800 border-amber-200",
  Pointage: "bg-purple-100 text-purple-800 border-purple-200",
  Paiement: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Alerte: "bg-orange-100 text-orange-800 border-orange-200",
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatCard({ value, label, color, icon: Icon }: { value: number | string; label: string; color: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
          <Icon className={`h-5 w-5 mt-1 ${color} opacity-70`} />
        </div>
      </CardContent>
    </Card>
  );
}

const MODULES_LIST = ["Animaux", "Santé", "Reproduction", "Alimentation", "Loges", "Maintenance", "Employés", "Fournisseurs", "Vétérinaire", "Budget", "Connexion", "Système"];
const ACTIONS_LIST = ["Création", "Modification", "Suppression", "Connexion", "Déconnexion", "Vaccination", "Traitement", "Pointage", "Paiement", "Alerte"];

export default function Notifications() {
  const { role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("toutes");

  const { data: stats, isLoading: loadingStats } = useGetNotificationsStats({
    query: { queryKey: getGetNotificationsStatsQueryKey() }
  });

  const { data: notifications, isLoading } = useGetNotifications(
    undefined,
    { query: { queryKey: getGetNotificationsQueryKey() } }
  );

  const markLue = useMarkNotificationLue();
  const markAll = useMarkAllNotificationsLues();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetNotificationsStatsQueryKey() });
  };

  const handleMarkLue = (id: number) => {
    markLue.mutate({ id }, { onSuccess: invalidate, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
  };

  const handleDelete = (id: number) => {
    fetch(getMarkNotificationLueUrl(id).replace("/lue", ""), { method: "DELETE" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        toast({ title: "Notification supprimée" });
        invalidate();
      })
      .catch(() => toast({ variant: "destructive", title: "Impossible de supprimer" }));
  };

  const handleMarkAll = () => {
    markAll.mutate({}, {
      onSuccess: (data) => {
        toast({ title: `${data.updated} notification(s) marquée(s) comme lues` });
        invalidate();
      },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const filtered = (notifications ?? []).filter(n => {
    if (tab === "non-lues" && n.lue) return false;
    if (tab === "lues" && !n.lue) return false;
    if (filterModule !== "all" && n.module !== filterModule) return false;
    if (filterAction !== "all" && n.action !== filterAction) return false;
    if (filterUser && !n.utilisateur.toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (search && !n.detail.toLowerCase().includes(search.toLowerCase()) && !n.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const nonLues = (notifications ?? []).filter(n => !n.lue).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications & Historique
          </h1>
          <p className="text-muted-foreground text-sm">Journal complet de toutes les actions menées sur la plateforme</p>
        </div>
        {nonLues > 0 && (
          <Button onClick={handleMarkAll} variant="outline" className="shrink-0">
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu ({nonLues})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={loadingStats ? "…" : (stats?.total ?? 0)} label="Total actions" color="text-slate-800" icon={Activity} />
        <StatCard value={loadingStats ? "…" : (stats?.nonLues ?? 0)} label="Non lues" color="text-red-600" icon={Bell} />
        <StatCard value={loadingStats ? "…" : ((notifications ?? []).filter(n => n.lue).length)} label="Lues" color="text-green-600" icon={BellOff} />
        <StatCard value={loadingStats ? "…" : (stats?.parModule?.length ?? 0)} label="Modules actifs" color="text-blue-600" icon={Layers} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger><SelectValue placeholder="Tous les modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modules</SelectItem>
            {MODULES_LIST.map(m => <SelectItem key={m} value={m}>{MODULE_ICONS[m] ?? "📌"} {m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger><SelectValue placeholder="Toutes les actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {ACTIONS_LIST.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filtrer par utilisateur..." value={filterUser} onChange={e => setFilterUser(e.target.value)} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="toutes">Toutes <Badge variant="secondary" className="ml-2 h-5 px-1.5">{(notifications ?? []).length}</Badge></TabsTrigger>
          <TabsTrigger value="non-lues">Non lues {nonLues > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5">{nonLues}</Badge>}</TabsTrigger>
          <TabsTrigger value="lues">Lues</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="toutes" className="mt-4">
          <NotificationList items={filtered} isLoading={isLoading} onMarkLue={handleMarkLue} onDelete={handleDelete} canDelete={role === "admin"} />
        </TabsContent>

        <TabsContent value="non-lues" className="mt-4">
          <NotificationList items={filtered} isLoading={isLoading} onMarkLue={handleMarkLue} onDelete={handleDelete} canDelete={role === "admin"} />
        </TabsContent>

        <TabsContent value="lues" className="mt-4">
          <NotificationList items={filtered} isLoading={isLoading} onMarkLue={handleMarkLue} onDelete={handleDelete} canDelete={role === "admin"} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Layers className="h-4 w-4" />Activité par module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingStats ? Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) :
                  (stats?.parModule ?? [])
                    .sort((a, b) => b.count - a.count)
                    .map(({ module, count }) => {
                      const max = Math.max(...(stats?.parModule ?? []).map(m => m.count), 1);
                      const pct = (count / max) * 100;
                      return (
                        <div key={module}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{MODULE_ICONS[module] ?? "📌"} {module}</span>
                            <span className="text-muted-foreground font-semibold">{count}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                }
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Activité par utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) : (() => {
                  const userMap: Record<string, { count: number; role: string }> = {};
                  for (const n of (notifications ?? [])) {
                    if (!userMap[n.utilisateur]) userMap[n.utilisateur] = { count: 0, role: n.role };
                    userMap[n.utilisateur].count++;
                  }
                  const users = Object.entries(userMap).sort(([, a], [, b]) => b.count - a.count);
                  const max = Math.max(...users.map(([, u]) => u.count), 1);
                  return users.map(([username, { count, role: urole }]) => (
                    <div key={username}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium flex items-center gap-1.5"><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${urole === "admin" ? "bg-amber-500" : "bg-blue-500"}`}>{urole === "admin" ? "A" : "E"}</span>{username}</span>
                        <span className="text-muted-foreground font-semibold">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${urole === "admin" ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Dernières 10 actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Module", "Action", "Détail", "Utilisateur", "Date", "Supprimer"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                  ) : (notifications ?? []).slice(0, 10).map(n => (
                    <tr key={n.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{MODULE_ICONS[n.module] ?? "📌"} {n.module}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded border font-medium ${ACTION_COLORS[n.action] ?? "bg-gray-100 text-gray-800 border-gray-200"}`}>{n.action}</span></td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{n.detail}</td>
                      <td className="px-4 py-3">{n.utilisateur}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(n.createdAt)}</td>
                      <td className="px-4 py-3">
                        {role === "admin" ? (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type NotifItem = {
  id: number;
  utilisateur: string;
  role: string;
  module: string;
  action: string;
  detail: string;
  lue: boolean;
  createdAt: string;
};

function NotificationList({ items, isLoading, onMarkLue, onDelete, canDelete }: { items: NotifItem[]; isLoading: boolean; onMarkLue: (id: number) => void; onDelete: (id: number) => void; canDelete: boolean; }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <BellOff className="h-10 w-10 mb-3 opacity-30" />
        <p className="font-medium">Aucune notification trouvée</p>
        <p className="text-sm mt-1">Les actions réalisées sur la plateforme apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-4 rounded-lg border px-4 py-3 transition-colors ${!n.lue ? "bg-primary/5 border-primary/20" : "bg-background"}`}
        >
          <div className="text-xl mt-0.5 shrink-0">{MODULE_ICONS[n.module] ?? "📌"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${ACTION_COLORS[n.action] ?? "bg-gray-100 text-gray-800 border-gray-200"}`}>
                {n.action}
              </span>
              <span className="text-sm font-semibold text-foreground">{n.module}</span>
              {!n.lue && <span className="inline-flex h-2 w-2 rounded-full bg-primary" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{n.detail}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className={`font-medium ${n.role === "admin" ? "text-amber-600" : "text-blue-600"}`}>{n.utilisateur}</span>
                <span className="text-[10px] opacity-60">({n.role})</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelative(n.createdAt)}
              </span>
              <span className="text-[10px] opacity-50">{formatDateTime(n.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!n.lue && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onMarkLue(n.id)}>
                <CheckCheck className="h-3.5 w-3.5 mr-1" />Lu
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onDelete(n.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />Supprimer
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
