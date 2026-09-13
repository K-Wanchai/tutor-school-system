import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findMatchingNavItem } from '../utils/navMatch';

const BRAND = 'TutorSchool';

// ตั้งชื่อแท็บเบราว์เซอร์เป็น "TutorSchool / <ชื่อเมนูปัจจุบัน>" ตามเมนูที่กำลังเลือกอยู่
// navItems: [{ label, path }] จาก Sidebar ของแต่ละ role
export default function useDocumentTitle(navItems) {
  const location = useLocation();

  useEffect(() => {
    const match = findMatchingNavItem(location.pathname, navItems);
    document.title = match ? `${BRAND} / ${match.label}` : BRAND;
  }, [location.pathname, navItems]);
}
