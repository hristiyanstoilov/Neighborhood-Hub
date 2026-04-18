const FEATURES = [
  {
    icon: '🤝',
    title: 'Share Skills',
    description:
      'Offer what you know — cooking, languages, IT, home repair. Find a neighbor who has exactly what you need.',
  },
  {
    icon: '🔧',
    title: 'Lend Tools',
    description:
      'Borrow a drill, ladder, or espresso machine from someone nearby. No need to buy something you\'ll use once.',
  },
  {
    icon: '📅',
    title: 'Local Events',
    description:
      'Discover and attend events organised by your neighbors — clean-ups, block parties, skill swaps, and more.',
  },
  {
    icon: '🫶',
    title: 'Community Drives',
    description:
      'Coordinate clothing donations, food collections, and neighborhood initiatives — all in one place.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Everything your neighborhood needs
      </h2>
      <p className="text-center text-gray-500 mb-10 text-sm max-w-md mx-auto">
        One platform for skills, tools, and community action — no money, no strangers, just neighbors.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center hover:border-green-300 hover:shadow-sm transition-all"
          >
            <span className="text-4xl mb-4">{f.icon}</span>
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
