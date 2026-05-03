import { useState } from "react";
import {
  useGetVisitesVeterinaire, getGetVisitesVeterinaireQueryKey,
  useCreateVisiteVeterinaire, useUpdateVisiteVeterinaire, useDeleteVisiteVeterinaire,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bell, CheckCircle, Edit3, Plus, Trash2 } from "lucide-react";

type VisiteForm = {
  veterinaire: string;
  date: string;
  type: string;
  animauxConcernes: string;
  diagnostic: string;
  traitement: string;
  cout: string;
  statut: string;
  notes: string;
};

const statutBadge: Record<string, string> = {
  Planifiee: "bg-yellow-100 text-yellow-700",
  Terminée: "bg-green-100 text-green-700",
  Annulée: "bg-red-100 text-red-700",
};

const initForm: VisiteForm = {
  veterinaire: "",
  date: new Date().toISOString().slice(0, 10),
  type: "Vaccination",
  animauxConcernes: "",
  diagnostic: "",
  traitement: "",
  cout: "",
  statut: "Planifiee",
  notes: "",
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

export default function Veterinaire() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<VisiteForm>({ ...initForm });

  const { data: visites, isLoading } = useGetVisitesVeterinaire({ query: { queryKey: getGetVisitesVeterinaireQueryKey() } });
  const createVisite = useCreateVisiteVeterinaire();
  const updateVisite = useUpdateVisiteVeterinaire();
  const deleteVisite = useDeleteVisiteVeterinaire();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetVisitesVeterinaireQueryKey() });

  const resetForm = () => {
    setForm({ ...initForm });
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      animauxConcernes: form.animauxConcernes || null,
      diagnostic: form.diagnostic || null,
      traitement: form.traitement || null,
      cout: form.cout ? Number(form.cout) : null,
      notes: form.notes || null,
    };
    if (editId) {
      updateVisite.mutate({ id: editId, data }, { onSuccess: () => { toast({ title: "Visite mise à jour" }); invalidate(); resetForm(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    } else {
      createVisite.mutate({ data }, { onSuccess: () => { toast({ title: "Visite enregistrée" }); invalidate(); resetForm(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const stats = {
    alertes: visites?.filter(v => v.statut === "Planifiee").length ?? 0,
    visites: visites?.length ?? 0,
    bons: visites?.filter(v => v.statut === "Terminée").length ?? 0,
    cout: visites?.reduce((sum, v) => sum + (Number(v.cout) || 0), 0) ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Vétérinaire</h1>
          <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
          <Button variant="ghost" size="sm">🔔 Notifs</Button>
        </div>
      </div>

      <Tabs defaultValue="alertes">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="visites">Visites</TabsTrigger>
          <TabsTrigger value="couts">Coûts</TabsTrigger>
        </TabsList>

        <TabsContent value="alertes" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={stats.alertes} label="Visites dans 7j" color="text-red-600" />
            <StatCard value={stats.visites} label="Visites 2025" color="text-green-600" />
            <StatCard value={stats.bons} label="Bons suivi" color="text-blue-600" />
            <StatCard value={`${fmt(stats.cout)} FCFA`} label="Coût 2025" color="text-amber-600" />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Alertes vétérinaires</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-md border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm">🔴 Visite imminente — Dr. Moreau dans 2 jours</div>
              <div className="rounded-md border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 text-sm">🟠 Ordonnance à renouveler — #P-108 — fin 01/05</div>
              <div className="rounded-md border-l-4 border-l-green-500 bg-green-50 px-4 py-3 text-sm">🟢 Dernière visite — Dr. Moreau 10/04 — 8 animaux</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Prochaines visites</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {['Date', 'Vétérinaire', 'Type', 'Animaux', 'Statut'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3">27/04/2025</td>
                    <td className="px-4 py-3">Dr. Moreau</td>
                    <td className="px-4 py-3">Vaccination</td>
                    <td className="px-4 py-3">#P-108, Lot B</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">Dans 2 jours</span></td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3">10/05/2025</td>
                    <td className="px-4 py-3">Dr. Moreau</td>
                    <td className="px-4 py-3">Routine</td>
                    <td className="px-4 py-3">À définir</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">Planifiée</span></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visites" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Nouvelle visite vétérinaire</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="w-full"><Plus className="mr-2 h-4 w-4" />Nouvelle visite</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouvelle"} visite</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Vétérinaire *</Label><Input value={form.veterinaire} onChange={e => setForm(f => ({ ...f, veterinaire: e.target.value }))} required /></div>
                      <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
                      <div className="space-y-1"><Label>Type *</Label>
                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["Vaccination", "Consultation", "Visite préventive", "Urgence", "Contrôle"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label>Statut</Label>
                        <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["Planifiee", "Terminée", "Annulée"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label>Animaux concernés</Label><Input value={form.animauxConcernes} onChange={e => setForm(f => ({ ...f, animauxConcernes: e.target.value }))} /></div>
                      <div className="space-y-1"><Label>Coût (FCFA)</Label><Input type="number" value={form.cout} onChange={e => setForm(f => ({ ...f, cout: e.target.value }))} /></div>
                      <div className="space-y-1 col-span-2"><Label>Diagnostic</Label><Input value={form.diagnostic} onChange={e => setForm(f => ({ ...f, diagnostic: e.target.value }))} /></div>
                      <div className="space-y-1 col-span-2"><Label>Traitement prescrit</Label><Input value={form.traitement} onChange={e => setForm(f => ({ ...f, traitement: e.target.value }))} /></div>
                      <div className="space-y-1 col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                    </div>
                    <Button type="submit" className="w-full" disabled={createVisite.isPending || updateVisite.isPending}>{editId ? "Mettre à jour" : "Enregistrer"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Liste des visites</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>{["Vétérinaire", "Date", "Type", "Animaux", "Diagnostic", "Coût (FCFA)", "Statut", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>) : visites?.map(v => (
                    <tr key={v.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{v.veterinaire}</td>
                      <td className="px-4 py-3">{v.date}</td>
                      <td className="px-4 py-3">{v.type}</td>
                      <td className="px-4 py-3">{v.animauxConcernes ?? "—"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{v.diagnostic ?? "—"}</td>
                      <td className="px-4 py-3">{v.cout != null ? fmt(Number(v.cout)) : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${statutBadge[v.statut] ?? "bg-gray-100 text-gray-800"}`}>{v.statut}</span></td>
                      <td className="px-4 py-3 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditId(v.id); setForm({ veterinaire: v.veterinaire, date: v.date, type: v.type, animauxConcernes: v.animauxConcernes ?? "", diagnostic: v.diagnostic ?? "", traitement: v.traitement ?? "", cout: v.cout ? String(v.cout) : "", statut: v.statut, notes: v.notes ?? "" }); setOpen(true); }}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (!confirm("Supprimer cette visite ?")) return; deleteVisite.mutate({ id: v.id }, { onSuccess: () => { toast({ title: "Supprimé" }); invalidate(); } }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="couts" className="space-y-4 mt-4">
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">Total coûts vétérinaires : {fmt(stats.cout)} FCFA</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
