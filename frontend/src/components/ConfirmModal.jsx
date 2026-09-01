/**
 * ConfirmModal — a clean inline confirmation dialog
 * Props:
 *   title: string
 *   message: string
 *   confirmLabel: string (default "Yes, proceed")
 *   cancelLabel: string (default "No, stay")
 *   onConfirm: () => void
 *   onCancel: () => void
 *   danger: bool — makes confirm button red-tinted
 */
export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Yes, proceed',
  cancelLabel  = 'No, stay',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">⚠️</div>
        <h3 className="modal-title">{title}</h3>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button
            id="btn-modal-confirm"
            className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            id="btn-modal-cancel"
            className="btn btn-ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
