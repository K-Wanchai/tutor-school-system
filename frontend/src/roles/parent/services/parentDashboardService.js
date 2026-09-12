import { getMyChildProfile } from './parentService';

// รวมข้อมูลแดชบอร์ดของบุตรหลานจาก endpoint ของผู้ปกครอง (ไม่มี /parent/dashboard รวมศูนย์บน backend)
// catch เป็นค่าว่างของตัวเอง ไม่ให้ข้อมูลส่วนหนึ่งที่ยังไม่มีทำให้ทั้งหน้าพัง
export async function getChildDashboard() {
  const profile = await getMyChildProfile().catch(() => null);

  return {
    fullName: profile?.fullName,
    studentCode: profile?.studentCode,
  };
}
