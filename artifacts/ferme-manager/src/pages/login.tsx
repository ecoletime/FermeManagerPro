import { useState } from "react";
import { useLocation } from "wouter";
import { getAdminCredentials, updateAdminCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const USER_STORAGE_KEY = "ferme_utilisateurs";

function loadUsers() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return [];
}

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getAdminCredentials();
    if (adminUsername === creds.username && adminPassword === creds.password) {
      localStorage.setItem("ferme_auth", JSON.stringify({ isLoggedIn: true, role: "admin", permissions: ["all"] }));
      setLocation("/");
      toast({ title: "Connexion réussie", description: "Bienvenue, Administrateur" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiants invalides" });
    }
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = loadUsers();
    const matched = users.find((user: any) => user.email.toLowerCase() === empUsername.toLowerCase() && user.actif !== false);
    if (matched) {
      localStorage.setItem("ferme_auth", JSON.stringify({ isLoggedIn: true, role: matched.role, permissions: matched.modules ?? [] }));
      setLocation("/");
      toast({ title: "Connexion réussie", description: `Bienvenue, ${matched.prenom} ${matched.nom}` });
    } else if (empUsername === "employe" && empPassword === "emp123") {
      localStorage.setItem("ferme_auth", JSON.stringify({ isLoggedIn: true, role: "employee", permissions: ["animaux", "alimentation", "sante"] }));
      setLocation("/");
      toast({ title: "Connexion réussie", description: "Bienvenue, Employé" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiants invalides" });
    }
  };

  const handleForgot = () => {
    if (!forgotUsername.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Entrez votre nom d'utilisateur admin" });
      return;
    }
    const creds = getAdminCredentials();
    if (forgotUsername.trim().toLowerCase() !== creds.username.toLowerCase()) {
      toast({ variant: "destructive", title: "Erreur", description: "Compte administrateur introuvable" });
      return;
    }
    setResetOpen(true);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 4) {
      toast({ variant: "destructive", title: "Erreur", description: "Mot de passe trop court" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Erreur", description: "Les mots de passe ne correspondent pas" });
      return;
    }
    updateAdminCredentials(forgotUsername.trim(), newPassword);
    setResetOpen(false);
    setForgotOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setForgotUsername("");
    toast({ title: "Mot de passe mis à jour" });
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <PiggyBank size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">FermeManager <span className="text-foreground">Pro</span></h1>
          <p className="text-muted-foreground">Système de gestion de ferme porcine</p>
        </div>

        <Card className="w-full border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Sélectionnez votre profil pour accéder à votre espace</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="employee" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="employee">Employé</TabsTrigger>
                <TabsTrigger value="admin">Administrateur</TabsTrigger>
              </TabsList>

              <TabsContent value="employee">
                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emp-username">Nom d'utilisateur</Label>
                    <Input id="emp-username" placeholder="email de l'utilisateur" value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-password">Mot de passe</Label>
                    <Input id="emp-password" type="password" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full font-medium">Se connecter</Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Nom d'utilisateur</Label>
                    <Input id="admin-username" placeholder="admin" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Mot de passe</Label>
                    <Input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" className="text-sm text-primary hover:underline" onClick={() => setForgotOpen(true)}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Button type="submit" className="w-full font-medium">Se connecter</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mot de passe oublié</DialogTitle>
              <DialogDescription>Entrez votre nom d'utilisateur administrateur pour réinitialiser le mot de passe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nom d'utilisateur admin</Label>
                <Input value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} placeholder="admin" />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleForgot}>Continuer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau mot de passe</DialogTitle>
              <DialogDescription>Choisissez un nouveau mot de passe pour l'administrateur.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleResetPassword}>Mettre à jour</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
