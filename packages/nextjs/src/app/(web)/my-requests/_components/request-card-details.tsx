import type { SkillRequestRow } from '@/lib/queries/skill-requests'
import { formatDateTime, formatMeetingType } from '@/lib/format'

export function RequestCardDetails({ request }: { request: SkillRequestRow }) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4">
        <div>
          <dt className="text-gray-400 text-xs">Start</dt>
          <dd className="text-gray-700">{formatDateTime(request.scheduledStart)}</dd>
        </div>
        <div>
          <dt className="text-gray-400 text-xs">End</dt>
          <dd className="text-gray-700">{formatDateTime(request.scheduledEnd)}</dd>
        </div>
        <div>
          <dt className="text-gray-400 text-xs">Meeting</dt>
          <dd className="text-gray-700">{formatMeetingType(request.meetingType)}</dd>
        </div>
        {request.meetingUrl && (
          <div>
            <dt className="text-gray-400 text-xs">Link</dt>
            <dd>
              <a
                href={request.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline text-sm truncate block max-w-[180px]"
              >
                Open link
              </a>
            </dd>
          </div>
        )}
      </dl>

      {request.notes && (
        <p className="text-sm text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-3">
          {request.notes}
        </p>
      )}

      {request.cancellationReason && (
        <p className="text-sm text-red-500 mb-3">
          Cancellation reason: {request.cancellationReason}
        </p>
      )}
    </>
  )
}
