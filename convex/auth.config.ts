import type { AuthConfig } from "convex/server";

export default {
	providers: [
		{
			algorithm: "ES256",
			applicationID: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
			issuer: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
			jwks: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/jwks`,
			type: "customJwt",
		},
	],
} satisfies AuthConfig;
