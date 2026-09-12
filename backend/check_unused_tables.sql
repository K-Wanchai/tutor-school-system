-- เช็คจำนวนแถวจริงในทุกตารางของระบบ (33 ตาราง) — รันบนเครื่องที่มี Postgres (tutorschool_db)
-- ผ่าน psql / pgAdmin / DBeaver แล้วเรียงจากน้อยไปมาก จะเห็นชัดว่าตารางไหน "ไม่ได้ใช้งานจริง" (แถว = 0)
SELECT 'academic_faculties' AS table_name, COUNT(*) AS row_count FROM academic_faculties
UNION ALL SELECT 'academic_majors', COUNT(*) FROM academic_majors
UNION ALL SELECT 'admission_rounds', COUNT(*) FROM admission_rounds
UNION ALL SELECT 'attendance_audit_logs', COUNT(*) FROM attendance_audit_logs
UNION ALL SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL SELECT 'class_attendances', COUNT(*) FROM class_attendances
UNION ALL SELECT 'classroom_sessions', COUNT(*) FROM classroom_sessions
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'course_evaluations', COUNT(*) FROM course_evaluations
UNION ALL SELECT 'course_lessons', COUNT(*) FROM course_lessons
UNION ALL SELECT 'course_schedules', COUNT(*) FROM course_schedules
UNION ALL SELECT 'course_schedule_days', COUNT(*) FROM course_schedule_days
UNION ALL SELECT 'course_tests', COUNT(*) FROM course_tests
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'exam_answers', COUNT(*) FROM exam_answers
UNION ALL SELECT 'exam_institutions', COUNT(*) FROM exam_institutions
UNION ALL SELECT 'exam_manual_scores', COUNT(*) FROM exam_manual_scores
UNION ALL SELECT 'exam_questions', COUNT(*) FROM exam_questions
UNION ALL SELECT 'exam_question_options', COUNT(*) FROM exam_question_options
UNION ALL SELECT 'exam_score_audit_logs', COUNT(*) FROM exam_score_audit_logs
UNION ALL SELECT 'exam_submissions', COUNT(*) FROM exam_submissions
UNION ALL SELECT 'institution_profiles', COUNT(*) FROM institution_profiles
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'school_tracks', COUNT(*) FROM school_tracks
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'student_code_counters', COUNT(*) FROM student_code_counters
UNION ALL SELECT 'student_exam_achievements', COUNT(*) FROM student_exam_achievements
UNION ALL SELECT 'test_questions', COUNT(*) FROM test_questions
UNION ALL SELECT 'test_question_options', COUNT(*) FROM test_question_options
UNION ALL SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'vocational_majors', COUNT(*) FROM vocational_majors
ORDER BY row_count ASC;
