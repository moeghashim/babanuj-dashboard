import { SignUpForm } from "../../../components/sign-up-form";

export default function SignUpPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Authentication</p>
				<h1>Create your Babanuj access.</h1>
				<div className="hero-actions">
					<SignUpForm />
				</div>
			</section>
		</main>
	);
}
