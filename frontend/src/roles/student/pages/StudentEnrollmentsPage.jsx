import { useEffect, useMemo, useState } from 'react';
import {
  enrollCourse,
  getAvailableCourses,
  getMyEnrollments,
} from '../services/studentEnrollmentService';
import './StudentEnrollmentsPage.css';

export default function StudentEnrollmentsPage() {
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const enrolledCourseIds = useMemo(() => {
    return new Set(myEnrollments.map((item) => item.courseId));
  }, [myEnrollments]);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const [courseData, enrollmentData] = await Promise.all([
        getAvailableCourses(),
        getMyEnrollments().catch(() => []),
      ]);

      setCourses(courseData?.content || []);
      setMyEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการสมัครเรียนได้'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(courseId) {
    const confirmed = window.confirm('ยืนยันการสมัครเรียนคอร์สนี้หรือไม่?');
    if (!confirmed) return;

    try {
      setEnrollingId(courseId);
      setErrorMessage('');
      setSuccessMessage('');

      await enrollCourse(courseId);

      setSuccessMessage('สมัครเรียนสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบการชำระเงิน');
      await loadPageData();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'ไม่สามารถสมัครเรียนคอร์สนี้ได้'
      );
    } finally {
      setEnrollingId(null);
    }
  }

  function getStatusLabel(status) {
    const labels = {
      DRAFT: 'ฉบับร่าง',
      OPEN_FOR_REGISTRATION: 'เปิดรับสมัคร',
      CLOSED: 'ปิดรับสมัคร',
      ONGOING: 'กำลังเรียน',
      COMPLETED: 'เรียนจบแล้ว',
      CANCELLED: 'ยกเลิก',
    };

    return labels[status] || status || '-';
  }

  function formatDate(dateValue) {
    if (!dateValue) return '-';

    return new Date(dateValue).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatPrice(price) {
    if (price == null) return '-';
    return `${Number(price).toLocaleString('th-TH')} บาท`;
  }

  function formatSchedule(course) {
    if (!course.scheduleDays && !course.scheduleStartTime && !course.scheduleEndTime) {
      return '-';
    }

    const day = course.scheduleDays || '';
    const start = course.scheduleStartTime || '';
    const end = course.scheduleEndTime || '';

    return `${day} ${start}${end ? ` - ${end}` : ''}`.trim();
  }

  if (loading) {
    return (
      <div className="student-enroll-page">
        <div className="student-enroll-loading">
          <div className="student-enroll-spinner" />
          <p>กำลังโหลดข้อมูลคอร์ส...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-enroll-page">
      <div className="student-enroll-header">
        <div>
          <h1>การสมัครเรียน</h1>
          <p>เลือกคอร์สที่เปิดรับสมัครจากฐานข้อมูลจริง</p>
        </div>
      </div>

      {errorMessage && (
        <div className="student-enroll-alert error">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="student-enroll-alert success">{successMessage}</div>
      )}

      {courses.length === 0 ? (
        <div className="student-enroll-empty">
          <h2>ยังไม่มีคอร์สในระบบ</h2>
          <p>เมื่อมีคอร์สจากฐานข้อมูล ระบบจะแสดงรายการที่หน้านี้</p>
        </div>
      ) : (
        <div className="student-course-grid">
          {courses.map((course) => {
            const isOpen = course.status === 'OPEN_FOR_REGISTRATION';
            const isAlreadyEnrolled = enrolledCourseIds.has(course.id);
            const isFull =
              course.seatLimit != null &&
              course.enrolledCount >= course.seatLimit;

            const disabled =
              !isOpen || isAlreadyEnrolled || isFull || enrollingId === course.id;

            return (
              <div className="student-enroll-card" key={course.id}>
                <div className="student-enroll-card-top">
                  <span className="student-course-code">
                    {course.courseCode || 'COURSE'}
                  </span>

                  <span
                    className={`student-course-status ${
                      isOpen ? 'open' : 'closed'
                    }`}
                  >
                    {getStatusLabel(course.status)}
                  </span>
                </div>

                <h2>{course.courseName || '-'}</h2>

                <p className="student-course-desc">
                  {course.description || 'ไม่มีรายละเอียดคอร์ส'}
                </p>

                <div className="student-course-info">
                  <div>
                    <span>ผู้สอน</span>
                    <strong>{course.teacherName || '-'}</strong>
                  </div>

                  <div>
                    <span>ราคา</span>
                    <strong>{formatPrice(course.price)}</strong>
                  </div>

                  <div>
                    <span>จำนวนชั่วโมง</span>
                    <strong>
                      {course.totalHours != null
                        ? `${course.totalHours} ชั่วโมง`
                        : '-'}
                    </strong>
                  </div>

                  <div>
                    <span>จำนวนที่นั่ง</span>
                    <strong>
                      {course.seatLimit != null
                        ? `${course.enrolledCount || 0}/${course.seatLimit} คน`
                        : '-'}
                    </strong>
                  </div>

                  <div>
                    <span>ช่วงรับสมัคร</span>
                    <strong>
                      {formatDate(course.registrationStartDate)} -{' '}
                      {formatDate(course.registrationEndDate)}
                    </strong>
                  </div>

                  <div>
                    <span>วันเริ่มคอร์ส</span>
                    <strong>{formatDate(course.courseStartDate)}</strong>
                  </div>

                  <div className="student-course-info-full">
                    <span>ตารางเรียน</span>
                    <strong>{formatSchedule(course)}</strong>
                  </div>
                </div>

                <button
                  className="student-enroll-btn"
                  disabled={disabled}
                  onClick={() => handleEnroll(course.id)}
                >
                  {enrollingId === course.id
                    ? 'กำลังสมัคร...'
                    : isAlreadyEnrolled
                      ? 'สมัครแล้ว'
                      : isFull
                        ? 'ที่นั่งเต็ม'
                        : isOpen
                          ? 'สมัครเรียน'
                          : 'ยังไม่เปิดรับสมัคร'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}