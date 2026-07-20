import { formatCurrency, formatDate, type LedgerInvoiceRecord, type LedgerPaymentRecord } from "../../lib/finance";

const statusToneClassName: Record<LedgerInvoiceRecord["status"], string> = {
	draft: "shell-chip-default",
	issued: "shell-chip-accent",
	overdue: "shell-chip-warning",
	paid: "shell-chip-success",
	partially_paid: "shell-chip-warning",
};

type FinanceLedgerTableProps = {
	currencyCode: string;
	invoices: LedgerInvoiceRecord[];
	payments: LedgerPaymentRecord[];
	scopeLabel: string;
};

export function FinanceLedgerTable({ currencyCode, invoices, payments, scopeLabel }: FinanceLedgerTableProps) {
	return (
		<section className="shell-grid">
			<div className="shell-panel">
				<span className="shell-chip shell-chip-accent">Invoices</span>
				<h2>{scopeLabel} invoice ledger</h2>
				{invoices.length === 0 ? (
					<p className="inline-note">No invoices exist yet.</p>
				) : (
					<ul className="record-list">
						{invoices.map((invoice) => (
							<li className="record-row" key={invoice._id}>
								<div>
									<strong>
										{invoice.invoiceNumber} · {invoice.customerName}
									</strong>
									<p>
										Issued {formatDate(invoice.issuedDate)} · Due {formatDate(invoice.dueDate)} ·{" "}
										{formatCurrency(invoice.amount, currencyCode)} invoiced ·{" "}
										{formatCurrency(invoice.paidAmount, currencyCode)} paid
									</p>
									<p>
										Outstanding {formatCurrency(invoice.outstandingAmount, currencyCode)} ·{" "}
										{invoice.paymentCount} payments
									</p>
									{invoice.note ? <p>Note: {invoice.note}</p> : null}
								</div>
								<div>
									<span className={`shell-chip ${statusToneClassName[invoice.status]}`}>{invoice.status}</span>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="shell-panel">
				<span className="shell-chip shell-chip-success">Payments</span>
				<h2>{scopeLabel} payment ledger</h2>
				{payments.length === 0 ? (
					<p className="inline-note">No payments have been recorded yet.</p>
				) : (
					<ul className="record-list">
						{payments.map((payment) => (
							<li className="record-row" key={payment._id}>
								<div>
									<strong>
										{payment.invoiceNumber} · {payment.customerName}
									</strong>
									<p>
										{formatCurrency(payment.amount, currencyCode)} received on{" "}
										{formatDate(payment.paymentDate)}
									</p>
									<p>
										Reference: {payment.reference ?? "No external reference"} · Created{" "}
										{formatDate(payment.createdAt)}
									</p>
									{payment.note ? <p>Note: {payment.note}</p> : null}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
