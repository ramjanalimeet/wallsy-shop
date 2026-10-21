import "server-only";
import { cache } from "react";
import { databaseUrl } from "./database-url.mjs";
import { prisma as db } from "./prisma-client";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema-sql";
import { loadStarterData } from "./starter-data";

// Records which schema version the database was last brought up to.
const META_TABLE = `CREATE TABLE IF NOT EXISTS "_WallsyMeta" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`;

async function recordedVersion() {
  try {
    const rows = await db.$queryRaw<{ value: string }[]>`SELECT "value" FROM "_WallsyMeta" WHERE "key" = 'schema'`;
    return rows[0]?.value ?? null;
  } catch {
    return null; // table doesn't exist yet
  }
}

/**
 * Brings the database up to date: creates or upgrades tables when a new version is
 * deployed and loads the starter catalog into an empty store. A no-op once current.
 */
async function initialize() {
  if ((await recordedVersion()) === SCHEMA_VERSION) return;

  try {
    await db.$executeRawUnsafe(META_TABLE);
  } catch {
    // Another server created it at the same moment.
  }

  await db.$transaction(
    async (tx) => {
      // Serializes setup across servers. Locking a table (unlike an advisory lock) also
      // refreshes Postgres's catalog cache, so tables another server just created are seen.
      await tx.$executeRawUnsafe(`LOCK TABLE "_WallsyMeta" IN EXCLUSIVE MODE`);
      const rows = await tx.$queryRaw<{ value: string }[]>`SELECT "value" FROM "_WallsyMeta" WHERE "key" = 'schema'`;
      if (rows[0]?.value === SCHEMA_VERSION) return;

      for (const statement of SCHEMA_SQL) await tx.$executeRawUnsafe(statement);

      const settings = await tx.setting.findUnique({ where: { id: 1 }, select: { currency: true } });
      const orders = await tx.order.count();
      // An untouched store from the first, dollar-priced release: swap in the Taka catalog.
      const legacyStarter = settings?.currency === "$" && orders === 0;
      if (!settings || legacyStarter) await loadStarterData(tx, { demo: false });

      await tx.$executeRaw`
        INSERT INTO "_WallsyMeta" ("key", "value") VALUES ('schema', ${SCHEMA_VERSION})
        ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`;
    },
    { timeout: 60_000, maxWait: 30_000 }
  );
}

let ready: Promise<void> | null = null;

/** Runs setup once per server instance; retried on the next call if it fails. */
export function ensureDatabase() {
  ready ??= initialize().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export type SetupStatus = { ok: true } | { ok: false; reason: "no-database" | "unreachable" };

/** Checks the database once per server instance (and once per request via React cache). */
export const getSetupStatus = cache(async (): Promise<SetupStatus> => {
  if (!databaseUrl()) return { ok: false, reason: "no-database" };
  try {
    await ensureDatabase();
    return { ok: true };
  } catch (e) {
    console.error("Database setup failed:", e);
    return { ok: false, reason: "unreachable" };
  }
});
