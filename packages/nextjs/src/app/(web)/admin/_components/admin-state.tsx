type AdminStateProps = {
  title: string
  message: string
}

export function AdminState({ title, message }: AdminStateProps) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-lg mb-2">{title}</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}