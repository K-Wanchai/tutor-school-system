import { useEffect, useState } from 'react';
import { getCourses } from '../../services/adminCourseService';
import { getStudents } from '../../services/adminStudentService';

function asList(pageOrArray) {
  if (Array.isArray(pageOrArray)) return pageOrArray;
  return pageOrArray?.content || [];
}

// รายชื่อคอร์ส/นักเรียน สำหรับ dropdown ตัวกรองรายงาน — โหลดครั้งเดียวใช้ร่วมกันทุกแท็บรายงาน
export default function useReportLookups() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [courseData, studentData] = await Promise.all([
          getCourses({ page: 0, size: 500 }).catch(() => []),
          getStudents({ page: 0, size: 5000 }).catch(() => []),
        ]);
        if (!mounted) return;
        setCourses(asList(courseData));
        setStudents(asList(studentData));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { courses, students, loading };
}
