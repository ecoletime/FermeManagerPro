import { useState } from "react";
import {
  useGetBudgetCategories, getGetBudgetCategoriesQueryKey, useCreateBudgetCategorie,
  useGetDepenses, getGetDepensesQueryKey, useCreateDepense,
  useGetBudgetStats, getGetBudgetStatsQueryKey,
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
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Budget() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats, isLoading: loadingStats } = useGetBudgetStats({ query: { queryKey: getGetBudgetStatsQueryKey() } });
  const { data: categories } = useGetBudgetCategories({ query: { queryKey: getGetBudgetCategoriesQueryKey() } });
  const { data: depenses, isLoading: loadingD } = useGetDepenses({ query: { queryKey: getGetDepensesQueryKey() } });

  const createCategorie = useCreateBudgetCategorie();
  const createDepense = useCreateDepense();

  const [catForm, setCatForm] = useState({ nom: "", budget: "", depense: "0", couleur: "#1A9E6F" });
  const [depForm, setDepForm] = useState({ categorieId: "", description: "", montant: "", date: new Date().toISOString().slice(0, 10) });
  const [openCat, setOpenCat] = useState(false);
  const [openDep, setOpenDep] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Budget</h1><p className="text-muted-foreground text-sm">Vue d'ensemble financière (Administrateur)</p></div>
        <div className="flex gap-2">
          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogTrigger asChild><Button variant="outline" data-testid="button-add-categorie"><Plus className="h-4 w-4 mr-2" />Catégorie</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle catégorie budgétaire</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createCategorie.mutate({ data: { nom: catForm.nom, budget: Number(catForm.budget), depense: Number(catForm.depense), couleur: catForm.couleur || null } }, { onSuccess: () => { toast({ title: "Catégorie créée" }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); setOpenCat(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                <div className="space-y-1"><Label>Nom *</Label><Input value={catForm.nom} onChange={e => setCatForm(f => ({...f, nom: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Budget (FCFA) *</Label><Input type="number" value={catForm.budget} onChange={e => setCatForm(f => ({...f, budget: e.target.value}))} required /></div>
                <Button type="submit" className="w-full" disabled={createCategorie.isPending}>Créer</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openDep} onOpenChange={setOpenDep}>
            <DialogTrigger asChild><Button data-testid="button-add-depense"><Plus className="h-4 w-4 mr-2" />Dépense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createDepense.mutate({ data: { categorieId: Number(depForm.categorieId), description: depForm.description, montant: Number(depForm.montant), date: depForm.date } }, { onSuccess: () => { toast({ title: "Dépense enregistrée" }); qc.invalidateQueries({ queryKey: getGetDepensesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); setOpenDep(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
                <div className="space-y-1"><Label>Catégorie *</Label>
                  <Select value={depForm.categorieId} onValueChange={v => setDepForm(f => ({...f, categorieId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Description *</Label><Input value={depForm.description} onChange={e => setDepForm(f => ({...f, description: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Montant (FCFA) *</Label><Input type="number" value={depForm.montant} onChange={e => setDepForm(f => ({...f, montant: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" value={depForm.date} onChange={e => setDepForm(f => ({...f, date: e.target.value}))} required /></div>
                <Button type="submit" className="w-full" disabled={createDepense.isPending}>Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}</div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Wallet className="h-7 w-7 text-primary" /><div><div className="text-xl font-bold">{fmt(stats.budgetTotal)} FCFA</div><div className="text-xs text-muted-foreground">Budget total</div></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><TrendingDown className="h-7 w-7 text-red-500" /><div><div className="text-xl font-bold text-red-600">{fmt(stats.depenseTotal)} FCFA</div><div className="text-xs text-muted-foreground">Total dépensé</div></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><TrendingUp className={`h-7 w-7 ${stats.solde >= 0 ? "text-green-600" : "text-red-600"}`} /><div><div className={`text-xl font-bold ${stats.solde >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(stats.solde)} FCFA</div><div className="text-xs text-muted-foreground">Solde restant</div></div></CardContent></Card>
        </div>
      )}

      {stats?.parCategorie && (
        <Card>
          <CardHeader><CardTitle className="text-base">Budget par catégorie</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.parCategorie.map(cat => {
              const pct = cat.budget > 0 ? Math.min((cat.depense / cat.budget) * 100, 100) : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="font-medium">{cat.nom}</span><span className="text-muted-foreground">{fmt(cat.depense)} / {fmt(cat.budget)} FCFA</span></div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.couleur ?? "#1A9E6F" }} />
                  </div>
                  <div className="text-xs text-right text-muted-foreground">{pct.toFixed(1)}% utilisé</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {stats?.depensesMensuelles && stats.depensesMensuelles.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Dépenses mensuelles</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.depensesMensuelles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => [`${fmt(v)} FCFA`, "Dépenses"]} />
                <Bar dataKey="montant" fill="#1A9E6F" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Dernières dépenses</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30"><tr>{["Date","Catégorie","Description","Montant (FCFA)"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {loadingD ? <tr><td colSpan={4} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                : depenses?.slice(0, 20).map(d => <tr key={d.id} className="hover:bg-muted/20"><td className="px-4 py-3">{d.date}</td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{d.categorieNom ?? "—"}</span></td><td className="px-4 py-3">{d.description}</td><td className="px-4 py-3 font-medium">{fmt(Number(d.montant))}</td></tr>)}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
