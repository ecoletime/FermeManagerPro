import { useState, useMemo } from "react";
import { useGetJournalAudit, getGetJournalAuditQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCw, ScrollText, Search, Download, X, CalendarRange } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PATCH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const MODULES = [
  "Animaux",
  "Santé",
  "Reproduction",
  "Alimentation",
  "Loges & Bâtiments",
  "Maintenance",
  "Employés",
  "Vétérinaire",
  "Fournisseurs",
  "Budget",
  "Notifications",
  "Système",
];

export default function JournalAudit() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const { data: entries = [], isLoading, refetch, isFetching } = useGetJournalAudit(
    { limit: 500 },
    { query: { queryKey: getGetJournalAuditQueryKey({ limit: 500 }), refetchInterval: 30000 } }
  );

  const filtered = useMemo(() => {
    const debut = dateDebut ? new Date(dateDebut + "T00:00:00") : null;
    const fin = dateFin ? new Date(dateFin + "T23:59:59") : null;

    return entries.filter((entry) => {
      if (moduleFilter !== "all" && entry.module !== moduleFilter) return false;

      if (debut || fin) {
        const ts = new Date(entry.timestamp);
        if (debut && ts < debut) return false;
        if (fin && ts > fin) return false;
      }

      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          entry.utilisateur.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.module.toLowerCase().includes(q) ||
          entry.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, moduleFilter, searchText, dateDebut, dateFin]);

  const uniqueUsers = useMemo(() => {
    const set = new Set(entries.map((e) => e.utilisateur));
    return Array.from(set).sort();
  }, [entries]);

  const hasActiveFilters = moduleFilter !== "all" || searchText !== "" || dateDebut !== "" || dateFin !== "";

  function resetFilters() {
    setModuleFilter("all");
    setSearchText("");
    setDateDebut("");
    setDateFin("");
  }

  function exportCsv() {
    const headers = ["Date", "Heure", "Utilisateur", "Role", "Module", "Action", "Description", "Methode", "Chemin", "Statut"];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map((e) => {
      const d = new Date(e.timestamp);
      return [
        escape(d.toLocaleDateString("fr-FR")),
        escape(d.toLocaleTimeString("fr-FR")),
        escape(e.utilisateur),
        escape(e.role),
        escape(e.module),
        escape(e.action),
        escape(e.description),
        escape(e.methode),
        escape(e.chemin),
        escape(e.statut),
      ].join(";");
    });
    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `journal-audit-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText size={22} className="text-primary" />
            Journal d'audit
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Toutes les actions enregistrées — visible uniquement par l'administrateur
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={15} className="mr-2" />
            Exporter CSV{filtered.length > 0 ? ` (${filtered.length})` : ""}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={15} className={isFetching ? "animate-spin mr-2" : "mr-2"} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative flex-1 min-w-[220px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Recherche</Label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Utilisateur, action, description..."
                  className="pl-9"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Module</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {MODULES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarRange size={12} />
                  Du
                </Label>
                <Input
                  type="date"
                  className="w-[155px]"
                  value={dateDebut}
                  max={dateFin || undefined}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Au</Label>
                <Input
                  type="date"
                  className="w-[155px]"
                  value={dateFin}
                  min={dateDebut || undefined}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground self-end">
                <X size={14} className="mr-1.5" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total entrées</p>
            <p className="text-2xl font-bold mt-1">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Entrées filtrées</p>
            <p className="text-2xl font-bold mt-1">
              {filtered.length}
              {hasActiveFilters && filtered.length !== entries.length && (
                <span className="text-sm font-normal text-muted-foreground ml-2">/ {entries.length}</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Utilisateurs actifs</p>
            <p className="text-2xl font-bold mt-1">{uniqueUsers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Historique des actions ({filtered.length})</span>
            {(dateDebut || dateFin) && (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <CalendarRange size={13} />
                {dateDebut && <span>Du {new Date(dateDebut).toLocaleDateString("fr-FR")}</span>}
                {dateFin && <span>au {new Date(dateFin).toLocaleDateString("fr-FR")}</span>}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>Aucune entrée trouvée</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={resetFilters} className="mt-2 text-primary">
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date / Heure</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Module</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Méthode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {new Date(entry.timestamp).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                        <br />
                        {new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${entry.role === "admin" ? "bg-amber-500" : "bg-blue-500"}`}>
                            {entry.role === "admin" ? "A" : "E"}
                          </div>
                          <span className="font-medium">{entry.utilisateur}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs font-normal">{entry.module}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{entry.action}</td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[280px] truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${METHOD_COLORS[entry.methode] ?? "bg-muted text-muted-foreground"}`}>
                          {entry.methode}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-xs ${entry.statut >= 200 && entry.statut < 300 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                          {entry.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
