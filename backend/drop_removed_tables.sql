-- ลบ 13 ตารางที่เอาโค้ดออกแล้ว — รันบนเครื่องที่มี DB จริง (tutorschool_db) หลัง deploy backend ใหม่แล้วเท่านั้น
-- ddl-auto=update ไม่ลบตาราง/คอลัมน์ให้เอง ต้องรันสคริปต์นี้เอง
-- เรียงลำดับตาม foreign key (ตารางลูกก่อน ตารางแม่ทีหลัง) ป้องกัน error จาก FK constraint

-- ระบบทำข้อสอบในแอป (คงเหลือแค่ exams + exam_manual_scores)
DROP TABLE IF EXISTS exam_score_audit_logs;
DROP TABLE IF EXISTS exam_answers;
DROP TABLE IF EXISTS exam_submissions;
DROP TABLE IF EXISTS exam_question_options;
DROP TABLE IF EXISTS exam_questions;

-- ห้องเรียนออนไลน์ + การเช็คชื่อออนไลน์อัตโนมัติ (คงเหลือแค่ class_attendances ที่ติวเตอร์เช็คชื่อเอง)
DROP TABLE IF EXISTS attendance_audit_logs;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS classroom_sessions;

-- ตารางเรียนแบบวันที่จริง + บทเรียน (คงเหลือแค่ course_schedule_days ซึ่งเป็นรูปแบบวนซ้ำรายสัปดาห์)
-- exams.lesson_id อ้างถึง course_lessons — ต้องลบคอลัมน์นี้ก่อน ไม่งั้น FK จะกันไม่ให้ลบตาราง
-- schedule_attendances เป็นตารางเก่าของฟีเจอร์เช็คชื่อรุ่นก่อน ClassAttendance (ถูกแทนที่ไปแล้วก่อนหน้านี้
-- ไม่มี entity ไหนอ้างถึงในโค้ดปัจจุบันเลย) แต่ยังมี FK ค้างชี้ไปที่ course_schedules อยู่ ต้องลบก่อน
ALTER TABLE exams DROP COLUMN IF EXISTS lesson_id;
DROP TABLE IF EXISTS schedule_attendances;
DROP TABLE IF EXISTS course_schedules;
DROP TABLE IF EXISTS course_lessons;

-- ระบบแบบทดสอบเก่าที่ไม่มีใครใช้แล้ว (คู่ขนานกับ exams ที่ถูกแทนที่ไปแล้ว)
DROP TABLE IF EXISTS test_question_options;
DROP TABLE IF EXISTS test_questions;
DROP TABLE IF EXISTS course_tests;
