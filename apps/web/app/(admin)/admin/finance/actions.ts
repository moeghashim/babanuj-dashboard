"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "../../../../lib/auth";
import { createInvoice, createPayment } from "../../../../lib/convex-server";
import { toRequiredString } from "../../../../lib/customers";
import {
	type InvoiceLifecycleStatus,
	parseCurrencyValue,
	parseOptionalString,
	parseRequiredDateValue,
} from "../../../../lib/finance";

export async function createInvoiceAction(formData: FormData) {
	await requirePlatformAdmin();

	const customerId = toRequiredString(formData.get("customerId"), "Customer");

	await createInvoice({
		amount: parseCurrencyValue(formData.get("amount"), "Invoice amount"),
		customerId,
		dueDate: parseRequiredDateValue(formData.get("dueDate"), "Due date"),
		invoiceNumber: toRequiredString(formData.get("invoiceNumber"), "Invoice number"),
		issuedDate: parseRequiredDateValue(formData.get("issuedDate"), "Issued date"),
		lifecycleStatus: toRequiredString(formData.get("lifecycleStatus"), "Lifecycle state") as InvoiceLifecycleStatus,
		note: parseOptionalString(formData.get("note")),
	});

	revalidatePath("/admin");
	revalidatePath("/admin/finance");
	revalidatePath("/customer");
	redirect(`/admin/finance?customer=${customerId}`);
}

export async function createPaymentAction(formData: FormData) {
	await requirePlatformAdmin();

	await createPayment({
		amount: parseCurrencyValue(formData.get("amount"), "Payment amount"),
		invoiceId: toRequiredString(formData.get("invoiceId"), "Invoice"),
		note: parseOptionalString(formData.get("note")),
		paymentDate: parseRequiredDateValue(formData.get("paymentDate"), "Payment date"),
		reference: parseOptionalString(formData.get("reference")),
	});

	revalidatePath("/admin");
	revalidatePath("/admin/finance");
	revalidatePath("/customer");
}
