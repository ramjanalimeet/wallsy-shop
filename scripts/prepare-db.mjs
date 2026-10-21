// Runs before `next build`: creates/updates the database tables and, on a brand-new
// database, loads the starter catalog so the store isn't empty on first deploy.
import { execSync } from "node:child_process";

// Local builds read .env; on Vercel the variables are already in the environment.
try {
  process.loadEnvFile(".env");
} catch {}

if (!process.env.DATABASE_URL) {
  console.error(
    "\n✖ DATABASE_URL is not set.\n" +
      "  Add a Postgres database (Vercel → your project → Storage → Neon), make sure it is\n" +
      "  connected to this project, then redeploy.\n"
  );
  process.exit(1);
}

// Schema changes need a direct (non-pooled) connection when the host provides one.
const direct = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const run = (cmd, env = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

run("npx prisma db push --skip-generate", { DATABASE_URL: direct });
run("npx tsx prisma/seed.ts --if-empty", { DATABASE_URL: direct });
