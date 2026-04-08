import Link from 'next/link'
import { Skill } from './types'

type SkillsGridProps = {
  skills: Skill[]
}

export function SkillsGrid({ skills }: SkillsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <Link
          key={skill.id}
          href={`/skills/${skill.id}`}
          className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
        >
          {skill.imageUrl && (
            <img src={skill.imageUrl} alt={skill.title} className="w-full h-36 object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="font-semibold text-gray-900 line-clamp-2">{skill.title}</h2>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  skill.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : skill.status === 'busy'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {skill.status}
              </span>
            </div>

            {skill.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{skill.description}</p>}

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {skill.categoryLabel && <span>{skill.categoryLabel}</span>}
              {skill.locationNeighborhood && <span>{skill.locationNeighborhood}, {skill.locationCity}</span>}
              {skill.availableHours != null && <span>{skill.availableHours}h/week</span>}
            </div>

            {skill.ownerName && <p className="text-xs text-gray-400 mt-2">by {skill.ownerName}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}
