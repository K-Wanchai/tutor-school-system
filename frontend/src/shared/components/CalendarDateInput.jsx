import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateDMY } from '../utils/dateUtils';
import './CalendarDateInput.css';

const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const POPUP_WIDTH = 260;
const POPUP_EST_HEIGHT = 330; // header + weekdays + up to 6 week rows
const VIEWPORT_MARGIN = 8;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoToParts(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function buildMonthCells(viewYear, viewMonth) {
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// คำนวณตำแหน่งป็อปอัพให้อยู่ในจอเสมอ (เปิดขึ้นด้านบนถ้าด้านล่างไม่พอที่)
function computePopupPosition(anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < POPUP_EST_HEIGHT + VIEWPORT_MARGIN && rect.top > POPUP_EST_HEIGHT + VIEWPORT_MARGIN;

  let left = rect.left;
  if (left + POPUP_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
    left = window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN;
  }
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

  return openUp
    ? { left, openUp: true, bottom: window.innerHeight - rect.top + 6 }
    : { left, openUp: false, top: rect.bottom + 6 };
}

// ช่องเลือกวันที่จากปฏิทิน (ไม่ให้พิมพ์เอง) — แสดง/เลือกเป็น วัน/เดือน/ปี
// value/onChange ยังเป็น ISO yyyy-mm-dd เหมือนเดิมเพื่อให้เข้ากับ state/backend เดิม
export default function CalendarDateInput({ value, onChange, placeholder = 'วว/ดด/ปปปป', disabled }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => isoToParts(value)?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (isoToParts(value)?.m ?? today.getMonth() + 1) - 1);
  const [pos, setPos] = useState(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      if (!inputRef.current) return;
      setPos(computePopupPosition(inputRef.current));
    }
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  function openCalendar() {
    if (disabled) return;
    const p = isoToParts(value);
    setViewYear(p?.y ?? today.getFullYear());
    setViewMonth((p?.m ?? today.getMonth() + 1) - 1);
    setOpen((o) => !o);
  }

  function pickDay(d) {
    onChange(`${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const cells = buildMonthCells(viewYear, viewMonth);
  const selectedIso = value || '';
  const todayIso = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const isTodayInView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="cdi-wrap">
      <input
        ref={inputRef}
        type="text"
        readOnly
        className="cdi-input"
        placeholder={placeholder}
        value={formatDateDMY(value)}
        onClick={openCalendar}
        disabled={disabled}
      />
      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="cdi-popup"
          style={{
            position: 'fixed',
            left: pos.left,
            top: pos.openUp ? 'auto' : pos.top,
            bottom: pos.openUp ? pos.bottom : 'auto',
          }}
        >
          <div className="cdi-popup-header">
            <button type="button" className="cdi-nav-btn" onClick={prevMonth} aria-label="เดือนก่อนหน้า">‹</button>
            <span className="cdi-popup-title">{THAI_MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="cdi-nav-btn" onClick={nextMonth} aria-label="เดือนถัดไป">›</button>
          </div>
          <div className="cdi-weekdays">
            {THAI_WEEKDAYS.map((w, i) => (
              <span key={w} className={i === 0 || i === 6 ? 'cdi-weekday--weekend' : ''}>{w}</span>
            ))}
          </div>
          <div className="cdi-days">
            {cells.map((d, i) => {
              if (d === null) return <span key={`empty-${i}`} className="cdi-day cdi-day--empty" />;
              const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
              const weekday = (i % 7);
              const cls = [
                'cdi-day',
                iso === selectedIso ? 'cdi-day--selected' : '',
                iso === todayIso ? 'cdi-day--today' : '',
                (weekday === 0 || weekday === 6) ? 'cdi-day--weekend' : '',
              ].filter(Boolean).join(' ');
              return (
                <button key={iso} type="button" className={cls} onClick={() => pickDay(d)}>
                  {d}
                </button>
              );
            })}
          </div>
          <div className="cdi-popup-footer">
            <button type="button" className="cdi-today-btn" onClick={goToToday} disabled={isTodayInView}>
              <span className="cdi-today-dot" /> ไปยังวันนี้
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
