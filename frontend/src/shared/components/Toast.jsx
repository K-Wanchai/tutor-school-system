import { useCallback, useEffect, useRef, useState } from 'react';
import './Toast.css';

// Toast/Snackbar แบบ non-blocking สำหรับแจ้งเตือนทั่วไป (สำเร็จ/ข้อมูล/ผิดพลาดที่ไม่รุนแรง)
// ใช้ผ่าน useToast() แล้ว render {toastElement} ไว้ในหน้า
export function useToast(duration = 3500) {
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'info', message }
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), duration);
  }, [duration]);

  const hideToast = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const toastElement = toast ? (
    <div className={`app-toast app-toast--${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" className="app-toast-close" onClick={hideToast} aria-label="ปิด">×</button>
    </div>
  ) : null;

  return { showToast, hideToast, toastElement };
}
