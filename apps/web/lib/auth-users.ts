import "server-only";

import { makeFunctionReference } from "convex/server";

import { fetchAuthQuery } from "./auth-server";

export type AuthUserRecord = {
	email: string;
	id: string;
	name: string;
};

const getAuthUserByEmailRef = makeFunctionReference<"query", { email: string }, AuthUserRecord | null>(
	"auth:getAuthUserByEmail",
);

export async function getAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
	return fetchAuthQuery(getAuthUserByEmailRef, {
		email: email.trim().toLowerCase(),
	});
}
