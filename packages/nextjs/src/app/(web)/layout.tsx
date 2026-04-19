import Nav from '@/components/nav'
import { Footer } from '@/components/footer'
import { WebUIProvider } from '@/components/web-ui-provider'

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebUIProvider>
      <Nav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </WebUIProvider>
  )
}
