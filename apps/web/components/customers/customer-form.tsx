import { ChannelAssignment } from "./channel-assignment";

type CustomerFormProps = {
	action: (formData: FormData) => void | Promise<void>;
	customer?: {
		_id?: string;
		activeChannels: string[];
		clerkOrganizationId: string;
		currencyCode: string;
		name: string;
		slug: string;
		status?: "active" | "inactive";
	};
	submitLabel: string;
};

export function CustomerForm({ action, customer, submitLabel }: CustomerFormProps) {
	return (
		<form action={action} className="shell-form">
			{customer?._id ? <input name="customerId" type="hidden" value={customer._id} /> : null}

			<div className="form-grid">
				<label className="field">
					<span className="field-label">Customer name</span>
					<input className="shell-input" defaultValue={customer?.name ?? ""} name="name" required type="text" />
				</label>

				<label className="field">
					<span className="field-label">Slug</span>
					<input className="shell-input" defaultValue={customer?.slug ?? ""} name="slug" required type="text" />
				</label>

				<label className="field">
					<span className="field-label">Clerk organization ID</span>
					<input
						className="shell-input"
						defaultValue={customer?.clerkOrganizationId ?? ""}
						name="clerkOrganizationId"
						required
						type="text"
					/>
				</label>

				<label className="field">
					<span className="field-label">Currency code</span>
					<input
						className="shell-input"
						defaultValue={customer?.currencyCode ?? "USD"}
						name="currencyCode"
						required
						type="text"
					/>
				</label>

				{customer ? (
					<label className="field">
						<span className="field-label">Status</span>
						<select className="shell-select" defaultValue={customer.status ?? "active"} name="status">
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</label>
				) : null}
			</div>

			<ChannelAssignment defaultChannels={customer?.activeChannels} />

			<button className="shell-button" type="submit">
				{submitLabel}
			</button>
		</form>
	);
}
