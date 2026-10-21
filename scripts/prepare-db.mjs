// Runs before `next build`: creates/updates the database tables and, on a brand-new
// database, loads the starter catalog so the store isn't empty on first deploy.
import { execSync } from "node:child_process";
import { directDatabaseUrl } from "../src/lib/database-url.mjs";

// Local builds read .env; on Vercel the variables are already in the environment.
try {
  process.loadEnvFile(".env");
} catch {}

const url = directDatabaseUrl();
if (!url) {
  const seen = Object.keys(process.env).filter((k) => /DATABASE|POSTGRES/i.test(k));
  console.error(
    "\n✖ No database connection string found (looked for DATABASE_URL, POSTGRES_URL and prefixed versions).\n" +
      "  Add a Postgres database (Vercel → your project → Storage → Neon), connect it to this\n" +
      "  project for the Production environment, then redeploy.\n" +
      (seen.length ? `  Database-related variables present: ${seen.join(", ")}\n` : "  No database-related variables are set for this build.\n")
  );
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });

run("npx prisma db push --skip-generate");
run("npx tsx prisma/seed.ts --if-empty");
