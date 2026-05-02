import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_COLOR: [number, number, number] = [26, 158, 111];
const DARK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FermeManager Pro", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 21);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.text(dateStr, pageW - 14, 21, { align: "right" });

  doc.setTextColor(...DARK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(subtitle, 14, 42);
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, 45, pageW - 14, 45);
}

function addFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("FermeManager Pro — Rapport généré automatiquement", 14, pageH - 4);
    doc.text(`Page ${i} / ${pages}`, pageW - 14, pageH - 4, { align: "right" });
  }
}

function statBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color?: [number, number, number]) {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(x, y, w, 18, 2, 2, "F");
  doc.setTextColor(...(color ?? BRAND_COLOR));
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + w / 2, y + 9, { align: "center" });
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + w / 2, y + 15, { align: "center" });
}

export function exportBudgetPdf(options: {
  stats: {
    budgetTotal: number;
    depenseTotal: number;
    solde: number;
    parCategorie: Array<{ id: number; nom: string; budget: number | string; depense: number | string; couleur?: string | null; createdAt: string }>;
    depensesMensuelles: Array<{ mois: string; montant: number | string }>;
  };
  depenses: Array<{ id: number; date: string; description: string; montant: number | string; categorieNom?: string | null; createdAt: string }>;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addHeader(doc, "Rapport financier", "Budget & Dépenses");

  // KPI boxes
  const kpis = [
    { label: "Budget total", value: `${fmt(options.stats.budgetTotal)} FCFA`, color: DARK },
    { label: "Total dépensé", value: `${fmt(options.stats.depenseTotal)} FCFA`, color: [220, 38, 38] as [number, number, number] },
    { label: "Solde restant", value: `${fmt(options.stats.solde)} FCFA`, color: options.stats.solde >= 0 ? BRAND_COLOR : ([220, 38, 38] as [number, number, number]) },
  ];
  const boxW = (pageW - 28 - 8) / 3;
  kpis.forEach((k, i) => statBox(doc, 14 + i * (boxW + 4), 50, boxW, k.label, k.value, k.color));

  // Categories table
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Répartition par catégorie", 14, 80);

  autoTable(doc, {
    startY: 83,
    head: [["Catégorie", "Budget (FCFA)", "Dépensé (FCFA)", "Solde (FCFA)", "Utilisation"]],
    body: options.stats.parCategorie.map(c => [
      c.nom,
      fmt(Number(c.budget)),
      fmt(Number(c.depense)),
      fmt(Number(c.budget) - Number(c.depense)),
      `${Math.min((Number(c.depense) / Number(c.budget)) * 100, 100).toFixed(1)}%`,
    ]),
    foot: [["TOTAL", fmt(options.stats.budgetTotal), fmt(options.stats.depenseTotal), fmt(options.stats.solde), `${((options.stats.depenseTotal / options.stats.budgetTotal) * 100).toFixed(1)}%`]],
    headStyles: { fillColor: BRAND_COLOR, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    footStyles: { fillColor: DARK, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "center" } },
    margin: { left: 14, right: 14 },
    showFoot: "lastPage",
  });

  // Monthly expenses
  if (options.stats.depensesMensuelles.length > 0) {
    const afterCat = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dépenses mensuelles", 14, afterCat);
    autoTable(doc, {
      startY: afterCat + 3,
      head: [["Mois", "Montant (FCFA)"]],
      body: options.stats.depensesMensuelles.map(m => [m.mois, fmt(Number(m.montant))]),
      headStyles: { fillColor: BRAND_COLOR, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
      tableWidth: 90,
    });
  }

  // Latest expenses detail
  if (options.depenses.length > 0) {
    const afterMois = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des dépenses récentes", 14, afterMois);
    autoTable(doc, {
      startY: afterMois + 3,
      head: [["Date", "Catégorie", "Description", "Montant (FCFA)"]],
      body: options.depenses.slice(0, 50).map(d => [d.date, d.categorieNom ?? "—", d.description, fmt(Number(d.montant))]),
      headStyles: { fillColor: BRAND_COLOR, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 3: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(`FermeManager_Budget_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSantePdf(options: {
  stats: { malades: number; vaccinsAFaire: number; enQuarantaine: number; decesMois: number };
  vaccins: Array<{ id: number; tag: string; vaccin: string; date: string; dose?: string | null; rappel?: string | null; administrePar?: string | null; createdAt: string }>;
  traitements: Array<{ id: number; tag: string; typeTraitement: string; produit: string; dose?: string | null; dateDebut: string; dateFin?: string | null; statut: string; createdAt: string }>;
  quarantaine: Array<{ id: number; tag: string; motif: string; dateDebut: string; dureeJours?: number | null; statut: string; createdAt: string }>;
  mortalite: Array<{ id: number; tag: string; date: string; cause: string; confirme_par?: string | null; observations?: string | null; createdAt: string }>;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addHeader(doc, "Rapport sanitaire", "Santé du Troupeau");

  // KPI boxes
  const kpis = [
    { label: "Animaux malades", value: String(options.stats.malades), color: [220, 38, 38] as [number, number, number] },
    { label: "Vaccins à faire", value: String(options.stats.vaccinsAFaire), color: [245, 158, 11] as [number, number, number] },
    { label: "En quarantaine", value: String(options.stats.enQuarantaine), color: [59, 130, 246] as [number, number, number] },
    { label: "Décès ce mois", value: String(options.stats.decesMois), color: DARK },
  ];
  const boxW = (pageW - 28 - 12) / 4;
  kpis.forEach((k, i) => statBox(doc, 14 + i * (boxW + 4), 50, boxW, k.label, k.value, k.color));

  // Vaccinations
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Vaccinations (${options.vaccins.length})`, 14, 80);
  autoTable(doc, {
    startY: 83,
    head: [["Tag", "Vaccin", "Date", "Dose", "Rappel", "Administré par"]],
    body: options.vaccins.map(v => [v.tag, v.vaccin, v.date, v.dose ?? "—", v.rappel ?? "—", v.administrePar ?? "—"]),
    headStyles: { fillColor: BRAND_COLOR, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });

  // Traitements
  const afterV = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Traitements en cours (${options.traitements.length})`, 14, afterV);
  autoTable(doc, {
    startY: afterV + 3,
    head: [["Tag", "Type", "Produit", "Dose", "Début", "Fin", "Statut"]],
    body: options.traitements.map(t => [t.tag, t.typeTraitement, t.produit, t.dose ?? "—", t.dateDebut, t.dateFin ?? "—", t.statut]),
    headStyles: { fillColor: [245, 158, 11] as [number, number, number], textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });

  // Quarantaine
  if (options.quarantaine.length > 0) {
    const afterT = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Quarantaine (${options.quarantaine.length})`, 14, afterT);
    autoTable(doc, {
      startY: afterT + 3,
      head: [["Tag", "Motif", "Début", "Durée (j)", "Statut"]],
      body: options.quarantaine.map(q => [q.tag, q.motif, q.dateDebut, String(q.dureeJours ?? "—"), q.statut]),
      headStyles: { fillColor: [59, 130, 246] as [number, number, number], textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
  }

  // Mortalité
  if (options.mortalite.length > 0) {
    const afterQ = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Mortalité (${options.mortalite.length})`, 14, afterQ);
    autoTable(doc, {
      startY: afterQ + 3,
      head: [["Tag", "Date", "Cause", "Confirmé par", "Observations"]],
      body: options.mortalite.map(m => [m.tag, m.date, m.cause, m.confirme_par ?? "—", m.observations ?? "—"]),
      headStyles: { fillColor: DARK as [number, number, number], textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(`FermeManager_Sante_${new Date().toISOString().slice(0, 10)}.pdf`);
}
