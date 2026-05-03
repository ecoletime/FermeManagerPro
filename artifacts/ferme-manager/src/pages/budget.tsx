import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, Wallet, FileDown, PiggyBank, Receipt, CalendarRange, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { exportBudgetPdf } from "@/lib/export-pdf";

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
  const [planForm, setPlanForm] = useState({ poste: "", budget: "", periode: "mensuel", mois: "Mai 2025" });
  const [plans, setPlans] = useState([
    { id: 1, poste: "Alimentation", budget: 2000000, periode: "Mensuel", mois: "Mai 2025", avancement: 72 },
    { id: 2, poste: "Maintenance", budget: 750000, periode: "Semestriel", mois: "Juin 2025", avancement: 45 },
    { id: 3, poste: "Santé", budget: 500000, periode: "Mensuel", mois: "Mai 2025", avancement: 28 },
  ]);
  const [openCat, setOpenCat] = useState(false);
  const [openDep, setOpenDep] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
  const depensesList = depenses ?? [];
  const recettes = useMemo(() => ([
    { id: 1, date: "2026-05-01", source: "Vente porcelets", description: "Portée T-009", montant: 1200000 },
    { id: 2, date: "2026-05-02", source: "Vente aliment", description: "Réassort externe", montant: 850000 },
    { id: 3, date: "2026-05-03", source: "Subvention", description: "Aide mensuelle", montant: 1500000 },
  ]), []);
  const budgetPrevisionnel = useMemo(() => ([
    { mois: "Jan", recettes: 2450000, depenses: 1980000 },
    { mois: "Fév", recettes: 2320000, depenses: 2140000 },
    { mois: "Mar", recettes: 2780000, depenses: 2190000 },
    { mois: "Avr", recettes: 2600000, depenses: 2300000 },
  ]), []);

  const addPlan = () => {
    if (!planForm.poste || !planForm.budget) return;
    setPlans((current) => [
      {
        id: Date.now(),
        poste: planForm.poste,
        budget: Number(planForm.budget),
        periode: planForm.periode.charAt(0).toUpperCase() + planForm.periode.slice(1),
        mois: planForm.mois,
        avancement: 0,
      },
      ...current,
    ]);
    setPlanForm({ poste: "", budget: "", periode: "mensuel", mois: "Mai 2025" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Budget</h1><p className="text-muted-foreground text-sm">Vue d'ensemble financière (Administrateur)</p></div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!stats || !depenses) return;
              exportBudgetPdf({ stats, depenses: depenses.map(d => ({ ...d, montant: Number(d.montant) })) });
            }}
            disabled={!stats}
          >
            <FileDown className="h-4 w-4 mr-2" />Exporter PDF
          </Button>
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

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="budget"><PiggyBank className="h-4 w-4 mr-2" />Budget</TabsTrigger>
          <TabsTrigger value="recettes"><Receipt className="h-4 w-4 mr-2" />Recette</TabsTrigger>
          <TabsTrigger value="depenses"><TrendingDown className="h-4 w-4 mr-2" />Dépense</TabsTrigger>
          <TabsTrigger value="previsionnel"><CalendarRange className="h-4 w-4 mr-2" />Budget prévisionnel</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="recettes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recettes enregistrées</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30"><tr>{["Date", "Source", "Description", "Montant (FCFA)"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {recettes.map(r => <tr key={r.id} className="hover:bg-muted/20"><td className="px-4 py-3">{r.date}</td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{r.source}</span></td><td className="px-4 py-3">{r.description}</td><td className="px-4 py-3 font-medium">{fmt(r.montant)}</td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Dernières dépenses</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30"><tr>{["Date","Catégorie","Description","Montant (FCFA)"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingD ? <tr><td colSpan={4} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                    : depensesList.slice(0, 20).map(d => <tr key={d.id} className="hover:bg-muted/20"><td className="px-4 py-3">{d.date}</td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{d.categorieNom ?? "—"}</span></td><td className="px-4 py-3">{d.description}</td><td className="px-4 py-3 font-medium">{fmt(Number(d.montant))}</td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previsionnel" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Créer un budget prévisionnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Poste *</Label>
                  <Select value={planForm.poste} onValueChange={(value) => setPlanForm((f) => ({ ...f, poste: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alimentation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alimentation">Alimentation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="sante">Santé</SelectItem>
                      <SelectItem value="salaires">Salaires</SelectItem>
                      <SelectItem value="logistique">Logistique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget (FCFA) *</Label>
                  <Input
                    type="number"
                    placeholder="ex: 2000000"
                    value={planForm.budget}
                    onChange={(e) => setPlanForm((f) => ({ ...f, budget: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={planForm.periode} onValueChange={(value) => setPlanForm((f) => ({ ...f, periode: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="semestriel">Semestriel</SelectItem>
                      <SelectItem value="trimestriel">Trimestriel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mois</Label>
                  <Select value={planForm.mois} onValueChange={(value) => setPlanForm((f) => ({ ...f, mois: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Jan 2025","Fév 2025","Mar 2025","Avr 2025","Mai 2025","Juin 2025","Juil 2025","Août 2025","Sept 2025","Oct 2025","Nov 2025","Déc 2025"].map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={addPlan}>Ajouter au plan</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Plans en cours</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{plan.poste}</div>
                      <div className="text-xs text-muted-foreground">{plan.periode} • {plan.mois}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{fmt(plan.budget)} FCFA</div>
                      <div className="text-xs text-muted-foreground">{plan.avancement}% avancé</div>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-green-600" style={{ width: `${plan.avancement}%` }} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPlanForm({ poste: plan.poste.toLowerCase(), budget: String(plan.budget), periode: plan.periode.toLowerCase(), mois: plan.mois })}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPlans((current) => current.filter((item) => item.id !== plan.id))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Budget prévisionnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={budgetPrevisionnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={(v: number) => [`${fmt(v)} FCFA`, "Montant"]} />
                  <Bar dataKey="recettes" fill="#1A9E6F" radius={[4,4,0,0]} />
                  <Bar dataKey="depenses" fill="#E11D48" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
