import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Neighborhood Hub collects, uses, and protects your personal data.',
}

const LAST_UPDATED = '2026-05-03'
const CONTACT_EMAIL = 'privacy@neighborhoodhub.bg'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Who we are</h2>
          <p className="text-gray-600 leading-relaxed">
            Neighborhood Hub (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a community platform for sharing skills, tools,
            food, and organising local events. This Privacy Policy explains how we collect, use,
            store, and protect your personal data in accordance with Regulation (EU) 2016/679
            (GDPR) and Bulgarian data protection law.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Data controller contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Data we collect</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Category</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Data</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Legal basis</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Account</td>
                  <td className="px-3 py-2 border border-gray-200">Name, email address, hashed password, email verification status</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(b) — contract</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">Profile</td>
                  <td className="px-3 py-2 border border-gray-200">Display name, bio, avatar image, neighborhood/city, public/private preference</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(b) — contract</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Listings</td>
                  <td className="px-3 py-2 border border-gray-200">Skill listings, tool listings, food shares, event and drive details, images you upload</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(b) — contract</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">Activity</td>
                  <td className="px-3 py-2 border border-gray-200">Requests, reservations, RSVPs, pledges, ratings, messages, notifications</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(b) — contract</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">AI chat</td>
                  <td className="px-3 py-2 border border-gray-200">Messages you send to the AI assistant, AI responses (stored for session history)</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(b) — contract</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">Technical</td>
                  <td className="px-3 py-2 border border-gray-200">IP address (for rate limiting and security), session tokens, browser/device info</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(f) — legitimate interest (security)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Analytics</td>
                  <td className="px-3 py-2 border border-gray-200">Page views, click events, feature usage (PostHog, anonymised where possible)</td>
                  <td className="px-3 py-2 border border-gray-200">Art. 6(1)(a) — consent (cookie banner)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How we use your data</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Provide and operate the Neighborhood Hub platform</li>
            <li>Send transactional emails (email verification, password reset, notifications)</li>
            <li>Display your profile and listings to other community members</li>
            <li>Match skill requests, tool reservations, food shares, and event RSVPs</li>
            <li>Provide the AI assistant feature (your messages are processed by Anthropic)</li>
            <li>Detect and prevent abuse, fraud, and security threats</li>
            <li>Improve the platform based on anonymised usage analytics (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Third-party processors</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We share data with the following processors, each bound by a Data Processing Agreement:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Processor</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Purpose</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-700">Location</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Neon (database)</td>
                  <td className="px-3 py-2 border border-gray-200">Primary data storage</td>
                  <td className="px-3 py-2 border border-gray-200">EU (Frankfurt)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">Netlify (hosting)</td>
                  <td className="px-3 py-2 border border-gray-200">Web app and API hosting</td>
                  <td className="px-3 py-2 border border-gray-200">US (SCCs apply)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Cloudflare R2 (storage)</td>
                  <td className="px-3 py-2 border border-gray-200">Image and file uploads</td>
                  <td className="px-3 py-2 border border-gray-200">EU region</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">Resend (email)</td>
                  <td className="px-3 py-2 border border-gray-200">Transactional email delivery</td>
                  <td className="px-3 py-2 border border-gray-200">US (SCCs apply)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">PostHog (analytics)</td>
                  <td className="px-3 py-2 border border-gray-200">Usage analytics (consent-gated)</td>
                  <td className="px-3 py-2 border border-gray-200">EU (eu.i.posthog.com)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200 font-medium">Anthropic (AI)</td>
                  <td className="px-3 py-2 border border-gray-200">AI assistant — your chat messages are processed by Claude</td>
                  <td className="px-3 py-2 border border-gray-200">US (SCCs apply)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-200">Upstash (Redis)</td>
                  <td className="px-3 py-2 border border-gray-200">Rate limiting (IP addresses only)</td>
                  <td className="px-3 py-2 border border-gray-200">EU region</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-xs mt-2">SCCs = Standard Contractual Clauses (GDPR-compliant basis for data transfers to third countries)</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data retention</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Active accounts:</strong> retained for the lifetime of your account</li>
            <li><strong>Deleted accounts:</strong> soft-deleted immediately; hard-purged after 30 days</li>
            <li><strong>AI chat messages:</strong> retained for 12 months, then deleted</li>
            <li><strong>Audit log entries:</strong> retained for 24 months for security purposes</li>
            <li><strong>Analytics data:</strong> retained per PostHog&apos;s policy (1 year on EU instance)</li>
            <li><strong>Security logs (IP, failed logins):</strong> retained for 90 days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your rights (GDPR Art. 15–22)</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Access (Art. 15):</strong> Request a copy of all personal data we hold about you.</p>
            <p><strong>Rectification (Art. 16):</strong> Correct inaccurate data via your profile settings.</p>
            <p><strong>Erasure (Art. 17):</strong> Delete your account — your data is hard-purged after 30 days.</p>
            <p><strong>Portability (Art. 20):</strong> Request a machine-readable export of your data.</p>
            <p><strong>Restriction (Art. 18):</strong> Request we restrict processing in certain circumstances.</p>
            <p><strong>Objection (Art. 21):</strong> Object to processing based on legitimate interest.</p>
            <p><strong>Withdraw consent:</strong> Withdraw analytics consent at any time via the cookie banner.</p>
          </div>
          <p className="text-gray-600 mt-3">
            To exercise any right, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>.
            We will respond within 30 days. You also have the right to lodge a complaint with the
            Bulgarian Commission for Personal Data Protection (KZLD) at{' '}
            <a href="https://www.cpdp.bg" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">cpdp.bg</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use one analytics cookie (PostHog) which requires your consent. It is off by default.
            You can accept or decline via the banner shown on your first visit, and change your
            preference at any time by clearing your browser storage for this site.
            We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Children</h2>
          <p className="text-gray-600 leading-relaxed">
            Neighborhood Hub is not intended for users under 16. By registering, you confirm you
            are at least 16 years old. If you believe a child has registered, please contact us
            at <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a> and
            we will delete the account promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to this policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy. When we make material changes we will update the
            &ldquo;Last updated&rdquo; date and, where required by law, notify you by email or in-app notice.
            Continued use of the platform after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact</h2>
          <p className="text-gray-600">
            Data protection enquiries:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
          <Link href="/terms" className="text-green-700 hover:underline">Terms of Service</Link>
          {' · '}
          <Link href="/contact" className="text-green-700 hover:underline">Contact</Link>
        </div>
      </div>
    </div>
  )
}
