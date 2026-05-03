import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const notificationTypeOptions = [
  { label: "Critiques", icon: "🚨" },
  { label: "Alertes", icon: "⚠️" },
  { label: "Infos", icon: "ℹ️" },
  { label: "Résumé quotidien", icon: "📊" },
  { label: "Succès", icon: "✅" },
];

const overviewStats = [
  { value: "7", label: "Alertes critiques" },
  { value: "12", label: "Stocks surveillés" },
  { value: "98%", label: "Taux de livraison" },
  { value: "7j", label: "Historique" },
];

const templateTypes = [
  { label: "Alerte critique", color: "bg-red-100 text-red-700", title: "🚨 Alerte critique" },
  { label: "Stock faible", color: "bg-amber-100 text-amber-700", title: "⚠️ Stock faible" },
  { label: "Succès", color: "bg-green-100 text-green-700", title: "✅ Succès" },
  { label: "Info", color: "bg-blue-100 text-blue-700", title: "ℹ️ Information" },
];

const severityIconMap: Record<string, string> = {
  succès: "🟢",
  alerte: "⚠️",
  critique: "🔴",
  urgence: "🚨",
};

const notifications = [
  {
    title: "Naissance — Truie #T-009 — 9 porcelets",
    desc: "Nouvelle portée née ce matin.",
    time: "02/05/2026 21:32",
    severity: "succès",
    color: "bg-green-100",
    text: "text-green-900",
    email: {
      subject: "Naissance — Truie #T-009 — 9 porcelets",
      from: "noreply@fermamanager.pro",
      to: ["admin@ferme.com", "carta.v@ferme.com"],
      body: "La truie #T-009 a mis bas 9 porcelets en bonne santé.",
      stock: [
        { label: "Maternité", value: "45 kg", level: "bad", width: "26%" },
        { label: "Croissance 1", value: "120 kg", level: "good", width: "100%" },
        { label: "Croissance 2", value: "85 kg", level: "bad", width: "34%" },
      ],
    },
  },
  {
    title: "Stock faible — Croissance 2 (85 kg)",
    desc: "Le stock de Croissance 2 est en dessous du seuil d’alerte.",
    time: "02/05/2026 20:11",
    severity: "alerte",
    color: "bg-amber-100",
    text: "text-amber-900",
    email: {
      subject: "Stock faible — Croissance 2 (85 kg)",
      from: "stock@fermamanager.pro",
      to: ["admin@ferme.com"],
      body: "Le niveau de l’aliment Croissance 2 est sous le seuil minimal. Un réassort est recommandé.",
      stock: [
        { label: "Croissance 1", value: "120 kg", level: "good", width: "100%" },
        { label: "Croissance 2", value: "85 kg", level: "bad", width: "34%" },
        { label: "Croissance 3", value: "250 kg", level: "good", width: "87%" },
      ],
    },
  },
  {
    title: "Animal malade — #P-108 — Fièvre 40.8°C",
    desc: "L’animal #P-108 a été signalé malade.",
    time: "02/05/2026 19:24",
    severity: "alerte",
    color: "bg-yellow-100",
    text: "text-yellow-900",
    email: {
      subject: "Animal malade — #P-108 — Fièvre 40.8°C",
      from: "noreply@fermamanager.pro",
      to: ["admin@ferme.com", "carta.v@ferme.com"],
      body: "L’animal #P-108 a été signalé malade avec une température de 40.8°C.",
      stock: [
        { label: "Croissance 1", value: "120 kg", level: "good", width: "100%" },
        { label: "Croissance 2", value: "85 kg", level: "bad", width: "34%" },
        { label: "Croissance 3", value: "250 kg", level: "good", width: "87%" },
        { label: "Maternité", value: "45 kg", level: "bad", width: "26%" },
        { label: "Gestation", value: "180 kg", level: "good", width: "100%" },
      ],
    },
  },
  {
    title: "Mise bas imminente — Truie #T-022",
    desc: "La truie #T-022 approche de la mise bas.",
    time: "02/05/2026 18:46",
    severity: "alerte",
    color: "bg-yellow-100",
    text: "text-yellow-900",
    email: {
      subject: "Mise bas imminente — Truie #T-022",
      from: "repro@fermamanager.pro",
      to: ["admin@ferme.com"],
      body: "La truie #T-022 présente les signes d’une mise bas imminente. Surveillance recommandée.",
      stock: [
        { label: "Gestation", value: "180 kg", level: "good", width: "100%" },
        { label: "Maternité", value: "45 kg", level: "bad", width: "26%" },
      ],
    },
  },
  {
    title: "Panne urgente — Fuite eau — Bâtiment B",
    desc: "Une fuite a été signalée au bâtiment B.",
    time: "02/05/2026 17:50",
    severity: "urgence",
    color: "bg-red-100",
    text: "text-red-900",
    email: {
      subject: "Panne urgente — Fuite eau — Bâtiment B",
      from: "maintenance@fermamanager.pro",
      to: ["admin@ferme.com", "tech@ferme.com"],
      body: "Une fuite d’eau a été détectée au bâtiment B. Intervention urgente requise.",
      stock: [
        { label: "Bâtiment A", value: "OK", level: "good", width: "100%" },
        { label: "Bâtiment B", value: "Urgent", level: "bad", width: "22%" },
      ],
    },
  },
  {
    title: "Stock critique — Aliment Maternité (45 kg)",
    desc: "Le stock a atteint un seuil critique.",
    time: "02/05/2026 17:20",
    severity: "critique",
    color: "bg-pink-100",
    text: "text-pink-900",
    email: {
      subject: "Stock critique — Aliment Maternité (45 kg)",
      from: "stock@fermamanager.pro",
      to: ["admin@ferme.com"],
      body: "Le stock de l’aliment Maternité est critique. Commande urgente nécessaire.",
      stock: [
        { label: "Croissance 1", value: "120 kg", level: "good", width: "100%" },
        { label: "Maternité", value: "45 kg", level: "bad", width: "26%" },
      ],
    },
  },
  {
    title: "Vaccin en retard — #P-108 — PRRS",
    desc: "Le vaccin PRRS est en retard de 3 jours.",
    time: "02/05/2026 16:58",
    severity: "alerte",
    color: "bg-yellow-100",
    text: "text-yellow-900",
    email: {
      subject: "Vaccin en retard — #P-108 — PRRS",
      from: "sante@fermamanager.pro",
      to: ["admin@ferme.com", "vet@ferme.com"],
      body: "Le vaccin PRRS de l’animal #P-108 est en retard de 3 jours.",
      stock: [
        { label: "Vaccin PRRS", value: "Retard", level: "bad", width: "32%" },
        { label: "Vaccin PCV2", value: "À jour", level: "good", width: "100%" },
      ],
    },
  },
];

const recipients = [
  { name: "Administrateur", email: "admin@ferme.com", role: "Admin principal", active: true, types: ["Critiques", "Alertes", "Résumé quotidien"] },
  { name: "Carla V.", email: "carta.v@ferme.com", role: "Responsable", active: true, types: ["Critiques", "Alertes", "Résumé quotidien"] },
];

const rules = [
  { label: "Stock critique", type: "critique", desc: "Alerte immédiate quand un stock passe sous le seuil.", active: true },
  { label: "Stock faible", type: "alerte", desc: "Alerte quand un stock atteint le seuil.", active: true },
  { label: "Animal malade", type: "alerte", desc: "Notification à chaque animal malade signalé.", active: true },
  { label: "Décès d'un animal", type: "critique", desc: "Notification immédiate pour tout décès.", active: true },
  { label: "Vaccin en retard", type: "alerte", desc: "Alerte si vaccin non administré à temps.", active: true },
  { label: "Mise bas imminente", type: "alerte", desc: "Notification 24h avant une mise bas.", active: true },
  { label: "Naissance de porcelets", type: "succès", desc: "Notification pour chaque naissance.", active: true },
  { label: "Absence non justifiée", type: "alerte", desc: "Alerte si employé absent sans justification.", active: true },
  { label: "Maintenance urgente", type: "critique", desc: "Alerte immédiate pour toute panne urgente.", active: true },
  { label: "Budget dépassé", type: "critique", desc: "Alerte quand un poste budgétaire est dépassé.", active: true },
  { label: "Visite vétérinaire imminente", type: "info", desc: "Rappel 48h avant une visite.", active: true },
  { label: "Résumé quotidien", type: "info", desc: "Email récapitulatif automatique chaque matin.", active: true },
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <div className="text-3xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function Notifications() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">🔔 Notifications</h1>
          <p className="text-muted-foreground text-sm">Système intégré de notifications</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </div>

      <Tabs defaultValue="centre">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="centre">Centre de notif</TabsTrigger>
          <TabsTrigger value="journal">Journal emails</TabsTrigger>
          <TabsTrigger value="destinataires">Destinataires</TabsTrigger>
          <TabsTrigger value="regles">Règles & Seuils</TabsTrigger>
          <TabsTrigger value="simulateur">Simulateur</TabsTrigger>
        </TabsList>

        <TabsContent value="centre" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Type</div>
              <Select defaultValue="tous">
                <SelectTrigger className="w-[92px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="alerte">Alerte</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="succès">Succès</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Statut</div>
              <Select defaultValue="tous">
                <SelectTrigger className="w-[92px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="lus">Lus</SelectItem>
                  <SelectItem value="non_lus">Non lus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">✓ Tout lu</Button>
            <Button variant="destructive">Suppr. lues</Button>
          </div>

          {notifications.map((n) => (
            <Card key={n.title} className={n.color}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className={`font-semibold ${n.text}`}>
                    {severityIconMap[n.severity] ?? "ℹ️"} {n.title}
                  </div>
                  <div className="text-sm text-muted-foreground">{n.desc}</div>
                  <div className="text-xs text-muted-foreground mt-2">{n.time}</div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">✓ Lu</Button>
                  <Button size="sm" variant="outline">Email</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="journal" className="space-y-4 mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Journal des emails envoyés</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.map((n, index) => (
                <div key={`${n.title}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-1 h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm shrink-0">
                      {index % 2 === 0 ? "✉️" : "📨"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        <span className="text-muted-foreground font-medium">[FermeManager]</span>{" "}
                        {severityIconMap[n.severity] ?? "ℹ️"} {n.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        À Cora V. &lt;admin@fermamanager.com&gt; — {n.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-green-700">● Envoyé</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 px-3">Voir</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogTitle className="text-base font-semibold">Email — {n.title}</DialogTitle>
                        <div className="rounded-t-lg overflow-hidden border mt-2">
                          <div className="bg-amber-700 text-white px-4 py-3 text-sm">
                            <div className="text-[11px] opacity-90">
                              De : {n.email.from} | À : {n.email.to.join(", ")}
                            </div>
                            <div className="font-semibold mt-1">{n.email.subject}</div>
                          </div>
                          <div className="bg-white p-5 space-y-4">
                            <div className="text-sm font-semibold text-amber-700">{severityIconMap[n.severity] ?? "ℹ️"} {n.email.subject}</div>
                            <p className="text-sm text-slate-700">{n.email.body}</p>
                            <div className="rounded-lg bg-stone-100 p-4">
                              <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">État des stocks</div>
                              <div className="mt-3 space-y-3">
                                {n.email.stock.map((item) => (
                                  <div key={item.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span>{item.label}</span>
                                      <span className={item.level === "good" ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>{item.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                                      <div className={`h-full rounded-full ${item.level === "good" ? "bg-green-600" : "bg-red-500"}`} style={{ width: item.width }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-3">
            <StatCard value="10" label="Emails envoyés" />
            <StatCard value="0" label="Erreurs" />
            <StatCard value="2" label="Destinataires touchés" />
          </div>
        </TabsContent>

        <TabsContent value="destinataires" className="space-y-4 mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Ajouter un destinataire</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input placeholder="ex: Jean-Pierre Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input placeholder="ex: admin@ferme.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select defaultValue="admin">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin principal</SelectItem>
                    <SelectItem value="employe">Employé</SelectItem>
                    <SelectItem value="responsable">Responsable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Types de notifications à recevoir</Label>
                <div className="flex flex-wrap gap-3 text-sm">
                  {notificationTypeOptions.map((item) => (
                    <label key={item.label} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked={item.label !== "Infos"} />
                      <span>{item.icon} {item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">Ajouter le destinataire</Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Destinataires enregistrés</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recipients.map((recipient) => (
                <div key={recipient.email} className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
                      {recipient.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{recipient.name}</div>
                      <div className="text-xs text-muted-foreground">{recipient.email}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {recipient.types.map((type) => (
                          <span key={type} className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {notificationTypeOptions.find((option) => option.label === type)?.icon ?? "•"} {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${recipient.active ? "text-green-700" : "text-muted-foreground"}`}>
                      {recipient.active ? "Actif" : "Inactif"}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 px-3">Désact.</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regles" className="mt-4 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Règles de notification actives</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rules.map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        item.type === "critique"
                          ? "bg-red-100 text-red-700"
                          : item.type === "alerte"
                          ? "bg-amber-100 text-amber-700"
                          : item.type === "succès"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{item.desc}</div>
                  </div>
                  <Switch checked={item.active} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Seuils d’alerte — Stocks alimentaires</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              <div className="space-y-4">
                {[
                  { label: "Croissance 1", value: "40", unit: "kg min", icon: "🍃" },
                  { label: "Croissance 2", value: "100", unit: "kg min", icon: "🍃" },
                  { label: "Croissance 3", value: "100", unit: "kg min", icon: "🍃" },
                  { label: "Maternité", value: "60", unit: "kg min", icon: "🌸" },
                  { label: "Gestation", value: "60", unit: "kg min", icon: "🌸" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span>{item.icon}</span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input className="w-16 h-8 text-right" defaultValue={item.value} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700">Sauvegarder</Button>
                <Button variant="outline">Tester les seuils</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Fréquence des résumés</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure du résumé quotidien</Label>
                <Input type="time" defaultValue="06:00" />
              </div>
              <div className="space-y-2">
                <Label>Jour du résumé hebdomadaire</Label>
                <Select defaultValue="lundi">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lundi">Lundi</SelectItem>
                    <SelectItem value="mardi">Mardi</SelectItem>
                    <SelectItem value="mercredi">Mercredi</SelectItem>
                    <SelectItem value="jeudi">Jeudi</SelectItem>
                    <SelectItem value="vendredi">Vendredi</SelectItem>
                    <SelectItem value="samedi">Samedi</SelectItem>
                    <SelectItem value="dimanche">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button className="bg-green-600 hover:bg-green-700">Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Templates d’emails</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templateTypes.map((template) => (
                <div key={template.label} className="rounded-lg border p-3 space-y-2">
                  <div className={`inline-flex text-[11px] px-2 py-0.5 rounded-full ${template.color}`}>{template.label}</div>
                  <div className="font-semibold text-sm">{template.title}</div>
                  <div className="text-xs text-muted-foreground">Aperçu visuel du modèle d’email à envoyer.</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Simulateur d’événements</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {["Naissance", "Panne", "Stock critique", "Absence", "Vaccin en retard", "Décès"].map((event) => (
                  <Button key={event} variant="outline" className="justify-start">{event}</Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">Déclenche un événement en temps réel pour tester les notifications.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulateur" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Simulateur</CardTitle></CardHeader>
            <CardContent className="p-4 text-sm text-muted-foreground">Le simulateur est désormais intégré dans l’onglet Règles & Seuils.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}