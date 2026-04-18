import { db } from '@/db'
import { users, skills, skillRequests, tools, toolReservations } from '@/db/schema'
import { count, eq, gte, isNull, and, sql } from 'drizzle-orm'
import { AdminPageHeader } from '../_components/admin-page-header'

export const dynamic = 'force-dynamic'

type StatCardProps = {
  label: string
  value: number | string
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-5 ${accent ? 'border-green-300' : 'border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

type BarChartProps = {
  title: string
  bars: { label: string; value: number; color: string }[]
}

function BarChart({ title, bars }: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 shrink-0 truncate">{bar.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${bar.color} transition-all`}
                style={{ width: `${Math.round((bar.value / max) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-6 text-right">{bar.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    [{ totalUsers }],
    [{ activeSkills }],
    [{ pendingRequests }],
    [{ availableTools }],
    [{ activeReservations }],
    [{ newUsers }],
    requestsByStatus,
    registrationsByDay,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ activeSkills: count() }).from(skills).where(isNull(skills.deletedAt)),
    db.select({ pendingRequests: count() }).from(skillRequests).where(eq(skillRequests.status, 'pending')),
    db.select({ availableTools: count() }).from(tools).where(and(isNull(tools.deletedAt), eq(tools.status, 'available'))),
    db.select({ activeReservations: count() }).from(toolReservations)
      .where(sql`${toolReservations.status} IN ('pending', 'approved')`),
    db.select({ newUsers: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
    db.select({ status: skillRequests.status, total: count() })
      .from(skillRequests)
      .groupBy(skillRequests.status),
    db.select({
      day: sql<string>`date_trunc('day', ${users.createdAt})::date::text`,
      total: count(),
    })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`)
      .orderBy(sql`date_trunc('day', ${users.createdAt})`),
  ])

  const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-yellow-400',
    accepted:  'bg-green-500',
    completed: 'bg-green-700',
    rejected:  'bg-red-400',
    cancelled: 'bg-gray-300',
  }

  const requestBars = requestsByStatus.map((r) => ({
    label: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: r.total,
    color: STATUS_COLORS[r.status] ?? 'bg-gray-400',
  }))

  // Fill missing days with 0 so chart always shows 7 bars
  // Use UTC date parts to match date_trunc('day', ...) which runs in UTC on Neon
  const dayBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    const found = registrationsByDay.find((r) => r.day === key)
    return { label, value: found?.total ?? 0, color: 'bg-green-500' }
  })

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Platform overview — live data"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users"         value={totalUsers}         sub="all time" />
        <StatCard label="Active Skills"        value={activeSkills}       sub="not deleted" />
        <StatCard label="Pending Requests"     value={pendingRequests}    sub="awaiting response" accent={pendingRequests > 0} />
        <StatCard label="Available Tools"      value={availableTools}     sub="ready to borrow" />
        <StatCard label="Active Reservations"  value={activeReservations} sub="pending + approved" />
        <StatCard label="New Users (7d)"       value={newUsers}           sub="last 7 days" accent={newUsers > 0} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BarChart
          title="Registrations — last 7 days"
          bars={dayBars}
        />
        <BarChart
          title="Skill requests by status"
          bars={requestBars.length > 0 ? requestBars : [{ label: 'No data', value: 0, color: 'bg-gray-200' }]}
        />
      </div>
    </div>
  )
}
