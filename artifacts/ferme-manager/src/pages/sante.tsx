import { useState } from "react";
import {
  useGetVaccins, getGetVaccinsQueryKey, useCreateVaccin, useDeleteVaccin,
  useGetTraitements, getGetTraitementsQueryKey, useCreateTraitement,
  useGetQuarantaine, getGetQuarantaineQueryKey, useCreateQuarantaine,
  useGetMortalite, getGetMortaliteQueryKey, useCreateMort,
  useGetSanteStats, getGetSanteStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Clock, Skull, Bell, Plus, Trash2, CheckCircle2, FlaskConical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function statusClass(statut: string) {
  if (statut === "En cours") return "bg-amber-100 text-amber-700";
  if (statut === "Terminé" || statut === "Terminee") return "bg-green-100 text-green-700";
  if (statut === "Critique") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${className}`}>{children}</span>;
}

export default function Sante() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: stats } = useGetSanteStats({ query: { queryKey: getGetSanteStatsQueryKey() } });
  const { data: vaccins, isLoading: loadingV } = useGetVaccins({ query: { queryKey: getGetVaccinsQueryKey() } });
  const { data: traitements, isLoading: loadingT } = useGetTraitements({ query: { queryKey: getGetTraitementsQueryKey() } });
  const { data: quarantaine, isLoading: loadingQ } = useGetQuarantaine({ query: { queryKey: getGetQuarantaineQueryKey() } });
  const { data: mortalite, isLoading: loadingM } = useGetMortalite({ query: { queryKey: getGetMortaliteQueryKey() } });

  const createVaccin = useCreateVaccin();
  const deleteVaccin = useDeleteVaccin();
  const createTraitement = useCreateTraitement();
  const createQuarantaine = useCreateQuarantaine();
  const createMort = useCreateMort();

  const [vaccinForm, setVaccinForm] = useState({ tag: "", vaccin: "", date: today, dose: "", rappel: "", administrePar: "" });
  const [traitForm, setTraitForm] = useState({ tag: "", typeTraitement: "", produit: "", dose: "", dateDebut: today, dateFin: "", statut: "En cours" });
  const [quarForm, setQuarForm] = useState({ tag: "", motif: "", dateDebut: today, dureeJours: "7" });
  const [mortForm, setMortForm] = useState({ tag: "", date: today, cause: "", confirme_par: "", observations: "" });

  const vaccinesDue = (vaccins ?? []).filter(v => v.rappel && v.rappel <= today).length;
  const activeQuarantine = (quarantaine ?? []).filter(q => q.statut === "En cours").length;
  const deathsThisMonth = (mortalite ?? []).filter(m => m.date.slice(0, 7) === today.slice(0, 7)).length;
  const sickAnimals = stats?.malades ?? 0;

  const alerts = [
    ...(vaccinesDue > 0 ? [{ tone: "red", text: `Vaccins à faire — ${vaccinesDue} rappel(s) en retard` }] : []),
    ...(activeQuarantine > 0 ? [{ tone: "amber", text: `Quarantaine active — ${activeQuarantine} animal(aux) en suivi` }] : []),
    ...(sickAnimals > 0 ? [{ tone: "green", text: `Surveillance sanitaire — ${sickAnimals} animal(aux) malade(s) détecté(s)` }] : []),
    ...(deathsThisMonth > 0 ? [{ tone: "red", text: `Décès ce mois — ${deathsThisMonth}` }] : []),
  ];

  const graphData = [
    { name: "Vaccins", valeur: (vaccins ?? []).length },
    { name: "Trait.", valeur: (traitements ?? []).length },
    { name: "Quar.", valeur: (quarantaine ?? []).length },
    { name: "Décès", valeur: (mortalite ?? []).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><span>🩺</span> Santé & Vaccins</h1>
        <p className="text-muted-foreground text-sm">Suivi sanitaire, vaccinations, traitements, quarantaine et mortalité</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Animaux malades" value={stats?.malades ?? "—"} color="text-red-500" />
        <StatCard icon={Shield} label="Vaccins à faire" value={stats?.vaccinsAFaire ?? "—"} color="text-blue-500" />
        <StatCard icon={Clock} label="En quarantaine" value={stats?.enQuarantaine ?? "—"} color="text-amber-500" />
        <StatCard icon={Skull} label="Décès ce mois" value={stats?.decesMois ?? "—"} color="text-green-600" />
      </div>

      <Tabs defaultValue="vaccins">
        <TabsList className="gap-1">
          <TabsTrigger value="vaccins">Vaccinations</TabsTrigger>
          <TabsTrigger value="traitements">Traitements</TabsTrigger>
          <TabsTrigger value="quarantaine">Quarantaine</TabsTrigger>
          <TabsTrigger value="mortalite">Mortalité</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        <TabsContent value="vaccins" className="space-y-4 mt-4">
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-md border text-sm ${a.tone === "red" ? "bg-red-50 border-red-200 text-red-800" : a.tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-800"}`}
              >
                {a.tone === "red" ? <AlertTriangle className="h-4 w-4" /> : a.tone === "amber" ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{a.text}</span>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Bell className="h-4 w-4" />Vaccinations à venir</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20">
                  <tr>{["TAG", "VACCIN", "DATE", "RAPPEL", "ADMINISTRÉ PAR", "STATUT"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {loadingV ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                    : (vaccins ?? []).length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune vaccination enregistrée</td></tr>
                    : (vaccins ?? []).map(v => {
                      const stat = v.rappel && v.rappel <= today ? "À faire" : "Planifié";
                      return <tr key={v.id} className="hover:bg-muted/10"><td className="px-4 py-2.5 font-mono font-medium">{v.tag}</td><td className="px-4 py-2.5">{v.vaccin}</td><td className="px-4 py-2.5">{v.date}</td><td className="px-4 py-2.5">{v.rappel ?? "—"}</td><td className="px-4 py-2.5">{v.administrePar ?? "—"}</td><td className="px-4 py-2.5"><Badge className={stat === "À faire" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>{stat}</Badge></td></tr>;
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Enregistrer un vaccin</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); createVaccin.mutate({ data: { ...vaccinForm, rappel: vaccinForm.rappel || null, dose: vaccinForm.dose || null, administrePar: vaccinForm.administrePar || null } }, { onSuccess: () => { toast({ title: "Vaccin enregistré" }); qc.invalidateQueries({ queryKey: getGetVaccinsQueryKey() }); qc.invalidateQueries({ queryKey: getGetSanteStatsQueryKey() }); setVaccinForm({ tag: "", vaccin: "", date: today, dose: "", rappel: "", administrePar: "" }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Tag animal *</Label><Input value={vaccinForm.tag} onChange={e => setVaccinForm(f => ({ ...f, tag: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Vaccin *</Label><Input value={vaccinForm.vaccin} onChange={e => setVaccinForm(f => ({ ...f, vaccin: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date *</Label><Input type="date" value={vaccinForm.date} onChange={e => setVaccinForm(f => ({ ...f, date: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Dose</Label><Input value={vaccinForm.dose} onChange={e => setVaccinForm(f => ({ ...f, dose: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Rappel</Label><Input type="date" value={vaccinForm.rappel} onChange={e => setVaccinForm(f => ({ ...f, rappel: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Administré par</Label><Input value={vaccinForm.administrePar} onChange={e => setVaccinForm(f => ({ ...f, administrePar: e.target.value }))} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full" disabled={createVaccin.isPending}>Enregistrer</Button></div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traitements" className="space-y-4 mt-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><FlaskConical className="h-4 w-4" />Traitements en cours</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20"><tr>{["TAG", "TYPE", "PRODUIT", "DOSE", "DÉBUT", "FIN", "STATUT"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingT ? <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                    : (traitements ?? []).length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun traitement enregistré</td></tr>
                    : (traitements ?? []).map(t => <tr key={t.id} className="hover:bg-muted/10"><td className="px-4 py-2.5 font-mono font-medium">{t.tag}</td><td className="px-4 py-2.5">{t.typeTraitement}</td><td className="px-4 py-2.5">{t.produit}</td><td className="px-4 py-2.5">{t.dose ?? "—"}</td><td className="px-4 py-2.5">{t.dateDebut}</td><td className="px-4 py-2.5">{t.dateFin ?? "—"}</td><td className="px-4 py-2.5"><Badge className={statusClass(t.statut)}>{t.statut}</Badge></td></tr>)}
                </tbody>
              </table>
            </CardContent></Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouveau traitement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); createTraitement.mutate({ data: { ...traitForm, dateFin: traitForm.dateFin || null, dose: traitForm.dose || null } }, { onSuccess: () => { toast({ title: "Traitement enregistré" }); qc.invalidateQueries({ queryKey: getGetTraitementsQueryKey() }); setTraitForm({ tag: "", typeTraitement: "", produit: "", dose: "", dateDebut: today, dateFin: "", statut: "En cours" }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Tag animal *</Label><Input value={traitForm.tag} onChange={e => setTraitForm(f => ({ ...f, tag: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Type *</Label><Input value={traitForm.typeTraitement} onChange={e => setTraitForm(f => ({ ...f, typeTraitement: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Produit *</Label><Input value={traitForm.produit} onChange={e => setTraitForm(f => ({ ...f, produit: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Dose</Label><Input value={traitForm.dose} onChange={e => setTraitForm(f => ({ ...f, dose: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date début *</Label><Input type="date" value={traitForm.dateDebut} onChange={e => setTraitForm(f => ({ ...f, dateDebut: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date fin</Label><Input type="date" value={traitForm.dateFin} onChange={e => setTraitForm(f => ({ ...f, dateFin: e.target.value }))} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full" disabled={createTraitement.isPending}>Enregistrer</Button></div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarantaine" className="space-y-4 mt-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Suivi quarantaine</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20"><tr>{["TAG", "MOTIF", "DÉBUT", "DURÉE", "STATUT"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingQ ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                    : (quarantaine ?? []).length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune mise en quarantaine</td></tr>
                    : (quarantaine ?? []).map(q => <tr key={q.id} className="hover:bg-muted/10"><td className="px-4 py-2.5 font-mono font-medium">{q.tag}</td><td className="px-4 py-2.5">{q.motif}</td><td className="px-4 py-2.5">{q.dateDebut}</td><td className="px-4 py-2.5">{q.dureeJours}j</td><td className="px-4 py-2.5"><Badge className={statusClass(q.statut)}>{q.statut}</Badge></td></tr>)}
                </tbody>
              </table>
            </CardContent></Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouvelle quarantaine</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); createQuarantaine.mutate({ data: { tag: quarForm.tag, motif: quarForm.motif, dateDebut: quarForm.dateDebut, dureeJours: Number(quarForm.dureeJours) } }, { onSuccess: () => { toast({ title: "Quarantaine enregistrée" }); qc.invalidateQueries({ queryKey: getGetQuarantaineQueryKey() }); qc.invalidateQueries({ queryKey: getGetSanteStatsQueryKey() }); setQuarForm({ tag: "", motif: "", dateDebut: today, dureeJours: "7" }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Tag animal *</Label><Input value={quarForm.tag} onChange={e => setQuarForm(f => ({ ...f, tag: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Motif *</Label><Input value={quarForm.motif} onChange={e => setQuarForm(f => ({ ...f, motif: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date début *</Label><Input type="date" value={quarForm.dateDebut} onChange={e => setQuarForm(f => ({ ...f, dateDebut: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Durée (jours)</Label><Input type="number" value={quarForm.dureeJours} onChange={e => setQuarForm(f => ({ ...f, dureeJours: e.target.value }))} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full" disabled={createQuarantaine.isPending}>Enregistrer</Button></div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mortalite" className="space-y-4 mt-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Skull className="h-4 w-4" />Déclarations de décès</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20"><tr>{["TAG", "DATE", "CAUSE", "CONFIRMÉ PAR", "OBSERVATIONS"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingM ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                    : (mortalite ?? []).length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun décès enregistré</td></tr>
                    : (mortalite ?? []).map(m => <tr key={m.id} className="hover:bg-muted/10"><td className="px-4 py-2.5 font-mono font-medium">{m.tag}</td><td className="px-4 py-2.5">{m.date}</td><td className="px-4 py-2.5">{m.cause}</td><td className="px-4 py-2.5">{m.confirme_par ?? "—"}</td><td className="px-4 py-2.5">{m.observations ?? "—"}</td></tr>)}
                </tbody>
              </table>
            </CardContent></Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Déclarer un décès</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); createMort.mutate({ data: { ...mortForm, confirme_par: mortForm.confirme_par || null, observations: mortForm.observations || null } }, { onSuccess: () => { toast({ title: "Décès enregistré" }); qc.invalidateQueries({ queryKey: getGetMortaliteQueryKey() }); qc.invalidateQueries({ queryKey: getGetSanteStatsQueryKey() }); setMortForm({ tag: "", date: today, cause: "", confirme_par: "", observations: "" }); }, onError: () => toast({ variant: "destructive", title: "Erreur" }) }); }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Tag animal *</Label><Input value={mortForm.tag} onChange={e => setMortForm(f => ({ ...f, tag: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date *</Label><Input type="date" value={mortForm.date} onChange={e => setMortForm(f => ({ ...f, date: e.target.value }))} required /></div>
                <div className="space-y-1 col-span-2"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Cause *</Label><Input value={mortForm.cause} onChange={e => setMortForm(f => ({ ...f, cause: e.target.value }))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Confirmé par</Label><Input value={mortForm.confirme_par} onChange={e => setMortForm(f => ({ ...f, confirme_par: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Observations</Label><Input value={mortForm.observations} onChange={e => setMortForm(f => ({ ...f, observations: e.target.value }))} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full" variant="destructive" disabled={createMort.isPending}>Enregistrer</Button></div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graphiques" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 pb-4 text-center"><div className="text-2xl font-bold text-primary">{(vaccins ?? []).length}</div><div className="text-xs text-muted-foreground mt-1">Vaccinations</div></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center"><div className="text-2xl font-bold text-blue-600">{(traitements ?? []).length}</div><div className="text-xs text-muted-foreground mt-1">Traitements</div></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center"><div className="text-2xl font-bold text-amber-500">{activeQuarantine}</div><div className="text-xs text-muted-foreground mt-1">Quarantaines actives</div></CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center"><div className="text-2xl font-bold text-red-500">{(mortalite ?? []).length}</div><div className="text-xs text-muted-foreground mt-1">Décès cumulés</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Suivi sanitaire</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={graphData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valeur" fill="#1A9E6F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
