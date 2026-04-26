'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { ProfilePageHeader } from './_components/profile-page-header'
import { ProfileSummaryCard } from './_components/profile-summary-card'
import { ProfileEmailWarning } from './_components/profile-email-warning'
import { DangerZone } from './_components/danger-zone'
import { ProfilePageSkeleton } from '@/components/ui/skeletons'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="max-w-lg">
      <ProfilePageHeader />
      <ProfileSummaryCard user={user} />
      {!user.emailVerifiedAt && <ProfileEmailWarning />}
      <DangerZone />
    </div>
  )
}
