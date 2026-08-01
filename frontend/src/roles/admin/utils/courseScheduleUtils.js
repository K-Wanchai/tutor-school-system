// เดิมอยู่ใน AdminCourseManagementPage.jsx — แยกออกมาเพื่อใช้ร่วมกันกับหน้าเพิ่มคอร์ส (AdminCourseCreatePage.jsx)

import { todayLocalISODate, getWeekdayOfISO } from '../../../shared/utils/dateUtils';

export const DAYS = [
  { key: 'MON', label: 'จ' },
  { key: 'TUE', label: 'อ' },
  { key: 'WED', label: 'พ' },
  { key: 'THU', label: 'พฤ' },
  { key: 'FRI', label: 'ศ' },
  { key: 'SAT', label: 'ส' },
  { key: 'SUN', label: 'อา' },
];

export const DAY_LABEL_TH = { MON: 'จันทร์', TUE: 'อังคาร', WED: 'พุธ', THU: 'พฤหัส', FRI: 'ศุกร์', SAT: 'เสาร์', SUN: 'อาทิตย์' };

// วันในสัปดาห์ตาม Date.getDay() (0=อาทิตย์ ... 6=เสาร์) ของแต่ละคีย์ใน DAYS
const DAY_KEY_TO_JS_WEEKDAY = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };

// วันที่ "มาก่อน" ที่สุดในสัปดาห์ (เรียงจันทร์-อาทิตย์ตาม DAYS) จากวันที่ถูกเลือกไว้ในตารางสอน
// ใช้เป็นวันเดียวที่บังคับให้เลือกได้สำหรับ "วันที่เริ่มสอน" เพราะคาบแรกของคอร์สต้องตรงกับวันนี้เสมอ
export function getPrimaryScheduleDayKey(scheduleSlots) {
  const keys = Object.keys(scheduleSlots || {});
  if (keys.length === 0) return null;
  return DAYS.find(d => keys.includes(d.key))?.key ?? null;
}

export function dayKeyToJsWeekday(key) {
  return key ? DAY_KEY_TO_JS_WEEKDAY[key] ?? null : null;
}

export const EMPTY_COURSE_FORM = {
  courseName: '', tutorId: '', price: '',
  totalHours: '', seatLimit: '',
  registrationStartDate: '', registrationEndDate: '',
  courseStartDate: '', description: '',
  scheduleSlots: {},
};

// รูปแบบ: "MON:10:00-12:00,WED:13:00-15:00"
export function parseDaySlots(str) {
  if (!str) return {};
  const slots = {};
  str.split(',').filter(Boolean).forEach(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0 && colonIdx < part.length - 1) {
      const day = part.slice(0, colonIdx);
      const timeRange = part.slice(colonIdx + 1);
      const dashIdx = timeRange.lastIndexOf('-');
      slots[day] = dashIdx > 0
        ? { start: timeRange.slice(0, dashIdx), end: timeRange.slice(dashIdx + 1) }
        : { start: timeRange, end: '' };
    } else {
      // old format (just day name)
      slots[part] = { start: '', end: '' };
    }
  });
  return slots;
}

export function encodeDaySlots(slots) {
  return DAYS.map(d => d.key)
    .filter(k => k in slots)
    .map(k => {
      const { start, end } = slots[k];
      return start && end ? `${k}:${start}-${end}` : k;
    })
    .join(',');
}

// รูปแบบ scheduleDays ของคอร์ส (ไม่ใช่ allowedTimeSlots ของสถาบัน) ตอนนี้เป็น array ของ
// { dayOfWeek, startTime, endTime } จาก backend แล้ว ไม่ใช่ string อีกต่อไป
export function slotsToScheduleDaysArray(slots) {
  return DAYS.map(d => d.key)
    .filter(k => k in slots)
    .map(k => ({ dayOfWeek: k, startTime: slots[k].start, endTime: slots[k].end }));
}

export function scheduleDaysArrayToSlots(scheduleDaysArray) {
  const slots = {};
  (scheduleDaysArray || []).forEach(({ dayOfWeek, startTime, endTime }) => {
    slots[dayOfWeek] = { start: startTime, end: endTime };
  });
  return slots;
}

function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(s1, e1, s2, e2) {
  return toMin(s1) < toMin(e2) && toMin(e1) > toMin(s2);
}

// ตรวจ conflict แต่ละวัน (per-day slots) กับตารางว่างของติวเตอร์
export function findConflictDays(scheduleSlots, avail) {
  if (!avail || !scheduleSlots) return [];
  return Object.entries(scheduleSlots).flatMap(([day, { start, end }]) => {
    if (!start || !end) return [];
    const busy = avail[day]?.busySlots ?? [];
    return busy
      .filter(b => overlaps(start, end, b.startTime, b.endTime))
      .map(b => ({ day, start: b.startTime, end: b.endTime, course: b.courseTitle }));
  });
}

// ตรวจว่าตารางสอนแต่ละวัน อยู่ "นอกช่วงเวลาที่สถาบันอนุญาต" หรือไม่
// วันที่แอดมินไม่ได้ตั้งค่าเวลาที่อนุญาตไว้ = ไม่จำกัดเวลาสำหรับวันนั้น (ไม่ตรวจ)
export function findOutsideAllowedDays(scheduleSlots, allowedByDay) {
  if (!allowedByDay || !scheduleSlots) return [];
  return Object.entries(scheduleSlots).flatMap(([day, { start, end }]) => {
    if (!start || !end) return [];
    const allowed = allowedByDay[day];
    if (!allowed?.start || !allowed?.end) return [];
    if (toMin(start) < toMin(allowed.start) || toMin(end) > toMin(allowed.end)) {
      return [{ day, start: allowed.start, end: allowed.end }];
    }
    return [];
  });
}

export function validateCourseForm(f, tutorAvail, priceRequired = true, allowedSlots) {
  const e = {};
  if (!f.courseName?.trim()) e.courseName = 'กรุณากรอกชื่อคอร์ส';
  if (!f.tutorId) e.tutorId = 'กรุณาเลือกติวเตอร์';
  if (priceRequired && (f.price === '' || f.price == null || isNaN(f.price))) e.price = 'กรุณากรอกราคา';
  else if (f.price !== '' && f.price != null && Number(f.price) < 0) e.price = 'ราคาต้องไม่ติดลบ';
  if (!f.totalHours || isNaN(f.totalHours) || Number(f.totalHours) < 1) e.totalHours = 'ต้องมากกว่า 0';
  if (!f.seatLimit || isNaN(f.seatLimit) || Number(f.seatLimit) < 1) e.seatLimit = 'ต้องมากกว่า 0';
  if (!f.courseStartDate) e.courseStartDate = 'กรุณาเลือกวันที่เริ่มสอน';

  // วันเปิด/ปิดรับสมัคร ต้องไม่ย้อนหลังวันปัจจุบัน
  const today = todayLocalISODate();
  if (f.registrationStartDate && f.registrationStartDate < today) {
    e.registrationStartDate = 'วันเปิดรับสมัครต้องไม่ย้อนหลังวันปัจจุบัน';
  }
  if (f.registrationEndDate && f.registrationEndDate < today) {
    e.registrationEndDate = 'วันปิดรับสมัครต้องไม่ย้อนหลังวันปัจจุบัน';
  }
  if (f.registrationEndDate && f.registrationStartDate && f.registrationEndDate < f.registrationStartDate) {
    e.registrationEndDate = 'วันปิดรับสมัครต้องไม่ก่อนวันเปิดรับสมัคร';
  }
  // วันที่เริ่มสอน ต้องอยู่หลังวันปิดรับสมัคร (เลือกวันปิดหรือก่อนหน้าไม่ได้)
  if (f.courseStartDate && f.registrationEndDate && f.courseStartDate <= f.registrationEndDate) {
    e.courseStartDate = 'วันที่เริ่มสอนต้องอยู่หลังวันปิดรับสมัคร';
  }
  // วันที่เริ่มสอน ต้องตรงกับวันที่มาก่อนที่สุดในสัปดาห์จากตารางสอนที่เลือกไว้ (คาบแรกของคอร์ส)
  const primaryDayKey = getPrimaryScheduleDayKey(f.scheduleSlots);
  if (f.courseStartDate && primaryDayKey && getWeekdayOfISO(f.courseStartDate) !== dayKeyToJsWeekday(primaryDayKey)) {
    e.courseStartDate = `วันที่เริ่มสอนต้องตรงกับวัน${DAY_LABEL_TH[primaryDayKey]} (วันแรกของตารางสอน)`;
  }

  // บังคับตารางสอน — แอดมินต้องเลือกวัน-เวลาเอง
  const slots = f.scheduleSlots || {};
  const selectedDayKeys = Object.keys(slots);
  if (selectedDayKeys.length === 0) {
    e.scheduleTime = 'กรุณาเลือกวันสอนอย่างน้อย 1 วัน';
  } else {
    const missingTime = selectedDayKeys.filter(k => !slots[k].start || !slots[k].end);
    if (missingTime.length > 0) {
      e.scheduleTime = `กรุณาใส่เวลาให้ครบทุกวัน: ${missingTime.map(k => DAY_LABEL_TH[k]).join(', ')}`;
    }
  }

  // ตรวจ time conflict กับตารางของติวเตอร์
  const conflicts = findConflictDays(f.scheduleSlots, tutorAvail);
  if (conflicts.length > 0) {
    e.scheduleTime = conflicts.map(c =>
      `วัน${DAY_LABEL_TH[c.day]} ${c.start}–${c.end}${c.course ? ` (${c.course})` : ''}`
    ).join(', ');
  }

  // ตรวจว่าอยู่นอกช่วงเวลาที่สถาบันอนุญาตหรือไม่
  const outsideAllowed = findOutsideAllowedDays(f.scheduleSlots, allowedSlots);
  if (outsideAllowed.length > 0) {
    e.scheduleTime = outsideAllowed.map(c =>
      `วัน${DAY_LABEL_TH[c.day]} อยู่นอกเวลาที่สถาบันอนุญาต (${c.start}–${c.end})`
    ).join(', ');
  }

  return e;
}
