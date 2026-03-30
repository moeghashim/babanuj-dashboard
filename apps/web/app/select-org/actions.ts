"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACTIVE_CUSTOMER_COOKIE, getCurrentAppSession } from "../../lib/auth";

export async function setActiveCustomerAction(formData: FormData) {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	const customerId = formData.get("customerId");
	if (typeof customerId !== "string" || !session.accessibleCustomerIds.includes(customerId)) {
		throw new Error("Select a valid customer workspace.");
	}

	const cookieStore = await cookies();
	cookieStore.set(ACTIVE_CUSTOMER_COOKIE, customerId, {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
	});

	redirect("/customer");
}
