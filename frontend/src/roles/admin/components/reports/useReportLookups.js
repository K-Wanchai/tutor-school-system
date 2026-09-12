import { useEffect, useState } from 'react';
import { getCourses } from '../../services/adminCourseService';

function asList(pageOrArray) {
  if (Array.isArray(pageOrArray)) return pageOrArray;
  return pageOrArray?.content || [];
}

// รายชื่อคอร์ส สำหรับ dropdown ตัวกรองรายงาน — โหลดครั้งเดียวใช้ร่วมกันทุกแท็บรายงาน
export default function useReportLookups() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const courseData = await getCourses({ page: 0, size: 500 }).catch(() => []);
        if (!mounted) return;
        setCourses(asList(courseData));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { courses, loading };
}
