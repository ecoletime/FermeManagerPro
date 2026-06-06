import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { updateAdminCredentials } from "@/lib/auth";

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
  { id: "notifications", label: "Notifications" },
  { id: "utilisateurs", label: "Utilisateurs" },
  { id: "systeme", label: "Paramètres système" },
];

interface UserRecord {
  id: number;
  username: string;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "employee";
  modules: string[];
  actif: boolean;
  createdAt: string;
  password?: string;
}

const STORAGE_KEY = "ferme_utilisateurs";

function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: 1, username: "admin", nom: "Diallo", prenom: "Amadou", email: "amadou@ferme.com", role: "admin", modules: ALL_MODULES.map((m) => m.id), actif: true, createdAt: "2026-01-01", password: "admin123" },
    { id: 2, username: "marie.kone", nom: "Koné", prenom: "Marie", email: "marie@ferme.com", role: "employee", modules: ["animaux", "alimentation", "sante", "notifications"], actif: true, createdAt: "2026-02-15", password: "emp123" },
  ];
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

const EMPTY_FORM = { username: "", nom: "", prenom: "", email: "", role: "employee" as "admin" | "employee", modules: [] as string[], actif: true, password: "" };

export default function Utilisateurs() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserRecord[]>(loadUsers);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const toggleModule = (id: string) => {
    setForm((f) => ({ ...f, modules: f.modules.includes(id) ? f.modules.filter((m) => m !== id) : [...f.modules, id] }));
  };

  const selectAll = () => setForm((f) => ({ ...f, modules: ALL_MODULES.map((m) => m.id) }));
  const deselectAll = () => setForm((f) => ({ ...f, modules: [] }));

  const handleRoleChange = (role: "admin" | "employee") => {
    setForm((f) => ({ ...f, role, modules: role === "admin" ? ALL_MODULES.map((m) => m.id) : f.modules }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setForm({ username: user.username, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, modules: [...user.modules], actif: user.actif, password: user.password ?? "" });
    setEditingId(user.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.nom || !form.prenom || !form.email) return;
    if (!(await confirm({ title: editingId ? "Modifier l'utilisateur" : "Créer l'utilisateur", description: editingId ? "Confirmer les modifications de cet utilisateur ?" : "Voulez-vous créer cet utilisateur ?" }))) return;

    if (editingId) {
      setUsers((current) => current.map((u) => u.id === editingId ? { ...u, username: form.username, nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, modules: form.modules, actif: form.actif, password: form.password || u.password } : u));
      if (form.role === "admin" && form.password) {
        updateAdminCredentials(form.username, form.password);
      }
      toast({ title: "Utilisateur modifié avec succès" });
    } else {
      const newUser: UserRecord = { id: Date.now(), username: form.username, nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, modules: form.modules, actif: form.actif, createdAt: new Date().toISOString().slice(0, 10), password: form.password || (form.role === "admin" ? "admin123" : "emp123") };
      setUsers((current) => [newUser, ...current]);
      if (newUser.role === "admin") {
        updateAdminCredentials(newUser.username, newUser.password ?? "admin123");
      }
      toast({ title: "Utilisateur créé avec succès" });
    }
    setOpen(false);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({ title: "Supprimer l'utilisateur", description: "Supprimer définitivement cet utilisateur ? Cette action est irréversible.", confirmText: "Supprimer", destructive: true }))) return;
    setUsers((current) => current.filter((u) => u.id !== id));
    setDeleteId(null);
    toast({ title: "Utilisateur supprimé" });
  };

  const toggleActif = (id: number) => {
    setUsers((current) => current.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u)));
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
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nouvel utilisateur</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</DialogTitle>
              <DialogDescription>Renseignez les informations et sélectionnez les modules accessibles.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nom d'utilisateur *</Label><Input placeholder="ex: amadou.diallo" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>Prénom *</Label><Input placeholder="ex: Amadou" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>Nom *</Label><Input placeholder="ex: Diallo" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>Adresse e-mail *</Label><Input type="email" placeholder="ex: amadou@ferme.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>Mot de passe admin</Label><Input type="password" placeholder="Nouveau mot de passe" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Rôle</Label><Select value={form.role} onValueChange={(v) => handleRoleChange(v as "admin" | "employee") }><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Administrateur (accès total)</SelectItem><SelectItem value="employee">Employé (accès limité)</SelectItem></SelectContent></Select></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Modules accessibles</Label>
                  <div className="flex gap-2"><Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAll}>Tout cocher</Button><Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={deselectAll}>Tout décocher</Button></div>
                </div>
                <div className="border rounded-md p-3 grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mod) => (<div key={mod.id} className="flex items-center gap-2"><Checkbox id={`mod-${mod.id}`} checked={form.modules.includes(mod.id)} onCheckedChange={() => toggleModule(mod.id)} disabled={form.role === "admin"} /><Label htmlFor={`mod-${mod.id}`} className="text-sm font-normal cursor-pointer">{mod.label}</Label></div>))}
                </div>
              </div>
              <div className="flex items-center gap-2"><Checkbox checked={form.actif} onCheckedChange={(checked) => setForm((f) => ({ ...f, actif: Boolean(checked) }))} /><Label>Compte actif</Label></div>
              <Button type="submit" className="w-full">{editingId ? "Enregistrer" : "Créer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap"><UserCircle2 className="h-5 w-5 text-primary" /><span className="font-semibold">{user.prenom} {user.nom}</span><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge><Badge variant={user.actif ? "default" : "destructive"}>{user.actif ? "Actif" : "Inactif"}</Badge></div>
                <div className="text-sm text-muted-foreground mt-1">{user.username} • {user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleActif(user.id)}>{user.actif ? "Désactiver" : "Activer"}</Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(user)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteId(user.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteId !== null && (
        <Dialog open onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer l'utilisateur ?</DialogTitle>
              <DialogDescription>Cette action est définitive.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteId)}>Supprimer</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
