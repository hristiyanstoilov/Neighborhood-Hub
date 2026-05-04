import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing your use of Neighborhood Hub.',
}

const LAST_UPDATED = '2026-05-03'
const CONTACT_EMAIL = 'hello@neighborhoodhub.bg'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By creating an account or using Neighborhood Hub (&ldquo;the platform&rdquo;, &ldquo;the service&rdquo;),
            you agree to be bound by these Terms of Service and our{' '}
            <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>.
            If you do not agree, do not use the platform.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            We may update these terms from time to time. Continued use after changes constitutes
            acceptance. We will notify registered users of material changes by email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. What Neighborhood Hub is</h2>
          <p className="text-gray-600 leading-relaxed">
            Neighborhood Hub is a community platform that enables neighbors to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
            <li>Offer and request skills (tutoring, repairs, handcraft, etc.)</li>
            <li>Share and borrow tools and equipment</li>
            <li>Share surplus food before it goes to waste</li>
            <li>Organise and participate in local events and community drives</li>
            <li>Connect and communicate with people in their neighborhood</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-2">
            Neighborhood Hub is a facilitator — we do not provide any services ourselves and are
            not a party to any agreement between users. All arrangements are made directly between
            community members.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Eligibility</h2>
          <p className="text-gray-600 leading-relaxed">
            You must be at least <strong>16 years old</strong> to create an account. By registering,
            you confirm that you meet this requirement. If we discover a user is under 16, we will
            delete the account promptly.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            You must be a human individual (not an automated system or bot). Corporate or
            business accounts are not permitted without prior written consent from us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Your account</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>You are responsible for keeping your login credentials secure.</li>
            <li>You may not share your account with others.</li>
            <li>You must provide accurate information during registration.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>Notify us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>{' '}
              if you suspect unauthorized access.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Acceptable use</h2>
          <p className="text-gray-600 leading-relaxed mb-2">You agree <strong>not to</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Post false, misleading, or fraudulent listings</li>
            <li>Use the platform for commercial advertising or spam</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Upload illegal content or content that infringes third-party rights</li>
            <li>Attempt to scrape, reverse-engineer, or overload the platform</li>
            <li>Create multiple accounts to circumvent a ban or limit</li>
            <li>Use the AI assistant to generate harmful, illegal, or deceptive content</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-2">
            We reserve the right to remove content or suspend accounts that violate these rules,
            at our sole discretion and without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. User content</h2>
          <p className="text-gray-600 leading-relaxed">
            You retain ownership of content you post (listings, images, messages). By posting,
            you grant Neighborhood Hub a non-exclusive, worldwide, royalty-free licence to store,
            display, and reproduce that content solely for the purpose of operating the platform.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            You confirm that you have the right to share any content you post, and that it does
            not infringe copyright, privacy, or any other rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Platform rules by module</h2>
          <div className="space-y-3 text-gray-600">
            <p><strong>Skills:</strong> Listings must accurately describe the skill offered. No payment may be requested — all skills must be offered free of charge or in exchange for another skill.</p>
            <p><strong>Tools:</strong> Lenders are responsible for ensuring items are safe to use. Borrowers must return items in the same condition. Any damage is a matter between the users concerned.</p>
            <p><strong>Food sharing:</strong> Only safe, unexpired food may be listed. You are responsible for labeling allergens. We do not accept liability for any health issues arising from shared food.</p>
            <p><strong>Events &amp; drives:</strong> Event organisers are responsible for the accuracy of event details and for complying with all applicable laws regarding public gatherings.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. AI assistant</h2>
          <p className="text-gray-600 leading-relaxed">
            The AI assistant is powered by Claude (Anthropic). Responses are generated automatically
            and may contain errors. They do not constitute professional advice (legal, medical,
            financial, or otherwise). Your chat messages are processed by Anthropic in accordance
            with their{' '}
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">privacy policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Disclaimers and limitation of liability</h2>
          <p className="text-gray-600 leading-relaxed">
            The platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind.
            We do not guarantee uninterrupted availability or error-free operation.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            To the maximum extent permitted by law, Neighborhood Hub is not liable for any indirect,
            incidental, or consequential damages arising from your use of the platform or from
            interactions with other users, including disputes over skills, tools, food, or events.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Nothing in these terms excludes or limits liability that cannot be excluded under
            applicable EU or Bulgarian consumer protection law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Account termination</h2>
          <p className="text-gray-600 leading-relaxed">
            You may delete your account at any time from your profile settings. Your data will be
            soft-deleted immediately and permanently purged after 30 days (see our{' '}
            <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>).
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            We may suspend or terminate your account if you violate these terms. We will notify
            you by email unless doing so would compromise security or is prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Governing law</h2>
          <p className="text-gray-600 leading-relaxed">
            These terms are governed by Bulgarian law. Any disputes shall be subject to the
            exclusive jurisdiction of the Bulgarian courts, without prejudice to your rights as
            a consumer under EU law. If you are based in another EU member state, you retain the
            right to bring proceedings in the courts of your country of residence.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Contact</h2>
          <p className="text-gray-600">
            Questions about these terms:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
          <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>
          {' · '}
          <Link href="/contact" className="text-green-700 hover:underline">Contact</Link>
        </div>
      </div>
    </div>
  )
}
