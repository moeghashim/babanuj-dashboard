import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, "..");
const authDataDir = join(appDir, ".data");
const defaultDatabasePath = join(authDataDir, "better-auth.db");

mkdirSync(authDataDir, { recursive: true });

export const authDatabaseUrl = process.env.AUTH_DB_URL ?? `file:${defaultDatabasePath}`;

const authClient = createClient({
	url: authDatabaseUrl,
});

export const authDb = drizzle(authClient);
