/**
 * Shared Prisma client singleton.
 *
 * Every data-access file imports `db` from here. Constructing the
 * PrismaClient is expensive (opens a connection pool), so we create
 * exactly one instance per Node process.
 *
 * Next.js's hot-reload complicates this: in dev, saving a file causes
 * modules to re-evaluate, which would create a new client every time
 * and exhaust the connection pool within minutes. The `globalThis`
 * dance below stashes the client on the global object so it survives
 * reloads.
 */

import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

//console.log("[db.ts] DB_PASSWORD:", process.env.DB_PASSWORD ? "SET" : "MISSING");
//console.log("[db.ts] NODE_ENV:", process.env.NODE_ENV);

function createClient(): PrismaClient {
  // Parse DATABASE_URL so we don't duplicate connection info.
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1), // strip leading "/"
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
