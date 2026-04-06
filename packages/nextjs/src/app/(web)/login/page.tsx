import { Suspense } from 'react'
import LoginForm from './login-form'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-gray-400 text-sm">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
