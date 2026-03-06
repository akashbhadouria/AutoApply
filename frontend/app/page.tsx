import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
      <section className="grid gap-8 md:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Job Hunter System</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-ink md:text-6xl">
            Profile data is the control plane for every automated application flow.
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            This initial slice ships the dynamic Profile Manager that later ATS, referral, and self-learning workers will use as their single source of truth.
          </p>
          <Link
            className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-accentDark"
            href="/profile"
          >
            Open Profile Manager
          </Link>
        </div>
        <div className="rounded-[32px] border border-border bg-panel p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Implemented now</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>Dynamic key-value profile storage in PostgreSQL</li>
            <li>Express API for upsert and delete flows</li>
            <li>Next.js dashboard page with inline management</li>
            <li>Docs and quickstart for local setup</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

