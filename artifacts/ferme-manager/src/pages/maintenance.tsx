import { useState } from "react";
import {
  useGetMaintenances, getGetMaintenancesQueryKey,
  useGetMaintenanceStats, getGetMaintenanceStatsQueryKey,
  useCreateMaintenance, useDeleteMaintenance,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle, Bell } from "lucide-react";

type MaintenanceForm = {
  titre: string;
  categorie: string;
  priorite: string;
  statut: string;
  lieu: string;
  dateSignalement: string;
  description: string;
  responsable: string;
  coutEstime: string;
};

const priorityBadge: Record<string, string> = {
  urgente: "bg-red-100 text-red-700",
  haute: "bg-amber-100 text-amber-700",
  normale: "bg-blue-100 text-blue-700",
  basse: "bg-slate-100 text-slate-700",
};

const statutBadge: Record<string, string> = {
  en_attente: "bg-slate-100 text-slate-700",
  en_cours: "bg-blue-100 text-blue-700",
  termine: "bg-green-100 text-green-700",
  annule: "bg-red-100 text-red-700",
};

const initForm: MaintenanceForm = {
  titre: "",
  categorie: "",
  priorite: "normale",
  statut: "en_attente",
  lieu: "",
  dateSignalement: new Date().toISOString().slice(0, 10),
  description: "",
  responsable: "",
  coutEstime: "",
};

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function Maintenance() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<MaintenanceForm>({ ...initForm });
  const [filters, setFilters] = useState({ priorite: "", statut: "", categorie: "" });

  const params = {
    ...(filters.priorite ? { priorite: filters.priorite } : {}),
    ...(filters.statut ? { statut: filters.statut } : {}),
    ...(filters.categorie ? { categorie: filters.categorie } : {}),
  };

  const { data: tasks, isLoading } = useGetMaintenances(params, { query: { queryKey: getGetMaintenancesQueryKey(params) } });
  const { data: stats } = useGetMaintenanceStats({ query: { queryKey: getGetMaintenanceStatsQueryKey() } });
  const createTask = useCreateMaintenance();
  const deleteTask = useDeleteMaintenance();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetMaintenancesQueryKey(params) });
    qc.invalidateQueries({ queryKey: getGetMaintenanceStatsQueryKey() });
  };

  const resetForm = () => {
    setForm({ ...initForm });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      coutEstime: form.coutEstime ? Number(form.coutEstime) : null,
      dateSignalement: form.dateSignalement || null,
      lieu: form.lieu || null,
      description: form.description || null,
      responsable: form.responsable || null,
      dateResolution: null,
      coutReel: null,
    };
    createTask.mutate({ data }, { onSuccess: () => { toast({ title: "Tâche créée" }); invalidate(); resetForm(); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const tasksList = tasks ?? [];
  const finishTask = (id: number) => {
    deleteTask.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Tâche terminée" });
          invalidate();
        },
        onError: () => toast({ variant: "destructive", title: "Erreur" }),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Maintenance</h1>
          <p className="text-muted-foreground text-sm">Suivi des tâches de maintenance</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
          <Button variant="ghost" size="sm">🔔 Notifs</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats?.urgentesActives ?? "—"} label="Urgentes" color="text-red-600" />
        <StatCard value={stats?.enCours ?? "—"} label="En cours" color="text-blue-600" />
        <StatCard value={stats?.terminees ?? "—"} label="Terminées" color="text-green-600" />
        <StatCard value={stats ? `${fmt(stats.coutTotal)} FCFA` : "—"} label="Coût total" color="text-slate-800" />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="nouvelle">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Aperçu maintenance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Tâches actives</div><div className="text-2xl font-bold text-blue-600">{stats?.enCours ?? 0}</div></div>
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Urgentes</div><div className="text-2xl font-bold text-red-600">{stats?.urgentesActives ?? 0}</div></div>
              </div>
              <div className="space-y-2">
                {tasksList.slice(0, 3).map((t) => (
                  <div key={t.id} className={`rounded-lg border px-4 py-3 ${t.priorite === "urgente" ? "border-l-4 border-l-red-500" : t.priorite === "haute" ? "border-l-4 border-l-amber-500" : t.priorite === "normale" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-slate-300"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm">{t.titre}</div>
                        <div className="text-xs text-muted-foreground">{t.categorie}{t.lieu ? ` — ${t.lieu}` : ""}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[t.priorite] ?? "bg-slate-100 text-slate-700"}`}>{t.priorite}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statutBadge[t.statut] ?? "bg-slate-100 text-slate-700"}`}>{t.statut.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {tasksList.length === 0 && <div className="text-sm text-muted-foreground">Aucune tâche enregistrée</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nouvelle" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Bell className="h-4 w-4" />Filtres</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select value={filters.priorite || "all"} onValueChange={v => setFilters(f => ({ ...f, priorite: v === "all" ? "" : v }))}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="Toutes priorités" /></SelectTrigger>
                  <SelectContent>
                    {[["all", "Toutes priorités"], ["urgente", "Urgente"], ["haute", "Haute"], ["normale", "Normale"], ["basse", "Basse"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.statut || "all"} onValueChange={v => setFilters(f => ({ ...f, statut: v === "all" ? "" : v }))}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="Tous statuts" /></SelectTrigger>
                  <SelectContent>
                    {[["all", "Tous statuts"], ["en_attente", "En attente"], ["en_cours", "En cours"], ["termine", "Terminé"], ["annule", "Annulé"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="w-[220px]" placeholder="Filtrer par catégorie..." value={filters.categorie} onChange={e => setFilters(f => ({ ...f, categorie: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
              : tasksList.map(t => (
                <Card key={t.id} className={t.priorite === "urgente" ? "border-l-4 border-l-red-500" : t.priorite === "haute" ? "border-l-4 border-l-amber-500" : t.priorite === "normale" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-slate-300"}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{t.titre}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[t.priorite] ?? "bg-slate-100 text-slate-700"}`}>{t.priorite}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statutBadge[t.statut] ?? "bg-slate-100 text-slate-700"}`}>{t.statut.replace("_", " ")}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-4 flex-wrap">
                          <span>{t.categorie}</span>
                          {t.lieu && <span>{t.lieu}</span>}
                          {t.dateSignalement && <span>{t.dateSignalement}</span>}
                          {t.responsable && <span>{t.responsable}</span>}
                        </div>
                        {t.description && <p className="text-sm mt-1 text-muted-foreground">{t.description}</p>}
                        <div className="text-sm mt-1"><span className="font-medium">Estimé :</span> {t.coutEstime ? `${fmt(t.coutEstime)} FCFA` : "—"}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => finishTask(t.id)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Terminer tâche
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (!confirm("Supprimer cette tâche ?")) return;
                            deleteTask.mutate(
                              { id: t.id },
                              {
                                onSuccess: () => {
                                  toast({ title: "Envoyée à la corbeille" });
                                  invalidate();
                                },
                                onError: () => toast({ variant: "destructive", title: "Erreur" }),
                              },
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="ml-2">Corbeille</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {!isLoading && tasksList.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucune tâche de maintenance</div>}
          </div>
        </TabsContent>

        <TabsContent value="nouvelle" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Enregistrer une tâche</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2"><Label>Titre *</Label><Input placeholder="ex: Fuite eau Bât. B" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Catégorie</Label><Input placeholder="ex: Électricité" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Lieu</Label><Input placeholder="Bâtiment A" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Priorité</Label>
                    <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[["urgente", "Urgente"], ["haute", "Haute"], ["normale", "Normale"], ["basse", "Basse"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Statut</Label>
                    <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[["en_attente", "En attente"], ["en_cours", "En cours"], ["termine", "Terminé"], ["annule", "Annulé"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Coût estimé (FCFA)</Label><Input type="number" placeholder="ex: 50000" value={form.coutEstime} onChange={e => setForm(f => ({ ...f, coutEstime: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Responsable</Label><Input placeholder="ex: Électricien Dupont" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} /></div>
                  <div className="space-y-1 col-span-2"><Label>Description</Label><Input placeholder="Décrivez le problème..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={createTask.isPending}>Enregistrer la tâche</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
