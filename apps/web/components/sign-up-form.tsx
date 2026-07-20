"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "../lib/auth-client";

type SignUpFormProps = {
	defaultEmail?: string;
	inviteToken?: string;
};

export function SignUpForm({ defaultEmail, inviteToken }: SignUpFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const callbackURL = inviteToken ? `/auth/complete?invite=${inviteToken}` : "/auth/complete";

	return (
		<form
			className="shell-form"
			onSubmit={(event) => {
				event.preventDefault();
				const formData = new FormData(event.currentTarget);
				const name = formData.get("name");
				const email = formData.get("email");
				const password = formData.get("password");

				if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
					setErrorMessage("Name, email, and password are required.");
					return;
				}

				startTransition(async () => {
					setErrorMessage(null);

					const result = await authClient.signUp.email({
						callbackURL,
						email,
						name,
						password,
					});

					if (result.error) {
						setErrorMessage(result.error.message ?? "Unable to create your account.");
						return;
					}

					router.push(callbackURL);
					router.refresh();
				});
			}}
		>
			<label className="field">
				<span className="field-label">Name</span>
				<input autoComplete="name" className="shell-input" name="name" required type="text" />
			</label>
			<label className="field">
				<span className="field-label">Email</span>
				<input
					autoComplete="email"
					className="shell-input"
					defaultValue={defaultEmail}
					name="email"
					required
					type="email"
				/>
			</label>
			<label className="field">
				<span className="field-label">Password</span>
				<input
					autoComplete="new-password"
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
					{isPending ? "Creating account..." : "Create account"}
				</Button>
				<Link
					className="shell-nav-link"
					href={
						inviteToken
							? `/sign-in?invite=${inviteToken}&email=${encodeURIComponent(defaultEmail ?? "")}`
							: "/sign-in"
					}
				>
					Already have access?
				</Link>
			</div>
		</form>
	);
}
