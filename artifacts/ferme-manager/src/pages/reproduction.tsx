import { useState } from "react";
import {
  useGetAccouplements, getGetAccouplementsQueryKey, useCreateAccouplement, useDeleteAccouplement,
  useGetNaissances, getGetNaissancesQueryKey, useCreateNaissance, useDeleteNaissance,
  useGetSevrages, getGetSevragesQueryKey, useCreateSevrage, useDeleteSevrage,
  useGetReproductionStats, getGetReproductionStatsQueryKey,
  useGetLoges, getGetLogesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { CheckCircle2, AlertTriangle, Bell, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Accouplement = {
  id: number; truie: string; verrat: string; date: string;
  dateMiseBasPrevue: string | null; statut: string; notes: string | null; createdAt: string;
};

type PlanningItem = {
  id: number;
  type: "loge" | "croisement" | "naissance" | "sevrage" | "recroisement";
  date: string;
  truie: string;
  verrat: string;
  loge: string;
  porcelets?: number;
  sevrageLe?: string;
  recroisementLe?: string;
  notes?: string;
};

function joursRestants(datePrevue: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(datePrevue); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function StatutBadge({ jours, statut }: { jours: number | null; statut: string }) {
  if (jours === null) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{statut}</span>;
  if (jours <= 0) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Imminente</span>;
  if (jours <= 7) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 w-fit">Proche</span>;
  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit">En gestation</span>;
}

function RestantCell({ jours }: { jours: number }) {
  if (jours <= 0) return <span className="text-red-600 font-semibold">Imminente</span>;
  if (jours <= 7) return <span className="text-amber-500 font-semibold">{jours} jours</span>;
  return <span className="text-green-600">{jours > 0 ? `−${jours}` : jours} jours</span>;
}

function makeFutureDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export default function Reproduction() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const futureDates = makeFutureDates(120);

  const { data: stats } = useGetReproductionStats({ query: { queryKey: getGetReproductionStatsQueryKey() } });
  const { data: accouplements, isLoading: loadingA } = useGetAccouplements({ query: { queryKey: getGetAccouplementsQueryKey() } });
  const { data: naissances, isLoading: loadingN } = useGetNaissances({ query: { queryKey: getGetNaissancesQueryKey() } });
  const { data: sevrages, isLoading: loadingS } = useGetSevrages({ query: { queryKey: getGetSevragesQueryKey() } });

  const createAcc = useCreateAccouplement();
  const createNaissance = useCreateNaissance();
  const createSevrage = useCreateSevrage();
  const deleteAcc = useDeleteAccouplement();
  const deleteNaissance = useDeleteNaissance();
  const deleteSevrage = useDeleteSevrage();
  const confirm = useConfirm();

  const [accForm, setAccForm] = useState({ truie: "", verrat: "", date: today, dateMiseBasPrevue: "", statut: "Gestante", notes: "" });
  const [naisForm, setNaisForm] = useState({ mere: "", pere: "", date: today, totalNes: "", vivants: "", mortNes: "0", poidsMovyen: "" });
  const [sevForm, setSevForm] = useState({ mere: "", date: today, nbSevres: "", ageJours: "28", poidsMoyen: "", destination: "" });
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [planningForm, setPlanningForm] = useState({
    type: "loge" as PlanningItem["type"],
    date: today,
    truie: "",
    verrat: "",
    loge: "",
    porcelets: "",
    sevrageLe: "",
    recroisementLe: "",
    notes: "",
  });
  const [planningFilter, setPlanningFilter] = useState("all");
  const { data: loges } = useGetLoges({ query: { queryKey: getGetLogesQueryKey() } });

  // Derived alerts
  const withDates = (accouplements ?? []).filter(a => a.dateMiseBasPrevue);
  const imminentes = withDates.filter(a => joursRestants(a.dateMiseBasPrevue!) <= 0);
  const proches = withDates.filter(a => { const j = joursRestants(a.dateMiseBasPrevue!); return j > 0 && j <= 7; });
  const gestantes = withDates.filter(a => { const j = joursRestants(a.dateMiseBasPrevue!); return j > 7; });

  // Sevrages overdue: naissances older than 28 days that have no sevrage yet
  const sevragesDus = (naissances ?? []).filter(n => {
    const ageJours = Math.floor((new Date(today).getTime() - new Date(n.date).getTime()) / 86400000);
    const alreadyDone = (sevrages ?? []).some(s => s.mere === n.mere);
    return ageJours >= 28 && !alreadyDone;
  });

  // Mises bas prévues table = all with dateMiseBasPrevue sorted by closeness
  const misesBasPrevues = [...withDates].sort((a, b) => {
    return joursRestants(a.dateMiseBasPrevue!) - joursRestants(b.dateMiseBasPrevue!);
  }) as Accouplement[];

  const submitAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await confirm({ title: "Enregistrer l'accouplement", description: "Voulez-vous enregistrer cet accouplement ?" }))) return;
    createAcc.mutate({ data: { ...accForm, dateMiseBasPrevue: accForm.dateMiseBasPrevue || null, notes: accForm.notes || null } }, {
      onSuccess: () => { toast({ title: "Accouplement enregistré" }); qc.invalidateQueries({ queryKey: getGetAccouplementsQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setAccForm({ truie: "", verrat: "", date: today, dateMiseBasPrevue: "", statut: "Gestante", notes: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };
  const submitNaissance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await confirm({ title: "Enregistrer la naissance", description: "Voulez-vous enregistrer cette mise bas ?" }))) return;
    createNaissance.mutate({ data: { mere: naisForm.mere, pere: naisForm.pere, date: naisForm.date, totalNes: Number(naisForm.totalNes), vivants: Number(naisForm.vivants), mortNes: Number(naisForm.mortNes), poidsMovyen: naisForm.poidsMovyen ? Number(naisForm.poidsMovyen) : null } }, {
      onSuccess: () => { toast({ title: "Naissance enregistrée" }); qc.invalidateQueries({ queryKey: getGetNaissancesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setNaisForm({ mere: "", pere: "", date: today, totalNes: "", vivants: "", mortNes: "0", poidsMovyen: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };
  const submitSevrage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await confirm({ title: "Enregistrer le sevrage", description: "Voulez-vous enregistrer ce sevrage ?" }))) return;
    createSevrage.mutate({ data: { mere: sevForm.mere, date: sevForm.date, nbSevres: Number(sevForm.nbSevres), ageJours: Number(sevForm.ageJours), poidsMoyen: sevForm.poidsMoyen ? Number(sevForm.poidsMoyen) : null, destination: sevForm.destination || null } }, {
      onSuccess: () => { toast({ title: "Sevrage enregistré" }); qc.invalidateQueries({ queryKey: getGetSevragesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setSevForm({ mere: "", date: today, nbSevres: "", ageJours: "28", poidsMoyen: "", destination: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const chartData = (accouplements ?? []).reduce((acc: Record<string, { mois: string; saillies: number; naissances: number }>, a) => {
    const m = a.date.slice(0, 7);
    if (!acc[m]) acc[m] = { mois: m, saillies: 0, naissances: 0 };
    acc[m].saillies++;
    return acc;
  }, {});
  (naissances ?? []).forEach(n => {
    const m = n.date.slice(0, 7);
    if (!chartData[m]) chartData[m] = { mois: m, saillies: 0, naissances: 0 };
    chartData[m].naissances++;
  });
  const chartArr = Object.values(chartData).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-6);
  const filteredPlanning = planningItems.filter((item) => planningFilter === "all" || item.type === planningFilter);

  const submitPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planningForm.truie || !planningForm.date || !planningForm.loge) {
      toast({ variant: "destructive", title: "Erreur", description: "Choisissez la truie, la date et la loge" });
      return;
    }
    setPlanningItems((current) => [
      {
        id: Date.now(),
        type: planningForm.type,
        date: planningForm.date,
        truie: planningForm.truie,
        verrat: planningForm.verrat || "—",
        loge: planningForm.loge,
        porcelets: planningForm.porcelets ? Number(planningForm.porcelets) : undefined,
        sevrageLe: planningForm.sevrageLe || undefined,
        recroisementLe: planningForm.recroisementLe || undefined,
        notes: planningForm.notes || undefined,
      },
      ...current,
    ]);
    toast({ title: "Planification enregistrée" });
    setPlanningForm({ type: "loge", date: today, truie: "", verrat: "", loge: "", porcelets: "", sevrageLe: "", recroisementLe: "", notes: "" });
  };

  const deletePlanning = (id: number) => {
    setPlanningItems((current) => current.filter((item) => item.id !== id));
    toast({ title: "Planification supprimée" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span>🐷</span> Reproduction & Naissances
        </h1>
        <p className="text-muted-foreground text-sm">Accouplements, gestations, naissances, traçabilité et sevrage</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 pb-4 text-center">
          <div className="text-3xl font-bold text-red-500">{stats?.miseBasImminentes ?? <Skeleton className="h-8 w-8 mx-auto" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Mises bas imminentes</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <div className="text-3xl font-bold text-blue-500">{stats?.truiesGestantes ?? <Skeleton className="h-8 w-8 mx-auto" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Truies gestantes</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.naissancesMois ?? <Skeleton className="h-8 w-8 mx-auto" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Naissances ce mois</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 text-center">
          <div className="text-3xl font-bold text-amber-500">{stats?.porceletsASevrer ?? <Skeleton className="h-8 w-8 mx-auto" />}</div>
          <div className="text-xs text-muted-foreground mt-1">Porcelets à sevrer</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="alertes">
        <TabsList className="gap-1">
          <TabsTrigger value="alertes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bell className="h-3.5 w-3.5 mr-1.5" />Alertes
          </TabsTrigger>
          <TabsTrigger value="accouplements">Accouplements</TabsTrigger>
          <TabsTrigger value="planification">Planification</TabsTrigger>
          <TabsTrigger value="naissances">Naissances</TabsTrigger>
          <TabsTrigger value="tracabilite">Traçabilité</TabsTrigger>
          <TabsTrigger value="sevrage">Sevrage</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        {/* ── ALERTES ── */}
        <TabsContent value="alertes" className="space-y-2 mt-4">
          {imminentes.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-900 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">!</span>
              <span className="leading-5">Mise bas imminente — <strong>{a.truie}</strong> (aujourd'hui ou dépassée)</span>
            </div>
          ))}
          {proches.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 rounded-md bg-amber-50 border border-amber-300 text-amber-950 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">!</span>
              <span className="leading-5">Mise bas proche — <strong>{a.truie}</strong> dans {joursRestants(a.dateMiseBasPrevue!)} jours</span>
            </div>
          ))}
          {sevragesDus.map(n => {
            const age = Math.floor((new Date(today).getTime() - new Date(n.date).getTime()) / 86400000);
            return (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 rounded-md bg-amber-50 border border-amber-300 text-amber-950 text-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">!</span>
                <span className="leading-5">Sevrage dû — portée <strong>{n.mere}</strong> ({age} jours accomplis)</span>
              </div>
            );
          })}
          {gestantes.slice(0, 3).map(a => {
            const j = joursRestants(a.dateMiseBasPrevue!);
            const ageGestation = 114 - j;
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 rounded-md bg-green-50 border border-green-300 text-green-950 text-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">✓</span>
                <span className="leading-5">Gestation confirmée — <strong>{a.truie}</strong> ({ageGestation > 0 ? ageGestation : "?"} jours)</span>
              </div>
            );
          })}
          {imminentes.length === 0 && proches.length === 0 && sevragesDus.length === 0 && gestantes.length === 0 && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-md bg-muted/40 border text-foreground text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">i</span>
              <span className="leading-5">Aucune alerte active pour le moment</span>
            </div>
          )}

          {/* Mises bas prévues */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mises bas prévues</p>
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/20">
                  <tr>{["TRUIE", "VERRAT", "ACCOUPLEMENT", "MISE BAS PRÉVUE", "RESTANT", "STATUT"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">
                  {loadingA ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                  ) : misesBasPrevues.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune mise bas planifiée</td></tr>
                  ) : misesBasPrevues.map(a => {
                    const j = joursRestants(a.dateMiseBasPrevue!);
                    return (
                      <tr key={a.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono font-medium">{a.truie}</td>
                        <td className="px-4 py-2.5 font-mono">{a.verrat}</td>
                        <td className="px-4 py-2.5">{a.date}</td>
                        <td className="px-4 py-2.5">{a.dateMiseBasPrevue}</td>
                        <td className="px-4 py-2.5"><RestantCell jours={j} /></td>
                        <td className="px-4 py-2.5"><StatutBadge jours={j} statut={a.statut} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="planification" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Planifier dans le futur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPlanning} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
                  <Select value={planningForm.type} onValueChange={(v) => setPlanningForm((f) => ({ ...f, type: v as PlanningItem["type"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loge">Loge à assigner</SelectItem>
                      <SelectItem value="croisement">Croisement truie / verrat</SelectItem>
                      <SelectItem value="naissance">Naissance prévue</SelectItem>
                      <SelectItem value="sevrage">Sevrage</SelectItem>
                      <SelectItem value="recroisement">Recroisement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date</Label>
                  <Select value={planningForm.date} onValueChange={(v) => setPlanningForm((f) => ({ ...f, date: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir une date" /></SelectTrigger>
                    <SelectContent>
                      {futureDates.map((date) => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Loge</Label>
                  <Select value={planningForm.loge} onValueChange={(v) => setPlanningForm((f) => ({ ...f, loge: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir une loge" /></SelectTrigger>
                    <SelectContent>
                      {(loges ?? []).map((loge) => <SelectItem key={loge.id} value={loge.nom}>{loge.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Truie</Label>
                  <Input value={planningForm.truie} onChange={(e) => setPlanningForm((f) => ({ ...f, truie: e.target.value }))} placeholder="#T-022" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Verrat</Label>
                  <Input value={planningForm.verrat} onChange={(e) => setPlanningForm((f) => ({ ...f, verrat: e.target.value }))} placeholder="#B-001" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Porcelets prévus</Label>
                  <Input type="number" min="0" value={planningForm.porcelets} onChange={(e) => setPlanningForm((f) => ({ ...f, porcelets: e.target.value }))} placeholder="12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date sevrage</Label>
                  <Select value={planningForm.sevrageLe} onValueChange={(v) => setPlanningForm((f) => ({ ...f, sevrageLe: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {futureDates.map((date) => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date recroisement</Label>
                  <Select value={planningForm.recroisementLe} onValueChange={(v) => setPlanningForm((f) => ({ ...f, recroisementLe: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {futureDates.map((date) => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Input value={planningForm.notes} onChange={(e) => setPlanningForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Préparer la maternité, déplacement, suivi..." />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit" className="w-full">Enregistrer la planification</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Vue future</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={planningFilter} onValueChange={setPlanningFilter}>
                <SelectTrigger><SelectValue placeholder="Filtrer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="loge">Loges</SelectItem>
                  <SelectItem value="croisement">Croisements</SelectItem>
                  <SelectItem value="naissance">Naissances</SelectItem>
                </SelectContent>
              </Select>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/20">
                    <tr>
                      {["Type", "Date", "Truie", "Verrat", "Loge", "Porcelets", "Notes", ""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPlanning.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Aucune planification</td></tr>
                    ) : filteredPlanning.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5">{item.type}</td>
                        <td className="px-4 py-2.5">{item.date}</td>
                        <td className="px-4 py-2.5">{item.truie}</td>
                        <td className="px-4 py-2.5">{item.verrat}</td>
                        <td className="px-4 py-2.5">{item.loge}</td>
                        <td className="px-4 py-2.5">{item.porcelets ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <div>{item.sevrageLe ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{item.recroisementLe ? `Recroisement: ${item.recroisementLe}` : ""}</div>
                        </td>
                        <td className="px-4 py-2.5">{item.notes ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => deletePlanning(item.id)}>Supprimer</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACCOUPLEMENTS ── */}
        <TabsContent value="accouplements" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouvel accouplement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitAcc} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Truie (TAG) *</Label><Input placeholder="#T-022" value={accForm.truie} onChange={e => setAccForm(f => ({...f, truie: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Verrat (TAG) *</Label><Input placeholder="#B-001" value={accForm.verrat} onChange={e => setAccForm(f => ({...f, verrat: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date accouplement *</Label><Input type="date" value={accForm.date} onChange={e => setAccForm(f => ({...f, date: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date mise bas prévue</Label><Input type="date" value={accForm.dateMiseBasPrevue} onChange={e => setAccForm(f => ({...f, dateMiseBasPrevue: e.target.value}))} /></div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Statut</Label>
                  <Select value={accForm.statut} onValueChange={v => setAccForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Gestante","Mise bas","Vide","Confirmée","En cours"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label><Input placeholder="Observations…" value={accForm.notes} onChange={e => setAccForm(f => ({...f, notes: e.target.value}))} /></div>
                <div className="col-span-2">
                  <Button type="submit" className="w-full" disabled={createAcc.isPending}>Enregistrer l'accouplement</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TRUIE", "VERRAT", "ACCOUPLEMENT", "MISE BAS PRÉVUE", "RESTANT", "STATUT", "NOTES", ""].map((h, i) => (
                  <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingA ? <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                  : (accouplements ?? []).length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Aucun accouplement enregistré</td></tr>
                  : (accouplements ?? []).map(a => {
                    const j = a.dateMiseBasPrevue ? joursRestants(a.dateMiseBasPrevue) : null;
                    return (
                      <tr key={a.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono font-medium">{a.truie}</td>
                        <td className="px-4 py-2.5 font-mono">{a.verrat}</td>
                        <td className="px-4 py-2.5">{a.date}</td>
                        <td className="px-4 py-2.5">{a.dateMiseBasPrevue ?? "—"}</td>
                        <td className="px-4 py-2.5">{j !== null ? <RestantCell jours={j} /> : "—"}</td>
                        <td className="px-4 py-2.5"><StatutBadge jours={j} statut={a.statut} /></td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.notes ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
                            deleteAcc.mutate({ id: a.id }, {
                              onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetAccouplementsQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); },
                              onError: () => toast({ variant: "destructive", title: "Erreur" }),
                            });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        {/* ── NAISSANCES ── */}
        <TabsContent value="naissances" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Nouvelle naissance</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitNaissance} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Truie (TAG) *</Label><Input placeholder="#T-022" value={naisForm.mere} onChange={e => setNaisForm(f => ({...f, mere: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Verrat (TAG) *</Label><Input placeholder="#B-001" value={naisForm.pere} onChange={e => setNaisForm(f => ({...f, pere: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date naissance *</Label><Input type="date" value={naisForm.date} onChange={e => setNaisForm(f => ({...f, date: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Total nés *</Label><Input type="number" min="0" placeholder="12" value={naisForm.totalNes} onChange={e => setNaisForm(f => ({...f, totalNes: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Vivants *</Label><Input type="number" min="0" placeholder="11" value={naisForm.vivants} onChange={e => setNaisForm(f => ({...f, vivants: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Mort-nés</Label><Input type="number" min="0" placeholder="0" value={naisForm.mortNes} onChange={e => setNaisForm(f => ({...f, mortNes: e.target.value}))} /></div>
                <div className="space-y-1 col-span-2"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Poids moyen (kg)</Label><Input type="number" step="0.01" placeholder="1.35" value={naisForm.poidsMovyen} onChange={e => setNaisForm(f => ({...f, poidsMovyen: e.target.value}))} /></div>
                <div className="col-span-2"><Button type="submit" className="w-full" disabled={createNaissance.isPending}>Enregistrer la naissance</Button></div>
              </form>
            </CardContent>
          </Card>

          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG MÈRE", "PÈRE", "DATE", "TOTAL NÉS", "VIVANTS", "MORT-NÉS", "POIDS MOY.", "TAUX SURVIE", ""].map((h, i) => (
                  <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingN ? <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                  : (naissances ?? []).length === 0 ? <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Aucune naissance enregistrée</td></tr>
                  : (naissances ?? []).map(n => {
                    const taux = n.totalNes > 0 ? ((n.vivants / n.totalNes) * 100).toFixed(1) + "%" : "—";
                    return (
                      <tr key={n.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono font-medium">{n.mere}</td>
                        <td className="px-4 py-2.5 font-mono">{n.pere}</td>
                        <td className="px-4 py-2.5">{n.date}</td>
                        <td className="px-4 py-2.5 font-semibold">{n.totalNes}</td>
                        <td className="px-4 py-2.5 text-green-700 font-medium">{n.vivants}</td>
                        <td className="px-4 py-2.5 text-red-600">{n.mortNes}</td>
                        <td className="px-4 py-2.5">{n.poidsMovyen != null ? `${Number(n.poidsMovyen).toFixed(2)} kg` : "—"}</td>
                        <td className="px-4 py-2.5">{taux}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
                            deleteNaissance.mutate({ id: n.id }, {
                              onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetNaissancesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); },
                              onError: () => toast({ variant: "destructive", title: "Erreur" }),
                            });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        {/* ── TRAÇABILITÉ ── */}
        <TabsContent value="tracabilite" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-bold text-primary">{(accouplements ?? []).length}</div>
              <div className="text-xs text-muted-foreground mt-1">Accouplements enregistrés</div>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">{(naissances ?? []).reduce((s, n) => s + n.vivants, 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total porcelets nés vivants</div>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{(sevrages ?? []).reduce((s, sv) => s + sv.nbSevres, 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total sevrés</div>
            </CardContent></Card>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TRUIE", "ACCOUPLEMENT", "NAISSANCE", "SEVRAGE", "NB NÉS", "NB SEVRÉS", "TAUX SURVIE"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {(naissances ?? []).map(n => {
                  const acc = (accouplements ?? []).find(a => a.truie === n.mere);
                  const sev = (sevrages ?? []).find(s => s.mere === n.mere);
                  const taux = n.totalNes > 0 ? ((n.vivants / n.totalNes) * 100).toFixed(1) + "%" : "—";
                  return (
                    <tr key={n.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-mono font-medium">{n.mere}</td>
                      <td className="px-4 py-2.5">{acc?.date ?? "—"}</td>
                      <td className="px-4 py-2.5">{n.date}</td>
                      <td className="px-4 py-2.5">{sev?.date ?? <span className="text-amber-500 text-xs">En attente</span>}</td>
                      <td className="px-4 py-2.5 font-semibold">{n.totalNes}</td>
                      <td className="px-4 py-2.5">{sev?.nbSevres ?? "—"}</td>
                      <td className="px-4 py-2.5">{taux}</td>
                    </tr>
                  );
                })}
                {(naissances ?? []).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Aucune donnée de traçabilité disponible</td></tr>
                )}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        {/* ── SEVRAGE ── */}
        <TabsContent value="sevrage" className="space-y-4 mt-4">
          {sevragesDus.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>{sevragesDus.length}</strong> portée(s) prête(s) à être sevrée(s) (28+ jours)</span>
            </div>
          )}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Plus className="h-4 w-4" />Enregistrer un sevrage</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitSevrage} className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Mère (TAG) *</Label><Input placeholder="#T-022" value={sevForm.mere} onChange={e => setSevForm(f => ({...f, mere: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Date sevrage *</Label><Input type="date" value={sevForm.date} onChange={e => setSevForm(f => ({...f, date: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Nb sevrés *</Label><Input type="number" min="0" placeholder="10" value={sevForm.nbSevres} onChange={e => setSevForm(f => ({...f, nbSevres: e.target.value}))} required /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Âge (jours)</Label><Input type="number" min="0" placeholder="28" value={sevForm.ageJours} onChange={e => setSevForm(f => ({...f, ageJours: e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Poids moyen (kg)</Label><Input type="number" step="0.01" placeholder="7.5" value={sevForm.poidsMoyen} onChange={e => setSevForm(f => ({...f, poidsMoyen: e.target.value}))} /></div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Destination</Label>
                  <Select value={sevForm.destination} onValueChange={v => setSevForm(f => ({...f, destination: v}))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>{["Bâtiment A — Croissance","Bâtiment B — Croissance","Bâtiment C — Maternité","Vente","Autre"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Button type="submit" className="w-full" disabled={createSevrage.isPending}>Enregistrer le sevrage</Button></div>
              </form>
            </CardContent>
          </Card>

          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["MÈRE", "DATE", "NB SEVRÉS", "ÂGE (j)", "POIDS MOY.", "DESTINATION", ""].map((h, i) => (
                  <th key={h || `col-${i}`} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingS ? <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chargement…</td></tr>
                  : (sevrages ?? []).length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Aucun sevrage enregistré</td></tr>
                  : (sevrages ?? []).map(s => (
                    <tr key={s.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-mono font-medium">{s.mere}</td>
                      <td className="px-4 py-2.5">{s.date}</td>
                      <td className="px-4 py-2.5 font-semibold">{s.nbSevres}</td>
                      <td className="px-4 py-2.5">{s.ageJours ?? "—"}</td>
                      <td className="px-4 py-2.5">{s.poidsMoyen != null ? `${Number(s.poidsMoyen).toFixed(2)} kg` : "—"}</td>
                      <td className="px-4 py-2.5">{s.destination ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="destructive" size="sm" onClick={async () => {
                          if (!(await confirm({ title: "Supprimer", description: "Supprimer définitivement cet élément ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
                          deleteSevrage.mutate({ id: s.id }, {
                            onSuccess: () => { toast({ title: "Supprimé" }); qc.invalidateQueries({ queryKey: getGetSevragesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); },
                            onError: () => toast({ variant: "destructive", title: "Erreur" }),
                          });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        {/* ── GRAPHIQUES ── */}
        <TabsContent value="graphiques" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {(accouplements ?? []).length > 0
                  ? `${(((accouplements ?? []).filter(a => a.statut === "Gestante" || a.statut === "Mise bas").length / (accouplements ?? []).length) * 100).toFixed(1)}%`
                  : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Taux de fertilité</div>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(naissances ?? []).length > 0
                  ? ((naissances ?? []).reduce((s, n) => s + n.vivants, 0) / (naissances ?? []).length).toFixed(1)
                  : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Moy. porcelets vivants / portée</div>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Saillies & Naissances par mois</CardTitle></CardHeader>
            <CardContent>
              {chartArr.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Pas assez de données</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartArr} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="saillies" name="Saillies" fill="#1A9E6F" radius={[4,4,0,0]} />
                    <Bar dataKey="naissances" name="Naissances" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
