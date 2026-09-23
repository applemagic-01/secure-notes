import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Share2,
} from "lucide-react";

import { SecureNotesLogo } from "@/components/app/brand/secure-notes-logo";
import { GlassBackground } from "@/components/app/background/glass-background";

export default function Home() {
  // The root page introduces Secure Notes and gives unauthenticated
  // users a clear path to either sign in or create an account.
  //
  // The actual note management experience lives behind authentication,
  // so this page intentionally stays focused on the product and its
  // security model.

  return (
    <GlassBackground>
      <main className="min-h-screen px-6 py-8 text-white sm:px-10 lg:px-16">
        {/* Brand and authentication actions */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            aria-label="Secure Notes home"
          >
            <SecureNotesLogo />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-white/15"
            >
              Create account
            </Link>
          </div>
        </header>

        {/* Main product introduction */}
        <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-7xl items-center justify-center py-20">
          <div className="w-full max-w-4xl text-center">
            {/* Small product label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4" />
              Secure note sharing
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Share sensitive notes
              <span className="block bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                with control.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              Create private notes and share them through secure links with
              optional passwords, expiration, one-time access, and revocation.
            </p>

            {/* Primary actions */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-medium text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
            </div>

            {/* Security capabilities */}
            <div className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<LockKeyhole className="h-5 w-5" />}
                title="Protected access"
                description="Use password-protected share links when a public link is not appropriate."
              />

              <FeatureCard
                icon={<Share2 className="h-5 w-5" />}
                title="Controlled sharing"
                description="Create one-time or time-based links and revoke them whenever needed."
              />

              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Security first"
                description="Sensitive credentials and share secrets are protected instead of stored in plain text."
              />
            </div>
          </div>
        </section>

        {/* Small footer */}
        <footer className="mx-auto w-full max-w-7xl border-t border-white/10 py-6 text-center text-sm text-white/40">
          Secure Notes · Private note sharing
        </footer>
      </main>
    </GlassBackground>
  );
}

/**
 * Keeps the feature cards visually consistent while making the
 * landing page easier to scan and maintain.
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md transition hover:bg-white/[0.07]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
        {icon}
      </div>

      <h2 className="text-sm font-semibold text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
    </div>
  );
}