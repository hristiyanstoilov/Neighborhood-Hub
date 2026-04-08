import Link from 'next/link'

export function ProfilePageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="flex gap-2">
        <Link
          href="/profile/skills"
          className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          My Skills
        </Link>
        <Link
          href="/profile/edit"
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
        >
          Edit profile
        </Link>
      </div>
    </div>
  )
}