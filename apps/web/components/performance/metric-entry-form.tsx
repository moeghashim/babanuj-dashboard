import type { CustomerRecord } from "../../lib/customers";
import { CUSTOMER_CHANNELS } from "../../lib/customers";
import { PERFORMANCE_RECORD_SOURCES } from "../../lib/performance";

type MetricEntryFormProps = {
	action: (formData: FormData) => void | Promise<void>;
	customers: CustomerRecord[];
	defaultPeriodKey: string;
};

export function MetricEntryForm({ action, customers, defaultPeriodKey }: MetricEntryFormProps) {
	return (
		<form action={action} className="shell-form">
			<div className="form-grid">
				<label className="field">
					<span className="field-label">Customer</span>
					<select className="shell-select" name="customerId" required>
						<option value="">Select customer</option>
						{customers.map((customer) => (
							<option key={customer._id} value={customer._id}>
								{customer.name}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					<span className="field-label">Reporting month</span>
					<input className="shell-input" defaultValue={defaultPeriodKey} name="periodKey" required type="month" />
				</label>

				<label className="field">
					<span className="field-label">Channel</span>
					<select className="shell-select" name="channel" required>
						<option value="">Select channel</option>
						{CUSTOMER_CHANNELS.map((channel) => (
							<option key={channel} value={channel}>
								{channel}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					<span className="field-label">Record source</span>
					<select className="shell-select" defaultValue="manual" name="source">
						{PERFORMANCE_RECORD_SOURCES.map((source) => (
							<option key={source} value={source}>
								{source}
							</option>
						))}
					</select>
				</label>

				<label className="field">
					<span className="field-label">Gross revenue</span>
					<input className="shell-input" min="0" name="grossRevenue" required step="0.01" type="number" />
				</label>

				<label className="field">
					<span className="field-label">Orders</span>
					<input className="shell-input" min="0" name="orderCount" required step="1" type="number" />
				</label>
			</div>

			<label className="field">
				<span className="field-label">Source reference</span>
				<input
					className="shell-input"
					name="sourceReference"
					placeholder="Optional external ID or note"
					type="text"
				/>
			</label>

			<p className="inline-note">
				Manual entries remain editable by period, customer, and channel. If a matching record already exists, saving
				here will update it instead of duplicating it.
			</p>

			<button className="shell-button" type="submit">
				Save monthly metric
			</button>
		</form>
	);
}
