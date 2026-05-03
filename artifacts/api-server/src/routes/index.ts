import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import animauxRouter from "./animaux";
import santeRouter from "./sante";
import reproductionRouter from "./reproduction";
import alimentationRouter from "./alimentation";
import logesRouter from "./loges";
import maintenanceRouter from "./maintenance";
import employesRouter from "./employes";
import veterinaireRouter from "./veterinaire";
import fournisseursRouter from "./fournisseurs";
import budgetRouter from "./budget";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(animauxRouter);
router.use(santeRouter);
router.use(reproductionRouter);
router.use(alimentationRouter);
router.use(logesRouter);
router.use(maintenanceRouter);
router.use(employesRouter);
router.use(veterinaireRouter);
router.use(fournisseursRouter);
router.use(budgetRouter);

router.post("/auth/reset-email", async (req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const { email, code } = req.body ?? {};

  if (typeof email !== "string" || typeof code !== "string") {
    res.status(400).json({ ok: false, error: "invalid-payload" });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ ok: false, error: "missing-resend-key" });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FermeManager Pro <onboarding@resend.dev>",
      to: [email],
      subject: "Votre code de réinitialisation",
      html: `<p>Votre code de réinitialisation est <strong>${code}</strong>.</p><p>Il expire dans 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    res.status(500).json({ ok: false, error: "resend-failed", detail: text });
    return;
  }

  res.json({ ok: true });
});

export default router;
