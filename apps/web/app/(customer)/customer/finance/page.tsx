import { FinanceLedgerTable } from "../../../../components/finance/ledger-table";
import { getCurrentAppSession } from "../../../../lib/auth";
import { getCustomerFinanceOverview } from "../../../../lib/convex-server";
import { formatCurrency, formatNumber } from "../../../../lib/performance";

export default async function CustomerFinancePage() {
	const session = await getCurrentAppSession();

	if (!session.activeCustomerId) {
		throw new Error("Customer finance dashboard requires an active customer.");
	}

	const overview = await getCustomerFinanceOverview(session.activeCustomerId);
	const currencyCode = overview.customer.currencyCode;

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-default">Customer ledger</span>
					<h2>{overview.customer.name}</h2>
					<p>
						{formatCurrency(overview.snapshot.currentBalance, currencyCode)} current balance across issued
						invoices.
					</p>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Totals</span>
					<h2>{formatCurrency(overview.snapshot.totalInvoiced, currencyCode)} invoiced</h2>
					<p>
						{formatCurrency(overview.snapshot.totalPaid, currencyCode)} paid ·{" "}
						{formatCurrency(overview.snapshot.totalOutstanding, currencyCode)} outstanding
					</p>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-warning">Status</span>
					<h2>{formatNumber(overview.snapshot.overdueInvoiceCount)} overdue invoices</h2>
					<p>
						Customer users can review all invoice and payment history here, but finance records remain admin-only
						to edit.
					</p>
				</div>
			</section>

			<FinanceLedgerTable
				currencyCode={currencyCode}
				invoices={overview.invoices}
				payments={overview.payments}
				scopeLabel={overview.customer.name}
			/>
		</div>
	);
}
