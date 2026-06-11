import { useState } from "react";
import {
  useGetRepas, getGetRepasQueryKey, useCreateRepas, useDeleteRepas,
  useGetStocks, getGetStocksQueryKey, useCreateStock, useDeleteStock,
  useGetLivraisons, getGetLivraisonsQueryKey, useCreateLivraison, useDeleteLivraison,
  useGetAlimentationStats, getGetAlimentationStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { AlertTriangle, CheckCircle2, Plus, Truck, BarChart3, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "Fait") return <span className="text-xs font-semibold text-green-600">Fait ✓</span>;
  if (statut === "À venir") return <span className="text-xs font-semibold text-amber-500">À venir</span>;
  return <span className="text-xs text-muted-foreground">Planifié</span>;
}

function stockStatut(pct: number) {
  if (pct < 15) return { label: "URGENT", color: "text-red-600 bg-red-100", barColor: "bg-red-500", daysLabel: "Critique" };
  if (pct < 40) return { label: "Faible", color: "text-amber-600 bg-amber-100", barColor: "bg-amber-400", daysLabel: "" };
  return { label: "OK", color: "text-green-700 bg-green-100", barColor: "bg-primary", daysLabel: "" };
}

function estimateJours(quantite: number, capaciteMax: number) {
  const pct = capaciteMax > 0 ? quantite / capaciteMax : 0;
  return Math.round(pct * 10);
}

function getRepasStatut(date: string, heure: string): string {
  const now = new Date();
  const repasTime = new Date(`${date}T${heure}`);
  const todayStr = now.toISOString().slice(0, 10);
  if (date < todayStr) return "Fait";
  if (date > todayStr) return "Planifié";
  return repasTime <= now ? "Fait" : "À venir";
}

export default function Alimentation() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetAlimentationStats({ query: { queryKey: getGetAlimentationStatsQueryKey() } });
  const { data: repas, isLoading: loadingR } = useGetRepas({ query: { queryKey: getGetRepasQueryKey() } });
  const { data: stocks, isLoading: loadingS } = useGetStocks({ query: { queryKey: getGetStocksQueryKey() } });
  const { data: livraisons, isLoading: loadingL } = useGetLivraisons({ query: { queryKey: getGetLivraisonsQueryKey() } });

  const createRepas = useCreateRepas();
  const createStock = useCreateStock();
  const createLivraison = useCreateLivraison();
  const deleteRepas = useDeleteRepas();
  const deleteStock = useDeleteStock();
  const deleteLivraison = useDeleteLivraison();
  const confirm = useConfirm();

  const handleDeleteRepas = async (id: number) => {
    if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    deleteRepas.mutate({ id }, {
      onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetRepasQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const handleDeleteStock = async (id: number) => {
    if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    deleteStock.mutate({ id }, {
      onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetStocksQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const handleDeleteLivraison = async (id: number) => {
    if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    deleteLivraison.mutate({ id }, {
      onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetLivraisonsQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  const [repasForm, setRepasForm] = useState({ date: today, heure: "07:00", batiment: "", aliment: "", quantiteDistribuee: "", quantiteRefusee: "0", distribue_par: "" });
  const [stockForm, setStockForm] = useState({ aliment: "", quantite: "", capaciteMax: "" });
  const [livForm, setLivForm] = useState({ fournisseur: "", date: today, aliment: "", quantite: "", prixTotal: "", qualite: "" });
  const [openS, setOpenS] = useState(false);
  const [openL, setOpenL] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  const criticalStocks = stocks?.filter(s => {
    const pct = s.capaciteMax > 0 ? (s.quantite / s.capaciteMax) * 100 : 0;
    return pct < 15;
  }) ?? [];

  const todayRepas = repas?.filter(r => r.date === today) ?? [];
  const nextLivraison = livraisons?.filter(l => l.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  const chartData = stocks?.map(s => ({
    name: s.aliment.length > 12 ? s.aliment.slice(0, 12) + "…" : s.aliment,
    quantite: Math.round(s.quantite),
    capacite: Math.round(s.capaciteMax),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-primary">🌿</span> Alimentation
        </h1>
        <p className="text-muted-foreground text-sm">Planning des repas, stocks, distribution et livraisons</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold text-primary">{stats ? `${fmt(stats.distribuéAujourdhui)} kg` : <Skeleton className="h-7 w-24" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Distribué aujourd'hui</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold text-primary">{stats ? `${fmt(stats.stockRestant)} kg` : <Skeleton className="h-7 w-24" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Stock restant</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold">{stats ? stats.repasEffectues : <Skeleton className="h-7 w-16" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Repas effectués</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold">{stats ? `${Number(stats.tauxConsommation).toFixed(1)}%` : <Skeleton className="h-7 w-16" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Taux consommation</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="repas">
        <TabsList className="mb-2">
          <TabsTrigger value="repas">Repas du jour</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="enregistrer">Enregistrer</TabsTrigger>
          <TabsTrigger value="livraisons">Livraisons</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        <TabsContent value="repas" className="space-y-3">
          {criticalStocks.map(s => (
            <div key={s.id} className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Stock <strong>{s.aliment}</strong> critique — {fmt(s.quantite)} kg (commander d'urgence)</span>
            </div>
          ))}
          {nextLivraison && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Livraison <strong>{nextLivraison.fournisseur}</strong> — {fmt(Number(nextLivraison.quantite))} kg {nextLivraison.aliment} le {nextLivraison.date}</span>
            </div>
          )}

          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {["HEURE", "BÂTIMENT", "ANIMAUX", "ALIMENT", "RATION", "RESPONSABLE", "STATUT", ""].map((h, i) => (
                    <th key={h || `actions-${i}`} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingR ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : todayRepas.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun repas enregistré aujourd'hui</td></tr>
                ) : todayRepas.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{r.heure}</td>
                    <td className="px-4 py-3">{r.batiment}</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3">{r.aliment}</td>
                    <td className="px-4 py-3">{Number(r.quantiteDistribuee).toFixed(0)} kg</td>
                    <td className="px-4 py-3">{r.distribue_par ?? "—"}</td>
                    <td className="px-4 py-3"><StatutBadge statut={getRepasStatut(r.date, r.heure)} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteRepas(r.id)} data-testid={`button-delete-repas-${r.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>

          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">État des stocks</p>
            <div className="space-y-4">
              {loadingS ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />) :
                stocks?.map(s => {
                  const pct = s.capaciteMax > 0 ? Math.min((s.quantite / s.capaciteMax) * 100, 100) : 0;
                  const { label, color, barColor, daysLabel } = stockStatut(pct);
                  const jours = estimateJours(s.quantite, s.capaciteMax);
                  return (
                    <div key={s.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{s.aliment}</span>
                        <span className="text-muted-foreground">{fmt(s.quantite)} kg / {fmt(s.capaciteMax)} kg</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {daysLabel ? daysLabel : `+${jours} jours restants`} —
                        </span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${color}`}>{label}</span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setOpenS(v => !v)} variant="outline" data-testid="button-add-stock">
              <Plus className="h-4 w-4 mr-2" />Nouveau stock
            </Button>
          </div>
          {openS && (
            <Card><CardContent className="pt-4">
              <form onSubmit={async e => {
                e.preventDefault();
                if (!(await confirm({ title: "Créer le stock", description: "Voulez-vous créer ce stock d'aliment ?" }))) return;
                createStock.mutate({ data: { aliment: stockForm.aliment, quantite: Number(stockForm.quantite), capaciteMax: Number(stockForm.capaciteMax) } }, {
                  onSuccess: () => { toast({ title: "Stock créé" }); qc.invalidateQueries({ queryKey: getGetStocksQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); setOpenS(false); setStockForm({ aliment: "", quantite: "", capaciteMax: "" }); },
                  onError: () => toast({ variant: "destructive", title: "Erreur" }),
                });
              }} className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Aliment *</Label><Input value={stockForm.aliment} onChange={e => setStockForm(f => ({...f, aliment: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Quantité (kg) *</Label><Input type="number" value={stockForm.quantite} onChange={e => setStockForm(f => ({...f, quantite: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Capacité max (kg) *</Label><Input type="number" value={stockForm.capaciteMax} onChange={e => setStockForm(f => ({...f, capaciteMax: e.target.value}))} required /></div>
                <div className="col-span-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenS(false)}>Annuler</Button>
                  <Button type="submit" disabled={createStock.isPending}>Créer</Button>
                </div>
              </form>
            </CardContent></Card>
          )}
          <div className="space-y-3">
            {loadingS ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />) :
              stocks?.map(s => {
                const pct = s.capaciteMax > 0 ? Math.min((s.quantite / s.capaciteMax) * 100, 100) : 0;
                const { label, color, barColor } = stockStatut(pct);
                return (
                  <Card key={s.id}><CardContent className="pt-4 pb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">{s.aliment}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{fmt(s.quantite)} / {fmt(s.capaciteMax)} kg</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{label}</span>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStock(s.id)} data-testid={`button-delete-stock-${s.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% rempli</div>
                  </CardContent></Card>
                );
              })
            }
          </div>
        </TabsContent>

        <TabsContent value="enregistrer">
          <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Enregistrer un repas distribué</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={async e => {
                e.preventDefault();
                if (!(await confirm({ title: "Enregistrer le repas", description: "Voulez-vous enregistrer ce repas distribué ?" }))) return;
                createRepas.mutate({ data: { ...repasForm, quantiteDistribuee: Number(repasForm.quantiteDistribuee), quantiteRefusee: Number(repasForm.quantiteRefusee), distribue_par: repasForm.distribue_par || null } }, {
                  onSuccess: () => { toast({ title: "Repas enregistré" }); qc.invalidateQueries({ queryKey: getGetRepasQueryKey() }); qc.invalidateQueries({ queryKey: getGetAlimentationStatsQueryKey() }); setRepasForm({ date: today, heure: "07:00", batiment: "", aliment: "", quantiteDistribuee: "", quantiteRefusee: "0", distribue_par: "" }); },
                  onError: () => toast({ variant: "destructive", title: "Erreur" }),
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Date *</Label><Input type="date" value={repasForm.date} onChange={e => setRepasForm(f => ({...f, date: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Heure *</Label><Input type="time" value={repasForm.heure} onChange={e => setRepasForm(f => ({...f, heure: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Bâtiment *</Label><Input placeholder="Ex: Bât. A" value={repasForm.batiment} onChange={e => setRepasForm(f => ({...f, batiment: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Aliment *</Label><Input placeholder="Ex: Croissance 3" value={repasForm.aliment} onChange={e => setRepasForm(f => ({...f, aliment: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Qté distribuée (kg) *</Label><Input type="number" step="0.1" min="0" value={repasForm.quantiteDistribuee} onChange={e => setRepasForm(f => ({...f, quantiteDistribuee: e.target.value}))} required /></div>
                  <div className="space-y-1"><Label>Qté refusée (kg)</Label><Input type="number" step="0.1" min="0" value={repasForm.quantiteRefusee} onChange={e => setRepasForm(f => ({...f, quantiteRefusee: e.target.value}))} /></div>
                  <div className="space-y-1 col-span-2"><Label>Responsable</Label><Input placeholder="Ex: Jean-Pierre D." value={repasForm.distribue_par} onChange={e => setRepasForm(f => ({...f, distribue_par: e.target.value}))} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={createRepas.isPending}>Enregistrer le repas</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="livraisons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setOpenL(v => !v)} variant="outline" data-testid="button-add-livraison">
              <Truck className="h-4 w-4 mr-2" />Nouvelle livraison
            </Button>
          </div>
          {openL && (
            <Card><CardContent className="pt-4">
              <form onSubmit={async e => {
                e.preventDefault();
                if (!(await confirm({ title: "Enregistrer la livraison", description: "Voulez-vous enregistrer cette livraison ?" }))) return;
                createLivraison.mutate({ data: { ...livForm, quantite: Number(livForm.quantite), prixTotal: livForm.prixTotal ? Number(livForm.prixTotal) : null, qualite: livForm.qualite || null } }, {
                  onSuccess: () => { toast({ title: "Livraison enregistrée" }); qc.invalidateQueries({ queryKey: getGetLivraisonsQueryKey() }); setOpenL(false); setLivForm({ fournisseur: "", date: today, aliment: "", quantite: "", prixTotal: "", qualite: "" }); },
                  onError: () => toast({ variant: "destructive", title: "Erreur" }),
                });
              }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Fournisseur *</Label><Input value={livForm.fournisseur} onChange={e => setLivForm(f => ({...f, fournisseur: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" value={livForm.date} onChange={e => setLivForm(f => ({...f, date: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Aliment *</Label><Input value={livForm.aliment} onChange={e => setLivForm(f => ({...f, aliment: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Quantité (kg) *</Label><Input type="number" value={livForm.quantite} onChange={e => setLivForm(f => ({...f, quantite: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Prix total (FCFA)</Label><Input type="number" value={livForm.prixTotal} onChange={e => setLivForm(f => ({...f, prixTotal: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Qualité</Label><Input value={livForm.qualite} onChange={e => setLivForm(f => ({...f, qualite: e.target.value}))} /></div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenL(false)}>Annuler</Button>
                  <Button type="submit" disabled={createLivraison.isPending}>Enregistrer</Button>
                </div>
              </form>
            </CardContent></Card>
          )}
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>{["FOURNISSEUR","DATE","ALIMENT","QTÉ (kg)","PRIX (FCFA)","QUALITÉ",""].map((h, i) => (
                  <th key={h || `actions-${i}`} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingL ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : livraisons?.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune livraison enregistrée</td></tr>
                ) : livraisons?.map(l => (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{l.fournisseur}</td>
                    <td className="px-4 py-3">{l.date}</td>
                    <td className="px-4 py-3">{l.aliment}</td>
                    <td className="px-4 py-3">{fmt(Number(l.quantite))}</td>
                    <td className="px-4 py-3">{l.prixTotal != null ? fmt(Number(l.prixTotal)) : "—"}</td>
                    <td className="px-4 py-3">{l.qualite ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLivraison(l.id)} data-testid={`button-delete-livraison-${l.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="graphiques" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Niveaux de stocks (kg)</CardTitle></CardHeader>
            <CardContent>
              {loadingS ? <Skeleton className="h-64 w-full" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`${v} kg`]} />
                    <Bar dataKey="capacite" name="Capacité max" fill="#e2e8f0" radius={[4,4,0,0]} />
                    <Bar dataKey="quantite" name="Stock actuel" fill="#1A9E6F" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Dernières livraisons</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {livraisons?.slice(0, 4).map((l) => (
                <div key={l.id} className="rounded-lg border px-3 py-2 text-sm flex justify-between">
                  <span>{l.fournisseur} — {l.aliment}</span>
                  <span className="text-muted-foreground">{fmt(Number(l.quantite))} kg</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-sm">Résumé des repas du jour</CardTitle></CardHeader>
            <CardContent>
              {loadingR ? <Skeleton className="h-32 w-full" /> : (
                <table className="w-full text-sm">
                  <thead className="border-b"><tr>
                    {["HEURE","BÂTIMENT","ALIMENT","RATION","RESPONSABLE","STATUT"].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y">
                    {todayRepas.length === 0 ? (
                      <tr><td colSpan={6} className="py-4 text-center text-muted-foreground text-sm">Aucun repas aujourd'hui</td></tr>
                    ) : todayRepas.map(r => (
                      <tr key={r.id}>
                        <td className="py-2 font-medium">{r.heure}</td>
                        <td className="py-2">{r.batiment}</td>
                        <td className="py-2">{r.aliment}</td>
                        <td className="py-2">{Number(r.quantiteDistribuee).toFixed(0)} kg</td>
                        <td className="py-2">{r.distribue_par ?? "—"}</td>
                        <td className="py-2"><StatutBadge statut={getRepasStatut(r.date, r.heure)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
