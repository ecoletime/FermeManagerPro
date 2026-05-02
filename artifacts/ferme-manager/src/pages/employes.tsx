import { useState } from "react";
import {
  useGetEmployes, getGetEmployesQueryKey,
  useCreateEmploye, useUpdateEmploye, useDeleteEmploye,
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
import { Plus, Trash2, Edit3, Users } from "lucide-react";

const statutBadge: Record<string, string> = {
  Actif: "bg-green-100 text-green-800",
  Congé: "bg-blue-100 text-blue-800",
  Suspendu: "bg-red-100 text-red-800",
};

const initForm = { nom: "", poste: "", telephone: "", email: "", dateEmbauche: "", statut: "Actif", salaire: "" };

export default function Employes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...initForm });

  const { data: employes, isLoading } = useGetEmployes({ query: { queryKey: getGetEmployesQueryKey() } });
  const createEmploye = useCreateEmploye();
  const updateEmploye = useUpdateEmploye();
  const deleteEmploye = useDeleteEmploye();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetEmployesQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, telephone: form.telephone || null, email: form.email || null, dateEmbauche: form.dateEmbauche || null, salaire: form.salaire ? Number(form.salaire) : null };
    if (editId) {
      updateEmploye.mutate({ id: editId, data }, { onSuccess: () => { toast({ title: "Employé mis à jour" }); invalidate(); setOpen(false); setEditId(null); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    } else {
      createEmploye.mutate({ data }, { onSuccess: () => { toast({ title: "Employé ajouté" }); invalidate(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const total = employes?.length ?? 0;
  const actifs = employes?.filter(e => e.statut === "Actif").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Employés</h1><p className="text-muted-foreground text-sm">{actifs} actifs sur {total} employés</p></div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm({ ...initForm }); } }}>
          <DialogTrigger asChild><Button data-testid="button-add-employe"><Plus className="h-4 w-4 mr-2" />Ajouter un employé</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouvel"} employé</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Nom complet *</Label><Input data-testid="input-nom" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Poste *</Label><Input value={form.poste} onChange={e => setForm(f => ({...f, poste: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(f => ({...f, telephone: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Date embauche</Label><Input type="date" value={form.dateEmbauche} onChange={e => setForm(f => ({...f, dateEmbauche: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Actif","Congé","Suspendu"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Salaire (FCFA)</Label><Input type="number" value={form.salaire} onChange={e => setForm(f => ({...f, salaire: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createEmploye.isPending || updateEmploye.isPending}>{editId ? "Mettre à jour" : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>{["Nom","Poste","Téléphone","Email","Embauche","Salaire (FCFA)","Statut",""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? Array.from({length: 4}).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                : employes?.map(e => (
                <tr key={e.id} className="hover:bg-muted/20" data-testid={`row-employe-${e.id}`}>
                  <td className="px-4 py-3 font-medium">{e.nom}</td>
                  <td className="px-4 py-3">{e.poste}</td>
                  <td className="px-4 py-3">{e.telephone ?? "—"}</td>
                  <td className="px-4 py-3">{e.email ?? "—"}</td>
                  <td className="px-4 py-3">{e.dateEmbauche ?? "—"}</td>
                  <td className="px-4 py-3">{e.salaire != null ? fmt(Number(e.salaire)) : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${statutBadge[e.statut] ?? "bg-gray-100 text-gray-800"}`}>{e.statut}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="sm" data-testid={`button-edit-${e.id}`} onClick={() => { setEditId(e.id); setForm({ nom: e.nom, poste: e.poste, telephone: e.telephone ?? "", email: e.email ?? "", dateEmbauche: e.dateEmbauche ?? "", statut: e.statut, salaire: e.salaire ? String(e.salaire) : "" }); setOpen(true); }}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-${e.id}`} onClick={() => { if (!confirm(`Supprimer ${e.nom}?`)) return; deleteEmploye.mutate({ id: e.id }, { onSuccess: () => { toast({ title: "Supprimé" }); invalidate(); } }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
