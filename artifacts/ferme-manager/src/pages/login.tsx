import { useState } from "react";
import { useLocation } from "wouter";
import { setAuthStateWithUsername } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLogin, useResetPassword } from "@workspace/api-client-react";

const RESET_CODE_KEY = "ferme_admin_reset_code";
const API_BASE = `${import.meta.env.BASE_URL}api`;

type ResetStep = "request" | "verify" | "password";

function generateCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const resetMutation = useResetPassword();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [forgotUsername, setForgotUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");

  const goHome = () => setLocation("/");

  const doLogin = (username: string, password: string) => {
    loginMutation.mutate(
      { data: { username: username.trim(), password } },
      {
        onSuccess: (user) => {
          const role = user.role === "admin" ? "admin" : "employee";
          const permissions = role === "admin" ? ["all"] : user.modules ?? [];
          setAuthStateWithUsername(role, permissions, user.username);
          window.dispatchEvent(new Event("storage"));
          goHome();
          setTimeout(() => toast({ title: "Connexion réussie", description: `Bienvenue, ${user.prenom} ${user.nom}` }), 0);
        },
        onError: () => toast({ variant: "destructive", title: "Erreur", description: "Identifiants invalides" }),
      },
    );
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(adminUsername, adminPassword);
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(empUsername, empPassword);
  };

  const openForgot = () => {
    setForgotOpen(true);
    setResetStep("request");
    setForgotUsername("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleForgot = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!forgotUsername.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Entrez votre nom d'utilisateur" });
      return;
    }
    const code = generateCode();
    localStorage.setItem(RESET_CODE_KEY, JSON.stringify({ username: forgotUsername.trim(), code, expiresAt: Date.now() + 10 * 60 * 1000 }));
    try {
      const targetEmail = `${forgotUsername.trim()}@example.com`;
      const response = await fetch(`${API_BASE}/auth/reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code }),
      });
      if (!response.ok) throw new Error("email-failed");
      toast({ title: "Code envoyé", description: `Le code a été envoyé à ${targetEmail}` });
    } catch {
      toast({ title: "Code généré", description: "L'envoi email a échoué, utilisez le code affiché dans le navigateur." });
    }
    setResetStep("verify");
  };

  const handleVerifyCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const raw = localStorage.getItem(RESET_CODE_KEY);
      if (!raw) {
        toast({ variant: "destructive", title: "Erreur", description: "Code expiré" });
        return;
      }
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(RESET_CODE_KEY);
        toast({ variant: "destructive", title: "Erreur", description: "Code expiré" });
        return;
      }
      if (String(parsed.code) !== resetCode.trim()) {
        toast({ variant: "destructive", title: "Erreur", description: "Code incorrect" });
        return;
      }
      setResetStep("password");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de vérifier le code" });
    }
  };

  const handleResetPassword = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast({ variant: "destructive", title: "Erreur", description: "Mot de passe trop court" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Erreur", description: "Les mots de passe ne correspondent pas" });
      return;
    }
    let username = forgotUsername.trim();
    try {
      const raw = localStorage.getItem(RESET_CODE_KEY);
      if (raw) username = JSON.parse(raw).username ?? username;
    } catch {}
    resetMutation.mutate(
      { data: { username, password: newPassword } },
      {
        onSuccess: () => {
          localStorage.removeItem(RESET_CODE_KEY);
          setForgotOpen(false);
          setResetStep("request");
          setNewPassword("");
          setConfirmPassword("");
          setForgotUsername("");
          setResetCode("");
          toast({ title: "Mot de passe mis à jour" });
        },
        onError: () => toast({ variant: "destructive", title: "Erreur", description: "Utilisateur introuvable" }),
      },
    );
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
                    <Input id="emp-username" placeholder="Nom d'utilisateur" value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-password">Mot de passe</Label>
                    <Input id="emp-password" type="password" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" className="text-sm text-primary hover:underline" onClick={openForgot}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Button type="submit" className="w-full font-medium" disabled={loginMutation.isPending}>Se connecter</Button>
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
                    <button type="button" className="text-sm text-primary hover:underline" onClick={openForgot}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Button type="submit" className="w-full font-medium" disabled={loginMutation.isPending}>Se connecter</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mot de passe oublié</DialogTitle>
              <DialogDescription>Entrez votre nom d'utilisateur pour réinitialiser le mot de passe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {resetStep === "request" && (
                <form className="space-y-4" onSubmit={handleForgot}>
                  <div className="space-y-2">
                    <Label>Nom d'utilisateur</Label>
                    <Input value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} placeholder="admin" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Envoyer le code</Button>
                  </div>
                </form>
              )}
              {resetStep === "verify" && (
                <form className="space-y-4" onSubmit={handleVerifyCode}>
                  <div className="space-y-2">
                    <Label>Code à 5 chiffres</Label>
                    <Input value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="12345" maxLength={5} inputMode="numeric" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setResetStep("request")}>Retour</Button>
                    <Button type="submit">Vérifier</Button>
                  </div>
                </form>
              )}
              {resetStep === "password" && (
                <form className="space-y-4" onSubmit={handleResetPassword}>
                  <div className="space-y-2">
                    <Label>Nouveau mot de passe</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmer le mot de passe</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setResetStep("verify")}>Retour</Button>
                    <Button type="submit" disabled={resetMutation.isPending}>Mettre à jour</Button>
                  </div>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
