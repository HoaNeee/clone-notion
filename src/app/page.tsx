import NavigationComponent from "@/components/navigation-component";
import { cookies } from "next/headers";
import Link from "next/link";

const DashboardPage = async () => {
	const token = (await cookies()).get("note_jwt_token")?.value;

	// Preserve existing authenticated behavior
	if (token) {
		return <NavigationComponent token={token} />;
	}

	return (
		<main className="min-h-screen bg-white text-slate-900 flex flex-col">
			<nav className="max-w-4xl w-full mx-auto flex items-center justify-between py-6 px-6">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-black text-white flex items-center justify-center rounded">
						NP
					</div>
					<span className="font-medium">Note Plus</span>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/login"
						className="text-sm text-slate-600 hover:text-slate-900"
					>
						Log in
					</Link>
					<Link
						href="/login"
						className="inline-flex items-center bg-black text-white px-4 py-2 text-sm rounded hover:opacity-95"
					>
						Get started
					</Link>
				</div>
			</nav>

			<section className="flex-1 flex items-center">
				<div className="max-w-4xl mx-auto px-6 py-20 text-center">
					<h1 className="text-5xl font-semibold mb-4">
						A simple, flexible notes workspace
					</h1>
					<p className="text-lg text-slate-600 mb-8">
						Note Plus — a clean, collaborative note-taking experience inspired
						by Notion. Create pages, organize content, and share with teammates.
					</p>

					<div className="flex items-center justify-center gap-4">
						<Link
							href="/login"
							className="px-6 py-3 rounded-md bg-black text-white font-medium"
						>
							Log in
						</Link>
						<Link
							href="/login"
							className="px-6 py-3 rounded-md border border-slate-200 text-slate-800"
						>
							Create account
						</Link>
					</div>

					<ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
						<li className="flex gap-3 items-start">
							<div className="text-2xl">🗂️</div>
							<div>
								<div className="font-medium">Organize</div>
								<div className="text-sm text-slate-600">
									Pages, databases and flexible blocks.
								</div>
							</div>
						</li>
						<li className="flex gap-3 items-start">
							<div className="text-2xl">⚡</div>
							<div>
								<div className="font-medium">Fast</div>
								<div className="text-sm text-slate-600">
									Lightweight editor and keyboard-first flows.
								</div>
							</div>
						</li>
						<li className="flex gap-3 items-start">
							<div className="text-2xl">🔒</div>
							<div>
								<div className="font-medium">Secure</div>
								<div className="text-sm text-slate-600">
									Account-based access and private notes.
								</div>
							</div>
						</li>
					</ul>
				</div>
			</section>

			<footer className="w-full border-t border-slate-100 py-6 max-w-4xl mx-auto text-center">
				<p className="px-6 text-sm text-slate-500">
					Built with ❤️ — clone-style landing for Note Plus
				</p>
			</footer>
		</main>
	);
};

export default DashboardPage;
