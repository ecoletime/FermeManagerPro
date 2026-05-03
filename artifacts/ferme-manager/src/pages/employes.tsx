import { useState } from "react";
import {
  useGetEmployes, getGetEmployesQueryKey,
  useCreateEmploye, useUpdateEmploye, useDeleteEmploye,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock3, Plus, Trash2 } from "lucide-react";

type EmployeForm = {
  nom: string;
  poste: string;
  telephone: string;
  email: string;
  dateEmbauche: string;
  statut: string;
  salaire: string;
};

type PointageForm = {
  employeId: string;
  dateHeure: string;
};

type TaskItem = {
  id: number;
  label: string;
};

type ScheduleEntry = {
  id: number;
  employeId: string;
  day: string;
  taskId: string;
};

const statutBadge: Record<string, string> = {
  Actif: "bg-green-100 text-green-800",
  Congé: "bg-amber-100 text-amber-800",
  Suspendu: "bg-red-100 text-red-800",
};

const initForm: EmployeForm = {
  nom: "",
  poste: "",
  telephone: "",
  email: "",
  dateEmbauche: new Date().toISOString().slice(0, 10),
  statut: "Actif",
  salaire: "",
};

const initPointage: PointageForm = {
  employeId: "",
  dateHeure: new Date().toISOString().slice(0, 16),
};

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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildNextDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Employes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeForm>({ ...initForm });
  const [pointage, setPointage] = useState<PointageForm>({ ...initPointage });
  const [pointages, setPointages] = useState<Array<{ id: number; employeId: string; type: "arrivee" | "depart"; dateHeure: string }>>([]);
  const [scheduleDays] = useState(buildNextDays(30));
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 1, label: "Nettoyage" },
    { id: 2, label: "Alimentation" },
    { id: 3, label: "Surveillance" },
  ]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ employeId: "", day: scheduleDays[0] ?? "", taskId: "1" });
  const [scheduleFilters, setScheduleFilters] = useState({ day: "all", employeId: "all", taskId: "all" });
  const [scheduleCalendarMonth, setScheduleCalendarMonth] = useState<Date>(new Date());
  const [scheduleCalendarOpen, setScheduleCalendarOpen] = useState(false);
  const [filterCalendarOpen, setFilterCalendarOpen] = useState(false);

  const { data: employes, isLoading } = useGetEmployes({ query: { queryKey: getGetEmployesQueryKey() } });
  const createEmploye = useCreateEmploye();
  const updateEmploye = useUpdateEmploye();
  const deleteEmploye = useDeleteEmploye();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetEmployesQueryKey() });
  const resetForm = () => {
    setForm({ ...initForm });
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      telephone: form.telephone || null,
      email: form.email || null,
      dateEmbauche: form.dateEmbauche || null,
      salaire: form.salaire ? Number(form.salaire) : null,
    };
    if (editId) {
      updateEmploye.mutate(
        { id: editId, data },
        {
          onSuccess: () => {
            toast({ title: "Employé mis à jour" });
            invalidate();
            resetForm();
          },
          onError: () => toast({ variant: "destructive", title: "Erreur" }),
        },
      );
    } else {
      createEmploye.mutate(
        { data },
        {
          onSuccess: () => {
            toast({ title: "Employé ajouté" });
            invalidate();
            resetForm();
          },
          onError: () => toast({ variant: "destructive", title: "Erreur" }),
        },
      );
    }
  };

  const enregistrerPointage = (type: "arrivee" | "depart") => {
    if (!pointage.employeId) {
      toast({ variant: "destructive", title: "Choisissez un employé" });
      return;
    }
    const dateHeure = pointage.dateHeure || new Date().toISOString().slice(0, 16);
    setPointages((current) => [{ id: Date.now(), employeId: pointage.employeId, type, dateHeure }, ...current]);
    toast({ title: type === "arrivee" ? "Arrivée enregistrée" : "Départ enregistré", description: formatDateTime(dateHeure) });
  };

  const addTask = () => {
    const label = taskInput.trim();
    if (!label) return;
    setTasks((current) => [...current, { id: Date.now(), label }]);
    setTaskInput("");
  };

  const deleteScheduleEntry = (id: number) => {
    setScheduleEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const addScheduleEntry = () => {
    if (!scheduleForm.employeId || !scheduleForm.day || !scheduleForm.taskId) {
      toast({ variant: "destructive", title: "Choisissez un employé, un jour et une tâche" });
      return;
    }
    setScheduleEntries((current) => [
      ...current,
      {
        id: Date.now(),
        employeId: scheduleForm.employeId,
        day: scheduleForm.day,
        taskId: scheduleForm.taskId,
      },
    ]);
    toast({ title: "Planning enregistré" });
  };

  const tasksById = Object.fromEntries(tasks.map((task) => [String(task.id), task.label]));
  const employeesById = Object.fromEntries((employes ?? []).map((e) => [String(e.id), e.nom]));
  const filteredScheduleEntries = scheduleEntries.filter((entry) => {
    const matchesDay = scheduleFilters.day === "all" || entry.day === scheduleFilters.day;
    const matchesEmploye = scheduleFilters.employeId === "all" || entry.employeId === scheduleFilters.employeId;
    const matchesTask = scheduleFilters.taskId === "all" || entry.taskId === scheduleFilters.taskId;
    return matchesDay && matchesEmploye && matchesTask;
  });

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const total = employes?.length ?? 0;
  const presents = employes?.filter(e => e.statut === "Actif").length ?? 0;
  const absents = employes?.filter(e => e.statut === "Suspendu").length ?? 0;
  const congés = employes?.filter(e => e.statut === "Congé").length ?? 0;
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Employés</h1>
          <p className="text-muted-foreground text-sm">{today} — {total} collaborateurs enregistrés</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
          <Button variant="ghost" size="sm">🔔 Notifs</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={presents} label="Présents" color="text-green-600" />
        <StatCard value={absents} label="Absents" color="text-red-600" />
        <StatCard value={congés} label="Congés" color="text-amber-600" />
        <StatCard value={total} label="Employés" color="text-blue-600" />
      </div>

      <Tabs defaultValue="pointage">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="pointage">Pointage</TabsTrigger>
          <TabsTrigger value="retards">Retards</TabsTrigger>
          <TabsTrigger value="conges">Congés</TabsTrigger>
        <TabsTrigger value="emploi-du-temps">Emploi du temps</TabsTrigger>
        <TabsTrigger value="recap">Récapitulatif</TabsTrigger>
        </TabsList>

        <TabsContent value="pointage" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Enregistrer arrivée / départ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Employé *</Label>
                  <Select value={pointage.employeId} onValueChange={(v) => setPointage((f) => ({ ...f, employeId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {employes?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nom} — {e.poste}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date / heure</Label>
                  <Input type="datetime-local" value={pointage.dateHeure} onChange={(e) => setPointage((f) => ({ ...f, dateHeure: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={() => enregistrerPointage("arrivee")}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Arrivée
                </Button>
                <Button type="button" className="w-full bg-red-600 hover:bg-red-700" onClick={() => enregistrerPointage("depart")}>
                  <Clock3 className="mr-2 h-4 w-4" /> Départ
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Pointages récents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {['Employé', 'Type', 'Date / heure'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pointages.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-muted-foreground">Aucun pointage enregistré</td></tr>
                  ) : pointages.map((p) => {
                    const employe = employes?.find((e) => String(e.id) === p.employeId);
                    return (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{employe?.nom ?? "—"}</td>
                        <td className="px-4 py-3">{p.type === "arrivee" ? "Arrivée" : "Départ"}</td>
                        <td className="px-4 py-3">{formatDateTime(p.dateHeure)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retards" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Signaler un retard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 md:col-span-1">
                  <Label>Employé *</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {employes?.map(e => <SelectItem key={e.id} value={e.nom}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-1">
                  <Label>Heure prévue</Label>
                  <Input type="time" defaultValue="06:00" />
                </div>
                <div className="space-y-1">
                  <Label>Heure réelle</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-1">
                  <Label>Motif</Label>
                  <Select defaultValue="transport">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Transport", "Santé", "Famille", "Autre"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Justifié ?</Label>
                  <Select defaultValue="oui">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oui">Oui</SelectItem>
                      <SelectItem value="non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Signaler</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Historique retards</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Employé", "Date", "Retard", "Motif", "Justifié"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">Thomas B.</td>
                    <td className="px-4 py-3">25/04/2025</td>
                    <td className="px-4 py-3 text-red-600">8h00</td>
                    <td className="px-4 py-3">Transport</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">En attente</span></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emploi-du-temps" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Filtres d’affichage</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Filtrer par jour</Label>
                <Button type="button" variant="outline" className="w-full justify-start font-normal" onClick={() => setFilterCalendarOpen((v) => !v)}>
                  {scheduleFilters.day === "all" ? "Tous les jours" : formatDay(scheduleFilters.day)}
                </Button>
                {filterCalendarOpen && (
                  <div className="rounded-md border bg-background p-2">
                    <Calendar
                      mode="single"
                      month={scheduleCalendarMonth}
                      onMonthChange={setScheduleCalendarMonth}
                      selected={scheduleFilters.day === "all" ? undefined : new Date(scheduleFilters.day)}
                      onSelect={(date) => {
                        if (!date) return;
                        setScheduleFilters((f) => ({ ...f, day: date.toISOString().slice(0, 10) }));
                        setFilterCalendarOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <Select value={scheduleFilters.employeId} onValueChange={(v) => setScheduleFilters((f) => ({ ...f, employeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Filtrer par employé" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employes?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scheduleFilters.taskId} onValueChange={(v) => setScheduleFilters((f) => ({ ...f, taskId: v }))}>
                <SelectTrigger><SelectValue placeholder="Filtrer par tâche" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tâches</SelectItem>
                  {tasks.map((task) => <SelectItem key={task.id} value={String(task.id)}>{task.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Créer un planning sur 30 jours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Employé</Label>
                  <Select value={scheduleForm.employeId} onValueChange={(v) => setScheduleForm((f) => ({ ...f, employeId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {employes?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Jour</Label>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal" onClick={() => setScheduleCalendarOpen((v) => !v)}>
                    {formatDay(scheduleForm.day)}
                  </Button>
                  {scheduleCalendarOpen && (
                    <div className="rounded-md border bg-background p-2">
                      <Calendar
                        mode="single"
                        month={scheduleCalendarMonth}
                        onMonthChange={setScheduleCalendarMonth}
                        selected={new Date(scheduleForm.day)}
                        onSelect={(date) => {
                          if (!date) return;
                          setScheduleForm((f) => ({ ...f, day: date.toISOString().slice(0, 10) }));
                          setScheduleCalendarOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Tâche</Label>
                  <Select value={scheduleForm.taskId} onValueChange={(v) => setScheduleForm((f) => ({ ...f, taskId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => <SelectItem key={task.id} value={String(task.id)}>{task.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={addScheduleEntry}>Enregistrer</Button>
                <Button type="button" variant="outline" onClick={() => setScheduleForm({ employeId: "", day: scheduleDays[0] ?? "", taskId: String(tasks[0]?.id ?? "") })}>Réinitialiser</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Affecter les tâches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Nouvelle tâche" />
                <Button type="button" onClick={addTask}>Ajouter</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tasks.map((task) => (
                  <span key={task.id} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                    {task.label}
                    <button type="button" className="text-destructive" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}>×</button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Planning par jour</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Jour", "Employé", "Tâche", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredScheduleEntries.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-4 text-muted-foreground">Aucun planning enregistré</td></tr>
                  ) : filteredScheduleEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">{entry.day}</td>
                      <td className="px-4 py-3 font-medium">{employeesById[entry.employeId] ?? "—"}</td>
                      <td className="px-4 py-3">{tasksById[entry.taskId] ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteScheduleEntry(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conges" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Enregistrer un congé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Employé *</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {employes?.map(e => <SelectItem key={e.id} value={e.nom}>{e.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select defaultValue="conge_paye">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conge_paye">Congé payé</SelectItem>
                      <SelectItem value="conge_maladie">Congé maladie</SelectItem>
                      <SelectItem value="conge_exceptionnel">Congé exceptionnel</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Début</Label>
                  <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-1">
                  <Label>Fin</Label>
                  <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Enregistrer</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Congés enregistrés</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Employé", "Type", "Début", "Fin", "Jours", "Statut"].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">Sophie M.</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Congé payé</span></td>
                    <td className="px-4 py-3">21/04/2025</td>
                    <td className="px-4 py-3">27/04/2025</td>
                    <td className="px-4 py-3">7</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">Approuvé</span></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recap" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter employé
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Liste des employés</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {['Nom', 'Poste', 'Téléphone', 'Email', 'Embauche', 'Salaire (FCFA)', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>) : employes?.map(e => (
                    <tr key={e.id} className="hover:bg-muted/20" data-testid={`row-employe-${e.id}`}>
                      <td className="px-4 py-3 font-medium">{e.nom}</td>
                      <td className="px-4 py-3">{e.poste}</td>
                      <td className="px-4 py-3">{e.telephone ?? '—'}</td>
                      <td className="px-4 py-3">{e.email ?? '—'}</td>
                      <td className="px-4 py-3">{e.dateEmbauche ?? '—'}</td>
                      <td className="px-4 py-3">{e.salaire != null ? fmt(Number(e.salaire)) : '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${statutBadge[e.statut] ?? 'bg-gray-100 text-gray-800'}`}>{e.statut}</span></td>
                      <td className="px-4 py-3 flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${e.id}`}
                          onClick={() => {
                            setEditId(e.id);
                            setForm({
                              nom: e.nom,
                              poste: e.poste,
                              telephone: e.telephone ?? "",
                              email: e.email ?? "",
                              dateEmbauche: e.dateEmbauche ?? "",
                              statut: e.statut,
                              salaire: e.salaire ? String(e.salaire) : "",
                            });
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-${e.id}`} onClick={() => { if (!confirm(`Supprimer ${e.nom}?`)) return; deleteEmploye.mutate({ id: e.id }, { onSuccess: () => { toast({ title: 'Supprimé' }); invalidate(); } }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
