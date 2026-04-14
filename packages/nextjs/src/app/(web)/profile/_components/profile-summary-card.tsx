import Image from 'next/image'

type ProfileSummaryCardProps = {
  user: {
    email: string
    role: string
    emailVerifiedAt: string | null
    profile?: {
      avatarUrl?: string | null
      name?: string | null
      bio?: string | null
      isPublic?: boolean | null
    } | null
  }
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        {user.profile?.avatarUrl ? (
          <Image
            src={user.profile.avatarUrl}
            alt={user.profile.name ?? 'Avatar'}
            width={56}
            height={56}
            unoptimized
            className="w-14 h-14 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
            {(user.profile?.name ?? user.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{user.profile?.name ?? '—'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <dl className="divide-y divide-gray-100 text-sm">
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
        </div>
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">Email verified</dt>
          <dd className={user.emailVerifiedAt ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
            {user.emailVerifiedAt ? 'Yes' : 'Not verified'}
          </dd>
        </div>
        <div className="py-3 flex justify-between">
          <dt className="text-gray-500">Profile visibility</dt>
          <dd className="font-medium">
            {user.profile?.isPublic === false ? 'Private' : 'Public'}
          </dd>
        </div>
        {user.profile?.bio && (
          <div className="py-3">
            <dt className="text-gray-500 mb-1">Bio</dt>
            <dd className="text-gray-700">{user.profile.bio}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}