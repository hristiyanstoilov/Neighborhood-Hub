import type { Metadata } from 'next'
import { FeedList } from './_components/feed-list'

export const metadata: Metadata = {
  title: 'Neighborhood Feed',
}

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Neighborhood Feed</h1>
        <p className="mt-1 text-sm text-gray-600">Recent activity across skills, tools, food, drives, and events.</p>
      </div>
      <FeedList />
    </div>
  )
}
