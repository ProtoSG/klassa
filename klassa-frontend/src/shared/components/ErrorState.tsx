export default function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-16 text-center shadow-card">
      <p className="text-prose text-sm">{message}</p>
      <p className="text-ghost text-xs mt-1">Verifica tu conexión o intenta de nuevo.</p>
    </div>
  )
}
