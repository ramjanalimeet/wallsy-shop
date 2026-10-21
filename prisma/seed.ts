// Resets the database to the demo store, including sample reviews and orders.
// Never run this against a live store: it deletes all products, orders and settings.
import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "../src/lib/database-url.mjs";
import { SCHEMA_SQL } from "../src/lib/schema-sql";
import { loadStarterData } from "../src/lib/starter-data";

try {
  process.loadEnvFile(".env");
} catch {}

const db = new PrismaClient({ datasourceUrl: databaseUrl() });

async function main() {
  const [{ exists }] = await db.$queryRaw<{ exists: boolean }[]>`SELECT to_regclass('public."Setting"') IS NOT NULL AS exists`;
  if (!exists) for (const statement of SCHEMA_SQL) await db.$executeRawUnsafe(statement);
  await loadStarterData(db, { demo: true });
  console.log("Loaded the demo store with sample reviews and orders.");
}

main().finally(() => db.$disconnect());
