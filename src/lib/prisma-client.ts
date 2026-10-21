import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "./database-url.mjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Raw client. App code uses `db` from ./db, which waits for first-run setup. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
