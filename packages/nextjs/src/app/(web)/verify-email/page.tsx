import { Suspense } from 'react'
import VerifyEmailContent from './verify-email-content'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto text-center py-16 text-gray-400 text-sm">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
