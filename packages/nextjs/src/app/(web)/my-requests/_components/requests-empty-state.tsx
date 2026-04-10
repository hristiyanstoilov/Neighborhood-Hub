import Link from 'next/link'

type Role = 'requester' | 'owner'

export function RequestsEmptyState({ role }: { role: Role }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-base">
        {role === 'requester'
          ? "You haven't sent any skill requests yet."
          : "You haven't received any skill requests yet."}
      </p>
      {role === 'requester' && (
        <Link
          href="/skills"
          className="mt-4 inline-block text-sm text-green-700 hover:underline"
        >
          Browse skills
        </Link>
      )}
    </div>
  )
}
