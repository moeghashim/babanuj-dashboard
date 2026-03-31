import { closeSync, existsSync, mkdirSync, openSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, "..");
const authDataDir = join(appDir, ".data");
const defaultDatabasePath = process.env.VERCEL ? "/tmp/better-auth.db" : join(authDataDir, "better-auth.db");

mkdirSync(dirname(defaultDatabasePath), { recursive: true });

export const authDatabaseUrl = process.env.AUTH_DB_URL ?? `file:${defaultDatabasePath}`;
const authDatabaseAuthToken = process.env.AUTH_DB_AUTH_TOKEN;

if (process.env.VERCEL && authDatabaseUrl.startsWith("file:")) {
	console.warn(
		"AUTH_DB_URL is using a local file path on Vercel. Configure a persistent remote libsql database for Better Auth in production.",
	);
}

const authClient = createClient({
	authToken: authDatabaseAuthToken,
	url: authDatabaseUrl,
});

const authSchemaStatements = [
	`CREATE TABLE IF NOT EXISTS "user" (
		"id" TEXT PRIMARY KEY NOT NULL,
		"name" TEXT NOT NULL,
		"email" TEXT NOT NULL UNIQUE,
		"email_verified" INTEGER DEFAULT false NOT NULL,
		"image" TEXT,
		"created_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
		"updated_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS "session" (
		"id" TEXT PRIMARY KEY NOT NULL,
		"expires_at" INTEGER NOT NULL,
		"token" TEXT NOT NULL UNIQUE,
		"created_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
		"updated_at" INTEGER NOT NULL,
		"ip_address" TEXT,
		"user_agent" TEXT,
		"user_id" TEXT NOT NULL,
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
	)`,
	`CREATE TABLE IF NOT EXISTS "account" (
		"id" TEXT PRIMARY KEY NOT NULL,
		"account_id" TEXT NOT NULL,
		"provider_id" TEXT NOT NULL,
		"user_id" TEXT NOT NULL,
		"access_token" TEXT,
		"refresh_token" TEXT,
		"id_token" TEXT,
		"access_token_expires_at" INTEGER,
		"refresh_token_expires_at" INTEGER,
		"scope" TEXT,
		"password" TEXT,
		"created_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
		"updated_at" INTEGER NOT NULL,
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
	)`,
	`CREATE TABLE IF NOT EXISTS "verification" (
		"id" TEXT PRIMARY KEY NOT NULL,
		"identifier" TEXT NOT NULL,
		"value" TEXT NOT NULL,
		"expires_at" INTEGER NOT NULL,
		"created_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
		"updated_at" INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS "jwks" (
		"id" TEXT PRIMARY KEY NOT NULL,
		"public_key" TEXT NOT NULL,
		"private_key" TEXT NOT NULL,
		"created_at" INTEGER NOT NULL,
		"expires_at" INTEGER
	)`,
	`CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("user_id")`,
	`CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("user_id")`,
	`CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
];

const lockPollIntervalMs = 100;
const staleLockThresholdMs = 30_000;
const authDatabasePath = authDatabaseUrl.startsWith("file:") ? authDatabaseUrl.slice("file:".length) : null;

function sleep(durationMs: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, durationMs);
	});
}

function clearStaleLock(lockPath: string) {
	if (!existsSync(lockPath)) {
		return;
	}

	const lockAgeMs = Date.now() - statSync(lockPath).mtimeMs;

	if (lockAgeMs > staleLockThresholdMs) {
		unlinkSync(lockPath);
	}
}

async function runMigrationsWithFileLock(lockPath: string) {
	for (;;) {
		try {
			const lockFd = openSync(lockPath, "wx");
			writeFileSync(lockFd, String(process.pid));

			try {
				await authClient.migrate(authSchemaStatements);
				return;
			} finally {
				closeSync(lockFd);

				if (existsSync(lockPath)) {
					unlinkSync(lockPath);
				}
			}
		} catch (error) {
			if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") {
				throw error;
			}

			clearStaleLock(lockPath);
			await sleep(lockPollIntervalMs);
		}
	}
}

if (authDatabasePath) {
	await runMigrationsWithFileLock(`${authDatabasePath}.lock`);
} else {
	await authClient.migrate(authSchemaStatements);
}

export const authDb = drizzle(authClient);
