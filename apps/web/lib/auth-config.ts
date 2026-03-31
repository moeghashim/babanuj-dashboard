import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { authDb } from "./auth-db";
import * as authGeneratedSchema from "./auth-generated-schema";

export const betterAuthBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? "babanuj-dashboard-dev-secret-change-me";

export const auth = betterAuth({
	baseURL: betterAuthBaseUrl,
	database: drizzleAdapter(authDb, {
		provider: "sqlite",
		schema: authGeneratedSchema,
	}),
	emailAndPassword: {
		autoSignIn: true,
		enabled: true,
		minPasswordLength: 8,
	},
	plugins: [
		nextCookies(),
		jwt({
			jwks: {
				keyPairConfig: {
					alg: "ES256",
				},
			},
			jwt: {
				audience: betterAuthBaseUrl,
				expirationTime: "15m",
				issuer: betterAuthBaseUrl,
			},
		}),
	],
	secret: betterAuthSecret,
});
