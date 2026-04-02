import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Neighborhood Hub',
  description: 'Квартална платформа за споделяне на умения, инструменти и събития',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bg" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
