import { redirect } from "next/navigation";

import { getCurrentAppSession } from "../../../lib/auth";

export default async function AuthCompletePage() {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
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
