// รายวิชาที่ถนัด (specialization) — เก็บเป็น string เดียวใน backend (Tutor.specialization)
// ฝั่ง frontend แปลงเป็น multi-select + ช่องกรอกเพิ่มเติมสำหรับ "อื่นๆ" แล้ว join กลับเป็น string ด้วย ", "

export const SUBJECT_OPTIONS = [
  'คณิตศาสตร์',
  'ฟิสิกส์',
  'ชีววิทยา',
  'เคมี',
  'โปรแกรมคอมพิวเตอร์',
];

export const OTHER_SUBJECT = 'อื่นๆ';

// แยก specialization string เดิม (เช่นจากการกรอกแบบข้อความเสรีในอดีต) กลับเป็นรายวิชาที่เลือกได้ + ข้อความอื่นๆ
export function parseSpecialization(value) {
  const parts = (value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const subjects = [];
  const otherParts = [];

  parts.forEach(part => {
    const match = SUBJECT_OPTIONS.find(opt => opt === part);
    if (match && !subjects.includes(match)) {
      subjects.push(match);
    } else if (part !== OTHER_SUBJECT) {
      otherParts.push(part);
    }
  });

  return {
    subjects,
    otherText: otherParts.join(', '),
  };
}

// รวมรายวิชาที่เลือก + ข้อความอื่นๆ กลับเป็น string เดียวสำหรับส่งไป backend
export function buildSpecialization(subjects, otherText) {
  const parts = [...subjects];
  const trimmedOther = (otherText || '').trim();
  if (trimmedOther) parts.push(trimmedOther);
  return parts.join(', ');
}

// รายชื่อวิชาทั้งหมด (สำหรับแสดงเป็น chip) จาก specialization string
export function specializationToChips(value) {
  const { subjects, otherText } = parseSpecialization(value);
  const chips = [...subjects];
  if (otherText) chips.push(otherText);
  return chips;
}
