import { useState } from "react";
import {
  useGetFournisseurs, getGetFournisseursQueryKey,
  useCreateFournisseur, useUpdateFournisseur, useDeleteFournisseur,
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
import { Plus, Trash2, Edit3 } from "lucide-react";

const initForm = { nom: "", categorie: "", telephone: "", email: "", adresse: "", produits: "", statut: "Actif", notes: "" };

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

export default function Fournisseurs() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...initForm });
  const [paiement, setPaiement] = useState("Payé");
  const [paiementAutre, setPaiementAutre] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const { data: fournisseurs, isLoading } = useGetFournisseurs({ query: { queryKey: getGetFournisseursQueryKey() } });
  const createFournisseur = useCreateFournisseur();
  const updateFournisseur = useUpdateFournisseur();
  const deleteFournisseur = useDeleteFournisseur();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetFournisseursQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, telephone: form.telephone || null, email: form.email || null, adresse: form.adresse || null, produits: form.produits || null, notes: form.notes || null };
    if (editId) {
      updateFournisseur.mutate({ id: editId, data }, { onSuccess: () => { toast({ title: "Fournisseur mis à jour" }); invalidate(); setOpen(false); setEditId(null); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    } else {
      createFournisseur.mutate({ data }, { onSuccess: () => { toast({ title: "Fournisseur ajouté" }); invalidate(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    }
  };

  const stats = {
    depenseAnnee: fournisseurs?.reduce((sum, f) => sum + (f.statut === "Actif" ? 160000 : 0), 0) ?? 0,
    enAttente: fournisseurs?.reduce((sum, f) => sum + (f.statut === "Inactif" ? 1 : 0), 0) ?? 0,
    fournisseursActifs: fournisseurs?.filter(f => f.statut === "Actif").length ?? 0,
    remboursements: fournisseurs?.length ?? 0,
  };
  const commandes = [
    { date: "24/04/2025", fournisseur: "AgroNutrition SA", produit: "Croissance 3", montant: "150 000 FCFA", statut: "Payé" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground text-sm">Gestion des fournisseurs, commandes et paiements</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm({ ...initForm }); } }}>
          <DialogTrigger asChild><Button data-testid="button-add-fournisseur"><Plus className="h-4 w-4 mr-2" />Ajouter un fournisseur</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouveau"} fournisseur</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Catégorie *</Label>
                  <Select value={form.categorie} onValueChange={v => setForm(f => ({...f, categorie: v}))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{["Aliments", "Médicaments", "Matériel", "Équipements", "Services", "Autre"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Actif", "Inactif"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(f => ({...f, telephone: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Produits/Services</Label><Input value={form.produits} onChange={e => setForm(f => ({...f, produits: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={e => setForm(f => ({...f, adresse: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createFournisseur.isPending || updateFournisseur.isPending}>{editId ? "Mettre à jour" : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="commandes">Commandes</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={`${new Intl.NumberFormat("fr-FR").format(stats.depenseAnnee)} FCFA`} label="Dépenses année" color="text-green-600" />
            <StatCard value={`${new Intl.NumberFormat("fr-FR").format(stats.enAttente)} FCFA`} label="En attente" color="text-red-600" />
            <StatCard value={stats.fournisseursActifs} label="Fournisseurs actifs" color="text-slate-800" />
            <StatCard value={stats.remboursements} label="À rembourser" color="text-amber-600" />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Fournisseurs</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>{["NOM", "CATÉGORIE", "TÉLÉPHONE", "TOTAL ACHATS", "STATUT"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>) : fournisseurs?.map(f => (
                    <tr key={f.id} className="hover:bg-muted/20" data-testid={`row-fournisseur-${f.id}`}>
                      <td className="px-4 py-3 font-medium">{f.nom}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.categorie}</td>
                      <td className="px-4 py-3">{f.telephone ?? "—"}</td>
                      <td className="px-4 py-3 text-green-700">{f.statut === "Actif" ? "120 000 FCFA" : "13 000 FCFA"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${f.statut === "Actif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{f.statut}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commandes" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Enregistrer une commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fournisseur *</Label>
                  <Select defaultValue="">
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>{(fournisseurs ?? []).map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" defaultValue={today} />
                </div>
                <div className="space-y-1">
                  <Label>Produit *</Label>
                  <Input placeholder="Ex: Croissance 3" />
                </div>
                <div className="space-y-1">
                  <Label>Montant (FCFA) *</Label>
                  <Input type="number" placeholder="ex: 150000" />
                </div>
                <div className="space-y-1">
                  <Label>Quantité</Label>
                  <Input placeholder="ex: 500 kg" />
                </div>
                <div className="space-y-1">
                  <Label>Paiement</Label>
                  <Select value={paiement} onValueChange={setPaiement}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Payé", "Partiel", "En attente", "Autre"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {paiement === "Autre" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Préciser</Label>
                    <Input value={paiementAutre} onChange={e => setPaiementAutre(e.target.value)} placeholder="Précisez le type de paiement" />
                  </div>
                )}
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Historique commandes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>{["DATE", "FOURNISSEUR", "PRODUIT", "MONTANT", "STATUT"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {commandes.map(c => (
                    <tr key={`${c.date}-${c.fournisseur}`} className="hover:bg-muted/20">
                      <td className="px-4 py-3">{c.date}</td>
                      <td className="px-4 py-3">{c.fournisseur}</td>
                      <td className="px-4 py-3">{c.produit}</td>
                      <td className="px-4 py-3">{c.montant}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">{c.statut}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements" className="space-y-4 mt-4">
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Historique des paiements fournisseurs à afficher ici.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
