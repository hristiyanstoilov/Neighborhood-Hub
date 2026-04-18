const STEPS = [
  {
    number: '1',
    title: 'Create an account',
    description: 'Sign up in under a minute. Verify your email and set up your profile with your neighborhood.',
  },
  {
    number: '2',
    title: 'Browse or offer',
    description: 'Post a skill you can teach, list a tool to lend, or join a community drive near you.',
  },
  {
    number: '3',
    title: 'Connect with neighbors',
    description: 'Send a request, agree on a time, and meet the people who live around you.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">How it works</h2>
      <p className="text-center text-gray-500 mb-10 text-sm max-w-md mx-auto">
        Getting started takes 3 steps.
      </p>

      <div className="grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-lg mb-4 shrink-0">
              {step.number}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
