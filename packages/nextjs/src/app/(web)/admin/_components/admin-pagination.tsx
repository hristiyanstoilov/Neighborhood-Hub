type AdminPaginationProps = {
  page: number
  hasNext: boolean
  prevHref: string
  nextHref: string
}

export function AdminPagination({ page, hasNext, prevHref, nextHref }: AdminPaginationProps) {
  return (
    <div className="flex justify-between mt-4 text-sm">
      {page > 1
        ? <a href={prevHref} className="text-green-700 hover:underline">← Previous</a>
        : <span />}
      {hasNext
        ? <a href={nextHref} className="text-green-700 hover:underline">Next →</a>
        : <span />}
    </div>
  )
}