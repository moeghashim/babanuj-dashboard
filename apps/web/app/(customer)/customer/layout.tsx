import type { ReactNode } from "react";

import { DashboardShell } from "../../../components/dashboard-shell";
import { requireCustomerAccess } from "../../../lib/auth";

export default async function CustomerLayout({ children }: Readonly<{ children: ReactNode }>) {
	await requireCustomerAccess();

	return (
		<DashboardShell
			description="Customer users can review only their own organization's performance and finance summary. Admins can use this view to inspect the customer experience."
			eyebrow="Customer workspace"
			links={[
				{ href: "/customer", label: "Overview" },
				{ href: "/select-org", label: "Switch org" },
				{ href: "/admin", label: "Admin area" },
			]}
			showOrganizationSwitcher
			title="Customer Dashboard"
		>
			{children}
		</DashboardShell>
	);
}
