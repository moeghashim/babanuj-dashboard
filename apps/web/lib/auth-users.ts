import "server-only";

import { eq } from "drizzle-orm";

import { authDb } from "./auth-db";
import { authUsers } from "./auth-schema";

export type AuthUserRecord = {
	email: string;
	id: string;
	name: string;
};

export async function getAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
	const normalizedEmail = email.trim().toLowerCase();
	const [user] = await authDb
		.select({
			email: authUsers.email,
			id: authUsers.id,
			name: authUsers.name,
		})
		.from(authUsers)
		.where(eq(authUsers.email, normalizedEmail))
		.limit(1);

	return user ?? null;
}
