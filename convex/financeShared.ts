import { ConvexError } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { DataModel, Doc, Id } from "./_generated/dataModel.js";
import { getViewerMemberships } from "./auth";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type CustomerDoc = Doc<"customers">;
export type InvoiceDoc = Doc<"invoices">;
export type PaymentDoc = Doc<"payments">;

export type DerivedInvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue";

export type LedgerInvoiceRecord = InvoiceDoc & {
	customerName: string;
	paidAmount: number;
	paymentCount: number;
	status: DerivedInvoiceStatus;
	outstandingAmount: number;
};

export type LedgerPaymentRecord = PaymentDoc & {
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

export async function getAccessibleCustomerIds(ctx: QueryCtx, authUserId: string) {
	const memberships = await getViewerMemberships(ctx, authUserId);
	const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");
	const customers = isPlatformAdmin ? await ctx.db.query("customers").collect() : [];

	return {
		customers,
		isPlatformAdmin,
		memberships,
		customerIds: isPlatformAdmin
			? customers.map((customer) => customer._id)
			: memberships.map((membership) => membership.customerId),
	};
}

export async function requireCustomerAccess(ctx: QueryCtx, authUserId: string, customerId: Id<"customers">) {
	const { isPlatformAdmin, memberships } = await getAccessibleCustomerIds(ctx, authUserId);

	if (isPlatformAdmin) {
		return;
	}

	const hasAccess = memberships.some((membership) => membership.customerId === customerId);

	if (!hasAccess) {
		throw new ConvexError("Customer access required");
	}
}

export function deriveInvoiceStatus(invoice: InvoiceDoc, paidAmount: number, now = Date.now()): DerivedInvoiceStatus {
	if (invoice.lifecycleStatus === "draft") {
		return "draft";
	}

	const outstandingAmount = Math.max(Number((invoice.amount - paidAmount).toFixed(2)), 0);

	if (outstandingAmount <= 0) {
		return "paid";
	}

	if (invoice.dueDate < now) {
		return "overdue";
	}

	if (paidAmount > 0) {
		return "partially_paid";
	}

	return "issued";
}

export function buildLedgerInvoiceRecord(
	invoice: InvoiceDoc,
	customerName: string,
	payments: PaymentDoc[],
	now = Date.now(),
): LedgerInvoiceRecord {
	const paidAmount = Number(payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2));
	const outstandingAmount = Math.max(Number((invoice.amount - paidAmount).toFixed(2)), 0);

	return {
		...invoice,
		customerName,
		outstandingAmount,
		paidAmount,
		paymentCount: payments.length,
		status: deriveInvoiceStatus(invoice, paidAmount, now),
	};
}

export function buildBalanceSnapshot(invoices: LedgerInvoiceRecord[], payments: PaymentDoc[]): BalanceSnapshot {
	const issuedInvoices = invoices.filter((invoice) => invoice.lifecycleStatus !== "draft");
	const totalInvoiced = Number(issuedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2));
	const totalPaid = Number(
		payments
			.filter((payment) => issuedInvoices.some((invoice) => invoice._id === payment.invoiceId))
			.reduce((sum, payment) => sum + payment.amount, 0)
			.toFixed(2),
	);
	const totalOutstanding = Number(issuedInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0).toFixed(2));

	return {
		currentBalance: totalOutstanding,
		issuedInvoiceCount: issuedInvoices.length,
		overdueInvoiceCount: issuedInvoices.filter((invoice) => invoice.status === "overdue").length,
		totalInvoiced,
		totalOutstanding,
		totalPaid,
	};
}
