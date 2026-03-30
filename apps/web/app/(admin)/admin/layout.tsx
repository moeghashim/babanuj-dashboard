import type { ReactNode } from "react";

import { DashboardShell } from "../../../components/dashboard-shell";
import { requirePlatformAdmin } from "../../../lib/auth";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
	await requirePlatformAdmin();

	return (
		<DashboardShell
			description="Manage customer setup, review aggregate performance, and keep finance workflows controlled from one place."
			eyebrow="Platform admin"
			links={[
				{ href: "/admin", label: "Overview" },
				{ href: "/admin/customers", label: "Customers" },
				{ href: "/customer", label: "Customer preview" },
				{ href: "/select-org", label: "Customer selector" },
			]}
			title="Babanuj Admin"
		>
			{children}
		</DashboardShell>
	);
}
