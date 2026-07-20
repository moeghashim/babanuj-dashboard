import { SignInForm } from "../../../components/sign-in-form";

type SignInPageProps = {
	searchParams?: Promise<{ email?: string; invite?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const defaultEmail = typeof resolvedSearchParams?.email === "string" ? resolvedSearchParams.email : undefined;
	const inviteToken = typeof resolvedSearchParams?.invite === "string" ? resolvedSearchParams.invite : undefined;

	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Authentication</p>
				<h1>{inviteToken ? "Sign in to accept your invite." : "Sign in to Babanuj."}</h1>
				{inviteToken ? (
					<p className="shell-copy">
						Use the invited email so the customer membership can be attached automatically.
					</p>
				) : null}
				<div className="hero-actions">
					<SignInForm defaultEmail={defaultEmail} inviteToken={inviteToken} />
				</div>
			</section>
		</main>
	);
}
