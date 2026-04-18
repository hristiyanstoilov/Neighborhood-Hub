'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateReservation } from './_hooks/use-create-reservation'

type ReserveButtonProps = {
  toolId: string
  toolTitle: string
  isOwner: boolean
  isLoggedIn: boolean
  isAvailable: boolean
}

export default function ReserveButton({
  toolId,
  toolTitle,
  isOwner,
  isLoggedIn,
  isAvailable,
}: ReserveButtonProps) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [startDate, setStart]   = useState('')
  const [endDate, setEnd]       = useState('')
  const [notes, setNotes]       = useState('')
  const reservation             = useCreateReservation()

  const handleClose = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (isOwner) return null
  if (!isAvailable) {
    return (
      <p className="text-sm text-gray-400 mt-4">This tool is currently not available for reservation.</p>
    )
  }

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => router.push('/login?next=' + encodeURIComponent(`/tools/${toolId}`))}
        className="mt-4 w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors"
      >
        Log in to reserve
      </button>
    )
  }

  const handleOpen = () => {
    setStart('')
    setEnd('')
    setNotes('')
    reservation.reset()
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    try {
      await reservation.mutateAsync({ toolId, startDate, endDate, notes: notes || undefined })
      setOpen(false)
      router.push('/my-reservations')
    } catch {
      // error shown via reservation.error
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="mt-4 w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors"
      >
        Reserve this tool
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={handleClose}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Reserve: {toolTitle}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="res-start" className="block text-sm font-medium text-gray-700 mb-1">
                  Start date <span className="text-red-500">*</span>
                </label>
                <input
                  id="res-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="res-end" className="block text-sm font-medium text-gray-700 mb-1">
                  End date <span className="text-red-500">*</span>
                </label>
                <input
                  id="res-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEnd(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="res-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  id="res-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Any details for the owner…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {reservation.error && (
                <p className="text-sm text-red-600">{reservation.error.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reservation.isPending || !startDate || !endDate}
                  className="flex-1 bg-green-700 text-white py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reservation.isPending ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
