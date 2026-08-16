import { useCallback, useRef, useState } from 'react';
import './ConfirmDialog.css';

// Confirm Box แบบ modal สำหรับการกระทำที่ย้อนกลับไม่ได้ (ลบ/ยกเลิก/ปฏิเสธ ฯลฯ)
// ใช้แทน window.confirm() — ใช้ผ่าน useConfirm() แล้ว render {confirmDialog} ไว้ในหน้า
// const ok = await confirm({ message, title, danger, confirmText, cancelText });
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    setState(opts);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const resolve = useCallback((result) => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const confirmDialog = state ? (
    <div className="confirm-dialog-overlay" onClick={() => resolve(false)}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        {state.title && <h3 className="confirm-dialog-title">{state.title}</h3>}
        <p id="confirm-dialog-message" className="confirm-dialog-message">{state.message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
            onClick={() => resolve(false)}
          >
            {state.cancelText || 'ยกเลิก'}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn ${state.danger ? 'confirm-dialog-btn--danger' : 'confirm-dialog-btn--primary'}`}
            onClick={() => resolve(true)}
            autoFocus
          >
            {state.confirmText || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmDialog };
}
