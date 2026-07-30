import { useState } from 'react';
import { DAYS, DAY_LABEL_TH, findConflictDays, findOutsideAllowedDays } from '../utils/courseScheduleUtils';

// เดิมอยู่ใน AdminCourseManagementPage.jsx — แยกออกมาเพื่อใช้ร่วมกันกับหน้าเพิ่มคอร์ส (AdminCourseCreatePage.jsx)

function formatTimeRange(digits) {
  // digits = สูงสุด 8 ตัว → HH:MM - HH:MM
  const d = digits.slice(0, 8);
  let out = '';
  if (d.length >= 1) out += d.slice(0, 2).padEnd(d.length < 2 ? d.length : 2, '');
  if (d.length >= 3) out += ':' + d.slice(2, 4).padEnd(d.length < 4 ? d.length - 2 : 2, '');
  else if (d.length === 2) out += ':';
  if (d.length >= 5) out += ' - ' + d.slice(4, 6).padEnd(d.length < 6 ? d.length - 4 : 2, '');
  else if (d.length === 4) out += ' - ';
  if (d.length >= 7) out += ':' + d.slice(6, 8).padEnd(d.length < 8 ? d.length - 6 : 2, '');
  else if (d.length === 6) out += ':';
  return out;
}

export function TimeRangeInput({ startTime, endTime, onChangeStart, onChangeEnd }) {
  const initDigits = (() => {
    if (!startTime && !endTime) return '';
    const s = (startTime || '00:00').replace(':', '');
    const e = (endTime || '00:00').replace(':', '');
    return s + e;
  })();

  const [digits, setDigits] = useState(initDigits);

  function handleKeyDown(e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice(0, -1);
      setDigits(next);
      if (next.length < 4) { onChangeStart(''); onChangeEnd(''); }
      else if (next.length < 8) {
        onChangeStart(`${next.slice(0, 2)}:${next.slice(2, 4)}`);
        onChangeEnd('');
      } else {
        onChangeStart(`${next.slice(0, 2)}:${next.slice(2, 4)}`);
        onChangeEnd(`${next.slice(4, 6)}:${next.slice(6, 8)}`);
      }
    }
  }

  function handleInput(e) {
    const key = e.nativeEvent?.data;
    if (!key || !/\d/.test(key)) return;
    if (digits.length >= 8) return;
    const next = digits + key;
    setDigits(next);
    if (next.length >= 4) onChangeStart(`${next.slice(0, 2)}:${next.slice(2, 4)}`);
    if (next.length >= 8) onChangeEnd(`${next.slice(4, 6)}:${next.slice(6, 8)}`);
  }

  return (
    <input
      type="text"
      className="cm-time-range-input"
      placeholder="10:00 - 12:00"
      value={formatTimeRange(digits)}
      onKeyDown={handleKeyDown}
      onChange={handleInput}
      inputMode="numeric"
    />
  );
}

// panel แสดงตารางว่างของติวเตอร์
export function TutorAvailabilityPanel({ avail, loading }) {
  if (loading) {
    return (
      <div className="cm-avail-panel cm-avail-loading">
        กำลังโหลดตารางว่างของติวเตอร์...
      </div>
    );
  }
  if (!avail) return null;

  return (
    <div className="cm-avail-panel">
      <div className="cm-avail-title">ตารางว่างของติวเตอร์ (สัปดาห์นี้)</div>
      <div className="cm-avail-rows">
        {DAYS.map(({ key }) => {
          const data = avail[key];
          const freeSlots = data?.freeSlots ?? [];
          const hasFree = freeSlots.length > 0;
          return (
            <div key={key} className={`cm-avail-row ${hasFree ? 'cm-avail-free' : 'cm-avail-busy'}`}>
              <span className="cm-avail-day">{DAY_LABEL_TH[key]}</span>
              <span className="cm-avail-slots">
                {hasFree
                  ? freeSlots.map((s, i) => (
                      <span key={i} className="cm-avail-slot">
                        {s.startTime}–{s.endTime}
                      </span>
                    ))
                  : <span className="cm-avail-no">ไม่ว่าง</span>
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleSection({
  form, fld, avail, err,
  slotsField = 'scheduleSlots',
  icon = '📅',
  title = 'ตารางสอน *',
  hint = '(08:00–21:00)',
  allowed,
}) {
  const slots = form[slotsField] || {};
  const orderedSelected = DAYS.map(d => d.key).filter(k => k in slots);
  const conflicts = findConflictDays(slots, avail);
  const conflictDaySet = new Set(conflicts.map(c => c.day));
  const outsideAllowed = findOutsideAllowedDays(slots, allowed);
  const outsideAllowedDaySet = new Set(outsideAllowed.map(c => c.day));

  function toggleDay(key) {
    const next = { ...slots };
    if (key in next) {
      delete next[key];
    } else {
      next[key] = { start: '', end: '' };
    }
    fld(slotsField, next);
  }

  function setSlotTime(day, field, value) {
    fld(slotsField, { ...slots, [day]: { ...slots[day], [field]: value } });
  }

  return (
    <div className="cm-schedule-section">
      <div className="cm-schedule-section-title">
        <span className="cm-schedule-icon">{icon}</span>
        <span>{title}</span>
      </div>

      {/* เลือกวัน */}
      <div className="cm-field">
        <label>กดเลือกวันที่สอน และใส่เวลาแต่ละวัน <span className="cm-lbl-hint">{hint}</span></label>
        <div className="cm-day-pills">
          {DAYS.map(d => (
            <button key={d.key} type="button"
              className={`cm-day-pill ${d.key in slots ? 'cm-day-pill--on' : ''}`}
              onClick={() => toggleDay(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* เวลาแต่ละวัน */}
      {orderedSelected.length > 0 && (
        <div className="cm-per-day-slots">
          {orderedSelected.map(key => {
            const slot = slots[key];
            const conflict = conflicts.find(c => c.day === key);
            const outsideConflict = outsideAllowed.find(c => c.day === key);
            return (
              <div key={key} className={`cm-per-day-row ${conflictDaySet.has(key) ? 'cm-per-day-row--conflict' : ''} ${outsideAllowedDaySet.has(key) ? 'cm-per-day-row--forbidden' : ''}`}>
                <span className="cm-per-day-label">{DAY_LABEL_TH[key]}</span>
                <TimeRangeInput
                  key={key}
                  startTime={slot.start}
                  endTime={slot.end}
                  onChangeStart={v => setSlotTime(key, 'start', v)}
                  onChangeEnd={v => setSlotTime(key, 'end', v)}
                />
                <div className="cm-per-day-messages">
                  {conflict && (
                    <span className="cm-per-day-conflict-msg">
                      ซ้ำ {conflict.start}–{conflict.end}{conflict.course ? ` (${conflict.course})` : ''}
                    </span>
                  )}
                  {outsideConflict && (
                    <span className="cm-per-day-forbidden-msg">
                      ⛔ นอกเวลาที่สถาบันอนุญาต ({outsideConflict.start}–{outsideConflict.end})
                    </span>
                  )}
                  {!conflict && !outsideConflict && (!slot.start || !slot.end) && (
                    <span className="cm-per-day-hint-msg">ยังไม่ได้ใส่เวลา</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* error จาก validate (submit) */}
      {err && (
        <div className="cm-avail-conflict"><strong>{err}</strong></div>
      )}
    </div>
  );
}

function TutorOption({ t }) {
  return (
    <option key={t.id} value={t.id}>
      {t.email}{t.firstName ? ` (${t.firstName} ${t.lastName})` : ''}
      {t.specialization ? ` — ${t.specialization}` : ''}
    </option>
  );
}

// เลือกติวเตอร์ + แสดงตารางว่างของติวเตอร์ที่เลือก
export function TutorSelectField({ tutors, tutorLoading, tutorAvail, availLoading, value, onChange, err }) {
  return (
    <>
      <div className="cm-field">
        <label>ติวเตอร์ * <span className="cm-lbl-hint">(เลือกจากระบบ)</span></label>
        <select value={value} onChange={e => onChange(e.target.value)} disabled={tutorLoading}>
          <option value="">
            {tutorLoading ? 'กำลังโหลดรายชื่อ...' : tutors.length === 0 ? 'ไม่พบติวเตอร์ในระบบ' : '— เลือกติวเตอร์ —'}
          </option>
          {tutors.map(t => <TutorOption key={t.id} t={t} />)}
        </select>
        {err && <span className="cm-err">{err}</span>}
        {tutors.length > 0 && !tutorLoading && (
          <span className="cm-field-hint">มีติวเตอร์ในระบบ {tutors.length} คน</span>
        )}
      </div>
      {value && (
        <TutorAvailabilityPanel avail={tutorAvail} loading={availLoading} />
      )}
    </>
  );
}
