import Link from 'next/link'
import { driveStatusClass, eventStatusClass, formatDate, formatDateTime, humanizeValue } from '@/lib/format'

export type SkillSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  ownerName: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

export type ToolSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  condition: string | null
  ownerName: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

export type EventSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  startsAt: string
  address: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

export type DriveSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  driveType: string
  deadline: string | null
}

export type FoodSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  quantity: number
  availableUntil: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

type SearchResultCardProps =
  | { type: 'skills'; item: SkillSearchResult }
  | { type: 'tools'; item: ToolSearchResult }
  | { type: 'events'; item: EventSearchResult }
  | { type: 'drives'; item: DriveSearchResult }
  | { type: 'food'; item: FoodSearchResult }

function locationLabel(neighborhood: string | null, city: string | null) {
  if (!neighborhood && !city) return null
  if (!neighborhood) return city
  if (!city) return neighborhood
  return `${neighborhood}, ${city}`
}

export function SearchResultCard(props: SearchResultCardProps) {
  if (props.type === 'skills') {
    const location = locationLabel(props.item.locationNeighborhood, props.item.locationCity)

    return (
      <Link href={`/skills/${props.item.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{props.item.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{props.item.ownerName ?? 'Neighbor'}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{humanizeValue(props.item.status)}</span>
        </div>
        {props.item.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{props.item.description}</p>}
        {location && <p className="mt-2 text-xs text-gray-500">{location}</p>}
      </Link>
    )
  }

  if (props.type === 'tools') {
    const location = locationLabel(props.item.locationNeighborhood, props.item.locationCity)

    return (
      <Link href={`/tools/${props.item.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{props.item.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{props.item.ownerName ?? 'Neighbor'}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{humanizeValue(props.item.condition)}</span>
        </div>
        {props.item.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{props.item.description}</p>}
        <div className="mt-2 flex gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{humanizeValue(props.item.status)}</span>
          {location && <span className="text-gray-500">{location}</span>}
        </div>
      </Link>
    )
  }

  if (props.type === 'events') {
    const location = locationLabel(props.item.locationNeighborhood, props.item.locationCity)

    return (
      <Link href={`/events/${props.item.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{props.item.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${eventStatusClass(props.item.status)}`}>
            {humanizeValue(props.item.status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">Starts: {formatDateTime(props.item.startsAt)}</p>
        {props.item.address && <p className="mt-1 text-sm text-gray-600">{props.item.address}</p>}
        {location && <p className="mt-1 text-xs text-gray-500">{location}</p>}
      </Link>
    )
  }

  if (props.type === 'drives') {
    return (
      <Link href={`/drives/${props.item.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{props.item.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${driveStatusClass(props.item.status)}`}>
            {humanizeValue(props.item.status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">Type: {humanizeValue(props.item.driveType)}</p>
        {props.item.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{props.item.description}</p>}
        {props.item.deadline && <p className="mt-1 text-xs text-gray-500">Deadline: {formatDate(props.item.deadline)}</p>}
      </Link>
    )
  }

  const location = locationLabel(props.item.locationNeighborhood, props.item.locationCity)

  return (
    <Link href={`/food/${props.item.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{props.item.title}</h3>
        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">Qty: {props.item.quantity}</span>
      </div>
      {props.item.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{props.item.description}</p>}
      <div className="mt-2 flex gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{humanizeValue(props.item.status)}</span>
        {props.item.availableUntil && <span className="text-gray-500">Until {formatDate(props.item.availableUntil)}</span>}
      </div>
      {location && <p className="mt-1 text-xs text-gray-500">{location}</p>}
    </Link>
  )
}
