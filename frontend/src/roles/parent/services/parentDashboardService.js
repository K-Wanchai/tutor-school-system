import {
  getMyChildProfile,
  getChildSchedules,
  getChildExamResults,
  getChildAttendance,
} from './parentService';

const ATTENDED_STATUSES = ['PRESENT', 'LATE'];

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildTodaySchedules(schedules) {
  const today = todayDateString();

  return schedules
    .filter((item) => item.scheduleDate === today && item.status !== 'CANCELLED')
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    .map((item) => ({
      id: item.id,
      startTime: item.startTime,
      courseName: item.courseName,
      lessonName: item.lessonTitle,
    }));
}

function buildAverageScore(examResults) {
  const graded = examResults.filter((item) => item.obtainedScore != null && item.totalScore);

  if (graded.length === 0) return null;

  const totalPercent = graded.reduce(
    (sum, item) => sum + (item.obtainedScore / item.totalScore) * 100,
    0
  );

  return Math.round(totalPercent / graded.length);
}

function buildLatestExams(examResults) {
  return [...examResults]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5)
    .map((item) => ({
      id: item.submissionId,
      examName: item.examTitle,
      score: item.obtainedScore,
      totalScore: item.totalScore,
      status: item.status,
    }));
}

function buildAttendanceRate(attendanceRecords) {
  if (attendanceRecords.length === 0) return null;

  const attended = attendanceRecords.filter((item) => ATTENDED_STATUSES.includes(item.status)).length;
  return Math.round((attended / attendanceRecords.length) * 100);
}

// รวมข้อมูลแดชบอร์ดของบุตรหลานจาก endpoint ของผู้ปกครองหลายตัว (ไม่มี /parent/dashboard รวมศูนย์บน backend)
// เช่นเดียวกับฝั่งนักเรียน — แต่ละคำขอ catch เป็นค่าว่างของตัวเอง ไม่ให้ข้อมูลส่วนหนึ่งที่ยังไม่มีทำให้ทั้งหน้าพัง
export async function getChildDashboard() {
  const [profile, schedules, examResults, attendanceRecords] = await Promise.all([
    getMyChildProfile().catch(() => null),
    getChildSchedules().catch(() => []),
    getChildExamResults().catch(() => []),
    getChildAttendance().catch(() => []),
  ]);

  const scheduleList = Array.isArray(schedules) ? schedules : [];
  const examList = Array.isArray(examResults) ? examResults : [];
  const attendanceList = Array.isArray(attendanceRecords) ? attendanceRecords : [];

  const todaySchedules = buildTodaySchedules(scheduleList);

  return {
    fullName: profile?.fullName,
    studentCode: profile?.studentCode,
    todayClasses: todaySchedules.length,
    averageScore: buildAverageScore(examList),
    attendanceRate: buildAttendanceRate(attendanceList),
    todaySchedules,
    latestExams: buildLatestExams(examList),
  };
}
