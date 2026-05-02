import { useState } from "react";
import {
  useGetRepas, getGetRepasQueryKey, useCreateRepas,
  useGetStocks, getGetStocksQueryKey, useCreateStock, useUpdateStock,
  useGetLivraisons, getGetLivraisonsQueryKey, useCreateLivraison,
  useGetAlimentationStats, getGetAlimentationStatsQueryKey,
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
import { Plus, Wheat, BarChart3 } from "lucide-react";

export default function Alimentation() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetAlimentationStats({ query: { queryKey: getGetAlimentationStatsQueryKey() } });
  const { data: repas, isLoading: loadingR } = useGetRepas({ query: { queryKey: getGetRepasQueryKey() } });
  const { data: stocks, isLoading: loadingS } = useGetStocks({ query: { queryKey: getGetStocksQueryKey() } });
  const { data: livraisons, isLoading: loadingL } = useGetLivraisons({ query: { queryKey: getGetLivraisonsQueryKey() } });

  const createRepas = useCreateRepas();
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const createLivraison = useCreateLivraison();

  const [repasForm, setRepasForm] = useState({ date: new Date().toISOString().slice(0, 10), heure: "07:00", batiment: "", aliment: "", quantiteDistribuee: "", quantiteRefusee: "0", distribue_par: "" });
  const [stockForm, setStockForm] = useState({ aliment: "", quantite: "", capaciteMax: "" });
  const [livForm, setLivForm] = useState({ fournisseur: "", date: new Date().toISOString().slice(0, 10), aliment: "", quantite: "", prixTotal: "", qualite: "" });
  const [openR, setOpenR] = useState(false);
  const [openS, setOpenS] = useState(false);
  const [openL, setOpenL] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Alimentation</h1><p className="text-muted-foreground text-sm">Gestion de l'alimentation et des stocks</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Distribué aujourd'hui", value: stats ? `${fmt(stats.distribuéAujourdhui)} kg` : "—" },
          { label: "Stock restant total", value: stats ? `${fmt(stats.stockRestant)} kg` : "—" },
          { label: "Repas effectués", value: stats?.repasEffectues ?? "—" },
          { label: "Taux consommation", value: stats ? `${Number(stats.tauxConsommation).toFixed(1)}%` : "—" },
        ].map(({ label, value }) => (
          <Card key={label}><CardContent className="pt-4"><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="stocks">
        <TabsList>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="repas">Repas du jour</TabsTrigger>
          <TabsTrigger value="livraisons">Livraisons</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Dialog open={openS} onOpenChange={setOpenS}>
              <DialogTrigger asChild><Button data-testid="button-add-stock" variant="outline"><Plus className="h-4 w-4 mr-2" />Nouveau stock</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau stock</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createStock.mutate({ data: { aliment: stockForm.aliment, quantite: Number(stockForm.quantite), capaciteMax: Number(stockForm.capaciteMax) } }, { onSuccess: () => { toast({ title: "Stock créé" }); qc.invalidateQueries({ queryKey: getGetStocksQueryKey() }); setOpenS(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="space-y-1"><Label>Aliment *</Label><Input value={stockForm.aliment} onChange={e => setStockForm(f => ({...f, aliment: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Quantité actuelle (kg) *</Label><Input type="number" value={stockForm.quantite} onChange={e => setStockForm(f => ({...f, quantite: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Capacité max (kg) *</Label><Input type="number" value={stockForm.capaciteMax} onChange={e => setStockForm(f => ({...f, capaciteMax: e.target.value}))} required /></div>
                  <Button type="submit" className="w-full" disabled={createStock.isPending}>Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4">
            {loadingS ? Array.from({length: 3}).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-8 w-full" /></CardContent></Card>)
              : stocks?.map(s => {
                const pct = s.capaciteMax > 0 ? Math.min((s.quantite / s.capaciteMax) * 100, 100) : 0;
                const color = pct < 25 ? "bg-red-500" : pct < 50 ? "bg-amber-500" : "bg-primary";
                return (
                  <Card key={s.id}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex justify-between"><span className="flex items-center gap-2"><Wheat className="h-4 w-4" />{s.aliment}</span><span className="text-muted-foreground font-normal">{fmt(s.quantite)} / {fmt(s.capaciteMax)} kg</span></CardTitle></CardHeader>
                    <CardContent>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground"><span>{pct.toFixed(1)}% rempli</span>{pct < 25 && <span className="text-red-600 font-medium">Stock critique</span>}</div>
                    </CardContent>
                  </Card>
                );
              })
            }
          </div>
        </TabsContent>

        <TabsContent value="repas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openR} onOpenChange={setOpenR}>
              <DialogTrigger asChild><Button data-testid="button-add-repas"><Plus className="h-4 w-4 mr-2" />Enregistrer repas</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau repas</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createRepas.mutate({ data: { ...repasForm, quantiteDistribuee: Number(repasForm.quantiteDistribuee), quantiteRefusee: Number(repasForm.quantiteRefusee), distribue_par: repasForm.distribue_par || null } }, { onSuccess: () => { toast({ title: "Repas enregistré" }); qc.invalidateQueries({ queryKey: getGetRepasQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); setOpenR(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={repasForm.date} onChange={e => setRepasForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Heure *</Label><Input type="time" value={repasForm.heure} onChange={e => setRepasForm(f => ({...f, heure: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Bâtiment *</Label><Input value={repasForm.batiment} onChange={e => setRepasForm(f => ({...f, batiment: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Aliment *</Label><Input value={repasForm.aliment} onChange={e => setRepasForm(f => ({...f, aliment: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Qté distribuée (kg) *</Label><Input type="number" step="0.1" value={repasForm.quantiteDistribuee} onChange={e => setRepasForm(f => ({...f, quantiteDistribuee: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Qté refusée (kg)</Label><Input type="number" step="0.1" value={repasForm.quantiteRefusee} onChange={e => setRepasForm(f => ({...f, quantiteRefusee: e.target.value}))} /></div>
                    <div className="space-y-1 col-span-2"><Label>Distribué par</Label><Input value={repasForm.distribue_par} onChange={e => setRepasForm(f => ({...f, distribue_par: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createRepas.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Date","Heure","Bâtiment","Aliment","Distribué (kg)","Refusé (kg)","Distribué par"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingR ? <tr><td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : repas?.map(r => <tr key={r.id} className="hover:bg-muted/20"><td className="px-4 py-3">{r.date}</td><td className="px-4 py-3">{r.heure}</td><td className="px-4 py-3">{r.batiment}</td><td className="px-4 py-3">{r.aliment}</td><td className="px-4 py-3">{Number(r.quantiteDistribuee).toFixed(1)}</td><td className="px-4 py-3">{Number(r.quantiteRefusee).toFixed(1)}</td><td className="px-4 py-3">{r.distribue_par ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="livraisons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openL} onOpenChange={setOpenL}>
              <DialogTrigger asChild><Button data-testid="button-add-livraison"><Plus className="h-4 w-4 mr-2" />Nouvelle livraison</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Enregistrer une livraison</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); createLivraison.mutate({ data: { ...livForm, quantite: Number(livForm.quantite), prixTotal: livForm.prixTotal ? Number(livForm.prixTotal) : null, qualite: livForm.qualite || null } }, { onSuccess: () => { toast({ title: "Livraison enregistrée" }); qc.invalidateQueries({ queryKey: getGetLivraisonsQueryKey() }); setOpenL(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Fournisseur *</Label><Input value={livForm.fournisseur} onChange={e => setLivForm(f => ({...f, fournisseur: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Date *</Label><Input type="date" value={livForm.date} onChange={e => setLivForm(f => ({...f, date: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Aliment *</Label><Input value={livForm.aliment} onChange={e => setLivForm(f => ({...f, aliment: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Quantité (kg) *</Label><Input type="number" value={livForm.quantite} onChange={e => setLivForm(f => ({...f, quantite: e.target.value}))} required /></div>
                    <div className="space-y-1"><Label>Prix total (FCFA)</Label><Input type="number" value={livForm.prixTotal} onChange={e => setLivForm(f => ({...f, prixTotal: e.target.value}))} /></div>
                    <div className="space-y-1"><Label>Qualité</Label><Input value={livForm.qualite} onChange={e => setLivForm(f => ({...f, qualite: e.target.value}))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createLivraison.isPending}>Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Fournisseur","Date","Aliment","Qté (kg)","Prix (FCFA)","Qualité"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {loadingL ? <tr><td colSpan={6} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                  : livraisons?.map(l => <tr key={l.id} className="hover:bg-muted/20"><td className="px-4 py-3">{l.fournisseur}</td><td className="px-4 py-3">{l.date}</td><td className="px-4 py-3">{l.aliment}</td><td className="px-4 py-3">{fmt(Number(l.quantite))}</td><td className="px-4 py-3">{l.prixTotal != null ? fmt(Number(l.prixTotal)) : "—"}</td><td className="px-4 py-3">{l.qualite ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
