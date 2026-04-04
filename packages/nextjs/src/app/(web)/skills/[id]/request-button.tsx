'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth'

interface Props {
  skill: { id: string; ownerId: string; status: string }
}

export default function RequestButton({ skill }: Props) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <Link
        href={`/login?next=/skills/${skill.id}`}
        className="block w-full text-center bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Log in to request this skill
      </Link>
    )
  }

  if (user.id === skill.ownerId) {
    return (
      <p className="text-center text-sm text-gray-400 py-2">This is your skill listing.</p>
    )
  }

  if (skill.status !== 'available') {
    return (
      <p className="text-center text-sm text-gray-400 py-2">
        This skill is currently unavailable.
      </p>
    )
  }

  return (
    <button
      disabled
      title="Skill requests coming soon"
      className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium opacity-60 cursor-not-allowed"
    >
      Request this skill
    </button>
  )
}
