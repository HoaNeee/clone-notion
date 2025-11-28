/* eslint-disable @next/next/no-html-link-for-pages */
import NavigationComponent from "@/components/navigation-component";
import { cookies } from "next/headers";

const DashboardPage = async () => {
  const token = (await cookies()).get("note_jwt_token")?.value;

  // Preserve existing authenticated behavior
  if (token) {
    return <NavigationComponent token={token} />;
  }

  return (
    <main className="text-slate-900 flex flex-col min-h-screen bg-white">
      <nav className="flex items-center justify-between w-full max-w-4xl px-6 py-6 mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center text-white bg-black rounded">
            NP
          </div>
          <span className="font-medium">Note Plus</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="text-slate-600 hover:text-slate-900 text-sm"
          >
            Log in
          </a>
          <a
            href="/login"
            className="hover:opacity-95 inline-flex items-center px-4 py-2 text-sm text-white bg-black rounded"
          >
            Get started
          </a>
        </div>
      </nav>

      <section className="flex items-center flex-1">
        <div className="max-w-4xl px-6 py-20 mx-auto text-center">
          <h1 className="mb-4 text-5xl font-semibold">
            A simple, flexible notes workspace
          </h1>
          <p className="text-slate-600 mb-8 text-lg">
            Note Plus — a clean, collaborative note-taking experience inspired
            by Notion. Create pages, organize content, and share with teammates.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-6 py-3 font-medium text-white bg-black rounded-md"
            >
              Log in
            </a>
            <a
              href="/login"
              className="border-slate-200 text-slate-800 px-6 py-3 border rounded-md"
            >
              Create account
            </a>
          </div>

          <ul className="sm:grid-cols-3 grid max-w-3xl grid-cols-1 gap-6 mx-auto mt-10 text-left">
            <li className="flex items-start gap-3">
              <div className="text-2xl">🗂️</div>
              <div>
                <div className="font-medium">Organize</div>
                <div className="text-slate-600 text-sm">
                  Pages, databases and flexible blocks.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="text-2xl">⚡</div>
              <div>
                <div className="font-medium">Fast</div>
                <div className="text-slate-600 text-sm">
                  Lightweight editor and keyboard-first flows.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="font-medium">Secure</div>
                <div className="text-slate-600 text-sm">
                  Account-based access and private notes.
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <footer className="border-slate-100 w-full max-w-4xl py-6 mx-auto text-center border-t">
        <p className="text-slate-500 px-6 text-sm">
          Built with ❤️ — clone-style landing for Note Plus
        </p>
      </footer>
    </main>
  );
};

export default DashboardPage;
