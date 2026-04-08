import Link from 'next/link'

type ErrorStateProps = {
  title?: string
  message?: string
  actionLabel?: string
  actionHref?: string
}

type EmptyStateProps = {
  title?: string
  message?: string
  actionLabel?: string
  actionHref?: string
}

export function ErrorState({
  title = 'Something went wrong.',
  message = 'Please try refreshing the page.',
  actionLabel,
  actionHref,
}: ErrorStateProps) {
  return (
    <div className="text-center py-24 text-gray-500">
      <p className="text-lg mb-2">{title}</p>
      <p className="text-sm">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block text-sm text-green-700 hover:underline mt-3">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export function EmptyState({
  title = 'No items found.',
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-24 text-gray-500">
      <p className="text-lg mb-2">{title}</p>
      {message && <p className="text-sm">{message}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block text-sm text-green-700 hover:underline mt-3">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
