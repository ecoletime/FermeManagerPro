import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const notifications = [
  { title: "Naissance — Truie #T-009 — 9 porcelets", desc: "Nouvelle portée née ce matin.", time: "02/05/2026 21:32", severity: "succès", color: "bg-green-100", text: "text-green-900" },
  { title: "Stock faible — Croissance 2 (85 kg)", desc: "Le stock de Croissance 2 est en dessous du seuil d’alerte.", time: "02/05/2026 20:11", severity: "alerte", color: "bg-amber-100", text: "text-amber-900" },
  { title: "Animal malade — #P-108 — Fièvre 40.8°C", desc: "L’animal #P-108 a été signalé malade.", time: "02/05/2026 19:24", severity: "alerte", color: "bg-yellow-100", text: "text-yellow-900" },
  { title: "Mise bas imminente — Truie #T-022", desc: "La truie #T-022 approche de la mise bas.", time: "02/05/2026 18:46", severity: "alerte", color: "bg-yellow-100", text: "text-yellow-900" },
  { title: "Panne urgente — Fuite eau — Bâtiment B", desc: "Une fuite a été signalée au bâtiment B.", time: "02/05/2026 17:50", severity: "urgence", color: "bg-red-100", text: "text-red-900" },
  { title: "Stock critique — Aliment Maternité (45 kg)", desc: "Le stock a atteint un seuil critique.", time: "02/05/2026 17:20", severity: "critique", color: "bg-pink-100", text: "text-pink-900" },
  { title: "Vaccin en retard — #P-108 — PRRS", desc: "Le vaccin PRRS est en retard de 3 jours.", time: "02/05/2026 16:58", severity: "alerte", color: "bg-yellow-100", text: "text-yellow-900" },
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
          <p className="text-muted-foreground text-sm">sam. 02 mai 2026, 22:04</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />Système actif</span>
          <Button variant="ghost" size="sm">🔔 Notifs</Button>
        </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="7" label="Non lues" />
            <StatCard value="2" label="Critiques" />
            <StatCard value="10" label="Emails envoyés" />
            <StatCard value="2" label="Destinataires actifs" />
          </div>

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

          <Card className="bg-green-50 border-green-100"><CardContent className="p-4 flex items-start justify-between gap-4"><div><div className="font-semibold">Naissance — Truie #T-009 — 9 porcelets</div><div className="text-sm text-muted-foreground">Nouvelle portée née ce matin.</div><div className="text-xs text-muted-foreground mt-2">02/05/2026 21:32</div></div><div className="flex flex-col gap-2 shrink-0"><Button size="sm" className="bg-green-600 hover:bg-green-700">✓ Lu</Button><Button size="sm" variant="outline">Email</Button></div></CardContent></Card>

          {notifications.slice(1).map((n) => (
            <Card key={n.title} className={n.color}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className={`font-semibold ${n.text}`}>{n.title}</div>
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
                      {index % 2 === 0 ? "◔" : "◍"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        <span className="text-muted-foreground font-medium">[FermeManager]</span> {" "}
                        {n.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        À Cora V. &lt;admin@fermamanager.com&gt; — {n.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-green-700">● Envoyé</span>
                    <Button size="sm" variant="outline" className="h-7 px-3">Voir</Button>
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

        <TabsContent value="destinataires" className="mt-4">
          <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Destinataires</CardTitle></CardHeader><CardContent className="p-4 text-sm text-muted-foreground">Destinataires à afficher ici.</CardContent></Card>
        </TabsContent>

        <TabsContent value="regles" className="mt-4">
          <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Règles & seuils</CardTitle></CardHeader><CardContent className="p-4 text-sm text-muted-foreground">Règles et seuils à afficher ici.</CardContent></Card>
        </TabsContent>

        <TabsContent value="simulateur" className="mt-4">
          <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Simulateur</CardTitle></CardHeader><CardContent className="p-4 text-sm text-muted-foreground">Simulateur à afficher ici.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}