import Link from 'next/link'
import Logo from '@/components/logo'

export default function Home() {
  return (
    <main className="flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 rounded-full bg-indigo-300 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="flex justify-center mb-8">
            <Logo size={64} withText={false} className="opacity-90" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Share skills.<br className="hidden sm:block" /> Build community.
          </h1>
          <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10">
            Neighborhood Hub connects neighbors in Sofia — offer your skills, find help nearby, and strengthen your community one swap at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/skills"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
            >
              Browse skills
            </Link>
            <Link
              href="/register"
              className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-400 border border-blue-400 transition-colors"
            >
              Join the community
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20 w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Offer a skill',
              description: 'List something you\'re good at — cooking, coding, language lessons, repairs, and more.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
            },
            {
              step: '02',
              title: 'Find a neighbor',
              description: 'Browse skills available in your neighborhood and request the help you need.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Swap & connect',
              description: 'Exchange time and skills with people nearby. No money — just community.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ),
            },
          ].map(({ step, title, description, icon }) => (
            <div key={step} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                {icon}
              </div>
              <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">{step}</span>
              <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ready to get started?</h2>
            <p className="text-sm text-gray-500 mt-1">Join neighbors already sharing skills across Sofia.</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create free account
          </Link>
        </div>
      </section>

    </main>
  )
}
