import { GraduationCap, CalendarOff, Users, Clock, PartyPopper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CalendarEventType } from '../types'

const CONFIG: Record<CalendarEventType, { label: string; classes: string; icon: LucideIcon }> = {
  EXAM: { label: 'Examen', classes: 'bg-muted-fill text-prose border-line', icon: GraduationCap },
  HOLIDAY: { label: 'Feriado', classes: 'bg-accent/30 text-ink border-accent/50', icon: CalendarOff },
  PARENT_TEACHER_MEETING: { label: 'Reunión de padres', classes: 'bg-muted-fill text-prose border-line', icon: Users },
  GRADING_DEADLINE: { label: 'Cierre de notas', classes: 'bg-warning/10 text-warning border-warning/30', icon: Clock },
  SCHOOL_ACTIVITY: { label: 'Actividad escolar', classes: 'bg-muted-fill text-prose border-line', icon: PartyPopper },
}

export default function CalendarEventTypeBadge({ type }: { type: CalendarEventType }) {
  const { label, classes, icon: Icon } = CONFIG[type]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-medium ${classes}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export function calendarEventTypeDotColor(type: CalendarEventType): string {
  const dot: Record<CalendarEventType, string> = {
    EXAM: 'bg-ink/40',
    HOLIDAY: 'bg-accent',
    PARENT_TEACHER_MEETING: 'bg-ink/40',
    GRADING_DEADLINE: 'bg-warning',
    SCHOOL_ACTIVITY: 'bg-ink/40',
  }
  return dot[type]
}
