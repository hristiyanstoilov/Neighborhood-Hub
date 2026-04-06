import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-gray-400 text-sm">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
