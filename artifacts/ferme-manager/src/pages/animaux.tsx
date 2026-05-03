import { useState } from "react";
import {
  useGetAnimaux, getGetAnimauxQueryKey,
  useGetAnimauxStats, getGetAnimauxStatsQueryKey,
  useCreateAnimal, useDeleteAnimal,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Search } from "lucide-react";
import { useGetEmployes, getGetEmployesQueryKey } from "@workspace/api-client-react";

const statutColors: Record<string, string> = {
  Sain: "bg-green-100 text-green-800",
  Malade: "bg-red-100 text-red-800",
  Gestante: "bg-blue-100 text-blue-800",
  "En quarantaine": "bg-amber-100 text-amber-800",
  Décédé: "bg-gray-100 text-gray-800",
};

export default function Animaux() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tag: "", type: "Truie", sexe: "F", dateNaissance: "", poids: "", batiment: "", statut: "Sain" });

  const params = {
    ...(search ? { tag: search } : {}),
    ...(filterStatut ? { statut: filterStatut } : {}),
    ...(filterType ? { type: filterType } : {}),
  };
  const { data: animaux, isLoading } = useGetAnimaux(params, { query: { queryKey: getGetAnimauxQueryKey(params) } });
  const { data: stats } = useGetAnimauxStats({ query: { queryKey: getGetAnimauxStatsQueryKey() } });
  const { data: employes } = useGetEmployes({ query: { queryKey: getGetEmployesQueryKey() } });
  const createAnimal = useCreateAnimal();
  const deleteAnimal = useDeleteAnimal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnimal.mutate({ data: { ...form, poids: form.poids ? Number(form.poids) : null, dateNaissance: form.dateNaissance || null } }, {
      onSuccess: () => {
        toast({ title: "Animal ajouté" });
        qc.invalidateQueries({ queryKey: getGetAnimauxQueryKey({}) });
        qc.invalidateQueries({ queryKey: getGetAnimauxStatsQueryKey() });
        setOpen(false);
        setForm({ tag: "", type: "Truie", sexe: "F", dateNaissance: "", poids: "", batiment: "", statut: "Sain" });
      },
      onError: () => toast({ variant: "destructive", title: "Erreur lors de l'ajout" }),
    });
  };

  const handleDelete = (id: number, tag: string) => {
    if (!confirm(`Supprimer l'animal ${tag}?`)) return;
    deleteAnimal.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Animal supprimé" });
        qc.invalidateQueries({ queryKey: getGetAnimauxQueryKey({}) });
        qc.invalidateQueries({ queryKey: getGetAnimauxStatsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Erreur lors de la suppression" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registre des Animaux</h1>
          <p className="text-muted-foreground text-sm">Gestion du troupeau</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-animal"><Plus className="h-4 w-4 mr-2" />Ajouter un animal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvel animal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Tag *</Label><Input data-testid="input-tag" value={form.tag} onChange={e => setForm(f => ({...f, tag: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Type *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v, sexe: v === "Verrat" ? "M" : v === "Truie" ? "F" : f.sexe}))}>
                    <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Truie","Verrat","Porcelet","Engraissement"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Sexe *</Label>
                  <Select value={form.sexe} onValueChange={v => setForm(f => ({...f, sexe: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Mâle</SelectItem>
                      <SelectItem value="F">Femelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Statut</Label>
                  <Select value={form.statut} onValueChange={v => setForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Sain","Malade","Gestante","En quarantaine"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Date naissance</Label><Input type="date" value={form.dateNaissance} onChange={e => setForm(f => ({...f, dateNaissance: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Poids (kg)</Label><Input type="number" step="0.1" value={form.poids} onChange={e => setForm(f => ({...f, poids: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label>Bâtiment</Label><Input value={form.batiment} onChange={e => setForm(f => ({...f, batiment: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createAnimal.isPending}>{createAnimal.isPending ? "Ajout..." : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registre">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="registre">Registre</TabsTrigger>
          <TabsTrigger value="pesees">Pesées</TabsTrigger>
          <TabsTrigger value="transferts">Transferts</TabsTrigger>
          <TabsTrigger value="sorties">Sorties</TabsTrigger>
        </TabsList>

        <TabsContent value="registre" className="space-y-4 mt-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total animaux</div></CardContent></Card>
              {Object.entries(stats.parType ?? {}).slice(0,3).map(([t, n]) => (
                <Card key={t}><CardContent className="pt-4"><div className="text-2xl font-bold">{String(n)}</div><div className="text-xs text-muted-foreground">{t}s</div></CardContent></Card>
              ))}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-search" placeholder="Rechercher par tag..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterStatut || "all"} onValueChange={v => setFilterStatut(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[160px]" data-testid="select-statut"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {["Sain","Malade","Gestante","En quarantaine"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterType || "all"} onValueChange={v => setFilterType(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[160px]" data-testid="select-type-filter"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {["Truie","Verrat","Porcelet","Engraissement"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      {["Tag","Type","Sexe","Naissance","Poids (kg)","Bâtiment","Statut",""].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? Array.from({length: 5}).map((_, i) => (
                      <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                    )) : animaux?.map(a => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-animal-${a.id}`}>
                        <td className="px-4 py-3 font-mono font-medium">{a.tag}</td>
                        <td className="px-4 py-3">{a.type}</td>
                        <td className="px-4 py-3">{a.sexe === "M" ? "Mâle" : "Femelle"}</td>
                        <td className="px-4 py-3">{a.dateNaissance ?? "—"}</td>
                        <td className="px-4 py-3">{a.poids != null ? Number(a.poids).toFixed(1) : "—"}</td>
                        <td className="px-4 py-3">{a.batiment ?? "—"}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statutColors[a.statut] ?? "bg-gray-100 text-gray-800"}`}>{a.statut}</span></td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" data-testid={`button-delete-${a.id}`} onClick={() => handleDelete(a.id, a.tag)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && animaux?.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Aucun animal trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pesees" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Enregistrer une pesée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Animal *</Label>
                  <Select defaultValue="">
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Choisir...</SelectItem>
                      {(animaux ?? []).map(a => <SelectItem key={a.id} value={a.tag}>{a.tag}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-1">
                  <Label>Poids (kg) *</Label>
                  <Input type="number" step="0.1" placeholder="ex: 47" />
                </div>
                <div className="space-y-1">
                  <Label>Par</Label>
                  <Select defaultValue={employes?.[0]?.nom ?? ""}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(employes ?? []).map(e => <SelectItem key={e.id} value={e.nom}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Historique pesées</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>{["TAG", "DATE", "POIDS", "GAIN/PERTE", "PAR"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">#T-022</td>
                    <td className="px-4 py-3">25/04/2025</td>
                    <td className="px-4 py-3">80 kg</td>
                    <td className="px-4 py-3 text-green-600">+5 kg</td>
                    <td className="px-4 py-3">Jean-Pierre D.</td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">#P-108</td>
                    <td className="px-4 py-3">20/04/2025</td>
                    <td className="px-4 py-3">52 kg</td>
                    <td className="px-4 py-3 text-red-600">-3 kg</td>
                    <td className="px-4 py-3">Jean-Pierre D.</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transferts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Enregistrer un transfert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Animal *</Label>
                  <Select defaultValue="">
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Choisir...</SelectItem>
                      {(animaux ?? []).map(a => <SelectItem key={a.id} value={a.tag}>{a.tag}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-1">
                  <Label>De</Label>
                  <Select defaultValue="Bâtiment A">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Bâtiment A", "Bâtiment B", "Quarantaine"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Vers *</Label>
                  <Select defaultValue="Bâtiment A">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Bâtiment A", "Bâtiment B", "Quarantaine"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Raison</Label>
                  <Select defaultValue="Quarantaine">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Quarantaine", "Vente", "Croissance", "Autre"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Par</Label>
                  <Select defaultValue={employes?.[0]?.nom ?? ""}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(employes ?? []).map(e => <SelectItem key={e.id} value={e.nom}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Enregistrer</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Historique</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>{["DATE", "TAG", "DE", "VERS", "RAISON"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3">22/04/2025</td>
                    <td className="px-4 py-3">#P-108</td>
                    <td className="px-4 py-3">Bât. B</td>
                    <td className="px-4 py-3">Bât. D</td>
                    <td className="px-4 py-3">Quarantaine</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sorties" className="mt-4">
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Sorties à afficher ici.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
