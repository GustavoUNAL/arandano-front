import '../platform-admin.css'

type Props = {
  companyName?: string | null
  onReturn: () => void
}

export function PlatformAdminBar({ companyName, onReturn }: Props) {
  const label = companyName?.trim() || 'esta empresa'
  return (
    <div className="platform-return" role="status">
      <p className="platform-return__copy">
        <span className="platform-return__kicker">Admin</span>
        <strong>{label}</strong>
      </p>
      <button type="button" className="platform-return__btn" onClick={onReturn}>
        Volver al panel
      </button>
    </div>
  )
}
