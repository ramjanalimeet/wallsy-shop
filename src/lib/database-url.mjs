// Finds the Postgres connection string under the names hosting providers use.
// Vercel's Storage integrations may add a custom prefix (e.g. STORAGE_DATABASE_URL).

const POOLED = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
const DIRECT = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

function find(names, env) {
  for (const name of names) if (env[name]) return env[name];
  for (const name of names) {
    const key = Object.keys(env).find((k) => k.endsWith(`_${name}`) && env[k]);
    if (key) return env[key];
  }
  return undefined;
}

/**
 * Tunes the connection string for the running app:
 * - Prisma Postgres allows only a few direct connections (db.prisma.io), so app
 *   traffic goes through its PgBouncer pooler (pooled.db.prisma.io) instead.
 * - Behind PgBouncer, Prisma must not use prepared statements (pgbouncer=true).
 * - On serverless hosts many copies run at once, so each gets one connection.
 * Anything already set in the URL wins.
 */
function tune(url, env) {
  if (!url || !/^postgres(ql)?:\/\//.test(url)) return url;
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.hostname === "db.prisma.io") u.hostname = "pooled.db.prisma.io";
  if (/^pooled\.|pooler|pgbouncer/.test(u.hostname) && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
  if (env.VERCEL && !u.searchParams.has("connection_limit")) {
    u.searchParams.set("connection_limit", "1");
    u.searchParams.set("pool_timeout", "20");
  }
  return u.toString();
}

/** Connection string for the running app (pooled when available). */
export function databaseUrl(env = process.env) {
  return tune(find(POOLED, env), env);
}

/** Connection string for schema changes (direct when available). */
export function directDatabaseUrl(env = process.env) {
  return find(DIRECT, env) ?? find(POOLED, env);
}
