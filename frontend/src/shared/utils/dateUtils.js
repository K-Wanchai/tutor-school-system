// รูปแบบวันที่มาตรฐานของทั้งระบบ: วว/ดด/ปปปป (ปีคริสต์ศักราช ไม่ใช่ พ.ศ.)
// ใช้แทน toLocaleDateString('th-TH', ...) ที่แปลงเป็น พ.ศ. โดยอัตโนมัติ

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateDMY(value) {
  const d = toDate(value);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTimeDMY(value) {
  const d = toDate(value);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDateDMY(d)} ${hh}:${min}`;
}

// yyyy-mm-dd จากวัน/เดือน/ปี "ตามเวลาท้องถิ่น" ของ Date object — ห้ามใช้ d.toISOString().slice(0, 10)
// แทนตรงนี้เพราะ toISOString() แปลงเป็น UTC ก่อน ถ้าเวลาท้องถิ่นเป็นช่วงตี 0-6 (ประเทศไทย UTC+7)
// จะได้วันที่ของ "เมื่อวาน" แทน ทำให้วันที่เพี้ยนไปหนึ่งวันทั้งกระดาน (เช่น ตารางว่างของติวเตอร์รายวันเลื่อนสลับกันหมด)
export function toLocalISODate(value) {
  const d = toDate(value);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// วันนี้ตามเวลาท้องถิ่น ในรูปแบบ ISO yyyy-mm-dd
export function todayLocalISODate() {
  return toLocalISODate(new Date());
}

// บวก/ลบจำนวนวันจากวันที่ ISO yyyy-mm-dd แล้วคืนค่าเป็น ISO yyyy-mm-dd
export function addDaysISO(iso, days) {
  const d = toDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

// วันในสัปดาห์ของวันที่ ISO yyyy-mm-dd (0=อาทิตย์ ... 6=เสาร์ ตาม Date.getDay())
// สร้างจากปี/เดือน/วันตรงๆ (ไม่ผ่าน UTC) เพื่อไม่ให้เพี้ยนแบบเดียวกับ toLocalISODate
export function getWeekdayOfISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getDay();
}

// ISO yyyy-mm-dd (รูปแบบที่ backend/state เดิมใช้) <-> วว/ดด/ปปปป (สำหรับ DateInput)
export function isoToDigits(iso) {
  if (!iso) return '';
  const [yyyy, mm, dd] = String(iso).slice(0, 10).split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}${mm}${yyyy}`;
}

export function digitsToIso(digits) {
  if (digits.length !== 8) return '';
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

const DAY_LABEL_TH = { MON: 'จันทร์', TUE: 'อังคาร', WED: 'พุธ', THU: 'พฤหัส', FRI: 'ศุกร์', SAT: 'เสาร์', SUN: 'อาทิตย์' };

// แปลงตารางสอนจาก backend (array ของ { dayOfWeek, startTime, endTime }) เป็นข้อความไทยล้วน
// หนึ่งวันต่อหนึ่งบรรทัด เช่น "วันอาทิตย์ 10:00 - 12:00 น.\nวันจันทร์ 13:00 - 15:00 น."
// — ผู้ใช้ต้อง CSS white-space: pre-line เพื่อให้ขึ้นบรรทัดใหม่
export function formatScheduleDaysTH(scheduleDays) {
  if (!scheduleDays || scheduleDays.length === 0) return '-';

  return scheduleDays
    .map(({ dayOfWeek, startTime, endTime }) => {
      const label = DAY_LABEL_TH[dayOfWeek] || dayOfWeek;
      if (!startTime || !endTime) return `วัน${label}`;
      return `วัน${label} ${startTime} - ${endTime} น.`;
    })
    .join('\n');
}
