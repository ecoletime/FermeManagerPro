import { useState } from "react";
import {
  useGetBudgetCategories, getGetBudgetCategoriesQueryKey, useCreateBudgetCategorie, useDeleteBudgetCategorie,
  useGetDepenses, getGetDepensesQueryKey, useCreateDepense, useDeleteDepense,
  useGetBudgetStats, getGetBudgetStatsQueryKey,
  useGetFournisseurs, getGetFournisseursQueryKey,
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
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, TrendingUp, TrendingDown, Wallet, FileDown, PiggyBank, Receipt, CalendarRange, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { exportBudgetPdf } from "@/lib/export-pdf";

export default function Budget() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats, isLoading: loadingStats } = useGetBudgetStats({ query: { queryKey: getGetBudgetStatsQueryKey() } });
  const { data: categories } = useGetBudgetCategories({ query: { queryKey: getGetBudgetCategoriesQueryKey() } });
  const { data: depenses, isLoading: loadingD } = useGetDepenses({ query: { queryKey: getGetDepensesQueryKey() } });
  const { data: fournisseurs } = useGetFournisseurs({ query: { queryKey: getGetFournisseursQueryKey() } });

  const createCategorie = useCreateBudgetCategorie();
  const createDepense = useCreateDepense();
  const deleteCategorie = useDeleteBudgetCategorie();
  const deleteDepense = useDeleteDepense();

  const [catForm, setCatForm] = useState({ nom: "", budget: "", depense: "0", couleur: "#1A9E6F" });
  const [recetteForm, setRecetteForm] = useState({ source: "", montant: "", date: new Date().toISOString().slice(0, 10), reference: "" });
  const [depForm, setDepForm] = useState({ categorieId: "", description: "", montant: "", date: new Date().toISOString().slice(0, 10) });
  const [planForm, setPlanForm] = useState({ poste: "", budget: "", periode: "mensuel", mois: "Mai 2025", avancement: "0" });
  const [expensePlanForm, setExpensePlanForm] = useState({ categorie: "", montant: "", date: new Date().toISOString().slice(0, 10), fournisseurId: "", fournisseur: "", paiement: "paye" });
  const [plans, setPlans] = useState<Array<{ id: number; poste: string; budget: number; periode: string; mois: string; avancement: number }>>([]);
  const [plannedExpenses, setPlannedExpenses] = useState<Array<{ id: number; categorie: string; montant: number; date: string; fournisseur: string; paiement: string }>>([]);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editingBudgetPrevId, setEditingBudgetPrevId] = useState<number | null>(null);
  const [budgetPrevForm, setBudgetPrevForm] = useState({ recettes: "", depenses: "" });
  const [openCat, setOpenCat] = useState(false);
  const [openDep, setOpenDep] = useState(false);
  const [recettesList, setRecettesList] = useState<Array<{ id: number; source: string; montant: number; date: string; reference: string }>>([]);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
  const depensesList = depenses ?? [];
  const [budgetPrevisionnel, setBudgetPrevisionnel] = useState<Array<{ id: number; mois: string; recettes: number; depenses: number }>>([]);

  const confirm = useConfirm();

  const handleDeleteCategorie = async (id: number) => {
    if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    deleteCategorie.mutate({ id }, {
      onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDepensesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const handleDeleteDepense = async (id: number) => {
    if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    deleteDepense.mutate({ id }, {
      onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetDepensesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const addPlan = async () => {
    if (!planForm.poste || !planForm.budget) return;
    if (!(await confirm({ title: editingPlanId ? "Modifier le plan" : "Ajouter au plan", description: editingPlanId ? "Confirmer la modification de ce poste budgétaire ?" : "Voulez-vous ajouter ce poste au plan budgétaire ?" }))) return;
    const normalizedPlan = {
      poste: planForm.poste.charAt(0).toUpperCase() + planForm.poste.slice(1),
      budget: Number(planForm.budget),
      periode: planForm.periode.charAt(0).toUpperCase() + planForm.periode.slice(1),
      mois: planForm.mois,
      avancement: Math.min(100, Math.max(0, Number(planForm.avancement) || 0)),
    };
    if (editingPlanId) {
      setPlans((current) =>
        current.map((plan) => (plan.id === editingPlanId ? { ...plan, ...normalizedPlan } : plan))
      );
      setEditingPlanId(null);
    } else {
      setPlans((current) => [
        { id: Date.now(), ...normalizedPlan },
        ...current,
      ]);
    }
    setPlanForm({ poste: "", budget: "", periode: "mensuel", mois: "Mai 2025", avancement: "0" });
  };

  const addPlannedExpenseOrUpdate = async () => {
    if (!expensePlanForm.categorie || !expensePlanForm.montant) return;
    if (!(await confirm({ title: editingExpenseId !== null ? "Modifier la dépense" : "Ajouter la dépense", description: editingExpenseId !== null ? "Confirmer la modification de cette dépense prévisionnelle ?" : "Voulez-vous enregistrer cette dépense prévisionnelle ?" }))) return;
    const entry = {
      categorie: expensePlanForm.categorie,
      montant: Number(expensePlanForm.montant),
      date: expensePlanForm.date,
      fournisseur: expensePlanForm.fournisseur || "—",
      paiement: expensePlanForm.paiement === "paye" ? "Payé" : expensePlanForm.paiement === "partiel" ? "Partiel" : "En attente",
    };
    if (editingExpenseId !== null) {
      setPlannedExpenses((cur) => cur.map((e) => e.id === editingExpenseId ? { ...e, ...entry } : e));
      setEditingExpenseId(null);
    } else {
      setPlannedExpenses((cur) => [{ id: Date.now(), ...entry }, ...cur]);
    }
    setExpensePlanForm({ categorie: "", montant: "", date: new Date().toISOString().slice(0, 10), fournisseurId: "", fournisseur: "", paiement: "paye" });
  };

  const editPlannedExpense = (id: number) => {
    const e = plannedExpenses.find((x) => x.id === id);
    if (!e) return;
    setEditingExpenseId(id);
    const paiementKey = e.paiement === "Payé" ? "paye" : e.paiement === "Partiel" ? "partiel" : "attente";
    setExpensePlanForm({ categorie: e.categorie, montant: String(e.montant), date: e.date, fournisseurId: "", fournisseur: e.fournisseur === "—" ? "" : e.fournisseur, paiement: paiementKey });
  };

  const startEditBudgetPrev = (id: number) => {
    const row = budgetPrevisionnel.find((r) => r.id === id);
    if (!row) return;
    setEditingBudgetPrevId(id);
    setBudgetPrevForm({ recettes: String(row.recettes), depenses: String(row.depenses) });
  };

  const saveBudgetPrev = async () => {
    if (editingBudgetPrevId === null) return;
    if (!(await confirm({ title: "Sauvegarder le budget", description: "Confirmer les nouvelles valeurs prévisionnelles ?" }))) return;
    setBudgetPrevisionnel((cur) =>
      cur.map((r) =>
        r.id === editingBudgetPrevId
          ? { ...r, recettes: Number(budgetPrevForm.recettes), depenses: Number(budgetPrevForm.depenses) }
          : r
      )
    );
    setEditingBudgetPrevId(null);
    setBudgetPrevForm({ recettes: "", depenses: "" });
  };


  const addRecette = () => {
    if (!recetteForm.source || !recetteForm.montant) return;
    setRecettesList((current) => [
      {
        id: Date.now(),
        source: recetteForm.source,
        montant: Number(recetteForm.montant),
        date: recetteForm.date,
        reference: recetteForm.reference || "—",
      },
      ...current,
    ]);
    setRecetteForm({ source: "", montant: "", date: new Date().toISOString().slice(0, 10), reference: "" });
  };

  const editPlan = (id: number) => {
    const plan = plans.find((item) => item.id === id);
    if (!plan) return;
    setEditingPlanId(id);
    setPlanForm({
      poste: plan.poste.toLowerCase(),
      budget: String(plan.budget),
      periode: plan.periode.toLowerCase(),
      mois: plan.mois,
      avancement: String(plan.avancement),
    });
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
              <form onSubmit={async e => { e.preventDefault(); if (!(await confirm({ title: "Créer la catégorie", description: "Voulez-vous créer cette catégorie budgétaire ?" }))) return; createCategorie.mutate({ data: { nom: catForm.nom, budget: Number(catForm.budget), depense: Number(catForm.depense), couleur: catForm.couleur || null } }, { onSuccess: () => { toast({ title: "Catégorie créée" }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); setOpenCat(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
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
              <form onSubmit={async e => { e.preventDefault(); if (!(await confirm({ title: "Enregistrer la dépense", description: "Voulez-vous enregistrer cette dépense ?" }))) return; createDepense.mutate({ data: { categorieId: Number(depForm.categorieId), description: depForm.description, montant: Number(depForm.montant), date: depForm.date } }, { onSuccess: () => { toast({ title: "Dépense enregistrée" }); qc.invalidateQueries({ queryKey: getGetDepensesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetStatsQueryKey() }); qc.invalidateQueries({ queryKey: getGetBudgetCategoriesQueryKey() }); setOpenDep(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="space-y-3">
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{cat.nom}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{fmt(cat.depense)} / {fmt(cat.budget)} FCFA</span>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteCategorie(cat.id)} data-testid={`button-delete-categorie-${cat.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enregistrer une recette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source *</Label>
                  <Select value={recetteForm.source} onValueChange={(value) => setRecetteForm((f) => ({ ...f, source: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vente animaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vente animaux">Vente animaux</SelectItem>
                      <SelectItem value="Subvention">Subvention</SelectItem>
                      <SelectItem value="Vente produits">Vente produits</SelectItem>
                      <SelectItem value="Autres">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <Input type="number" placeholder="ex: 500000" value={recetteForm.montant} onChange={(e) => setRecetteForm((f) => ({ ...f, montant: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={recetteForm.date} onChange={(e) => setRecetteForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input placeholder="ex: M. Dupont" value={recetteForm.reference} onChange={(e) => setRecetteForm((f) => ({ ...f, reference: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={addRecette}>Ajouter une recette</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recettes enregistrées</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30"><tr>{["Date", "Source", "Référence", "Montant (FCFA)"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {recettesList.map(r => <tr key={r.id} className="hover:bg-muted/20"><td className="px-4 py-3">{r.date}</td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{r.source}</span></td><td className="px-4 py-3">{r.reference}</td><td className="px-4 py-3 font-medium">{fmt(r.montant)}</td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enregistrer une dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={expensePlanForm.categorie} onValueChange={(value) => setExpensePlanForm((f) => ({ ...f, categorie: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alimentation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alimentation">Alimentation</SelectItem>
                      <SelectItem value="Salaire">Salaire</SelectItem>
                      <SelectItem value="Autres">Autres</SelectItem>
                      <SelectItem value="Santé">Santé</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <Input type="number" placeholder="ex: 75000" value={expensePlanForm.montant} onChange={(e) => setExpensePlanForm((f) => ({ ...f, montant: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={expensePlanForm.date} onChange={(e) => setExpensePlanForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Fournisseur</Label>
                  <Select value={expensePlanForm.fournisseurId} onValueChange={(value) => {
                    const fournisseur = fournisseurs?.find((item) => String(item.id) === value)?.nom ?? "";
                    setExpensePlanForm((f) => ({ ...f, fournisseurId: value, fournisseur }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {(fournisseurs ?? []).map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>{item.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Paiement</Label>
                  <Select value={expensePlanForm.paiement} onValueChange={(value) => setExpensePlanForm((f) => ({ ...f, paiement: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paye">Payé</SelectItem>
                      <SelectItem value="partiel">Partiel</SelectItem>
                      <SelectItem value="attente">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={addPlannedExpenseOrUpdate}>
                  {editingExpenseId !== null ? "Enregistrer les modifications" : "Ajouter une dépense"}
                </Button>
                {editingExpenseId !== null && (
                  <Button variant="outline" onClick={() => { setEditingExpenseId(null); setExpensePlanForm({ categorie: "", montant: "", date: new Date().toISOString().slice(0, 10), fournisseurId: "", fournisseur: "", paiement: "paye" }); }}>
                    Annuler
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dernières dépenses</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30"><tr>{["Date","Catégorie","Description","Montant (FCFA)",""].map((h, i) => <th key={h || `actions-${i}`} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingD ? <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                    : depensesList.slice(0, 20).map(d => <tr key={d.id} className="hover:bg-muted/20"><td className="px-4 py-3">{d.date}</td><td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{d.categorieNom ?? "—"}</span></td><td className="px-4 py-3">{d.description}</td><td className="px-4 py-3 font-medium">{fmt(Number(d.montant))}</td><td className="px-4 py-3 text-right"><Button variant="destructive" size="sm" onClick={() => handleDeleteDepense(d.id)} data-testid={`button-delete-depense-${d.id}`}><Trash2 className="h-4 w-4" /></Button></td></tr>)}
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
                {editingPlanId && (
                  <div className="space-y-2">
                    <Label>Avancement (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="ex: 50"
                      value={planForm.avancement}
                      onChange={(e) => setPlanForm((f) => ({ ...f, avancement: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={addPlan}>
                  {editingPlanId ? "Enregistrer les modifications" : "Ajouter au plan"}
                </Button>
                {editingPlanId && (
                  <Button variant="outline" onClick={() => { setEditingPlanId(null); setPlanForm({ poste: "", budget: "", periode: "mensuel", mois: "Mai 2025", avancement: "0" }); }}>
                    Annuler
                  </Button>
                )}
              </div>
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
                    <Button size="sm" variant="outline" onClick={() => editPlan(plan.id)}>
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Budget prévisionnel mensuel</CardTitle>
                <div className="flex gap-1.5 text-xs items-center">
                  <span className="w-3 h-3 rounded-sm inline-block bg-[#1A9E6F]" />Recettes
                  <span className="w-3 h-3 rounded-sm inline-block bg-[#E11D48] ml-2" />Dépenses
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={budgetPrevisionnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={(v: number) => [`${fmt(v)} FCFA`, "Montant"]} />
                  <Bar dataKey="recettes" fill="#1A9E6F" radius={[4,4,0,0]} name="Recettes" />
                  <Bar dataKey="depenses" fill="#E11D48" radius={[4,4,0,0]} name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Mois","Recettes prévisionnelles (FCFA)","Dépenses prévisionnelles (FCFA)","Solde",""].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {budgetPrevisionnel.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      {editingBudgetPrevId === row.id ? (
                        <>
                          <td className="px-4 py-2 font-medium">{row.mois}</td>
                          <td className="px-4 py-2"><Input type="number" className="h-7 text-sm w-36" value={budgetPrevForm.recettes} onChange={e => setBudgetPrevForm(f => ({ ...f, recettes: e.target.value }))} /></td>
                          <td className="px-4 py-2"><Input type="number" className="h-7 text-sm w-36" value={budgetPrevForm.depenses} onChange={e => setBudgetPrevForm(f => ({ ...f, depenses: e.target.value }))} /></td>
                          <td className="px-4 py-2 font-medium" />
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs" onClick={saveBudgetPrev}>Sauvegarder</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingBudgetPrevId(null)}>Annuler</Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-medium">{row.mois}</td>
                          <td className="px-4 py-2 text-green-700">{fmt(row.recettes)}</td>
                          <td className="px-4 py-2 text-red-600">{fmt(row.depenses)}</td>
                          <td className={`px-4 py-2 font-semibold ${row.recettes - row.depenses >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {row.recettes - row.depenses >= 0 ? "+" : ""}{fmt(row.recettes - row.depenses)}
                          </td>
                          <td className="px-4 py-2">
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEditBudgetPrev(row.id)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dépenses prévisionnelles</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Date", "Catégorie", "Fournisseur", "Montant (FCFA)", "Paiement", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {plannedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">{expense.date}</td>
                      <td className="px-4 py-3">{expense.categorie}</td>
                      <td className="px-4 py-3">{expense.fournisseur}</td>
                      <td className="px-4 py-3 font-medium">{fmt(expense.montant)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${expense.paiement === "Payé" ? "bg-green-100 text-green-700" : expense.paiement === "Partiel" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}>
                          {expense.paiement}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editPlannedExpense(expense.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setPlannedExpenses(cur => cur.filter(e => e.id !== expense.id))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
