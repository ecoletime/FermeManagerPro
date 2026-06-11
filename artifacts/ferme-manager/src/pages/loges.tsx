import { useState } from "react";
import {
  useGetBatiments, getGetBatimentsQueryKey, useCreateBatiment, useDeleteBatiment,
  useGetLoges, getGetLogesQueryKey, useCreateLoge, useDeleteLoge,
  useGetAllocations, getGetAllocationsQueryKey, useCreateAllocation, useDeleteAllocation,
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
import { useConfirm } from "@/hooks/use-confirm";
import { Building2, Home, Plus, Bell, Activity, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const deleteBatiment = useDeleteBatiment();
  const deleteLoge = useDeleteLoge();
  const deleteAllocation = useDeleteAllocation();
  const confirm = useConfirm();

  const [batForm, setBatForm] = useState({ nom: "", code: "", vocation: "", superficie: "" });
  const [logeForm, setLogeForm] = useState({ nom: "", type: "Truies", batimentId: "", capacite: "", occupe: "0", superficie: "", statut: "Active", notes: "" });
  const [allocForm, setAllocForm] = useState({ date: new Date().toISOString().slice(0, 10), animalTag: "", logeId: "", raison: "" });
  const [openB, setOpenB] = useState(false);
  const [openL, setOpenL] = useState(false);
  const [openA, setOpenA] = useState(false);

  const batimentCount = stats?.totalBatiments ?? 0;
  const logeCount = stats?.totalLoges ?? 0;
  const animauxLoges = stats?.animauxLoges ?? 0;
  const occupation = stats ? `${Number(stats.tauxOccupation).toFixed(0)}%` : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Loges & Bâtiments</h1>
          <p className="text-muted-foreground text-sm">Gestion des infrastructures d’hébergement</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
          <Button variant="ghost" size="sm">🔔 Notifs</Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="batiments">Bâtiments</TabsTrigger>
          <TabsTrigger value="loges">Loges</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="nouveau">+ Nouvelle</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={batimentCount} label="Bâtiments" color="text-slate-700" />
            <StatCard value={logeCount} label="Loges" color="text-slate-700" />
            <StatCard value={animauxLoges} label="Animaux logés" color="text-green-600" />
            <StatCard value={occupation} label="Taux occupation" color="text-indigo-600" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Aperçu par bâtiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingB ? (
                <Skeleton className="h-20 w-full" />
              ) : (batiments ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun bâtiment enregistré</div>
              ) : (
                (batiments ?? []).map((b) => {
                  const totalLoges = (loges ?? []).filter((l) => l.batimentId === b.id).length;
                  const totalAnimaux = (loges ?? []).filter((l) => l.batimentId === b.id).reduce((sum, l) => sum + l.occupe, 0);
                  const taux = (loges ?? []).filter((l) => l.batimentId === b.id && l.capacite).reduce((sum, l) => sum + (l.occupe / (l.capacite || 1)) * 100, 0);
                  const avgTaux = totalLoges > 0 ? Math.round(taux / totalLoges) : 0;
                  return (
                    <div key={b.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{b.nom}</div>
                        <div className="text-muted-foreground">{totalLoges} loges — {totalAnimaux} animaux</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(avgTaux, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{b.code}</span>
                        <span>{avgTaux}% occupation</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batiments" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20">
                  <tr>{["Nom", "Code", "Vocation", "Superficie", ""].map((h, i) => <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {loadingB ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                    : (batiments ?? []).length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Aucun bâtiment</td></tr>
                    : (batiments ?? []).map((b) => <tr key={b.id}><td className="px-4 py-2.5 font-medium">{b.nom}</td><td className="px-4 py-2.5">{b.code}</td><td className="px-4 py-2.5">{b.vocation ?? "—"}</td><td className="px-4 py-2.5">{b.superficie ?? "—"}</td><td className="px-4 py-2.5 text-right"><Button variant="destructive" size="sm" onClick={async () => { if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return; deleteBatiment.mutate({ id: b.id }, { onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetBatimentsQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }}><Trash2 className="h-4 w-4" /></Button></td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loges" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20">
                  <tr>{["Nom", "Type", "Bâtiment", "Capacité", "Occupé", "Taux", "Statut", ""].map((h, i) => <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {loadingL ? <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                    : (loges ?? []).length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Aucune loge</td></tr>
                    : (loges ?? []).map((l) => {
                      const pct = l.capacite && l.capacite > 0 ? (l.occupe / l.capacite) * 100 : 0;
                      return <tr key={l.id}><td className="px-4 py-2.5 font-medium">{l.nom}</td><td className="px-4 py-2.5">{l.type}</td><td className="px-4 py-2.5">{l.batimentNom ?? "—"}</td><td className="px-4 py-2.5">{l.capacite ?? "—"}</td><td className="px-4 py-2.5">{l.occupe}</td><td className="px-4 py-2.5">{pct.toFixed(0)}%</td><td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{l.statut}</span></td><td className="px-4 py-2.5 text-right"><Button variant="destructive" size="sm" onClick={async () => { if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return; deleteLoge.mutate({ id: l.id }, { onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetLogesQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }}><Trash2 className="h-4 w-4" /></Button></td></tr>;
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20">
                  <tr>{["Date", "Animal", "Loge", "Bâtiment", "Raison", ""].map((h, i) => <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {loadingA ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                    : (allocations ?? []).length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Aucune allocation</td></tr>
                    : (allocations ?? []).map((a) => <tr key={a.id}><td className="px-4 py-2.5">{a.date}</td><td className="px-4 py-2.5 font-medium">{a.animalTag}</td><td className="px-4 py-2.5">{a.logeNom ?? "—"}</td><td className="px-4 py-2.5">{a.batimentNom ?? "—"}</td><td className="px-4 py-2.5">{a.raison ?? "—"}</td><td className="px-4 py-2.5 text-right"><Button variant="destructive" size="sm" onClick={async () => { if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return; deleteAllocation.mutate({ id: a.id }, { onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetAllocationsQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }}><Trash2 className="h-4 w-4" /></Button></td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nouveau" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouveau bâtiment</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async e => { e.preventDefault(); if (!(await confirm({ title: "Créer le bâtiment", description: "Voulez-vous créer ce bâtiment ?" }))) return; createBatiment.mutate({ data: { ...batForm, superficie: batForm.superficie ? Number(batForm.superficie) : null, vocation: batForm.vocation || null } }, { onSuccess: () => { toast({ title: "Bâtiment créé" }); qc.invalidateQueries({ queryKey: getGetBatimentsQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); setBatForm({ nom: "", code: "", vocation: "", superficie: "" }); setOpenB(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="space-y-1"><Label>Nom *</Label><Input value={batForm.nom} onChange={e => setBatForm(f => ({ ...f, nom: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Code *</Label><Input value={batForm.code} onChange={e => setBatForm(f => ({ ...f, code: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Vocation</Label><Input value={batForm.vocation} onChange={e => setBatForm(f => ({ ...f, vocation: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Superficie (m²)</Label><Input type="number" value={batForm.superficie} onChange={e => setBatForm(f => ({ ...f, superficie: e.target.value }))} /></div>
                  <Button type="submit" className="w-full" disabled={createBatiment.isPending}>Créer</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouvelle loge</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async e => { e.preventDefault(); if (!(await confirm({ title: "Créer la loge", description: "Voulez-vous créer cette loge ?" }))) return; createLoge.mutate({ data: { nom: logeForm.nom, type: logeForm.type, batimentId: Number(logeForm.batimentId), capacite: logeForm.capacite ? Number(logeForm.capacite) : null, superficie: logeForm.superficie ? Number(logeForm.superficie) : null, statut: logeForm.statut, notes: logeForm.notes || null } }, { onSuccess: () => { toast({ title: "Loge créée" }); qc.invalidateQueries({ queryKey: getGetLogesQueryKey() }); qc.invalidateQueries({ queryKey: getGetLogesStatsQueryKey() }); setLogeForm({ nom: "", type: "Truies", batimentId: "", capacite: "", occupe: "0", superficie: "", statut: "Active", notes: "" }); setOpenL(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="space-y-1"><Label>Nom *</Label><Input value={logeForm.nom} onChange={e => setLogeForm(f => ({ ...f, nom: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Type *</Label><Select value={logeForm.type} onValueChange={v => setLogeForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Truies", "Verrats", "Porcelet", "Engraissement", "Nurserie", "Quarantaine"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label>Bâtiment *</Label><Select value={logeForm.batimentId} onValueChange={v => setLogeForm(f => ({ ...f, batimentId: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{batiments?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label>Capacité</Label><Input type="number" value={logeForm.capacite} onChange={e => setLogeForm(f => ({ ...f, capacite: e.target.value }))} /></div>
                  <Button type="submit" className="w-full" disabled={createLoge.isPending}>Créer</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouvelle allocation</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async e => { e.preventDefault(); if (!(await confirm({ title: "Créer l'allocation", description: "Voulez-vous affecter cet animal à cette loge ?" }))) return; createAllocation.mutate({ data: { date: allocForm.date, animalTag: allocForm.animalTag, logeId: Number(allocForm.logeId), raison: allocForm.raison || null } }, { onSuccess: () => { toast({ title: "Allocation créée" }); qc.invalidateQueries({ queryKey: getGetAllocationsQueryKey() }); setAllocForm({ date: new Date().toISOString().slice(0, 10), animalTag: "", logeId: "", raison: "" }); setOpenA(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                  <div className="space-y-1"><Label>Tag animal *</Label><Input value={allocForm.animalTag} onChange={e => setAllocForm(f => ({ ...f, animalTag: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Date *</Label><Input type="date" value={allocForm.date} onChange={e => setAllocForm(f => ({ ...f, date: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Loge *</Label><Select value={allocForm.logeId} onValueChange={v => setAllocForm(f => ({ ...f, logeId: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{loges?.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nom} ({l.batimentNom})</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label>Raison</Label><Input value={allocForm.raison} onChange={e => setAllocForm(f => ({ ...f, raison: e.target.value }))} /></div>
                  <Button type="submit" className="w-full" disabled={createAllocation.isPending}>Créer</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graphiques" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={batimentCount} label="Bâtiments" color="text-slate-700" />
            <StatCard value={logeCount} label="Loges" color="text-slate-700" />
            <StatCard value={animauxLoges} label="Animaux logés" color="text-green-600" />
            <StatCard value={occupation} label="Taux occupation" color="text-indigo-600" />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Occupation par bâtiment</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={(batiments ?? []).map((b) => {
                  const totalLoges = (loges ?? []).filter((l) => l.batimentId === b.id).length;
                  const totalAnimaux = (loges ?? []).filter((l) => l.batimentId === b.id).reduce((sum, l) => sum + l.occupe, 0);
                  return { nom: b.nom, loges: totalLoges, animaux: totalAnimaux };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="loges" fill="#1A9E6F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="animaux" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
