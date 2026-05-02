import { useState } from "react";
import {
  useGetMaintenances, getGetMaintenancesQueryKey,
  useGetMaintenanceStats, getGetMaintenanceStatsQueryKey,
  useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit3, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const priorityColors: Record<string, string> = {
  urgente: "border-l-4 border-l-red-500",
  haute: "border-l-4 border-l-amber-500",
  normale: "border-l-4 border-l-blue-500",
  basse: "border-l-4 border-l-gray-300",
};
const priorityBadge: Record<string, string> = {
  urgente: "bg-red-100 text-red-800",
  haute: "bg-amber-100 text-amber-800",
  normale: "bg-blue-100 text-blue-800",
  basse: "bg-gray-100 text-gray-800",
};
const statutBadge: Record<string, string> = {
  en_attente: "bg-gray-100 text-gray-700",
  en_cours: "bg-blue-100 text-blue-700",
  termine: "bg-green-100 text-green-700",
  annule: "bg-red-100 text-red-700",
};

const initForm = { titre: "", categorie: "", priorite: "normale", statut: "en_attente", lieu: "", dateSignalement: new Date().toISOString().slice(0, 10), description: "", responsable: "", coutEstime: "" };

export default function Maintenance() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ priorite: "", statut: "", categorie: "" });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...initForm });

  const params = {
    ...(filters.priorite ? { priorite: filters.priorite } : {}),
    ...(filters.statut ? { statut: filters.statut } : {}),
    ...(filters.categorie ? { categorie: filters.categorie } : {}),
  };

  const { data: tasks, isLoading } = useGetMaintenances(params, { query: { queryKey: getGetMaintenancesQueryKey(params) } });
  const { data: stats } = useGetMaintenanceStats({ query: { queryKey: getGetMaintenanceStatsQueryKey() } });
  const createTask = useCreateMaintenance();
  const updateTask = useUpdateMaintenance();
  const deleteTask = useDeleteMaintenance();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetMaintenancesQueryKey({}) });
    qc.invalidateQueries({ queryKey: getGetMaintenanceStatsQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, coutEstime: form.coutEstime ? Number(form.coutEstime) : null, dateSignalement: form.dateSignalement || null, lieu: form.lieu || null, description: form.description || null, responsable: form.responsable || null, dateResolution: null, coutReel: null };
    if (editId) {
      updateTask.mutate({ id: editId, data }, { onSuccess: () => { toast({ title: "Tâche mise à jour" }); invalidate(); setOpen(false); setEditId(null); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    } else {
      createTask.mutate({ data }, { onSuccess: () => { toast({ title: "Tâche créée" }); invalidate(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Maintenance</h1><p className="text-muted-foreground text-sm">Suivi des tâches de maintenance</p></div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm({ ...initForm }); } }}>
          <DialogTrigger asChild><Button data-testid="button-add-maintenance"><Plus className="h-4 w-4 mr-2" />Nouvelle tâche</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouvelle"} tâche de maintenance</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={e => setForm(f => ({...f, titre: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Catégorie *</Label><Input value={form.categorie} onChange={e => setForm(f => ({...f, categorie: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Lieu</Label><Input value={form.lieu} onChange={e => setForm(f => ({...f, lieu: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Priorité</Label>
                  <Select value={form.priorite} onValueChange={v => setForm(f => ({...f, priorite: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["urgente","haute","normale","basse"].map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[["en_attente","En attente"],["en_cours","En cours"],["termine","Terminé"],["annule","Annulé"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Date signalement</Label><Input type="date" value={form.dateSignalement} onChange={e => setForm(f => ({...f, dateSignalement: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Responsable</Label><Input value={form.responsable} onChange={e => setForm(f => ({...f, responsable: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Coût estimé (FCFA)</Label><Input type="number" value={form.coutEstime} onChange={e => setForm(f => ({...f, coutEstime: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createTask.isPending || updateTask.isPending}>{editId ? "Mettre à jour" : "Créer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: "Urgentes actives", value: stats?.urgentesActives ?? "—", color: "text-red-600" },
          { icon: Wrench, label: "En cours", value: stats?.enCours ?? "—", color: "text-blue-600" },
          { icon: CheckCircle, label: "Terminées", value: stats?.terminees ?? "—", color: "text-green-600" },
          { icon: Clock, label: "Coût total (FCFA)", value: stats ? fmt(stats.coutTotal) : "—", color: "text-primary" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}><CardContent className="pt-4 flex items-center gap-3"><Icon className={`h-6 w-6 ${color}`} /><div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtres</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Priorité", key: "priorite", options: [["","Toutes"],["urgente","Urgente"],["haute","Haute"],["normale","Normale"],["basse","Basse"]] },
              { label: "Statut", key: "statut", options: [["","Tous"],["en_attente","En attente"],["en_cours","En cours"],["termine","Terminé"]] },
            ].map(({ label, key, options }) => (
              <Select key={key} value={(filters as Record<string,string>)[key] || "all"} onValueChange={v => setFilters(f => ({...f, [key]: v === "all" ? "" : v}))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent>{options.map(([v, l]) => <SelectItem key={v || "all"} value={v || "all"}>{l}</SelectItem>)}</SelectContent>
              </Select>
            ))}
            <Input className="w-[200px]" placeholder="Filtrer par catégorie..." value={filters.categorie} onChange={e => setFilters(f => ({...f, categorie: e.target.value}))} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? Array.from({length: 3}).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
          : tasks?.map(t => (
          <Card key={t.id} className={priorityColors[t.priorite] ?? ""} data-testid={`card-maintenance-${t.id}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{t.titre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityBadge[t.priorite] ?? ""}`}>{t.priorite}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${statutBadge[t.statut] ?? ""}`}>{t.statut.replace("_", " ")}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                    <span>{t.categorie}</span>
                    {t.lieu && <span>{t.lieu}</span>}
                    {t.dateSignalement && <span>{t.dateSignalement}</span>}
                    {t.responsable && <span>{t.responsable}</span>}
                  </div>
                  {t.description && <p className="text-sm mt-1 text-muted-foreground">{t.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" data-testid={`button-edit-${t.id}`} onClick={() => { setEditId(t.id); setForm({ titre: t.titre, categorie: t.categorie, priorite: t.priorite, statut: t.statut, lieu: t.lieu ?? "", dateSignalement: t.dateSignalement ?? "", description: t.description ?? "", responsable: t.responsable ?? "", coutEstime: t.coutEstime ? String(t.coutEstime) : "" }); setOpen(true); }}><Edit3 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" data-testid={`button-delete-${t.id}`} onClick={() => { if (!confirm("Supprimer?")) return; deleteTask.mutate({ id: t.id }, { onSuccess: () => { toast({ title: "Supprimé" }); invalidate(); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && tasks?.length === 0 && <div className="text-center py-12 text-muted-foreground">Aucune tâche de maintenance</div>}
      </div>
    </div>
  );
}
