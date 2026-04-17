import { apiFetch } from '../api'

export interface DriveListItem {
  id: string
  title: string
  description: string | null
  driveType: string
  status: string
  deadline: string | null
  goalDescription: string | null
  organizerName: string | null
  organizerId: string
}

export interface DriveDetail extends DriveListItem {
  dropOffAddress: string | null
  pledgeCount: number
  updatedAt: string
}

export interface DrivePledge {
  id: string
  userId: string
  pledgeDescription: string
  status: string
  createdAt: string
  userName: string | null
}

export const drivesKeys = {
  all:     ['drives'] as const,
  list:    (status: string, driveType: string | null, page: number) =>
    [...drivesKeys.all, 'list', status, driveType ?? '', page] as const,
  detail:  (id: string)     => [...drivesKeys.all, 'detail', id] as const,
  pledges: (driveId: string) => [...drivesKeys.all, 'pledges', driveId] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchDrivesList(input: {
  status?: string
  driveType?: string | null
  page?: number
  limit?: number
}): Promise<{ data: DriveListItem[]; total: number; page: number }> {
  const params = new URLSearchParams({
    limit: String(input.limit ?? 20),
    page:  String(input.page ?? 1),
  })
  if (input.status)    params.set('status', input.status)
  if (input.driveType) params.set('driveType', input.driveType)

  const res = await apiFetch(`/api/drives?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))

  return {
    data:  (json.data ?? []) as DriveListItem[],
    total: typeof json.total === 'number' ? json.total : 0,
    page:  typeof json.page  === 'number' ? json.page  : 1,
  }
}

export async function fetchDriveDetail(id: string): Promise<DriveDetail> {
  const res = await apiFetch(`/api/drives/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return json.data as DriveDetail
}

export async function fetchDrivePledges(driveId: string): Promise<DrivePledge[]> {
  const res = await apiFetch(`/api/drives/${driveId}/pledges`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return (json.data ?? []) as DrivePledge[]
}
