"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "../lib/auth-client";

export function SignInForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	return (
		<form
			className="shell-form"
			onSubmit={(event) => {
				event.preventDefault();
				const formData = new FormData(event.currentTarget);
				const email = formData.get("email");
				const password = formData.get("password");

				if (typeof email !== "string" || typeof password !== "string") {
					setErrorMessage("Email and password are required.");
					return;
				}

				startTransition(async () => {
					setErrorMessage(null);

					const result = await authClient.signIn.email({
						callbackURL: "/auth/complete",
						email,
						password,
					});

					if (result.error) {
						setErrorMessage(result.error.message ?? "Unable to sign in.");
						return;
					}

					router.push("/auth/complete");
					router.refresh();
				});
			}}
		>
			<label className="field">
				<span className="field-label">Email</span>
				<input autoComplete="email" className="shell-input" name="email" required type="email" />
			</label>
			<label className="field">
				<span className="field-label">Password</span>
				<input
					autoComplete="current-password"
					className="shell-input"
					minLength={8}
					name="password"
					required
					type="password"
				/>
			</label>
			{errorMessage ? <p className="inline-note">{errorMessage}</p> : null}
			<div className="hero-actions">
				<Button isDisabled={isPending} type="submit" variant="primary">
					{isPending ? "Signing in..." : "Sign in"}
				</Button>
				<Link className="shell-nav-link" href="/sign-up">
					Create account
				</Link>
			</div>
		</form>
	);
}
