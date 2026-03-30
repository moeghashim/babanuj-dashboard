import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Config } from "drizzle-kit";

const appDir = dirname(fileURLToPath(import.meta.url));
const defaultAuthDbUrl = `file:${join(appDir, ".data", "better-auth.db")}`;

export default {
	dbCredentials: {
		url: process.env.AUTH_DB_URL ?? defaultAuthDbUrl,
	},
	dialect: "sqlite",
	out: "./drizzle",
	schema: "./lib/auth-generated-schema.ts",
} satisfies Config;
