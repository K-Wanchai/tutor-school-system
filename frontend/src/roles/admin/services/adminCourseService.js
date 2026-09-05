import api from '../../../shared/services/api';
import { toLocalISODate } from '../../../shared/utils/dateUtils';

function unwrap(res) {
  return res.data?.data ?? res.data;
}

function apiError(error, label) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error(`[${label}]`, error.response?.data || error.message);

  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณาตรวจสอบว่า server ทำงานอยู่';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (403 Forbidden)';
  if (status === 400) {
    const errors = error.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const msgs = Object.values(errors).flat();
      if (msgs.length > 0) return msgs.join(', ');
    }
    if (serverMsg === 'Course must have at least 1 lesson before it can be opened for registration') {
      return 'คอร์สนี้ยังไม่มีบทเรียน กรุณาเพิ่มบทเรียนอย่างน้อย 1 บทก่อนเปิดรับสมัคร';
    }
    return serverMsg || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  }
  if (status === 404) return 'ไม่พบข้อมูล (404 Not Found)';
  if (status === 409) return serverMsg || 'รหัสคอร์สซ้ำในระบบ';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export async function getCourses({ page = 0, size = 10 } = {}) {
  try {
    const res = await api.get('/courses', { params: { page, size } });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getCourses'), { cause: error });
  }
}

export async function getCourseById(id) {
  try {
    const res = await api.get(`/courses/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getCourseById'), { cause: error });
  }
}

export async function createCourse(form) {
  const payload = {
    courseName:            form.courseName.trim(),
    price:                 form.price != null && form.price !== '' ? Number(form.price) : 0,
    description:           form.description?.trim() || null,
    totalHours:            Number(form.totalHours),
    seatLimit:             Number(form.seatLimit),
    registrationStartDate: form.registrationStartDate || null,
    registrationEndDate:   form.registrationEndDate || null,
    courseStartDate:       form.courseStartDate,
    tutorId:               Number(form.tutorId),
    scheduleDays:          form.scheduleDays || [],
  };
  try {
    const res = await api.post('/courses', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createCourse'), { cause: error });
  }
}

export async function updateCourse(id, form) {
  const payload = {
    courseName:            form.courseName.trim(),
    price:                 form.price != null && form.price !== '' ? Number(form.price) : 0,
    description:           form.description?.trim() || null,
    totalHours:            Number(form.totalHours),
    seatLimit:             Number(form.seatLimit),
    registrationStartDate: form.registrationStartDate || null,
    registrationEndDate:   form.registrationEndDate || null,
    courseStartDate:       form.courseStartDate,
    tutorId:               Number(form.tutorId),
    lessons:               form.lessons || [],
    tests:                 form.tests || [],
    scheduleDays:          form.scheduleDays || [],
  };
  try {
    const res = await api.put(`/courses/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateCourse'), { cause: error });
  }
}

export async function updateCourseStatus(id, status) {
  try {
    const res = await api.patch(`/courses/${id}/status`, { status });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateCourseStatus'), { cause: error });
  }
}

export async function deleteCourse(id) {
  try {
    await api.delete(`/courses/${id}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteCourse'), { cause: error });
  }
}

// ดึง availability ของ Tutor ทั้งสัปดาห์ (จ–อา ของสัปดาห์ปัจจุบัน)
// excludeCourseId: ตอนแก้ไขคอร์ส ไม่ต้องนับ pattern/ตารางของคอร์สที่กำลังแก้ไขเองว่าเป็นเวลาไม่ว่าง
export async function getTutorWeeklyAvailability(tutorId, excludeCourseId) {
  const now = new Date();
  const dow = now.getDay(); // 0=อา
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));

  const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const results = await Promise.all(
    DAY_KEYS.map(async (key, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalISODate(d);
      try {
        const res = await api.get(`/course-schedules/tutor/${tutorId}/availability`, {
          params: { date: dateStr, excludeCourseId: excludeCourseId || undefined },
        });
        return { key, data: res.data?.data };
      } catch {
        return { key, data: null };
      }
    })
  );
  return Object.fromEntries(results.map(r => [r.key, r.data]));
}

export async function getCourseStats() {
  try {
    const res = await api.get('/courses', { params: { page: 0, size: 5000 } });
    const data = unwrap(res);
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    return {
      total:               data?.totalElements ?? list.length,
      pending:             list.filter(c => c.status === 'PENDING').length,
      closed:              list.filter(c => c.status === 'CLOSED').length,
      openForRegistration: list.filter(c => c.status === 'OPEN_FOR_REGISTRATION').length,
      ongoing:             list.filter(c => c.status === 'ONGOING').length,
      completed:           list.filter(c => c.status === 'COMPLETED').length,
    };
  } catch {
    return { total: 0, pending: 0, closed: 0, openForRegistration: 0, ongoing: 0, completed: 0 };
  }
}
