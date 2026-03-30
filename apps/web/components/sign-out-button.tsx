"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "../lib/auth-client";

export function SignOutButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			isDisabled={isPending}
			variant="ghost"
			onPress={() => {
				startTransition(async () => {
					await authClient.signOut();
					router.push("/");
					router.refresh();
				});
			}}
		>
			{isPending ? "Signing out..." : "Sign out"}
		</Button>
	);
}
