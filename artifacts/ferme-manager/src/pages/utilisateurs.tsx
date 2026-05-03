import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ShieldCheck, ShieldOff, UserCircle2 } from "lucide-react";

const ALL_MODULES = [
  { id: "animaux", label: "Animaux" },
  { id: "sante", label: "Santé & Vaccins" },
  { id: "reproduction", label: "Reproduction" },
  { id: "alimentation", label: "Alimentation" },
  { id: "loges", label: "Loges & Bâtiments" },
  { id: "maintenance", label: "Maintenance" },
  { id: "employes", label: "Employés" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "veterinaire", label: "Vétérinaire" },
  { id: "budget", label: "Budgétisation" },
];

interface UserRecord {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "employee";
  modules: string[];
  actif: boolean;
  createdAt: string;
}

const STORAGE_KEY = "ferme_utilisateurs";

function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 1,
      nom: "Diallo",
      prenom: "Amadou",
      email: "amadou@ferme.com",
      role: "admin",
      modules: ALL_MODULES.map((m) => m.id),
      actif: true,
      createdAt: "2026-01-01",
    },
    {
      id: 2,
      nom: "Koné",
      prenom: "Marie",
      email: "marie@ferme.com",
      role: "employee",
      modules: ["animaux", "alimentation", "sante"],
      actif: true,
      createdAt: "2026-02-15",
    },
  ];
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  role: "employee" as "admin" | "employee",
  modules: [] as string[],
  actif: true,
};

export default function Utilisateurs() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>(loadUsers);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const toggleModule = (id: string) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(id)
        ? f.modules.filter((m) => m !== id)
        : [...f.modules, id],
    }));
  };

  const selectAll = () => setForm((f) => ({ ...f, modules: ALL_MODULES.map((m) => m.id) }));
  const deselectAll = () => setForm((f) => ({ ...f, modules: [] }));

  const handleRoleChange = (role: "admin" | "employee") => {
    setForm((f) => ({
      ...f,
      role,
      modules: role === "admin" ? ALL_MODULES.map((m) => m.id) : f.modules,
    }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      modules: [...user.modules],
      actif: user.actif,
    });
    setEditingId(user.id);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email) return;

    if (editingId) {
      setUsers((current) =>
        current.map((u) =>
          u.id === editingId
            ? { ...u, nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, modules: form.modules, actif: form.actif }
            : u
        )
      );
      toast({ title: "Utilisateur modifié avec succès" });
    } else {
      const newUser: UserRecord = {
        id: Date.now(),
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        role: form.role,
        modules: form.modules,
        actif: form.actif,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers((current) => [newUser, ...current]);
      toast({ title: "Utilisateur créé avec succès" });
    }
    setOpen(false);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setUsers((current) => current.filter((u) => u.id !== id));
    setDeleteId(null);
    toast({ title: "Utilisateur supprimé" });
  };

  const toggleActif = (id: number) => {
    setUsers((current) =>
      current.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground text-sm">Créer et gérer les accès aux modules (Administrateur)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</DialogTitle>
              <DialogDescription>
                Renseignez les informations et sélectionnez les modules accessibles.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prénom *</Label>
                  <Input
                    placeholder="ex: Amadou"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nom *</Label>
                  <Input
                    placeholder="ex: Diallo"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Adresse e-mail *</Label>
                <Input
                  type="email"
                  placeholder="ex: amadou@ferme.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => handleRoleChange(v as "admin" | "employee")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur (accès total)</SelectItem>
                    <SelectItem value="employee">Employé (accès limité)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Modules accessibles</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAll}>
                      Tout cocher
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={deselectAll}>
                      Tout décocher
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md p-3 grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`mod-${mod.id}`}
                        checked={form.modules.includes(mod.id)}
                        onCheckedChange={() => toggleModule(mod.id)}
                        disabled={form.role === "admin"}
                      />
                      <label
                        htmlFor={`mod-${mod.id}`}
                        className="text-sm cursor-pointer select-none"
                      >
                        {mod.label}
                      </label>
                    </div>
                  ))}
                </div>
                {form.role === "admin" && (
                  <p className="text-xs text-muted-foreground">Les administrateurs ont accès à tous les modules.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <UserCircle2 className="h-7 w-7 text-blue-500" />
            <div>
              <div className="text-xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">Utilisateurs total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-500" />
            <div>
              <div className="text-xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
              <div className="text-xs text-muted-foreground">Administrateurs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <ShieldOff className="h-7 w-7 text-green-500" />
            <div>
              <div className="text-xl font-bold">{users.filter((u) => u.actif).length}</div>
              <div className="text-xs text-muted-foreground">Comptes actifs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {["Nom", "E-mail", "Rôle", "Modules", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${user.role === "admin" ? "bg-amber-500" : "bg-blue-500"}`}>
                        {user.prenom[0]}{user.nom[0]}
                      </div>
                      <div>
                        <div className="font-medium">{user.prenom} {user.nom}</div>
                        <div className="text-xs text-muted-foreground">Créé le {user.createdAt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                      {user.role === "admin" ? "Admin" : "Employé"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="text-xs text-muted-foreground">Tous les modules</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {user.modules.slice(0, 3).map((m) => (
                          <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {ALL_MODULES.find((mod) => mod.id === m)?.label ?? m}
                          </span>
                        ))}
                        {user.modules.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{user.modules.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActif(user.id)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${user.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {user.actif ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog open={deleteId === user.id} onOpenChange={(v) => setDeleteId(v ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
                            <DialogDescription>
                              Êtes-vous sûr de vouloir supprimer <strong>{user.prenom} {user.nom}</strong> ? Cette action est irréversible.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 mt-4">
                            <Button variant="destructive" className="flex-1" onClick={() => handleDelete(user.id)}>
                              Supprimer
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                              Annuler
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
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
