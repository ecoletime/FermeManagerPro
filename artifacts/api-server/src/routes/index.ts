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

export default router;
