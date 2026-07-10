import type { FamilyResponse } from '../types'
import EditFamilyDialog from './EditFamilyDialog'

interface Props {
  family: FamilyResponse | null
  canManage: boolean
}

export default function FamilyInfoCard({ family, canManage }: Props) {
  if (!family) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-sm font-medium text-ink mb-4">Información Familiar</h2>
        <p className="text-sm text-ghost">No hay información familiar registrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink">Información Familiar</h2>
        {canManage && <EditFamilyDialog family={family} />}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ghost">Acudiente</p>
          <p className="text-sm text-ink mt-0.5">{family.guardianName}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Email</p>
          <p className="text-sm text-ink mt-0.5">{family.guardianEmail ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Teléfono</p>
          <p className="text-sm text-ink mt-0.5">{family.guardianPhone ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Dirección</p>
          <p className="text-sm text-ink mt-0.5">{family.address ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Contacto de emergencia</p>
          <p className="text-sm text-ink mt-0.5">{family.emergencyContact ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Teléfono de emergencia</p>
          <p className="text-sm text-ink mt-0.5">{family.emergencyPhone ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
