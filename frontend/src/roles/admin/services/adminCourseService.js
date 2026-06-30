import api from '../../../shared/services/api';

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
    throw new Error(apiError(error, 'getCourses'));
  }
}

export async function getCourseById(id) {
  try {
    const res = await api.get(`/courses/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getCourseById'));
  }
}

export async function createCourse(form) {
  const payload = {
    courseCode:            form.courseCode.trim(),
    courseName:            form.courseName.trim(),
    price:                 form.price != null && form.price !== '' ? Number(form.price) : 0,
    description:           form.description?.trim() || null,
    totalHours:            Number(form.totalHours),
    seatLimit:             Number(form.seatLimit),
    registrationStartDate: form.registrationStartDate || null,
    registrationEndDate:   form.registrationEndDate || null,
    courseStartDate:       form.courseStartDate,
    tutorId:               Number(form.tutorId),
    scheduleDays:          form.scheduleDays || null,
    scheduleStartTime:     form.scheduleStartTime || null,
    scheduleEndTime:       form.scheduleEndTime || null,
  };
  try {
    const res = await api.post('/courses', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createCourse'));
  }
}

export async function updateCourse(id, form) {
  const payload = {
    courseCode:            form.courseCode.trim(),
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
    scheduleDays:          form.scheduleDays || null,
    scheduleStartTime:     form.scheduleStartTime || null,
    scheduleEndTime:       form.scheduleEndTime || null,
  };
  try {
    const res = await api.put(`/courses/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateCourse'));
  }
}

export async function updateCourseStatus(id, status) {
  try {
    const res = await api.patch(`/courses/${id}/status`, { status });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateCourseStatus'));
  }
}

export async function deleteCourse(id) {
  try {
    await api.delete(`/courses/${id}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteCourse'));
  }
}

// ดึง availability ของ Tutor ทั้งสัปดาห์ (จ–อา ของสัปดาห์ปัจจุบัน)
export async function getTutorWeeklyAvailability(tutorId) {
  const now = new Date();
  const dow = now.getDay(); // 0=อา
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));

  const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const results = await Promise.all(
    DAY_KEYS.map(async (key, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      try {
        const res = await api.get(`/course-schedules/tutor/${tutorId}/availability`, { params: { date: dateStr } });
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
      draft:               list.filter(c => c.status === 'DRAFT').length,
      openForRegistration: list.filter(c => c.status === 'OPEN_FOR_REGISTRATION').length,
      ongoing:             list.filter(c => c.status === 'ONGOING').length,
      completed:           list.filter(c => c.status === 'COMPLETED').length,
      cancelled:           list.filter(c => c.status === 'CANCELLED').length,
    };
  } catch {
    return { total: 0, draft: 0, openForRegistration: 0, ongoing: 0, completed: 0, cancelled: 0 };
  }
}
