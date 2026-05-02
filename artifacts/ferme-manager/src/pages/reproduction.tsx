import { useState } from "react";
import {
  useGetAccouplements, getGetAccouplementsQueryKey, useCreateAccouplement,
  useGetNaissances, getGetNaissancesQueryKey, useCreateNaissance,
  useGetSevrages, getGetSevragesQueryKey, useCreateSevrage,
  useGetReproductionStats, getGetReproductionStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Heart, Baby, Milk, ChevronDown } from "lucide-react";

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    "Gestante": "bg-green-100 text-green-700",
    "Mise bas": "bg-blue-100 text-blue-700",
    "Vide": "bg-gray-100 text-gray-600",
    "En cours": "bg-amber-100 text-amber-700",
    "Confirmée": "bg-green-100 text-green-700",
    "Fertile": "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[statut] ?? "bg-gray-100 text-gray-600"}`}>
      {statut}
    </span>
  );
}

function SectionBar({ label, color }: { label: string; color: "green" | "amber" | "gray" }) {
  const colors = {
    green: "bg-primary text-white",
    amber: "bg-amber-500 text-white",
    gray: "bg-muted/60 text-foreground border-b",
  };
  return (
    <div className={`px-4 py-2 text-sm font-semibold tracking-wide rounded-t ${colors[color]}`}>
      {label}
    </div>
  );
}

function CollapseForm({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-md mt-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30 rounded-md transition-colors"
      >
        <span className="uppercase tracking-wider">{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t">{children}</div>}
    </div>
  );
}

export default function Reproduction() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: stats } = useGetReproductionStats({ query: { queryKey: getGetReproductionStatsQueryKey() } });
  const { data: accouplements, isLoading: loadingA } = useGetAccouplements({ query: { queryKey: getGetAccouplementsQueryKey() } });
  const { data: naissances, isLoading: loadingN } = useGetNaissances({ query: { queryKey: getGetNaissancesQueryKey() } });
  const { data: sevrages, isLoading: loadingS } = useGetSevrages({ query: { queryKey: getGetSevragesQueryKey() } });

  const createAcc = useCreateAccouplement();
  const createNaissance = useCreateNaissance();
  const createSevrage = useCreateSevrage();

  const today = new Date().toISOString().slice(0, 10);

  const [accForm, setAccForm] = useState({ truie: "", verrat: "", date: today, dateMiseBasPrevue: "", statut: "Gestante", notes: "" });
  const [naisForm, setNaisForm] = useState({ mere: "", pere: "", date: today, totalNes: "", vivants: "", mortNes: "0", poidsMovyen: "" });
  const [sevForm, setSevForm] = useState({ mere: "", date: today, nbSevres: "", ageJours: "28", poidsMoyen: "", destination: "" });

  const gestantes = accouplements?.filter(a => a.statut === "Gestante") ?? [];
  const imminentes = accouplements?.filter(a => {
    if (!a.dateMiseBasPrevue) return false;
    const diff = (new Date(a.dateMiseBasPrevue).getTime() - new Date(today).getTime()) / 86400000;
    return diff >= 0 && diff <= 5;
  }) ?? [];

  const submitAcc = (e: React.FormEvent) => {
    e.preventDefault();
    createAcc.mutate({ data: { ...accForm, dateMiseBasPrevue: accForm.dateMiseBasPrevue || null, notes: accForm.notes || null } }, {
      onSuccess: () => { toast({ title: "Saillie enregistrée" }); qc.invalidateQueries({ queryKey: getGetAccouplementsQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setAccForm({ truie: "", verrat: "", date: today, dateMiseBasPrevue: "", statut: "Gestante", notes: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const submitNaissance = (e: React.FormEvent) => {
    e.preventDefault();
    createNaissance.mutate({ data: { mere: naisForm.mere, pere: naisForm.pere, date: naisForm.date, totalNes: Number(naisForm.totalNes), vivants: Number(naisForm.vivants), mortNes: Number(naisForm.mortNes), poidsMovyen: naisForm.poidsMovyen ? Number(naisForm.poidsMovyen) : null } }, {
      onSuccess: () => { toast({ title: "Naissance enregistrée" }); qc.invalidateQueries({ queryKey: getGetNaissancesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setNaisForm({ mere: "", pere: "", date: today, totalNes: "", vivants: "", mortNes: "0", poidsMovyen: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  const submitSevrage = (e: React.FormEvent) => {
    e.preventDefault();
    createSevrage.mutate({ data: { mere: sevForm.mere, date: sevForm.date, nbSevres: Number(sevForm.nbSevres), ageJours: Number(sevForm.ageJours), poidsMoyen: sevForm.poidsMoyen ? Number(sevForm.poidsMoyen) : null, destination: sevForm.destination || null } }, {
      onSuccess: () => { toast({ title: "Sevrage enregistré" }); qc.invalidateQueries({ queryKey: getGetSevragesQueryKey() }); qc.invalidateQueries({ queryKey: getGetReproductionStatsQueryKey() }); setSevForm({ mere: "", date: today, nbSevres: "", ageJours: "28", poidsMoyen: "", destination: "" }); },
      onError: () => toast({ variant: "destructive", title: "Erreur" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span>🐷</span> Reproduction & Naissances
        </h1>
        <p className="text-muted-foreground text-sm">Saillies, gestations, naissances et sevrages</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-100 text-pink-600"><Heart className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold">{stats?.truiesGestantes ?? <Skeleton className="h-6 w-8 inline-block" />}</div><div className="text-xs text-muted-foreground">Truies gestantes</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold">{stats?.miseBasImminentes ?? <Skeleton className="h-6 w-8 inline-block" />}</div><div className="text-xs text-muted-foreground">Mises bas prévues</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 text-green-600"><Baby className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold">{stats?.naissancesMois ?? <Skeleton className="h-6 w-8 inline-block" />}</div><div className="text-xs text-muted-foreground">Naissances ce mois</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Milk className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold">{stats?.porceletsASevrer ?? <Skeleton className="h-6 w-8 inline-block" />}</div><div className="text-xs text-muted-foreground">Porcelets à sevrer</div></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="saillies">
        <TabsList>
          <TabsTrigger value="saillies">Saillies</TabsTrigger>
          <TabsTrigger value="gestations">Gestations</TabsTrigger>
          <TabsTrigger value="naissances">Naissances</TabsTrigger>
          <TabsTrigger value="sevrages">Sevrages</TabsTrigger>
          <TabsTrigger value="resultats">Résultats</TabsTrigger>
        </TabsList>

        {/* ── SAILLIES ── */}
        <TabsContent value="saillies" className="space-y-3 mt-4">
          {imminentes.map(a => (
            <div key={a.id} className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Mise bas imminente — Truie <strong>{a.truie}</strong> prévue le <strong>{a.dateMiseBasPrevue}</strong></span>
            </div>
          ))}
          {gestantes.length > 3 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>{gestantes.length}</strong> truies en gestation — surveiller les mises bas</span>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <SectionBar label="Saillies en cours" color="gray" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG", "VERRAT", "ACCOUPLEMENT", "MISE BAS PRÉVUE", "NOTES", "STATUT"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingA ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : accouplements?.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune saillie enregistrée</td></tr>
                ) : accouplements?.map(a => (
                  <tr key={a.id} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono font-medium">{a.truie}</td>
                    <td className="px-4 py-2.5 font-mono">{a.verrat}</td>
                    <td className="px-4 py-2.5">{a.date}</td>
                    <td className="px-4 py-2.5">{a.dateMiseBasPrevue ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.notes ?? "—"}</td>
                    <td className="px-4 py-2.5"><StatutBadge statut={a.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CollapseForm title="Nouvelle saillie">
            <form onSubmit={submitAcc} className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Truie (TAG) *</Label>
                  <Input placeholder="AT-088" value={accForm.truie} onChange={e => setAccForm(f => ({...f, truie: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Verrat (TAG) *</Label>
                  <Input placeholder="VR-001" value={accForm.verrat} onChange={e => setAccForm(f => ({...f, verrat: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date accouplement *</Label>
                  <Input type="date" value={accForm.date} onChange={e => setAccForm(f => ({...f, date: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date mise bas prévue</Label>
                  <Input type="date" value={accForm.dateMiseBasPrevue} onChange={e => setAccForm(f => ({...f, dateMiseBasPrevue: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Statut</Label>
                  <Select value={accForm.statut} onValueChange={v => setAccForm(f => ({...f, statut: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Gestante", "Mise bas", "Vide", "Confirmée", "En cours"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes / Résultat</Label>
                  <Input placeholder="Observations…" value={accForm.notes} onChange={e => setAccForm(f => ({...f, notes: e.target.value}))} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">La date de mise bas prévue est calculée automatiquement à 114 jours de gestation si laissée vide.</p>
              <Button type="submit" className="w-full" disabled={createAcc.isPending}>Enregistrer la saillie</Button>
            </form>
          </CollapseForm>

          {/* Naissances / Fécondité */}
          <div className="rounded-md border overflow-hidden mt-4">
            <SectionBar label="Naissances / Fécondité" color="green" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG", "VERRAT", "DATE", "TOTAL NÉS", "VIVANTS", "MORT-NÉS", "POIDS MOY.", "TAUX SURVIE"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingN ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : naissances?.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune naissance enregistrée</td></tr>
                ) : naissances?.map(n => {
                  const tauxSurvie = n.totalNes > 0 ? ((n.vivants / n.totalNes) * 100).toFixed(1) : "—";
                  return (
                    <tr key={n.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-mono font-medium">{n.mere}</td>
                      <td className="px-4 py-2.5 font-mono">{n.pere}</td>
                      <td className="px-4 py-2.5">{n.date}</td>
                      <td className="px-4 py-2.5 font-semibold">{n.totalNes}</td>
                      <td className="px-4 py-2.5 text-green-700 font-medium">{n.vivants}</td>
                      <td className="px-4 py-2.5 text-red-600">{n.mortNes}</td>
                      <td className="px-4 py-2.5">{n.poidsMovyen != null ? `${Number(n.poidsMovyen).toFixed(2)} kg` : "—"}</td>
                      <td className="px-4 py-2.5">{tauxSurvie !== "—" ? `${tauxSurvie}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <CollapseForm title="Nouvelle naissance">
            <form onSubmit={submitNaissance} className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Truie (TAG) *</Label>
                  <Input placeholder="AT-088" value={naisForm.mere} onChange={e => setNaisForm(f => ({...f, mere: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Verrat (TAG) *</Label>
                  <Input placeholder="VR-001" value={naisForm.pere} onChange={e => setNaisForm(f => ({...f, pere: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date naissance *</Label>
                  <Input type="date" value={naisForm.date} onChange={e => setNaisForm(f => ({...f, date: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Total nés *</Label>
                  <Input type="number" min="0" placeholder="12" value={naisForm.totalNes} onChange={e => setNaisForm(f => ({...f, totalNes: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nb vivants *</Label>
                  <Input type="number" min="0" placeholder="11" value={naisForm.vivants} onChange={e => setNaisForm(f => ({...f, vivants: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mort-nés</Label>
                  <Input type="number" min="0" placeholder="0" value={naisForm.mortNes} onChange={e => setNaisForm(f => ({...f, mortNes: e.target.value}))} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Poids moyen (kg)</Label>
                  <Input type="number" step="0.01" placeholder="1.35" value={naisForm.poidsMovyen} onChange={e => setNaisForm(f => ({...f, poidsMovyen: e.target.value}))} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createNaissance.isPending}>Enregistrer la naissance</Button>
            </form>
          </CollapseForm>

          {/* Naissances / Sevrage */}
          <div className="rounded-md border overflow-hidden mt-4">
            <SectionBar label="Naissances / Sevrage" color="amber" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["MÈRE", "DATE", "NB SEVRÉS", "ÂGE (j)", "POIDS MOY.", "DESTINATION"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingS ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : sevrages?.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun sevrage enregistré</td></tr>
                ) : sevrages?.map(s => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono font-medium">{s.mere}</td>
                    <td className="px-4 py-2.5">{s.date}</td>
                    <td className="px-4 py-2.5 font-semibold">{s.nbSevres}</td>
                    <td className="px-4 py-2.5">{s.ageJours ?? "—"}</td>
                    <td className="px-4 py-2.5">{s.poidsMoyen != null ? `${Number(s.poidsMoyen).toFixed(2)} kg` : "—"}</td>
                    <td className="px-4 py-2.5">{s.destination ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CollapseForm title="Enregistrer un sevrage">
            <form onSubmit={submitSevrage} className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mère (TAG) *</Label>
                  <Input placeholder="AT-088" value={sevForm.mere} onChange={e => setSevForm(f => ({...f, mere: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date sevrage *</Label>
                  <Input type="date" value={sevForm.date} onChange={e => setSevForm(f => ({...f, date: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nb sevrés *</Label>
                  <Input type="number" min="0" placeholder="10" value={sevForm.nbSevres} onChange={e => setSevForm(f => ({...f, nbSevres: e.target.value}))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Âge (jours)</Label>
                  <Input type="number" min="0" placeholder="28" value={sevForm.ageJours} onChange={e => setSevForm(f => ({...f, ageJours: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Poids moyen (kg)</Label>
                  <Input type="number" step="0.01" placeholder="7.5" value={sevForm.poidsMoyen} onChange={e => setSevForm(f => ({...f, poidsMoyen: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Destination</Label>
                  <Select value={sevForm.destination} onValueChange={v => setSevForm(f => ({...f, destination: v}))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>
                      {["Bâtiment A — Croissance", "Bâtiment B — Croissance", "Bâtiment C — Maternité", "Vente", "Autre"].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createSevrage.isPending}>Enregistrer le sevrage</Button>
            </form>
          </CollapseForm>
        </TabsContent>

        {/* ── GESTATIONS ── */}
        <TabsContent value="gestations" className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <SectionBar label="Truies en gestation" color="green" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG", "VERRAT", "DATE SAILLIE", "MISE BAS PRÉVUE", "JOURS RESTANTS", "STATUT"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingA ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : gestantes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune truie en gestation</td></tr>
                ) : gestantes.map(a => {
                  const joursRestants = a.dateMiseBasPrevue
                    ? Math.ceil((new Date(a.dateMiseBasPrevue).getTime() - new Date(today).getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={a.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-mono font-medium">{a.truie}</td>
                      <td className="px-4 py-2.5 font-mono">{a.verrat}</td>
                      <td className="px-4 py-2.5">{a.date}</td>
                      <td className="px-4 py-2.5">{a.dateMiseBasPrevue ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {joursRestants !== null ? (
                          <span className={joursRestants <= 5 ? "text-red-600 font-semibold" : joursRestants <= 14 ? "text-amber-600 font-medium" : "text-green-700"}>
                            {joursRestants <= 0 ? "Imminente" : `J−${joursRestants}`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5"><StatutBadge statut={a.statut} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── NAISSANCES ── */}
        <TabsContent value="naissances" className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <SectionBar label="Historique des naissances" color="green" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG MÈRE", "PÈRE", "DATE", "TOTAL NÉS", "VIVANTS", "MORT-NÉS", "POIDS MOY.", "TAUX SURVIE"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingN ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : naissances?.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucune naissance enregistrée</td></tr>
                ) : naissances?.map(n => {
                  const taux = n.totalNes > 0 ? ((n.vivants / n.totalNes) * 100).toFixed(1) : "—";
                  return (
                    <tr key={n.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-mono font-medium">{n.mere}</td>
                      <td className="px-4 py-2.5 font-mono">{n.pere}</td>
                      <td className="px-4 py-2.5">{n.date}</td>
                      <td className="px-4 py-2.5 font-semibold">{n.totalNes}</td>
                      <td className="px-4 py-2.5 text-green-700 font-medium">{n.vivants}</td>
                      <td className="px-4 py-2.5 text-red-600">{n.mortNes}</td>
                      <td className="px-4 py-2.5">{n.poidsMovyen != null ? `${Number(n.poidsMovyen).toFixed(2)} kg` : "—"}</td>
                      <td className="px-4 py-2.5">{taux !== "—" ? `${taux}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── SEVRAGES ── */}
        <TabsContent value="sevrages" className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <SectionBar label="Naissances / Sevrage" color="amber" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["MÈRE", "DATE", "NB SEVRÉS", "ÂGE (j)", "POIDS MOY.", "DESTINATION"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {loadingS ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : sevrages?.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun sevrage enregistré</td></tr>
                ) : sevrages?.map(s => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono font-medium">{s.mere}</td>
                    <td className="px-4 py-2.5">{s.date}</td>
                    <td className="px-4 py-2.5 font-semibold">{s.nbSevres}</td>
                    <td className="px-4 py-2.5">{s.ageJours ?? "—"}</td>
                    <td className="px-4 py-2.5">{s.poidsMoyen != null ? `${Number(s.poidsMoyen).toFixed(2)} kg` : "—"}</td>
                    <td className="px-4 py-2.5">{s.destination ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── RÉSULTATS ── */}
        <TabsContent value="resultats" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Taux de fertilité", value: accouplements && accouplements.length > 0 ? `${((accouplements.filter(a => a.statut === "Gestante" || a.statut === "Mise bas").length / accouplements.length) * 100).toFixed(1)}%` : "—" },
              { label: "Moy. nés vivants/portée", value: naissances && naissances.length > 0 ? (naissances.reduce((s, n) => s + n.vivants, 0) / naissances.length).toFixed(1) : "—" },
              { label: "Moy. mort-nés/portée", value: naissances && naissances.length > 0 ? (naissances.reduce((s, n) => s + n.mortNes, 0) / naissances.length).toFixed(1) : "—" },
              { label: "Taux de survie moyen", value: naissances && naissances.length > 0 ? `${(naissances.reduce((s, n) => s + (n.totalNes > 0 ? (n.vivants / n.totalNes) : 0), 0) / naissances.length * 100).toFixed(1)}%` : "—" },
            ].map(({ label, value }) => (
              <Card key={label}><CardContent className="pt-5 pb-4">
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent></Card>
            ))}
          </div>
          <div className="rounded-md border overflow-hidden">
            <SectionBar label="Récapitulatif saillies" color="gray" />
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>{["TAG", "VERRAT", "DATE", "MISE BAS PRÉVUE", "STATUT"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {accouplements?.map(a => (
                  <tr key={a.id} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono font-medium">{a.truie}</td>
                    <td className="px-4 py-2.5 font-mono">{a.verrat}</td>
                    <td className="px-4 py-2.5">{a.date}</td>
                    <td className="px-4 py-2.5">{a.dateMiseBasPrevue ?? "—"}</td>
                    <td className="px-4 py-2.5"><StatutBadge statut={a.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
