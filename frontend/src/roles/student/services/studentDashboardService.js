import { getMyProfile } from './studentProfileService';
import { getMySchedule } from './studentScheduleService';
import { getMyExamSubmissions } from './studentExamService';
import { getMyAttendanceHistory } from './studentAttendanceService';

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

function buildAverageScore(examSubmissions) {
  const graded = examSubmissions.filter(
    (item) => item.status === 'GRADED' && item.totalScore
  );

  if (graded.length === 0) return null;

  const totalPercent = graded.reduce(
    (sum, item) => sum + (item.obtainedScore / item.totalScore) * 100,
    0
  );

  return Math.round(totalPercent / graded.length);
}

function buildLatestExams(examSubmissions) {
  return [...examSubmissions]
    .sort((a, b) => new Date(b.submittedAt || b.updatedAt || 0) - new Date(a.submittedAt || a.updatedAt || 0))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
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

// รวมข้อมูลแดชบอร์ดของนักเรียนจาก endpoint จริงหลายตัว (ไม่มี /student/dashboard รวมศูนย์บน backend)
// แต่ละคำขอ catch เป็นค่าว่างของตัวเอง เพื่อไม่ให้ข้อมูลส่วนหนึ่งที่ยังไม่มี (เช่น ยังไม่มีตารางเรียน)
// ทำให้ทั้งหน้าพัง
export async function getStudentDashboard() {
  const [profile, schedules, examSubmissions, attendanceRecords] = await Promise.all([
    getMyProfile().catch(() => null),
    getMySchedule().catch(() => []),
    getMyExamSubmissions().catch(() => []),
    getMyAttendanceHistory().catch(() => []),
  ]);

  const scheduleList = Array.isArray(schedules) ? schedules : [];
  const examList = Array.isArray(examSubmissions) ? examSubmissions : [];
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
