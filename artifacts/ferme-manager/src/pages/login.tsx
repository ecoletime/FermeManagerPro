import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === "admin" && adminPassword === "admin123") {
      login("admin");
      setLocation("/");
      toast({ title: "Connexion réussie", description: "Bienvenue, Administrateur" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiants invalides" });
    }
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (empUsername === "employe" && empPassword === "emp123") {
      login("employee");
      setLocation("/");
      toast({ title: "Connexion réussie", description: "Bienvenue, Employé" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiants invalides" });
    }
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
                    <Input 
                      id="emp-username" 
                      placeholder="employe" 
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-password">Mot de passe</Label>
                    <Input 
                      id="emp-password" 
                      type="password" 
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full font-medium">Se connecter</Button>
                </form>
              </TabsContent>
              
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Nom d'utilisateur</Label>
                    <Input 
                      id="admin-username" 
                      placeholder="admin" 
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Mot de passe</Label>
                    <Input 
                      id="admin-password" 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full font-medium">Se connecter</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}