export const CUSTOMER_CHANNELS = ["Website", "B2B", "Amazon", "TikTok", "Etsy", "Walmart", "Temu"] as const;
export type CustomerChannel = (typeof CUSTOMER_CHANNELS)[number];

export type CustomerRecord = {
	_id: string;
	activeChannels: CustomerChannel[];
	createdAt: number;
	createdBy: string;
	currencyCode: string;
	name: string;
	slug: string;
	status: "active" | "inactive";
	updatedAt: number;
	updatedBy: string;
};

export type CustomerMembershipRecord = {
	_id: string;
	authUserId: string;
	customerId: string;
	role: "platform_admin" | "customer_viewer";
	userEmail: string;
	userName?: string | null;
};

export function parseChannelValues(formData: FormData, fieldName = "activeChannels") {
	return CUSTOMER_CHANNELS.filter((channel) => formData.getAll(fieldName).includes(channel));
}

export function slugifyCustomerName(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export function toRequiredString(value: FormDataEntryValue | null, fieldName: string) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} is required`);
	}

	return value.trim();
}
