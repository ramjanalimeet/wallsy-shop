import { prisma } from "./prisma-client";
import { ensureDatabase } from "./setup";

// Every query waits until the tables exist, so pages that render alongside the layout
// on a brand-new database don't run before setup has finished.
export const db = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await ensureDatabase();
        return query(args);
      },
    },
  },
});
