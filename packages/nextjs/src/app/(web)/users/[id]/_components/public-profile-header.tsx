import Image from 'next/image'

type PublicProfileHeaderProps = {
  name: string | null
  avatarUrl: string | null
  location: string | null
  bio: string | null
}

export function PublicProfileHeader({ name, avatarUrl, location, bio }: PublicProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 shrink-0 overflow-hidden border border-gray-100">
          {avatarUrl
            ? <Image src={avatarUrl} alt={name ?? 'Avatar'} width={64} height={64} unoptimized className="w-full h-full object-cover" />
            : (name?.[0] ?? '?').toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{name ?? 'Neighbor'}</h1>
          {location && <p className="text-sm text-gray-500 mt-0.5">📍 {location}</p>}
          {bio && <p className="text-sm text-gray-700 mt-3 leading-relaxed">{bio}</p>}
        </div>
      </div>
    </div>
  )
}