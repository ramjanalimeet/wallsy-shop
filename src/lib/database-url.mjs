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
 * On serverless hosts many copies of the app can run at once, and each Prisma client
 * opens several connections by default. Databases like Prisma Postgres allow only a
 * handful of direct connections, so give each copy a single connection there.
 * An explicit connection_limit in the URL always wins.
 */
function limitConnections(url, env) {
  if (!url || !env.VERCEL || !/^postgres(ql)?:\/\//.test(url) || /[?&]connection_limit=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1&pool_timeout=20`;
}

/** Connection string for the running app (pooled when available). */
export function databaseUrl(env = process.env) {
  return limitConnections(find(POOLED, env), env);
}

/** Connection string for schema changes (direct when available). */
export function directDatabaseUrl(env = process.env) {
  return find(DIRECT, env) ?? find(POOLED, env);
}
