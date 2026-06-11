import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Cog } from "lucide-react";
import {
  useGetSystemSettings,
  getGetSystemSettingsQueryKey,
  useUpdateSystemSettings,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SETTINGS_KEY = "ferme_system_settings";

type SystemSettingsForm = {
  farmName: string;
  language: string;
  currency: string;
  darkMode: boolean;
  autoBackup: boolean;
  notifications: boolean;
};

const defaultSettings: SystemSettingsForm = {
  farmName: "FermeManager Pro",
  language: "fr",
  currency: "FCFA",
  darkMode: false,
  autoBackup: true,
  notifications: true,
};

function cacheLocal(next: SystemSettingsForm) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  document.documentElement.classList.toggle("dark", next.darkMode);
}

export default function SystemSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useGetSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [settings, setSettings] = useState<SystemSettingsForm>(defaultSettings);

  useEffect(() => {
    if (!data) return;
    const next: SystemSettingsForm = {
      farmName: data.farmName,
      language: data.language,
      currency: data.currency,
      darkMode: data.darkMode,
      autoBackup: data.autoBackup,
      notifications: data.notifications,
    };
    setSettings(next);
    cacheLocal(next);
  }, [data]);

  const update = (patch: Partial<SystemSettingsForm>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      document.documentElement.classList.toggle("dark", next.darkMode);
      return next;
    });
  };

  const save = () => {
    updateSettings.mutate(
      { data: settings },
      {
        onSuccess: () => {
          cacheLocal(settings);
          qc.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
          toast({ title: "Paramètres système enregistrés" });
        },
        onError: () => toast({ variant: "destructive", title: "Erreur", description: "Enregistrement impossible" }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Cog className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres système</h1>
          <p className="text-sm text-muted-foreground">Configurer le système, l’affichage et les options globales</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Général</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la ferme</Label>
              <Input value={settings.farmName} onChange={(e) => update({ farmName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={settings.language} onValueChange={(value) => update({ language: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={settings.currency} onValueChange={(value) => update({ currency: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="XOF">XOF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Mode sombre</p>
                <p className="text-xs text-muted-foreground">Activer l’apparence sombre</p>
              </div>
              <Switch checked={settings.darkMode} onCheckedChange={(checked) => update({ darkMode: checked })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Sauvegarde automatique</p>
                <p className="text-xs text-muted-foreground">Créer des sauvegardes régulières</p>
              </div>
              <Switch checked={settings.autoBackup} onCheckedChange={(checked) => update({ autoBackup: checked })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Afficher les alertes système</p>
              </div>
              <Switch checked={settings.notifications} onCheckedChange={(checked) => update({ notifications: checked })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={updateSettings.isPending}>Enregistrer les paramètres</Button>
      </div>
    </div>
  );
}
