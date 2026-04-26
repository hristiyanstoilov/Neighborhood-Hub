import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { uuidSchema } from '@/lib/schemas/skill'
import { queryToolById } from '@/lib/queries/tools'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import ReserveButton from './reserve-button'
import ToolOwnerActions from './tool-owner-actions'
import { FlagButton } from '@/components/ui/flag-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return {}
  try {
    const tool = await queryToolById(id)
    if (!tool) return {}
    return {
      title: tool.title,
      description: tool.description ?? `Borrow this tool from a neighbor on Neighborhood Hub.`,
    }
  } catch { return {} }
}

const conditionLabel: Record<string, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  let tool = null
  let fetchError = false
  let currentUserId: string | null = null

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [toolResult, user] = await Promise.all([
      queryToolById(id),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    tool = toolResult
    currentUserId = user?.id ?? null
  } catch {
    fetchError = true
  }

  if (!fetchError && !tool) notFound()

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <Link href="/tools" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
          ← Back to Tools
        </Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load this tool.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const isOwner = currentUserId === tool!.ownerId

  return (
    <div className="max-w-2xl">
      <Link href="/tools" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
        ← Back to Tools
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">{tool!.title}</h1>
          <span
            className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
              tool!.status === 'available'
                ? 'bg-green-100 text-green-700'
                : tool!.status === 'on_loan'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {tool!.status === 'on_loan' ? 'On loan' : tool!.status === 'in_use' ? 'In use' : tool!.status}
          </span>
        </div>

        {tool!.imageUrl && (
          <Image
            src={tool!.imageUrl}
            alt={tool!.title}
            width={1200}
            height={560}
            unoptimized
            className="w-full h-56 object-cover rounded-lg mb-5 border border-gray-100"
          />
        )}

        {tool!.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{tool!.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Condition</dt>
            <dd className="font-medium">{tool!.condition ? (conditionLabel[tool!.condition] ?? tool!.condition) : '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Category</dt>
            <dd className="font-medium">{tool!.categoryLabel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Location</dt>
            <dd className="font-medium">
              {tool!.locationNeighborhood
                ? `${tool!.locationNeighborhood}, ${tool!.locationCity}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Listed by</dt>
            <dd className="font-medium">
              <Link href={`/users/${tool!.ownerId}`} className="hover:text-green-700 hover:underline">
                {tool!.ownerName ?? 'Anonymous'}
              </Link>
            </dd>
          </div>
        </dl>

        {isOwner && <ToolOwnerActions toolId={tool!.id} />}

        <ReserveButton
          toolId={tool!.id}
          toolTitle={tool!.title}
          isOwner={isOwner}
          isLoggedIn={currentUserId !== null}
          isAvailable={tool!.status === 'available'}
        />

        {currentUserId && !isOwner && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <FlagButton entityType="tool" entityId={tool!.id} />
          </div>
        )}
      </div>
    </div>
  )
}
