import Nav from '@/components/nav'

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </>
  )
}
