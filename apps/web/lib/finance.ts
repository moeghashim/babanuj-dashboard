import type { CustomerRecord } from "./customers";

export const INVOICE_LIFECYCLE_STATUSES = ["draft", "issued"] as const;
export const INVOICE_STATUSES = ["draft", "issued", "partially_paid", "paid", "overdue"] as const;

export type InvoiceLifecycleStatus = (typeof INVOICE_LIFECYCLE_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceRecord = {
	_id: string;
	amount: number;
	createdAt: number;
	createdBy: string;
	currencyCode: string;
	customerId: string;
	dueDate: number;
	invoiceNumber: string;
	issuedDate: number;
	lifecycleStatus: InvoiceLifecycleStatus;
	note?: string;
	updatedAt: number;
	updatedBy: string;
};

export type PaymentRecord = {
	_id: string;
	amount: number;
	createdAt: number;
	createdBy: string;
	currencyCode: string;
	customerId: string;
	invoiceId: string;
	note?: string;
	paymentDate: number;
	reference?: string;
	updatedAt: number;
	updatedBy: string;
};

export type LedgerInvoiceRecord = InvoiceRecord & {
	customerName: string;
	paidAmount: number;
	paymentCount: number;
	status: InvoiceStatus;
	outstandingAmount: number;
};

export type LedgerPaymentRecord = PaymentRecord & {
	customerName: string;
	invoiceNumber: string;
};

export type BalanceSnapshot = {
	currentBalance: number;
	issuedInvoiceCount: number;
	overdueInvoiceCount: number;
	totalInvoiced: number;
	totalOutstanding: number;
	totalPaid: number;
};

export type AdminFinanceOverview = {
	customers: CustomerRecord[];
	invoices: LedgerInvoiceRecord[];
	payments: LedgerPaymentRecord[];
	selectedCustomer: CustomerRecord | null;
	snapshot: BalanceSnapshot;
};

export type CustomerFinanceOverview = {
	customer: CustomerRecord;
	invoices: LedgerInvoiceRecord[];
	payments: LedgerPaymentRecord[];
	snapshot: BalanceSnapshot;
};

export function formatCurrency(value: number, currencyCode = "USD") {
	return new Intl.NumberFormat("en-US", {
		currency: currencyCode,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: "currency",
	}).format(value);
}

export function formatDate(value: number) {
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeZone: "UTC",
	}).format(new Date(value));
}

export function parseCurrencyValue(value: FormDataEntryValue | null, fieldName: string) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} is required`);
	}

	const parsedValue = Number(value);

	if (!Number.isFinite(parsedValue) || parsedValue < 0) {
		throw new Error(`${fieldName} must be a non-negative number`);
	}

	return Number(parsedValue.toFixed(2));
}

export function parseRequiredDateValue(value: FormDataEntryValue | null, fieldName: string) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} is required`);
	}

	const timestamp = Date.parse(`${value}T00:00:00.000Z`);

	if (!Number.isFinite(timestamp)) {
		throw new Error(`${fieldName} must be a valid date`);
	}

	return timestamp;
}

export function parseOptionalString(value: FormDataEntryValue | null) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
