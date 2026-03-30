import Link from "next/link";
import type { ReactNode } from "react";

import { SessionControls } from "./session-controls";

type DashboardShellProps = {
	children: ReactNode;
	description: string;
	eyebrow: string;
	links: Array<{ href: string; label: string }>;
	showCustomerSwitcher?: boolean;
	title: string;
};

export function DashboardShell({
	children,
	description,
	eyebrow,
	links,
	showCustomerSwitcher = false,
	title,
}: DashboardShellProps) {
	return (
		<div className="dashboard-shell">
			<header className="shell-header">
				<div>
					<p className="eyebrow">{eyebrow}</p>
					<h1 className="shell-title">{title}</h1>
					<p className="shell-copy">{description}</p>
				</div>
				<SessionControls showCustomerSwitcher={showCustomerSwitcher} />
			</header>

			<nav aria-label={`${title} navigation`} className="shell-nav">
				{links.map((link) => (
					<Link className="shell-nav-link" href={link.href} key={link.href}>
						{link.label}
					</Link>
				))}
			</nav>

			<div className="shell-content">{children}</div>
		</div>
	);
}
