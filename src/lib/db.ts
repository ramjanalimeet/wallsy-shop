import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "./database-url.mjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
