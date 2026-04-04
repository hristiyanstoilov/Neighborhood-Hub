import Link from 'next/link'
import { notFound } from 'next/navigation'
import { uuidSchema } from '@/lib/schemas/skill'
import { querySkillById } from '@/lib/queries/skills'
import RequestButton from './request-button'

export const dynamic = 'force-dynamic'

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  let skill = null
  let fetchError = false

  try {
    skill = await querySkillById(id)
  } catch {
    fetchError = true
  }

  if (!fetchError && !skill) notFound()

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <Link href="/skills" className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block">
          ← Back to Skills
        </Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load this skill.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link href="/skills" className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block">
        ← Back to Skills
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">{skill!.title}</h1>
          <span
            className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
              skill!.status === 'available'
                ? 'bg-green-100 text-green-700'
                : skill!.status === 'busy'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {skill!.status}
          </span>
        </div>

        {skill!.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{skill!.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Category</dt>
            <dd className="font-medium">{skill!.categoryLabel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Availability</dt>
            <dd className="font-medium">{skill!.availableHours != null ? `${skill!.availableHours} h / week` : '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Location</dt>
            <dd className="font-medium">
              {skill!.locationNeighborhood
                ? `${skill!.locationNeighborhood}, ${skill!.locationCity}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Offered by</dt>
            <dd className="font-medium">{skill!.ownerName ?? 'Anonymous'}</dd>
          </div>
        </dl>

        <RequestButton skill={skill!} />
      </div>
    </div>
  )
}
