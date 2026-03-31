import type { LedgerInvoiceRecord } from "../../lib/finance";

type PaymentFormProps = {
	action: (formData: FormData) => void | Promise<void>;
	invoices: LedgerInvoiceRecord[];
	selectedInvoiceId?: string;
};

export function PaymentForm({ action, invoices, selectedInvoiceId }: PaymentFormProps) {
	return (
		<form action={action} className="shell-form">
			<div className="form-grid">
				<label className="field">
					<span className="field-label">Invoice</span>
					<select className="shell-select" defaultValue={selectedInvoiceId ?? ""} name="invoiceId" required>
						<option value="">Select issued invoice</option>
						{invoices.map((invoice) => (
							<option key={invoice._id} value={invoice._id}>
								{invoice.invoiceNumber} · {invoice.customerName} · {invoice.outstandingAmount.toFixed(2)}{" "}
								{invoice.currencyCode}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					<span className="field-label">Payment date</span>
					<input className="shell-input" name="paymentDate" required type="date" />
				</label>

				<label className="field">
					<span className="field-label">Amount</span>
					<input className="shell-input" min="0.01" name="amount" required step="0.01" type="number" />
				</label>

				<label className="field">
					<span className="field-label">Reference</span>
					<input className="shell-input" name="reference" placeholder="Bank transfer ref" type="text" />
				</label>
			</div>

			<label className="field">
				<span className="field-label">Admin note</span>
				<input className="shell-input" name="note" placeholder="Optional payment note" type="text" />
			</label>

			<p className="inline-note">
				Payments are capped to the current outstanding balance and automatically roll invoice status to partially
				paid, paid, or overdue.
			</p>

			<button className="shell-button" type="submit">
				Save payment
			</button>
		</form>
	);
}
