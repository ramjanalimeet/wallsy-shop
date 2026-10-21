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

/** Connection string for the running app (pooled when available). */
export function databaseUrl(env = process.env) {
  return find(POOLED, env);
}

/** Connection string for schema changes (direct when available). */
export function directDatabaseUrl(env = process.env) {
  return find(DIRECT, env) ?? find(POOLED, env);
}
