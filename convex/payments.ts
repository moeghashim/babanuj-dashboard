import { ConvexError, v } from "convex/values";
import { mutationGeneric } from "convex/server";

import { requireIdentity, requirePlatformAdminMembership } from "./auth";
import { buildLedgerInvoiceRecord } from "./financeShared";

export const createPayment = mutationGeneric({
	args: {
		amount: v.number(),
		invoiceId: v.id("invoices"),
		note: v.optional(v.string()),
		paymentDate: v.number(),
		reference: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const invoice = await ctx.db.get(args.invoiceId);

		if (!invoice) {
			throw new ConvexError("Invoice not found");
		}

		if (invoice.lifecycleStatus === "draft") {
			throw new ConvexError("Payments can only be recorded against issued invoices");
		}

		if (args.amount <= 0) {
			throw new ConvexError("Payment amount must be greater than zero");
		}

		const existingPayments = await ctx.db
			.query("payments")
			.withIndex("by_invoice_id", (query) => query.eq("invoiceId", invoice._id))
			.collect();
		const derivedInvoice = buildLedgerInvoiceRecord(invoice, "Unknown customer", existingPayments);

		if (args.amount > derivedInvoice.outstandingAmount) {
			throw new ConvexError("Payment amount cannot exceed the outstanding balance");
		}

		const now = Date.now();

		return ctx.db.insert("payments", {
			amount: Number(args.amount.toFixed(2)),
			createdAt: now,
			createdBy: identity.subject,
			currencyCode: invoice.currencyCode,
			customerId: invoice.customerId,
			invoiceId: invoice._id,
			note: args.note,
			paymentDate: args.paymentDate,
			reference: args.reference,
			updatedAt: now,
			updatedBy: identity.subject,
		});
	},
});
