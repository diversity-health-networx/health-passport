import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main class="page-wrap px-4 pb-8 pt-14">
      <section class="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 border border-[var(--sea-ink)]">
        <div class="pointer-events-none absolute -left-20 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div class="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p class="island-kicker mb-3">Health Passport</p>
        <h1 class="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Form Orchestration Platform
        </h1>
        <p class="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Secure, distributed form handling with admin analytics.
        </p>
        <div class="flex flex-wrap gap-3">
          <Link
            to="/admin/forms"
            class="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)] hover:border-[var(--sea-ink)]"
          >
            Admin Dashboard
          </Link>
          <Link
            to="/admin/create"
            class="rounded-full border border-[rgba(50,143,151,0.3)] bg-white/20 px-5 py-2.5 text-sm font-semibold text-[rgb(79,184,178)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--sea-ink)]"
          >
            Create Form
          </Link>
        </div>
      </section>

      <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ">
        {[
          ['D1 Database', 'Cloudflare edge-replicated SQLite for distributed data storage.'],
          ['Secure Auth', 'Magic link authentication for administrators.'],
          ['Postmark', 'Reliable email delivery for notifications.'],
          ['UUIDv7', 'Chronologically sortable temporal identifiers.'],
        ].map(([title, desc], index) => (
          <article
            class="island-shell feature-card rise-in rounded-2xl p-5 border border-[var(--sea-ink)]"
            style={{ 'animation-delay': `${index * 90 + 80}ms` }}
          >
            <h2 class="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p class="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}