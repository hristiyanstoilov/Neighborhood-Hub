'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { submitContact } from './actions'

export default function ContactPage() {
  const t = useTranslations('contact')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t('error_required'))
      return
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) {
      setError(t('error_email'))
      return
    }

    setLoading(true)
    try {
      const result = await submitContact({ name, email, subject, message })
      if (!result.ok) {
        setError(result.error === 'TOO_MANY_REQUESTS' ? t('error_rate_limit') : t('error_failed'))
        return
      }
      setSent(true)
    } catch {
      setError(t('error_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg">
        <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
          <p className="text-2xl font-bold text-green-800 mb-2">{t('success_title')}</p>
          <p className="text-sm text-green-700">{t('success_body')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4" noValidate>
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">{t('field_name')}</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">{t('field_email')}</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={254}
          />
        </div>

        <div>
          <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">{t('field_subject')}</label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">{t('field_message')}</label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={t('placeholder_message')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            maxLength={2000}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '…' : t('submit')}
        </button>
      </form>
    </div>
  )
}
