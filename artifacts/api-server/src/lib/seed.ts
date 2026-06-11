import { db, usersTable, systemSettingsTable } from "@workspace/db";
import { logger } from "./logger";

const ALL_MODULES = [
  "animaux", "sante", "reproduction", "alimentation", "loges", "maintenance",
  "employes", "fournisseurs", "veterinaire", "budget", "notifications",
  "utilisateurs", "systeme",
];

export async function seedDefaults(): Promise<void> {
  try {
    const existingUsers = await db.select().from(usersTable).limit(1);
    if (existingUsers.length === 0) {
      await db.insert(usersTable).values([
        {
          username: "admin",
          nom: "Administrateur",
          prenom: "Compte",
          email: "admin@ferme.com",
          role: "admin",
          modules: ALL_MODULES,
          actif: true,
          password: "admin123",
        },
        {
          username: "employe",
          nom: "Employé",
          prenom: "Compte",
          email: "employe@ferme.com",
          role: "employee",
          modules: ["animaux", "alimentation", "sante"],
          actif: true,
          password: "emp123",
        },
      ]);
      logger.info("Seeded default users (admin, employe)");
    }

    const existingSettings = await db.select().from(systemSettingsTable).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(systemSettingsTable).values({});
      logger.info("Seeded default system settings");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed defaults");
  }
}
