import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import NewToolForm from './new-tool-form'

export const dynamic = 'force-dynamic'

export default async function NewToolPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/tools/new')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/tools/new')

  const [cats, locs] = await Promise.all([
    queryCategories(),
    queryLocations(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">List a tool</h1>
      <NewToolForm categories={cats} locations={locs} />
    </div>
  )
}
