import Link from 'next/link'
import { EmptyState } from '@/components/ui/async-states'

type PublicProfileSkill = {
  id: string
  title: string
  imageUrl: string | null
  categoryLabel: string | null
}

type PublicProfileSkillsProps = {
  skills: PublicProfileSkill[]
}

export function PublicProfileSkills({ skills }: PublicProfileSkillsProps) {
  return (
    <>
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        Skills offered
        {skills.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-400">({skills.length})</span>
        )}
      </h2>

      {skills.length === 0 ? (
        <EmptyState title="No available skills at the moment." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
            >
              {skill.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={skill.imageUrl} alt={skill.title} className="w-full h-24 object-cover" />
              )}
              <div className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{skill.title}</p>
                  {skill.categoryLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">{skill.categoryLabel}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  available
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}