import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentAppSession } from "../../../lib/auth";
import { getInviteByToken } from "../../../lib/convex-server";
import { formatDate } from "../../../lib/finance";

type InvitePageProps = {
	params: Promise<{ token: string }>;
	searchParams?: Promise<{ status?: string }>;
};

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
	const { token } = await params;
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const invite = await getInviteByToken(token);

	if (!invite) {
		notFound();
	}

	const session = await getCurrentAppSession();
	const inviteEmailMatches = session.user?.email?.trim().toLowerCase() === invite.email;
	const acceptanceFailed = resolvedSearchParams?.status === "error";

	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Customer Invite</p>
				<h1>{invite.customerName}</h1>
				<p className="shell-copy">
					{invite.email} · {invite.role} · Expires {formatDate(invite.expiresAt)}
				</p>

				<div className="shell-panel">
					<h2>Invite status</h2>
					<p>
						{invite.isValid
							? "This invite is active."
							: invite.status === "accepted"
								? "This invite has already been accepted."
								: invite.isExpired
									? "This invite has expired."
									: "This invite is no longer active."}
					</p>
					{acceptanceFailed ? (
						<p className="inline-note">
							The signed-in account did not match the invited email, or the invite was no longer valid.
						</p>
					) : null}
				</div>

				<div className="hero-actions">
					{invite.isValid ? (
						session.userId ? (
							inviteEmailMatches ? (
								<Link className="shell-nav-link" href={`/auth/complete?invite=${token}`}>
									Continue with this account
								</Link>
							) : (
								<>
									<p className="inline-note">
										You are signed in as {session.user?.email ?? "another account"}. Use the invited email to
										accept this access.
									</p>
									<Link
										className="shell-nav-link"
										href={`/sign-in?invite=${token}&email=${encodeURIComponent(invite.email)}`}
									>
										Sign in with invited email
									</Link>
								</>
							)
						) : (
							<>
								<Link
									className="shell-nav-link"
									href={`/sign-up?invite=${token}&email=${encodeURIComponent(invite.email)}`}
								>
									Create account
								</Link>
								<Link
									className="shell-nav-link"
									href={`/sign-in?invite=${token}&email=${encodeURIComponent(invite.email)}`}
								>
									Already have access?
								</Link>
							</>
						)
					) : (
						<Link className="shell-nav-link" href="/">
							Back to dashboard home
						</Link>
					)}
				</div>
			</section>
		</main>
	);
}
