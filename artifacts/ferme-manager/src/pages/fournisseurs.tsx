import { useState } from "react";
import {
  useGetFournisseurs, getGetFournisseursQueryKey,
  useCreateFournisseur, useUpdateFournisseur, useDeleteFournisseur,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit3 } from "lucide-react";

const initForm = { nom: "", categorie: "", telephone: "", email: "", adresse: "", produits: "", statut: "Actif", notes: "" };

export default function Fournisseurs() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...initForm });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1><p className="text-muted-foreground text-sm">{fournisseurs?.length ?? 0} fournisseurs enregistrés</p></div>
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
                    <SelectContent>{["Aliments","Médicaments","Matériel","Équipements","Services","Autre"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Actif","Inactif"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>{["Nom","Catégorie","Téléphone","Email","Produits","Statut",""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? Array.from({length: 3}).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                : fournisseurs?.map(f => (
                <tr key={f.id} className="hover:bg-muted/20" data-testid={`row-fournisseur-${f.id}`}>
                  <td className="px-4 py-3 font-medium">{f.nom}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{f.categorie}</span></td>
                  <td className="px-4 py-3">{f.telephone ?? "—"}</td>
                  <td className="px-4 py-3">{f.email ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{f.produits ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${f.statut === "Actif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{f.statut}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditId(f.id); setForm({ nom: f.nom, categorie: f.categorie, telephone: f.telephone ?? "", email: f.email ?? "", adresse: f.adresse ?? "", produits: f.produits ?? "", statut: f.statut, notes: f.notes ?? "" }); setOpen(true); }}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (!confirm(`Supprimer ${f.nom}?`)) return; deleteFournisseur.mutate({ id: f.id }, { onSuccess: () => { toast({ title: "Supprimé" }); invalidate(); } }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
