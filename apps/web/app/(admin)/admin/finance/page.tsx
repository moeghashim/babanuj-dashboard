import Link from "next/link";
import { InvoiceForm } from "../../../../components/finance/invoice-form";
import { FinanceLedgerTable } from "../../../../components/finance/ledger-table";
import { PaymentForm } from "../../../../components/finance/payment-form";
import { requirePlatformAdmin } from "../../../../lib/auth";
import { getAdminFinanceOverview } from "../../../../lib/convex-server";
import { formatCurrency, formatNumber } from "../../../../lib/performance";
import { createInvoiceAction, createPaymentAction } from "./actions";

type AdminFinancePageProps = {
	searchParams?: Promise<{ customer?: string }>;
};

export default async function AdminFinancePage({ searchParams }: AdminFinancePageProps) {
	await requirePlatformAdmin();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedCustomerId =
		typeof resolvedSearchParams?.customer === "string" ? resolvedSearchParams.customer : undefined;
	const overview = await getAdminFinanceOverview(selectedCustomerId);
	const currencyCode = overview.selectedCustomer?.currencyCode ?? overview.customers[0]?.currencyCode ?? "USD";
	const payableInvoices = overview.invoices.filter(
		(invoice) => invoice.lifecycleStatus === "issued" && invoice.outstandingAmount > 0,
	);

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<p className="eyebrow">Finance scope</p>
					<h2>{overview.selectedCustomer?.name ?? "All customers"}</h2>
					<p className="shell-copy">
						{formatCurrency(overview.snapshot.totalOutstanding, currencyCode)} outstanding across{" "}
						{formatNumber(overview.snapshot.issuedInvoiceCount)} issued invoices.
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Ledger totals</p>
					<h2>{formatCurrency(overview.snapshot.totalInvoiced, currencyCode)}</h2>
					<p className="inline-note">
						{formatCurrency(overview.snapshot.totalPaid, currencyCode)} paid ·{" "}
						{formatCurrency(overview.snapshot.currentBalance, currencyCode)} current balance
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Risk</p>
					<h2>{formatNumber(overview.snapshot.overdueInvoiceCount)} overdue invoices</h2>
					<p className="inline-note">
						Overdue status is calculated when an issued invoice still has balance remaining past its due date.
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Customers</p>
					<div className="period-links">
						<Link
							className={`shell-nav-link${!overview.selectedCustomer ? " is-active" : ""}`}
							href="/admin/finance"
						>
							All customers
						</Link>
						{overview.customers.map((customer) => (
							<Link
								className={`shell-nav-link${customer._id === overview.selectedCustomer?._id ? " is-active" : ""}`}
								href={`/admin/finance?customer=${customer._id}`}
								key={customer._id}
							>
								{customer.name}
							</Link>
						))}
					</div>
				</div>
			</section>

			<section className="shell-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Admin entry</span>
					<h2>Issue customer invoices</h2>
					<p>
						Invoice numbers are unique per customer. Draft invoices stay out of payment workflows until they are
						issued.
					</p>
					<InvoiceForm
						action={createInvoiceAction}
						customers={overview.customers}
						selectedCustomerId={overview.selectedCustomer?._id}
					/>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Cash collection</span>
					<h2>Record Babanuj payments received</h2>
					<p>
						Only issued invoices with an outstanding balance are available here. Payments cannot exceed the
						current balance.
					</p>
					<PaymentForm action={createPaymentAction} invoices={payableInvoices} />
				</div>
			</section>

			<FinanceLedgerTable
				currencyCode={currencyCode}
				invoices={overview.invoices}
				payments={overview.payments}
				scopeLabel={overview.selectedCustomer?.name ?? "All customer"}
			/>
		</div>
	);
}
