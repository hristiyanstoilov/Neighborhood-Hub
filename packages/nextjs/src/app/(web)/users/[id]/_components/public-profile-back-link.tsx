import Link from 'next/link'

export function PublicProfileBackLink() {
  return (
    <Link href="/skills" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
      ← Browse skills
    </Link>
  )
}