// เดิมอยู่ใน AdminCourseManagementPage.jsx — แยกออกมาเพื่อใช้ร่วมกันกับหน้าเพิ่มคอร์ส (AdminCourseCreatePage.jsx)

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
