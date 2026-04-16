import Link from 'next/link'
import Image from 'next/image'
import { Tool } from './types'

const conditionLabel: Record<string, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
}

type ToolsGridProps = {
  tools: Tool[]
}

export function ToolsGrid({ tools }: ToolsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <Link
          key={tool.id}
          href={`/tools/${tool.id}`}
          className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
        >
          {tool.imageUrl && (
            <Image
              src={tool.imageUrl}
              alt={tool.title}
              width={640}
              height={288}
              unoptimized
              className="w-full h-36 object-cover"
            />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="font-semibold text-gray-900 line-clamp-2">{tool.title}</h2>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  tool.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : tool.status === 'on_loan'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tool.status === 'on_loan' ? 'On loan' : tool.status === 'in_use' ? 'In use' : tool.status}
              </span>
            </div>

            {tool.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{tool.description}</p>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {tool.condition && <span>{conditionLabel[tool.condition] ?? tool.condition}</span>}
              {tool.categoryLabel && <span>{tool.categoryLabel}</span>}
              {tool.locationNeighborhood && (
                <span>{tool.locationNeighborhood}, {tool.locationCity}</span>
              )}
            </div>

            {tool.ownerName && (
              <p className="text-xs text-gray-400 mt-2">by {tool.ownerName}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
