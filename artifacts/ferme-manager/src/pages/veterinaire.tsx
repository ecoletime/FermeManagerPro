import { useState } from "react";
import {
  useGetVisitesVeterinaire, getGetVisitesVeterinaireQueryKey,
  useCreateVisiteVeterinaire, useUpdateVisiteVeterinaire, useDeleteVisiteVeterinaire,
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

const statutBadge: Record<string, string> = {
  Planifiee: "bg-blue-100 text-blue-800",
  Terminée: "bg-green-100 text-green-800",
  Annulée: "bg-red-100 text-red-800",
};

const initForm = { veterinaire: "", date: new Date().toISOString().slice(0, 10), type: "Consultation", animauxConcernes: "", diagnostic: "", traitement: "", cout: "", statut: "Planifiee", notes: "" };

export default function Veterinaire() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...initForm });

  const { data: visites, isLoading } = useGetVisitesVeterinaire({ query: { queryKey: getGetVisitesVeterinaireQueryKey() } });
  const createVisite = useCreateVisiteVeterinaire();
  const updateVisite = useUpdateVisiteVeterinaire();
  const deleteVisite = useDeleteVisiteVeterinaire();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetVisitesVeterinaireQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, animauxConcernes: form.animauxConcernes || null, diagnostic: form.diagnostic || null, traitement: form.traitement || null, cout: form.cout ? Number(form.cout) : null, notes: form.notes || null };
    if (editId) {
      updateVisite.mutate({ id: editId, data }, { onSuccess: () => { toast({ title: "Visite mise à jour" }); invalidate(); setOpen(false); setEditId(null); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    } else {
      createVisite.mutate({ data }, { onSuccess: () => { toast({ title: "Visite enregistrée" }); invalidate(); setOpen(false); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) });
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Vétérinaire</h1><p className="text-muted-foreground text-sm">Suivi des visites vétérinaires</p></div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm({ ...initForm }); } }}>
          <DialogTrigger asChild><Button data-testid="button-add-visite"><Plus className="h-4 w-4 mr-2" />Nouvelle visite</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Modifier" : "Nouvelle"} visite</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Vétérinaire *</Label><Input value={form.veterinaire} onChange={e => setForm(f => ({...f, veterinaire: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Type *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Consultation","Visite préventive","Urgence","Contrôle","Vaccination"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Planifiee","Terminée","Annulée"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Animaux concernés</Label><Input value={form.animauxConcernes} onChange={e => setForm(f => ({...f, animauxConcernes: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Coût (FCFA)</Label><Input type="number" value={form.cout} onChange={e => setForm(f => ({...f, cout: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Diagnostic</Label><Input value={form.diagnostic} onChange={e => setForm(f => ({...f, diagnostic: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Traitement prescrit</Label><Input value={form.traitement} onChange={e => setForm(f => ({...f, traitement: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createVisite.isPending || updateVisite.isPending}>{editId ? "Mettre à jour" : "Enregistrer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>{["Vétérinaire","Date","Type","Animaux","Diagnostic","Coût (FCFA)","Statut",""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? Array.from({length: 3}).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                : visites?.map(v => (
                <tr key={v.id} className="hover:bg-muted/20" data-testid={`row-visite-${v.id}`}>
                  <td className="px-4 py-3 font-medium">{v.veterinaire}</td>
                  <td className="px-4 py-3">{v.date}</td>
                  <td className="px-4 py-3">{v.type}</td>
                  <td className="px-4 py-3">{v.animauxConcernes ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{v.diagnostic ?? "—"}</td>
                  <td className="px-4 py-3">{v.cout != null ? fmt(Number(v.cout)) : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${statutBadge[v.statut] ?? "bg-gray-100 text-gray-800"}`}>{v.statut}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditId(v.id); setForm({ veterinaire: v.veterinaire, date: v.date, type: v.type, animauxConcernes: v.animauxConcernes ?? "", diagnostic: v.diagnostic ?? "", traitement: v.traitement ?? "", cout: v.cout ? String(v.cout) : "", statut: v.statut, notes: v.notes ?? "" }); setOpen(true); }}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (!confirm("Supprimer?")) return; deleteVisite.mutate({ id: v.id }, { onSuccess: () => { toast({ title: "Supprimé" }); invalidate(); } }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
