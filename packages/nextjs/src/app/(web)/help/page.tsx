import Link from 'next/link';

export const metadata = {
  title: 'Help & FAQ — Neighborhood Hub',
  description: 'Answers to the most common questions about using Neighborhood Hub.',
};

export default function HelpFaqPage() {
  const faqs = [
    {
      question: 'How do I offer a skill?',
      answer: 'Go to Skills → New Skill, fill in title, description, and category.',
    },
    {
      question: 'How do I request a skill?',
      answer: 'Open any skill listing and click "Request". The owner will accept or reject.',
    },
    {
      question: 'How do points work?',
      answer: 'You earn 10 points each time a skill exchange is marked as complete by both parties.',
    },
    {
      question: 'What happens after I request a tool?',
      answer: 'The owner reviews your request and approves or rejects it. You\'ll get a notification.',
    },
    {
      question: 'Can I cancel a request?',
      answer: 'Yes — open My Requests and use the Cancel button. A reason is required for accepted requests.',
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Use the "Report" button on any listing or message.',
    },
    {
      question: 'Is my location data private?',
      answer: 'Yes. We only store neighborhood-level location (no exact address or GPS coordinates).',
    },
    {
      question: 'How do I delete my account?',
      answer: 'Go to Profile → Edit Profile → scroll to the bottom and use "Delete Account".',
    },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto py-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Help & FAQ</h1>
        </section>

        <section className="mt-12 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {faqs.map((item, index) => (
            <div key={item.question} className="border-b border-gray-200 p-6 last:border-b-0">
              <p className="font-semibold text-gray-900">{index + 1}. {item.question}</p>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </div>
          ))}
        </section>

        <footer className="mt-10 text-gray-600">
          Still need help?{' '}
          <Link href="/contact" className="text-green-700 underline underline-offset-4">
            Contact us
          </Link>
        </footer>
    </div>
  );
}
