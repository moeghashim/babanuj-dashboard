import { ConvexError, v } from "convex/values";
import { mutationGeneric, queryGeneric } from "convex/server";

import { requireIdentity, requirePlatformAdminMembership } from "./auth";
import {
	buildBalanceSnapshot,
	buildLedgerInvoiceRecord,
	getAccessibleCustomerIds,
	type CustomerDoc,
	type LedgerInvoiceRecord,
	type LedgerPaymentRecord,
	type PaymentDoc,
	requireCustomerAccess,
	type QueryCtx,
} from "./financeShared";

type AdminFinanceOverview = {
	customers: CustomerDoc[];
	invoices: LedgerInvoiceRecord[];
	payments: LedgerPaymentRecord[];
	selectedCustomer: CustomerDoc | null;
	snapshot: ReturnType<typeof buildBalanceSnapshot>;
};

type CustomerFinanceOverview = {
	customer: CustomerDoc;
	invoices: LedgerInvoiceRecord[];
	payments: LedgerPaymentRecord[];
	snapshot: ReturnType<typeof buildBalanceSnapshot>;
};

async function listInvoicesForCustomerIds(ctx: QueryCtx, customerIds: CustomerDoc["_id"][]) {
	const invoiceGroups = await Promise.all(
		customerIds.map((customerId) => ctx.db.query("invoices").withIndex("by_customer_id", (query) => query.eq("customerId", customerId)).collect()),
	);

	return invoiceGroups.flat().sort((left, right) => right.issuedDate - left.issuedDate);
}

async function listPaymentsForCustomerIds(ctx: QueryCtx, customerIds: CustomerDoc["_id"][]) {
	const paymentGroups = await Promise.all(
		customerIds.map((customerId) => ctx.db.query("payments").withIndex("by_customer_id", (query) => query.eq("customerId", customerId)).collect()),
	);

	return paymentGroups.flat().sort((left, right) => right.paymentDate - left.paymentDate);
}

function buildLedgerRecords(customers: CustomerDoc[], invoices: Awaited<ReturnType<typeof listInvoicesForCustomerIds>>, payments: PaymentDoc[]) {
	const customerById = new Map(customers.map((customer) => [customer._id, customer] as const));
	const paymentsByInvoiceId = new Map<PaymentDoc["invoiceId"], PaymentDoc[]>();

	for (const payment of payments) {
		const paymentList = paymentsByInvoiceId.get(payment.invoiceId) ?? [];
		paymentList.push(payment);
		paymentsByInvoiceId.set(payment.invoiceId, paymentList);
	}

	const ledgerInvoices = invoices.map((invoice) =>
		buildLedgerInvoiceRecord(invoice, customerById.get(invoice.customerId)?.name ?? "Unknown customer", paymentsByInvoiceId.get(invoice._id) ?? []),
	);
	const ledgerPayments = payments.map((payment) => ({
		...payment,
		customerName: customerById.get(payment.customerId)?.name ?? "Unknown customer",
		invoiceNumber: invoices.find((invoice) => invoice._id === payment.invoiceId)?.invoiceNumber ?? "Unknown invoice",
	}));

	return {
		invoices: ledgerInvoices,
		payments: ledgerPayments,
		snapshot: buildBalanceSnapshot(ledgerInvoices, payments),
	};
}

export const createInvoice = mutationGeneric({
	args: {
		amount: v.number(),
		customerId: v.id("customers"),
		dueDate: v.number(),
		invoiceNumber: v.string(),
		issuedDate: v.number(),
		lifecycleStatus: v.union(v.literal("draft"), v.literal("issued")),
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const customer = await ctx.db.get(args.customerId);

		if (!customer) {
			throw new ConvexError("Customer not found");
		}

		if (args.amount <= 0) {
			throw new ConvexError("Invoice amount must be greater than zero");
		}

		if (args.dueDate < args.issuedDate) {
			throw new ConvexError("Due date must be on or after the issue date");
		}

		const existingInvoice = (
			await ctx.db
				.query("invoices")
				.withIndex("by_customer_id", (query) => query.eq("customerId", args.customerId))
				.collect()
		).find((invoice) => invoice.invoiceNumber === args.invoiceNumber);

		if (existingInvoice) {
			throw new ConvexError("Invoice number must be unique per customer");
		}

		const now = Date.now();

		return ctx.db.insert("invoices", {
			amount: Number(args.amount.toFixed(2)),
			createdAt: now,
			createdBy: identity.subject,
			currencyCode: customer.currencyCode,
			customerId: args.customerId,
			dueDate: args.dueDate,
			invoiceNumber: args.invoiceNumber,
			issuedDate: args.issuedDate,
			lifecycleStatus: args.lifecycleStatus,
			note: args.note,
			updatedAt: now,
			updatedBy: identity.subject,
		});
	},
});

export const getAdminFinanceOverview = queryGeneric({
	args: {
		customerId: v.optional(v.id("customers")),
	},
	handler: async (ctx, args): Promise<AdminFinanceOverview> => {
		const identity = await requireIdentity(ctx);
		const { customerIds, customers, isPlatformAdmin } = await getAccessibleCustomerIds(ctx, identity.subject);

		if (!isPlatformAdmin) {
			throw new ConvexError("Platform admin access required");
		}

		const selectedCustomerId = args.customerId ?? null;
		const selectedCustomer = selectedCustomerId ? customers.find((customer) => customer._id === selectedCustomerId) ?? null : null;
		const scopedCustomerIds = selectedCustomer ? [selectedCustomer._id] : customerIds;
		const scopedCustomers = selectedCustomer ? [selectedCustomer] : customers;
		const invoices = await listInvoicesForCustomerIds(ctx, scopedCustomerIds);
		const payments = await listPaymentsForCustomerIds(ctx, scopedCustomerIds);
		const ledger = buildLedgerRecords(scopedCustomers, invoices, payments);

		return {
			customers,
			invoices: ledger.invoices,
			payments: ledger.payments,
			selectedCustomer,
			snapshot: ledger.snapshot,
		};
	},
});

export const getCustomerFinanceOverview = queryGeneric({
	args: {
		customerId: v.id("customers"),
	},
	handler: async (ctx, args): Promise<CustomerFinanceOverview> => {
		const identity = await requireIdentity(ctx);
		await requireCustomerAccess(ctx, identity.subject, args.customerId);
		const customer = await ctx.db.get(args.customerId);

		if (!customer) {
			throw new ConvexError("Customer not found");
		}

		const invoices = await listInvoicesForCustomerIds(ctx, [customer._id]);
		const payments = await listPaymentsForCustomerIds(ctx, [customer._id]);
		const ledger = buildLedgerRecords([customer], invoices, payments);

		return {
			customer,
			invoices: ledger.invoices,
			payments: ledger.payments,
			snapshot: ledger.snapshot,
		};
	},
});
