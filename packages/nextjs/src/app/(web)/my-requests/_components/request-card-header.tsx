import Link from 'next/link'
import { formatRequestStatus } from '@/lib/format'

type RequestCardHeaderProps = {
  skillId: string
  skillTitle: string
  isOwner: boolean
  otherName: string | null
  status: string
  statusClassName: string
}

export function RequestCardHeader({
  skillId,
  skillTitle,
  isOwner,
  otherName,
  status,
  statusClassName,
}: RequestCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <Link
          href={`/skills/${skillId}`}
          className="font-semibold text-gray-900 hover:text-green-700 transition-colors"
        >
          {skillTitle}
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">
          {isOwner ? 'From' : 'To'}: {otherName ?? 'Unknown user'}
        </p>
      </div>
      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${statusClassName}`}>
        {formatRequestStatus(status)}
      </span>
    </div>
  )
}
