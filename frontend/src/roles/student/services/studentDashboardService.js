import { getMyProfile } from './studentProfileService';

// รวมข้อมูลแดชบอร์ดของนักเรียนจาก endpoint จริง (ไม่มี /student/dashboard รวมศูนย์บน backend)
// catch เป็นค่าว่างของตัวเอง เพื่อไม่ให้ข้อมูลส่วนหนึ่งที่ยังไม่มีทำให้ทั้งหน้าพัง
export async function getStudentDashboard() {
  const profile = await getMyProfile().catch(() => null);

  return {
    fullName: profile?.fullName,
    studentCode: profile?.studentCode,
  };
}
