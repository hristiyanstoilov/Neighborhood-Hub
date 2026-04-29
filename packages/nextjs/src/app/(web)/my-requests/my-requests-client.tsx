'use client'

import { useTranslations } from 'next-intl'
import RequestCard from './request-card'
import {
  RoleTabs,
  RequestsEmptyState,
  RequestsLoadingState,
  RequestsErrorState,
} from './_components'
import { useSkillRequests, type RequestsRole } from './_hooks'

export function MyRequestsClient({ role, viewerId }: { role: RequestsRole; viewerId: string }) {
  const t = useTranslations('my_requests')
  const query = useSkillRequests(viewerId, role)

  const requests = query.data ?? []

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <RoleTabs role={role} />

      {query.isLoading ? (
        <RequestsLoadingState />
      ) : query.isError ? (
        <RequestsErrorState onRetry={() => query.refetch()} />
      ) : requests.length === 0 ? (
        <RequestsEmptyState role={role} />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} viewerId={viewerId} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}
