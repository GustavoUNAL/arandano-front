import type { AuthUser, StaffMemberRow } from '../api'

export function formatStaffMoney(value: string | number | null | undefined): string {
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPersonDate(
  iso: string | null | undefined,
  style: 'long' | 'medium' = 'long',
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: style,
    ...(style === 'long' ? { timeStyle: 'short' as const } : {}),
  }).format(d)
}

export function staffRoleLabel(user?: AuthUser | null): string | null {
  if (!user?.role) return null
  if (user.role === 'crew') return 'Operadora'
  if (user.role === 'manager') return 'Gerencia'
  if (user.role === 'owner') return 'Dueño'
  return user.role
}

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function StaffProfileCard({
  member,
  roleLabel,
  compact = false,
}: {
  member: StaffMemberRow
  roleLabel?: string | null
  compact?: boolean
}) {
  return (
    <article className={`staff-profile-card${compact ? ' staff-profile-card--compact' : ''}`}>
      <div className="staff-profile-card__avatar" aria-hidden>
        {personInitials(member.name)}
      </div>
      <div className="staff-profile-card__main">
        <h2 className="staff-profile-card__name">{member.name}</h2>
        {roleLabel ? <p className="staff-profile-card__role">{roleLabel}</p> : null}
        <dl className="staff-profile-card__dl">
          <div>
            <dt>Correo</dt>
            <dd>{member.email?.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{member.phone?.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd>{member.idNumber?.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Tarifa por hora</dt>
            <dd>{formatStaffMoney(member.defaultHourlyRate)}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{member.active ? 'Activa' : 'Inactiva'}</dd>
          </div>
          <div>
            <dt>Alta en el sistema</dt>
            <dd>{formatPersonDate(member.createdAt)}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{formatPersonDate(member.updatedAt)}</dd>
          </div>
        </dl>
        {member.notes?.trim() ? (
          <p className="staff-profile-card__notes">{member.notes}</p>
        ) : null}
      </div>
    </article>
  )
}
