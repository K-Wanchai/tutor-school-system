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
