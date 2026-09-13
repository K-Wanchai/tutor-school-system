// จับคู่ path ปัจจุบันกับรายการเมนู {label, path} ที่ path ยาวที่สุดที่ตรงกัน
// รองรับหน้าย่อยที่ไม่มีในเมนูโดยตรง เช่น /admin/exams/tutors/4 ให้ยังจับคู่กับเมนู "การสอบ" (path: /admin/exams) ได้
export function findMatchingNavItem(pathname, navItems) {
  return navItems
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}
