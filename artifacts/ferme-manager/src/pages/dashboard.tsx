import { 
  useGetDashboardSummary, 
  useGetDashboardAlertes, 
  useGetDashboardActiviteRecente,
  getGetDashboardSummaryQueryKey,
  getGetDashboardAlertesQueryKey,
  getGetDashboardActiviteRecenteQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PiggyBank, 
  HeartPulse, 
  Users, 
  Wrench, 
  Baby, 
  Home as HomeIcon,
  AlertTriangle,
  Info,
  CheckCircle,
  Activity,
  Wheat,
  Truck,
} from "lucide-react";
import { Link } from "wouter";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { role } = useAuth();
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: alertes, isLoading: loadingAlertes } = useGetDashboardAlertes({
    query: { queryKey: getGetDashboardAlertesQueryKey() }
  });

  const { data: activite, isLoading: loadingActivite } = useGetDashboardActiviteRecente({
    query: { queryKey: getGetDashboardActiviteRecenteQueryKey() }
  });

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'urgente': return <AlertTriangle className="text-destructive h-5 w-5" />;
      case 'attention': return <AlertTriangle className="text-amber-500 h-5 w-5" />;
      case 'ok': return <CheckCircle className="text-green-500 h-5 w-5" />;
      default: return <Info className="text-blue-500 h-5 w-5" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch(type) {
      case 'urgente': return "bg-destructive/10 border-destructive/20";
      case 'attention': return "bg-amber-500/10 border-amber-500/20";
      case 'ok': return "bg-green-500/10 border-green-500/20";
      default: return "bg-blue-500/10 border-blue-500/20";
    }
  };

  // Mock data for charts since it's not directly in summary
  const troupeauData = [
    { name: 'Truies', value: 45 },
    { name: 'Verrats', value: 5 },
    { name: 'Porcelets', value: 120 },
    { name: 'Engraissement', value: 80 },
  ];
  
  const COLORS = ['#1A9E6F', '#eab308', '#3b82f6', '#ef4444'];

  const depensesData = [
    { name: 'Jan', alimentation: 400000, veterinaire: 150000, maintenance: 50000 },
    { name: 'Fév', alimentation: 450000, veterinaire: 80000, maintenance: 120000 },
    { name: 'Mar', alimentation: 420000, veterinaire: 100000, maintenance: 30000 },
    { name: 'Avr', alimentation: 480000, veterinaire: 50000, maintenance: 200000 },
  ];

  const shortcuts = [
    { href: "/animaux", label: "Animaux", icon: PiggyBank },
    { href: "/sante", label: "Santé & Vaccins", icon: HeartPulse },
    { href: "/reproduction", label: "Reproduction", icon: Baby },
    { href: "/alimentation", label: "Alimentation", icon: Wheat },
    { href: "/loges", label: "Loges & Bâtiments", icon: HomeIcon },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/employes", label: "Employés", icon: Users },
    { href: "/fournisseurs", label: "Fournisseurs", icon: Truck },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex h-full min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-muted/50">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="leading-tight">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard 
          title="Total Animaux" 
          value={summary?.totalAnimaux} 
          icon={PiggyBank} 
          loading={loadingSummary} 
          color="text-blue-500" 
          bg="bg-blue-500/10" 
        />
        <KpiCard 
          title="Animaux Malades" 
          value={summary?.animauxMalades} 
          icon={HeartPulse} 
          loading={loadingSummary} 
          color="text-destructive" 
          bg="bg-destructive/10" 
        />
        <KpiCard 
          title="Naissances (Mois)" 
          value={summary?.naissancesMois} 
          icon={Baby} 
          loading={loadingSummary} 
          color="text-green-500" 
          bg="bg-green-500/10" 
        />
        <KpiCard 
          title="Taux Occupation" 
          value={summary?.tauxOccupation ? `${summary.tauxOccupation}%` : undefined} 
          icon={HomeIcon} 
          loading={loadingSummary} 
          color="text-amber-500" 
          bg="bg-amber-500/10" 
        />
        <KpiCard 
          title="Maintenances Actives" 
          value={summary?.maintenancesActives} 
          icon={Wrench} 
          loading={loadingSummary} 
          color="text-purple-500" 
          bg="bg-purple-500/10" 
        />
        <KpiCard 
          title="Employés Présents" 
          value={summary?.employesPresents} 
          icon={Users} 
          loading={loadingSummary} 
          color="text-indigo-500" 
          bg="bg-indigo-500/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart: Troupeau */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Répartition du Troupeau</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={troupeauData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {troupeauData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} têtes`, '']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart: Expenses (Admin Only) */}
            {role === 'admin' ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Dépenses Mensuelles (FCFA)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depensesData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${valueToK(val)}k`} />
                      <Tooltip 
                        formatter={(value) => [`${value.toLocaleString('fr-FR')} FCFA`, '']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="alimentation" name="Alimentation" stackId="a" fill="#1A9E6F" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="veterinaire" name="Vétérinaire" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Activity className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Espace Opérationnel</h3>
                  <p className="text-sm text-muted-foreground">Consultez les alertes et l'activité pour organiser votre journée de travail.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activité Récente */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Activité Récente</CardTitle>
              <CardDescription>Les dernières actions enregistrées sur la ferme</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivite ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activite && activite.length > 0 ? (
                <div className="space-y-6">
                  {activite.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {/* Very simple icon mapping, ideally use the string to map to lucide icons */}
                        <Activity size={18} className="text-muted-foreground" />
                      </div>
                      <div className="flex flex-col flex-1 gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.message}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {item.badge && (
                          <div>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                              {item.badge}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune activité récente.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Alerts */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center justify-between text-lg">
                Alertes du jour
                {alertes && alertes.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{alertes.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {loadingAlertes ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
                  </div>
                ) : alertes && alertes.length > 0 ? (
                  alertes.map((alerte) => (
                    <div 
                      key={alerte.id} 
                      className={`p-4 border-b last:border-0 flex items-start gap-3 transition-colors hover:bg-muted/50 ${getAlertBg(alerte.type)} border-l-4`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getAlertIcon(alerte.type)}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between w-full">
                          <Badge variant="outline" className="bg-background text-[10px] py-0 h-4 capitalize">
                            {alerte.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {new Date(alerte.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-snug">{alerte.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <CheckCircle className="h-12 w-12 text-green-500/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Aucune alerte pour le moment</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Tout fonctionne normalement.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, loading, color, bg }: any) {
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-muted-foreground line-clamp-1">{title}</p>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <div className="mt-1">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground">
              {value !== undefined && value !== null ? value : '-'}
            </h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function valueToK(value: number) {
  return value >= 1000 ? Math.round(value / 1000) : value;
}
