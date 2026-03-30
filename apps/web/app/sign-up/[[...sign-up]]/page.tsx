import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Authentication</p>
				<h1>Create your Babanuj access.</h1>
				<div className="hero-actions">
					<SignUp signInUrl="/sign-in" />
				</div>
			</section>
		</main>
	);
}
