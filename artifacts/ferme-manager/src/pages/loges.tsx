import { useState } from "react";
import {
  useGetBatiments, getGetBatimentsQueryKey, useCreateBatiment,
  useGetLoges, getGetLogesQueryKey, useCreateLoge,
  useGetAllocations, getGetAllocationsQueryKey, useCreateAllocation,
  useGetLogesStats, getGetLogesStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Home } from "lucide-react";

export default function Loges() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetLogesStats({ query: { queryKey: getGetLogesStatsQueryKey() } });
  const { data: batiments, isLoading: loadingB } = useGetBatiments({ query: { queryKey: getGetBatimentsQueryKey() } });
  const { data: loges, isLoading: loadingL } = useGetLoges({ query: { queryKey: getGetLogesQueryKey() } });
  const { data: allocations, isLoading: loadingA } = useGetAllocations({ query: { queryKey: getGetAllocationsQueryKey() } });

  const createBatiment = useCreateBatiment();
  const createLoge = useCreateLoge();
  const createAllocation = useCreateAllocation();

  const [batForm, setBatForm] = useState({ nom: "", code: "", vocation: "", superficie: "" });
  const [logeForm, setLogeForm] = useState({ nom: "", type: "Truies", batimentId: "", capacite: "", occupe: "0", superficie: "", statut: "Active", notes: "" });
  const [allocForm, setAllocForm] = useState({ date: new Date().toISOString().slice(0, 10), animalTag: "", logeId: "", raison: "" });
  const [openB, setOpenB] = useState(false);
  const [openL, setOpenL] = useState(false);
  const [openA, setOpenA] = useState(false);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Loges & Bâtiments</h1><p className="text-muted-foreground text-sm">Gestion des infrastructures d'hébergement</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Bâtiments", value: stats?.totalBatiments ?? "—" },
          { icon: Home, label: "Loges", value: stats?.totalLoges ?? "—" },
          { icon: Home, label: "Animaux logés", value: stats?.animauxLoges ?? "—" },
          { icon: Home, label: "Taux occupation", value: stats ? `${Number(stats.tauxOccupation).toFixed(1)}%` : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}><CardContent className="pt-4 flex items-center gap-3"><Icon className="h-6 w-6 text-primary" /><div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="batiments">
        <TabsList>
          <TabsTrigger value="batiments">Bâtiments</TabsTrigger>
          <TabsTrigger value="loges">Loges</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="batiments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openB} onOpenChange={setOpenB}>
              <DialogTrigger asChild><Button data-testid="button-add-batiment"><Plus className="h-4 w-4 mr-2" />Nouveau bâtiment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau bâtiment</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createBatiment.mutate({ data: { ...batForm, superficie: batForm.superficie ? Number(batForm.superficie) : null, vocation: batForm.vocation || null } }, { onSuccess: () => { toast({ title: "Bâtiment créé" }); qc.invalidateQueries({ queryKey: getGetBatimentsQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); setOpenB(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Nom *</Label><Input value={batForm.nom} onChange={e => setBatForm(f => ({...f, nom: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Code *</Label><Input value={batForm.code} onChange={e => setBatForm(f => ({...f, code: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Vocation</Label><Input value={batForm.vocation} onChange={e => setBatForm(f => ({...f, vocation: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Superficie (m²)</Label><Input type="number" value={batForm.superficie} onChange={e => setBatForm(f => ({...f, superficie: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createBatiment.isPending}>Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingB ? Array.from({length: 2}).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)
              : batiments?.map(b => (
              <Card key={b.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{b.nom} <span className="text-sm font-normal text-muted-foreground">({b.code})</span></CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {b.vocation && <div>Vocation: {b.vocation}</div>}
                  {b.superficie && <div>Superficie: {b.superficie} m²</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loges" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openL} onOpenChange={setOpenL}>
              <DialogTrigger asChild><Button data-testid="button-add-loge"><Plus className="h-4 w-4 mr-2" />Nouvelle loge</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle loge</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createLoge.mutate({ data: { nom: logeForm.nom, type: logeForm.type, batimentId: Number(logeForm.batimentId), capacite: logeForm.capacite ? Number(logeForm.capacite) : null, occupe: Number(logeForm.occupe), superficie: logeForm.superficie ? Number(logeForm.superficie) : null, statut: logeForm.statut, notes: logeForm.notes || null } }, { onSuccess: () => { toast({ title: "Loge créée" }); qc.invalidateQueries({ queryKey: getGetLogesQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); setOpenL(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Nom *</Label><Input value={logeForm.nom} onChange={e => setLogeForm(f => ({...f, nom: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Type *</Label>
                      <Select value={logeForm.type} onValueChange={v => setLogeForm(f => ({...f, type: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Truies","Verrats","Porcelet","Engraissement","Nurserie","Quarantaine"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Bâtiment *</Label>
                      <Select value={logeForm.batimentId} onValueChange={v => setLogeForm(f => ({...f, batimentId: v}))}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>{batiments?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Capacité</Label><Input type="number" value={logeForm.capacite} onChange={e => setLogeForm(f => ({...f, capacite: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createLoge.isPending}>Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Nom","Type","Bâtiment","Capacité","Occupé","Taux","Statut"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingL ? <tr><td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : loges?.map(l => {
                    const pct = l.capacite && l.capacite > 0 ? (l.occupe / l.capacite) * 100 : 0;
                    return <tr key={l.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-medium">{l.nom}</td><td className="px-4 py-3">{l.type}</td><td className="px-4 py-3">{l.batimentNom ?? "—"}</td><td className="px-4 py-3">{l.capacite ?? "—"}</td><td className="px-4 py-3">{l.occupe}</td><td className="px-4 py-3"><span className={pct > 90 ? "text-red-600" : pct > 70 ? "text-amber-600" : "text-green-600"}>{pct.toFixed(0)}%</span></td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{l.statut}</span></td></tr>;
                  })}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openA} onOpenChange={setOpenA}>
              <DialogTrigger asChild><Button data-testid="button-add-allocation"><Plus className="h-4 w-4 mr-2" />Nouvelle allocation</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle allocation</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createAllocation.mutate({ data: { date: allocForm.date, animalTag: allocForm.animalTag, logeId: Number(allocForm.logeId), raison: allocForm.raison || null } }, { onSuccess: () => { toast({ title: "Allocation créée" }); qc.invalidateQueries({ queryKey: getGetAllocationsQueryKey() }); setOpenA(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Tag animal *</Label><Input value={allocForm.animalTag} onChange={e => setAllocForm(f => ({...f, animalTag: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={allocForm.date} onChange={e => setAllocForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Loge *</Label>
                      <Select value={allocForm.logeId} onValueChange={v => setAllocForm(f => ({...f, logeId: v}))}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>{loges?.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom} ({l.batimentNom})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Raison</Label><Input value={allocForm.raison} onChange={e => setAllocForm(f => ({...f, raison: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createAllocation.isPending}>Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Date","Animal","Loge","Bâtiment","Raison"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingA ? <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : allocations?.map(a => <tr key={a.id} className="hover:bg-muted/20"><td className="px-4 py-3">{a.date}</td><td className="px-4 py-3 font-mono">{a.animalTag}</td><td className="px-4 py-3">{a.logeNom ?? "—"}</td><td className="px-4 py-3">{a.batimentNom ?? "—"}</td><td className="px-4 py-3">{a.raison ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
