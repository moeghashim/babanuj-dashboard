"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "../../../../lib/auth";
import { upsertChannelMetric } from "../../../../lib/convex-server";
import { toRequiredString } from "../../../../lib/customers";
import { normalizePeriodKey, parseMetricCurrencyValue, parseMetricIntegerValue } from "../../../../lib/performance";

export async function upsertChannelMetricAction(formData: FormData) {
	await requirePlatformAdmin();

	const periodKey = normalizePeriodKey(toRequiredString(formData.get("periodKey"), "Reporting period"));
	const sourceReferenceValue = formData.get("sourceReference");
	const sourceReference =
		typeof sourceReferenceValue === "string" && sourceReferenceValue.trim().length > 0
			? sourceReferenceValue.trim()
			: undefined;

	await upsertChannelMetric({
		channel: toRequiredString(formData.get("channel"), "Channel") as
			| "Website"
			| "B2B"
			| "Amazon"
			| "TikTok"
			| "Etsy"
			| "Walmart"
			| "Temu",
		customerId: toRequiredString(formData.get("customerId"), "Customer"),
		grossRevenue: parseMetricCurrencyValue(formData.get("grossRevenue"), "Gross revenue"),
		orderCount: parseMetricIntegerValue(formData.get("orderCount"), "Order count"),
		periodKey,
		source: toRequiredString(formData.get("source"), "Record source") as "manual" | "integration",
		sourceReference,
	});

	revalidatePath("/admin");
	revalidatePath("/admin/performance");
	revalidatePath("/customer");
	redirect(`/admin/performance?period=${periodKey}`);
}
