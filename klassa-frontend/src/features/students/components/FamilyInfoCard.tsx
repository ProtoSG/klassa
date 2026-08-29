import type { FamilyResponse, StudentResponse } from '../types'
import EditFamilyDialog from './EditFamilyDialog'
import AddFamilyDialog from './AddFamilyDialog'
import CreateParentAccessDialog from './CreateParentAccessDialog'
import LinkExistingFamilyDialog from './LinkExistingFamilyDialog'
import WhatsAppButton from '@/shared/components/WhatsAppButton'
import { templates } from '@/shared/lib/whatsapp'

interface Props {
  student: StudentResponse
  family: FamilyResponse | null
  canManage: boolean
  /** Gates the "create portal login" action specifically — POST /api/users is ADMIN-only server-side, so this must be narrower than canManage (which also covers TREASURER on this page). */
  canCreateParentAccess: boolean
}

export default function FamilyInfoCard({ student, family, canManage, canCreateParentAccess }: Props) {
  if (!family) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-sm font-medium text-ink mb-4">Información Familiar</h2>
        <p className="text-sm text-ghost mb-3">No hay información familiar registrada.</p>
        {canManage && (
          <div className="flex flex-col items-start gap-2">
            <AddFamilyDialog student={student} />
            <LinkExistingFamilyDialog student={student} />
          </div>
        )}
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
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-ink">{family.guardianPhone ?? '—'}</p>
            {family.guardianPhone && (
              <WhatsAppButton
                phone={family.guardianPhone}
                text={templates.genericMessage({
                  guardianName: family.guardianName,
                  studentName: student.fullName,
                  body: 'Quería conversar con usted.',
                })}
                label="Enviar WhatsApp al apoderado"
              />
            )}
          </div>
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

      {canManage && (
        <div className="mt-3">
          <LinkExistingFamilyDialog student={student} currentFamily={family} />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-line">
        <p className="text-xs text-ghost mb-1">Acceso al portal</p>
        {family.linkedUserEmail ? (
          <p className="text-sm text-ink">{family.linkedUserEmail}</p>
        ) : (
          <>
            <p className="text-sm text-ghost mb-2">Sin cuenta vinculada todavía.</p>
            {canCreateParentAccess && <CreateParentAccessDialog family={family} />}
          </>
        )}
      </div>
    </div>
  )
}
