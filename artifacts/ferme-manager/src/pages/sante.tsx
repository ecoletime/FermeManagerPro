import { useState } from "react";
import {
  useGetVaccins, getGetVaccinsQueryKey, useCreateVaccin, useDeleteVaccin,
  useGetTraitements, getGetTraitementsQueryKey, useCreateTraitement,
  useGetQuarantaine, getGetQuarantaineQueryKey, useCreateQuarantaine,
  useGetMortalite, getGetMortaliteQueryKey, useCreateMort,
  useGetSanteStats, getGetSanteStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle, Shield, Clock, Skull, FileDown } from "lucide-react";
import { exportSantePdf } from "@/lib/export-pdf";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number | string, color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color ?? "bg-primary/10"}`}><Icon className={`h-5 w-5 ${color ? "text-white" : "text-primary"}`} /></div>
        <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
      </CardContent>
    </Card>
  );
}

export default function Sante() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetSanteStats({ query: { queryKey: getGetSanteStatsQueryKey() } });
  const { data: vaccins, isLoading: loadingV } = useGetVaccins({ query: { queryKey: getGetVaccinsQueryKey() } });
  const { data: traitements, isLoading: loadingT } = useGetTraitements({ query: { queryKey: getGetTraitementsQueryKey() } });
  const { data: quarantaine, isLoading: loadingQ } = useGetQuarantaine({ query: { queryKey: getGetQuarantaineQueryKey() } });
  const { data: mortalite, isLoading: loadingM } = useGetMortalite({ query: { queryKey: getGetMortaliteQueryKey() } });

  const createVaccin = useCreateVaccin();
  const deleteVaccin = useDeleteVaccin();
  const createTraitement = useCreateTraitement();
  const createQuarantaine = useCreateQuarantaine();
  const createMort = useCreateMort();

  const [vaccinForm, setVaccinForm] = useState({ tag: "", vaccin: "", date: "", dose: "", rappel: "", administrePar: "" });
  const [traitForm, setTraitForm] = useState({ tag: "", typeTraitement: "", produit: "", dose: "", dateDebut: "", dateFin: "", statut: "En cours" });
  const [quarForm, setQuarForm] = useState({ tag: "", motif: "", dateDebut: "", dureeJours: 7, statut: "En cours" });
  const [mortForm, setMortForm] = useState({ tag: "", date: "", cause: "", confirme_par: "", observations: "" });
  const [openV, setOpenV] = useState(false);
  const [openT, setOpenT] = useState(false);
  const [openQ, setOpenQ] = useState(false);
  const [openMort, setOpenMort] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Santé & Vaccins</h1><p className="text-muted-foreground text-sm">Suivi sanitaire du troupeau</p></div>
        <Button
          variant="outline"
          onClick={() => {
            if (!stats || !vaccins || !traitements || !quarantaine || !mortalite) return;
            exportSantePdf({ stats, vaccins, traitements, quarantaine, mortalite });
          }}
          disabled={!stats || !vaccins}
        >
          <FileDown className="h-4 w-4 mr-2" />Exporter PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Animaux malades" value={stats?.malades ?? "—"} color="bg-red-500" />
        <StatCard icon={Shield} label="Vaccins à faire" value={stats?.vaccinsAFaire ?? "—"} color="bg-amber-500" />
        <StatCard icon={Clock} label="En quarantaine" value={stats?.enQuarantaine ?? "—"} color="bg-blue-500" />
        <StatCard icon={Skull} label="Décès ce mois" value={stats?.decesMois ?? "—"} color="bg-gray-500" />
      </div>

      <Tabs defaultValue="vaccins">
        <TabsList>
          <TabsTrigger value="vaccins">Vaccinations</TabsTrigger>
          <TabsTrigger value="traitements">Traitements</TabsTrigger>
          <TabsTrigger value="quarantaine">Quarantaine</TabsTrigger>
          <TabsTrigger value="mortalite">Mortalité</TabsTrigger>
        </TabsList>

        <TabsContent value="vaccins" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openV} onOpenChange={setOpenV}>
              <DialogTrigger asChild><Button data-testid="button-add-vaccin"><Plus className="h-4 w-4 mr-2" />Enregistrer vaccin</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau vaccin</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createVaccin.mutate({ data: { ...vaccinForm, rappel: vaccinForm.rappel || null, dose: vaccinForm.dose || null, administrePar: vaccinForm.administrePar || null } }, { onSuccess: () => { toast({ title: "Vaccin enregistré" }); qc.invalidateQueries({ queryKey: getGetVaccinsQueryKey() }); setOpenV(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Tag animal *</Label><Input value={vaccinForm.tag} onChange={e => setVaccinForm(f => ({...f, tag: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Vaccin *</Label><Input value={vaccinForm.vaccin} onChange={e => setVaccinForm(f => ({...f, vaccin: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={vaccinForm.date} onChange={e => setVaccinForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Dose</Label><Input value={vaccinForm.dose} onChange={e => setVaccinForm(f => ({...f, dose: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Rappel</Label><Input type="date" value={vaccinForm.rappel} onChange={e => setVaccinForm(f => ({...f, rappel: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Administré par</Label><Input value={vaccinForm.administrePar} onChange={e => setVaccinForm(f => ({...f, administrePar: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createVaccin.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Tag","Vaccin","Date","Dose","Rappel","Administré par",""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingV ? <tr><td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : vaccins?.map(v => <tr key={v.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{v.tag}</td><td className="px-4 py-3">{v.vaccin}</td><td className="px-4 py-3">{v.date}</td><td className="px-4 py-3">{v.dose ?? "—"}</td><td className="px-4 py-3">{v.rappel ?? "—"}</td><td className="px-4 py-3">{v.administrePar ?? "—"}</td><td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => deleteVaccin.mutate({ id: v.id }, { onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetVaccinsQueryKey() }); } })}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="traitements" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openT} onOpenChange={setOpenT}>
              <DialogTrigger asChild><Button data-testid="button-add-traitement"><Plus className="h-4 w-4 mr-2" />Nouveau traitement</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau traitement</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createTraitement.mutate({ data: { ...traitForm, dateFin: traitForm.dateFin || null, dose: traitForm.dose || null } }, { onSuccess: () => { toast({ title: "Traitement enregistré" }); qc.invalidateQueries({ queryKey: getGetTraitementsQueryKey() }); setOpenT(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Tag animal *</Label><Input value={traitForm.tag} onChange={e => setTraitForm(f => ({...f, tag: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Type traitement *</Label><Input value={traitForm.typeTraitement} onChange={e => setTraitForm(f => ({...f, typeTraitement: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Produit *</Label><Input value={traitForm.produit} onChange={e => setTraitForm(f => ({...f, produit: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Dose</Label><Input value={traitForm.dose} onChange={e => setTraitForm(f => ({...f, dose: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Date début *</Label><Input type="date" value={traitForm.dateDebut} onChange={e => setTraitForm(f => ({...f, dateDebut: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date fin</Label><Input type="date" value={traitForm.dateFin} onChange={e => setTraitForm(f => ({...f, dateFin: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createTraitement.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Tag","Type","Produit","Dose","Début","Fin","Statut"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingT ? <tr><td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : traitements?.map(t => <tr key={t.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{t.tag}</td><td className="px-4 py-3">{t.typeTraitement}</td><td className="px-4 py-3">{t.produit}</td><td className="px-4 py-3">{t.dose ?? "—"}</td><td className="px-4 py-3">{t.dateDebut}</td><td className="px-4 py-3">{t.dateFin ?? "—"}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">{t.statut}</span></td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="quarantaine" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openQ} onOpenChange={setOpenQ}>
              <DialogTrigger asChild><Button data-testid="button-add-quarantaine"><Plus className="h-4 w-4 mr-2" />Mettre en quarantaine</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Mise en quarantaine</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createQuarantaine.mutate({ data: { ...quarForm } }, { onSuccess: () => { toast({ title: "Quarantaine enregistrée" }); qc.invalidateQueries({ queryKey: getGetQuarantaineQueryKey() }); qc.invalidateQueries({ queryKey: getGetSanteStatsQueryKey() }); setOpenQ(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Tag animal *</Label><Input value={quarForm.tag} onChange={e => setQuarForm(f => ({...f, tag: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Motif *</Label><Input value={quarForm.motif} onChange={e => setQuarForm(f => ({...f, motif: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date début *</Label><Input type="date" value={quarForm.dateDebut} onChange={e => setQuarForm(f => ({...f, dateDebut: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Durée (jours)</Label><Input type="number" value={quarForm.dureeJours} onChange={e => setQuarForm(f => ({...f, dureeJours: Number(e.target.value)}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createQuarantaine.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Tag","Motif","Début","Durée","Statut"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingQ ? <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : quarantaine?.map(q => <tr key={q.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{q.tag}</td><td className="px-4 py-3">{q.motif}</td><td className="px-4 py-3">{q.dateDebut}</td><td className="px-4 py-3">{q.dureeJours}j</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">{q.statut}</span></td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="mortalite" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openMort} onOpenChange={setOpenMort}>
              <DialogTrigger asChild><Button data-testid="button-add-mort" variant="destructive"><Plus className="h-4 w-4 mr-2" />Déclarer décès</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Déclaration de décès</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createMort.mutate({ data: { ...mortForm, confirme_par: mortForm.confirme_par || null, observations: mortForm.observations || null } }, { onSuccess: () => { toast({ title: "Décès enregistré" }); qc.invalidateQueries({ queryKey: getGetMortaliteQueryKey() }); qc.invalidateQueries({ queryKey: getGetSanteStatsQueryKey() }); setOpenMort(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Tag animal *</Label><Input value={mortForm.tag} onChange={e => setMortForm(f => ({...f, tag: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={mortForm.date} onChange={e => setMortForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1 col-span-2"><Label>Cause *</Label><Input value={mortForm.cause} onChange={e => setMortForm(f => ({...f, cause: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Confirmé par</Label><Input value={mortForm.confirme_par} onChange={e => setMortForm(f => ({...f, confirme_par: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Observations</Label><Input value={mortForm.observations} onChange={e => setMortForm(f => ({...f, observations: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" variant="destructive" disabled={createMort.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Tag","Date","Cause","Confirmé par","Observations"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingM ? <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : mortalite?.map(m => <tr key={m.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{m.tag}</td><td className="px-4 py-3">{m.date}</td><td className="px-4 py-3">{m.cause}</td><td className="px-4 py-3">{m.confirme_par ?? "—"}</td><td className="px-4 py-3">{m.observations ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
