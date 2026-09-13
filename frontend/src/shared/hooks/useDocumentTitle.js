import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'TutorSchool';

// ตั้งชื่อแท็บเบราว์เซอร์เป็น "TutorSchool / <ชื่อเมนูปัจจุบัน>" ตามเมนูที่กำลังเลือกอยู่
// navItems: [{ label, path }] จาก Sidebar ของแต่ละ role — เทียบ path ปัจจุบันกับ path ที่ยาวที่สุดที่ตรงกัน
// (รองรับหน้าย่อยที่ไม่มีในเมนู เช่น /admin/exams/tutors/4 ให้ยังจับคู่กับเมนู "การสอบ" ได้)
export default function useDocumentTitle(navItems) {
  const location = useLocation();

  useEffect(() => {
    const match = navItems
      .filter((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];

    document.title = match ? `${BRAND} / ${match.label}` : BRAND;
  }, [location.pathname, navItems]);
}
