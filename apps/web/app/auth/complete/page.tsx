import { redirect } from "next/navigation";

import { getCurrentAppSession } from "../../../lib/auth";
import { acceptCustomerInvite } from "../../../lib/convex-server";

export const dynamic = "force-dynamic";

type AuthCompletePageProps = {
	searchParams?: Promise<{ invite?: string }>;
};

export default async function AuthCompletePage({ searchParams }: AuthCompletePageProps) {
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const inviteToken = typeof resolvedSearchParams?.invite === "string" ? resolvedSearchParams.invite : undefined;
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	if (inviteToken) {
		try {
			await acceptCustomerInvite(inviteToken);
			redirect("/auth/complete");
		} catch {
			redirect(`/invite/${inviteToken}?status=error`);
		}
	}

	if (session.isBootstrap) {
		redirect("/admin/customers");
	}

	if (session.isPlatformAdmin) {
		redirect("/admin");
	}

	if (session.appRole === "customer_viewer") {
		if (session.activeCustomerId) {
			redirect("/customer");
		}

		redirect("/select-org");
	}

	redirect("/unauthorized");
}
