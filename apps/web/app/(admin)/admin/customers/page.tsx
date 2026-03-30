import { Card, CardContent, Chip } from "@heroui/react";
import Link from "next/link";

import { CustomerForm } from "../../../../components/customers/customer-form";
import { requirePlatformAdmin } from "../../../../lib/auth";
import { listAccessibleCustomers } from "../../../../lib/convex-server";
import { createCustomerAction } from "./actions";

export default async function CustomersPage() {
	await requirePlatformAdmin();
	const customers = await listAccessibleCustomers();

	return (
		<div className="shell-content">
			<section className="shell-grid">
				<Card className="shell-panel">
					<CardContent>
						<Chip color="accent" variant="soft">
							Customer records
						</Chip>
						<h2>Create a customer</h2>
						<p>
							Create the base customer record with currency and active channels. This is the source record for
							future performance and finance data.
						</p>
						<CustomerForm
							action={createCustomerAction}
							customer={{
								activeChannels: [],
								currencyCode: "USD",
								name: "",
								slug: "",
							}}
							submitLabel="Create customer"
						/>
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="success" variant="soft">
							Existing customers
						</Chip>
						<h2>Manage active customer workspaces</h2>
						{customers.length === 0 ? (
							<p>
								No customers exist yet. Create the first one to bootstrap admin membership and customer
								management.
							</p>
						) : (
							<ul className="record-list">
								{customers.map((customer) => (
									<li className="record-row" key={customer._id}>
										<div>
											<strong>{customer.name}</strong>
											<p>
												{customer.slug} · {customer.currencyCode} · {customer.status}
											</p>
										</div>
										<Link className="shell-nav-link" href={`/admin/customers/${customer._id}`}>
											Open
										</Link>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="warning" variant="soft">
							Runtime note
						</Chip>
						<h2>Access mapping dependency</h2>
						<p>
							Customer membership mapping now uses Better Auth accounts. A user must create their Babanuj access
							first, then an admin can map that email to a customer workspace.
						</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
