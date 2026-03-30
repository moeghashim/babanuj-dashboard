"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "../../../../lib/auth";
import { createCustomer, updateCustomer, upsertMembership } from "../../../../lib/convex-server";
import { parseChannelValues, slugifyCustomerName, toRequiredString } from "../../../../lib/customers";

export async function createCustomerAction(formData: FormData) {
	await requirePlatformAdmin();

	const name = toRequiredString(formData.get("name"), "Customer name");
	const slugInput = formData.get("slug");
	const slug =
		typeof slugInput === "string" && slugInput.trim().length > 0 ? slugInput.trim() : slugifyCustomerName(name);

	const customerId = await createCustomer({
		activeChannels: parseChannelValues(formData),
		clerkOrganizationId: toRequiredString(formData.get("clerkOrganizationId"), "Clerk organization ID"),
		currencyCode: toRequiredString(formData.get("currencyCode"), "Currency code").toUpperCase(),
		name,
		slug,
	});

	revalidatePath("/admin/customers");
	redirect(`/admin/customers/${customerId}`);
}

export async function updateCustomerAction(formData: FormData) {
	await requirePlatformAdmin();

	const customerId = toRequiredString(formData.get("customerId"), "Customer ID");
	const name = toRequiredString(formData.get("name"), "Customer name");
	const slugInput = formData.get("slug");
	const slug =
		typeof slugInput === "string" && slugInput.trim().length > 0 ? slugInput.trim() : slugifyCustomerName(name);

	await updateCustomer({
		activeChannels: parseChannelValues(formData),
		clerkOrganizationId: toRequiredString(formData.get("clerkOrganizationId"), "Clerk organization ID"),
		currencyCode: toRequiredString(formData.get("currencyCode"), "Currency code").toUpperCase(),
		customerId,
		name,
		slug,
		status: toRequiredString(formData.get("status"), "Status") as "active" | "inactive",
	});

	revalidatePath("/admin/customers");
	revalidatePath(`/admin/customers/${customerId}`);
}

export async function upsertMembershipAction(formData: FormData) {
	await requirePlatformAdmin();

	const customerId = toRequiredString(formData.get("customerId"), "Customer ID");
	await upsertMembership({
		clerkOrganizationId: toRequiredString(formData.get("clerkOrganizationId"), "Clerk organization ID"),
		clerkUserId: toRequiredString(formData.get("clerkUserId"), "Clerk user ID"),
		customerId,
		role: toRequiredString(formData.get("role"), "Role") as "platform_admin" | "customer_viewer",
	});

	revalidatePath(`/admin/customers/${customerId}`);
}
