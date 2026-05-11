import Link from 'next/link';

export const metadata = {
  title: 'For Municipalities — Neighborhood Hub',
  description:
    'Partner with Neighborhood Hub to empower your citizens with skill sharing, community drives, and local events.',
};

export default function ForMunicipalitiesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            For Municipalities
          </h1>
          <p className="text-lg text-gray-600">
            Empower your citizens with neighborhood-level digital infrastructure
          </p>
        </section>

        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">What We Offer</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Skill Sharing Network</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Help neighbors exchange knowledge, request help, and build stronger local connections.
              </p>
            </article>
            <article className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Community Drives</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Organize donation campaigns, volunteer efforts, and civic initiatives in one place.
              </p>
            </article>
            <article className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Local Events Platform</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Promote neighborhood events, gather attendees, and keep communities informed.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Why Partner With Us</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
              <span>Free for citizens</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
              <span>GDPR-compliant</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
              <span>Bulgarian language support</span>
            </li>
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Get in Touch</h2>
          <p className="mt-3 text-gray-600">
            Let&apos;s discuss how Neighborhood Hub can support your municipality with practical, community-focused digital services.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex rounded-lg bg-green-700 px-6 py-3 text-white transition hover:bg-green-800"
            >
              Contact us →
            </Link>
          </div>
        </section>
    </div>
  );
}
