import type { CustomerRecord } from "../../lib/customers";
import { INVOICE_LIFECYCLE_STATUSES } from "../../lib/finance";

type InvoiceFormProps = {
	action: (formData: FormData) => void | Promise<void>;
	customers: CustomerRecord[];
	selectedCustomerId?: string;
};

export function InvoiceForm({ action, customers, selectedCustomerId }: InvoiceFormProps) {
	return (
		<form action={action} className="shell-form">
			<div className="form-grid">
				<label className="field">
					<span className="field-label">Customer</span>
					<select className="shell-select" defaultValue={selectedCustomerId ?? ""} name="customerId" required>
						<option value="">Select customer</option>
						{customers.map((customer) => (
							<option key={customer._id} value={customer._id}>
								{customer.name}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					<span className="field-label">Invoice number</span>
					<input className="shell-input" name="invoiceNumber" placeholder="INV-2026-001" required type="text" />
				</label>

				<label className="field">
					<span className="field-label">Issue date</span>
					<input className="shell-input" name="issuedDate" required type="date" />
				</label>

				<label className="field">
					<span className="field-label">Due date</span>
					<input className="shell-input" name="dueDate" required type="date" />
				</label>

				<label className="field">
					<span className="field-label">Amount</span>
					<input className="shell-input" min="0.01" name="amount" required step="0.01" type="number" />
				</label>

				<label className="field">
					<span className="field-label">Lifecycle state</span>
					<select className="shell-select" defaultValue="issued" name="lifecycleStatus">
						{INVOICE_LIFECYCLE_STATUSES.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
				</label>
			</div>

			<label className="field">
				<span className="field-label">Admin note</span>
				<input className="shell-input" name="note" placeholder="Optional note shown in the ledger" type="text" />
			</label>

			<p className="inline-note">
				Invoices are immutable financial records in v1. Admins can create draft or issued invoices, and payments can
				only be recorded against issued invoices.
			</p>

			<button className="shell-button" type="submit">
				Save invoice
			</button>
		</form>
	);
}
