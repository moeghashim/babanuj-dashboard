import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Config } from "drizzle-kit";

const appDir = dirname(fileURLToPath(import.meta.url));
const defaultAuthDbUrl = `file:${join(appDir, ".data", "better-auth.db")}`;
const authDbUrl = process.env.AUTH_DB_URL ?? defaultAuthDbUrl;
const authDbAuthToken = process.env.AUTH_DB_AUTH_TOKEN;
const isRemoteLibsqlDatabase =
	authDbUrl.startsWith("libsql:") ||
	authDbUrl.startsWith("https:") ||
	authDbUrl.startsWith("http:") ||
	authDbUrl.startsWith("wss:") ||
	authDbUrl.startsWith("ws:");

export default {
	dbCredentials: isRemoteLibsqlDatabase
		? {
				authToken: authDbAuthToken,
				url: authDbUrl,
			}
		: {
				url: authDbUrl,
			},
	dialect: isRemoteLibsqlDatabase ? "turso" : "sqlite",
	out: "./drizzle",
	schema: "./lib/auth-generated-schema.ts",
} satisfies Config;
