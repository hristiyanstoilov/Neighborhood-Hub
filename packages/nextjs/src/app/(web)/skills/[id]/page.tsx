import Link from 'next/link'
import { notFound } from 'next/navigation'
import RequestButton from './request-button'

interface SkillDetail {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName: string | null
  ownerAvatar: string | null
  categoryLabel: string | null
  locationCity: string | null
  locationNeighborhood: string | null
}

async function getSkill(id: string): Promise<SkillDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/skills/${id}`,
    { cache: 'no-store' }
  )
  if (res.status === 404) return null
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const skill = await getSkill(id)

  if (!skill) notFound()

  return (
    <div className="max-w-2xl">
      <Link href="/skills" className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block">
        ← Back to Skills
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">{skill.title}</h1>
          <span
            className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
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

        {skill.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{skill.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Category</dt>
            <dd className="font-medium">{skill.categoryLabel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Availability</dt>
            <dd className="font-medium">{skill.availableHours} h / week</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Location</dt>
            <dd className="font-medium">
              {skill.locationNeighborhood
                ? `${skill.locationNeighborhood}, ${skill.locationCity}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Offered by</dt>
            <dd className="font-medium">{skill.ownerName ?? 'Anonymous'}</dd>
          </div>
        </dl>

        <RequestButton skill={skill} />
      </div>
    </div>
  )
}
