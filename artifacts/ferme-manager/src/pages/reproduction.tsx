import { useState } from "react";
import {
  useGetAccouplements, getGetAccouplementsQueryKey, useCreateAccouplement,
  useGetNaissances, getGetNaissancesQueryKey, useCreateNaissance,
  useGetSevrages, getGetSevragesQueryKey, useCreateSevrage,
  useGetReproductionStats, getGetReproductionStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Heart, Baby, Milk } from "lucide-react";

export default function Reproduction() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetReproductionStats({ query: { queryKey: getGetReproductionStatsQueryKey() } });
  const { data: accouplements, isLoading: loadingA } = useGetAccouplements({ query: { queryKey: getGetAccouplementsQueryKey() } });
  const { data: naissances, isLoading: loadingN } = useGetNaissances({ query: { queryKey: getGetNaissancesQueryKey() } });
  const { data: sevrages, isLoading: loadingS } = useGetSevrages({ query: { queryKey: getGetSevragesQueryKey() } });

  const createAcc = useCreateAccouplement();
  const createNaissance = useCreateNaissance();
  const createSevrage = useCreateSevrage();

  const [accForm, setAccForm] = useState({ truie: "", verrat: "", date: "", dateMiseBasPrevue: "", statut: "Gestante", notes: "" });
  const [naisForm, setNaisForm] = useState({ mere: "", pere: "", date: "", totalNes: 0, vivants: 0, mortNes: 0, poidsMovyen: "" });
  const [sevForm, setSevForm] = useState({ mere: "", date: "", nbSevres: 0, ageJours: 28, poidsMoyen: "", destination: "" });
  const [openA, setOpenA] = useState(false);
  const [openN, setOpenN] = useState(false);
  const [openS, setOpenS] = useState(false);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Reproduction</h1><p className="text-muted-foreground text-sm">Accouplements, naissances et sevrages</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Heart, label: "Truies gestantes", value: stats?.truiesGestantes ?? "—", color: "bg-pink-100 text-pink-600" },
          { icon: Baby, label: "Naissances ce mois", value: stats?.naissancesMois ?? "—", color: "bg-green-100 text-green-600" },
          { icon: Heart, label: "Mise bas imminentes", value: stats?.miseBasImminentes ?? "—", color: "bg-amber-100 text-amber-600" },
          { icon: Milk, label: "Porcelets à sevrer", value: stats?.porceletsASevrer ?? "—", color: "bg-blue-100 text-blue-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}><CardContent className="pt-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
            <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="accouplements">
        <TabsList>
          <TabsTrigger value="accouplements">Accouplements</TabsTrigger>
          <TabsTrigger value="naissances">Naissances</TabsTrigger>
          <TabsTrigger value="sevrages">Sevrages</TabsTrigger>
        </TabsList>

        <TabsContent value="accouplements" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openA} onOpenChange={setOpenA}>
              <DialogTrigger asChild><Button data-testid="button-add-accouplement"><Plus className="h-4 w-4 mr-2" />Nouvel accouplement</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Enregistrer un accouplement</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createAcc.mutate({ data: { ...accForm, dateMiseBasPrevue: accForm.dateMiseBasPrevue || null, notes: accForm.notes || null } }, { onSuccess: () => { toast({ title: "Accouplement enregistré" }); qc.invalidateQueries({ queryKey: getGetAccouplementsQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setOpenA(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Truie (tag) *</Label><Input value={accForm.truie} onChange={e => setAccForm(f => ({...f, truie: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Verrat (tag) *</Label><Input value={accForm.verrat} onChange={e => setAccForm(f => ({...f, verrat: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={accForm.date} onChange={e => setAccForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date mise bas prévue</Label><Input type="date" value={accForm.dateMiseBasPrevue} onChange={e => setAccForm(f => ({...f, dateMiseBasPrevue: e.target.value}))} /></div>
                    <div className="space-y-1 col-span-2"><Label>Notes</Label><Input value={accForm.notes} onChange={e => setAccForm(f => ({...f, notes: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createAcc.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Truie","Verrat","Date","Mise bas prévue","Statut"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingA ? <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : accouplements?.map(a => <tr key={a.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{a.truie}</td><td className="px-4 py-3 font-mono">{a.verrat}</td><td className="px-4 py-3">{a.date}</td><td className="px-4 py-3">{a.dateMiseBasPrevue ?? "—"}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-800">{a.statut}</span></td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="naissances" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openN} onOpenChange={setOpenN}>
              <DialogTrigger asChild><Button data-testid="button-add-naissance"><Plus className="h-4 w-4 mr-2" />Enregistrer naissance</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle naissance</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createNaissance.mutate({ data: { ...naisForm, poidsMovyen: naisForm.poidsMovyen ? Number(naisForm.poidsMovyen) : null } }, { onSuccess: () => { toast({ title: "Naissance enregistrée" }); qc.invalidateQueries({ queryKey: getGetNaissancesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setOpenN(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Mère (tag) *</Label><Input value={naisForm.mere} onChange={e => setNaisForm(f => ({...f, mere: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Père (tag) *</Label><Input value={naisForm.pere} onChange={e => setNaisForm(f => ({...f, pere: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={naisForm.date} onChange={e => setNaisForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Total nés *</Label><Input type="number" value={naisForm.totalNes} onChange={e => setNaisForm(f => ({...f, totalNes: Number(e.target.value)}))} required /></div>
                    <div className="space-y-1"><Label>Vivants *</Label><Input type="number" value={naisForm.vivants} onChange={e => setNaisForm(f => ({...f, vivants: Number(e.target.value)}))} required /></div>
                    <div className="space-y-1"><Label>Mort-nés</Label><Input type="number" value={naisForm.mortNes} onChange={e => setNaisForm(f => ({...f, mortNes: Number(e.target.value)}))} /></div>
                    <div className="space-y-1"><Label>Poids moyen (kg)</Label><Input type="number" step="0.01" value={naisForm.poidsMovyen} onChange={e => setNaisForm(f => ({...f, poidsMovyen: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createNaissance.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Mère","Père","Date","Total nés","Vivants","Mort-nés","Poids moy."].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingN ? <tr><td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : naissances?.map(n => <tr key={n.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{n.mere}</td><td className="px-4 py-3 font-mono">{n.pere}</td><td className="px-4 py-3">{n.date}</td><td className="px-4 py-3">{n.totalNes}</td><td className="px-4 py-3 text-green-700">{n.vivants}</td><td className="px-4 py-3 text-red-700">{n.mortNes}</td><td className="px-4 py-3">{n.poidsMovyen != null ? `${Number(n.poidsMovyen).toFixed(2)} kg` : "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sevrages" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openS} onOpenChange={setOpenS}>
              <DialogTrigger asChild><Button data-testid="button-add-sevrage"><Plus className="h-4 w-4 mr-2" />Enregistrer sevrage</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau sevrage</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createSevrage.mutate({ data: { ...sevForm, poidsMoyen: sevForm.poidsMoyen ? Number(sevForm.poidsMoyen) : null, destination: sevForm.destination || null } }, { onSuccess: () => { toast({ title: "Sevrage enregistré" }); qc.invalidateQueries({ queryKey: getGetSevragesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setOpenS(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Mère (tag) *</Label><Input value={sevForm.mere} onChange={e => setSevForm(f => ({...f, mere: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={sevForm.date} onChange={e => setSevForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Nb sevrés *</Label><Input type="number" value={sevForm.nbSevres} onChange={e => setSevForm(f => ({...f, nbSevres: Number(e.target.value)}))} required /></div>
                    <div className="space-y-1"><Label>Âge (jours)</Label><Input type="number" value={sevForm.ageJours} onChange={e => setSevForm(f => ({...f, ageJours: Number(e.target.value)}))} /></div>
                    <div className="space-y-1"><Label>Poids moyen (kg)</Label><Input type="number" step="0.01" value={sevForm.poidsMoyen} onChange={e => setSevForm(f => ({...f, poidsMoyen: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Destination</Label><Input value={sevForm.destination} onChange={e => setSevForm(f => ({...f, destination: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createSevrage.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Mère","Date","Nb sevrés","Âge (j)","Poids moy.","Destination"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingS ? <tr><td colSpan={6} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : sevrages?.map(s => <tr key={s.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono">{s.mere}</td><td className="px-4 py-3">{s.date}</td><td className="px-4 py-3">{s.nbSevres}</td><td className="px-4 py-3">{s.ageJours ?? "—"}</td><td className="px-4 py-3">{s.poidsMoyen != null ? `${Number(s.poidsMoyen).toFixed(2)} kg` : "—"}</td><td className="px-4 py-3">{s.destination ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
