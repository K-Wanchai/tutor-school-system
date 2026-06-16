# Seed Data Guide — Tutor School System

คู่มือการใส่ข้อมูลเริ่มต้น (Test Data) สำหรับ Development และ Testing

---

## สารบัญ

- [ก่อนเริ่ม](#ก่อนเริ่ม)
- [Test Accounts สรุป](#test-accounts-สรุป)
- [BCrypt Password Notes](#bcrypt-password-notes)
- [SQL Scripts](#sql-scripts)
- [วิธี Run SQL](#วิธี-run-sql)
- [ตรวจสอบว่า Seed สำเร็จ](#ตรวจสอบว่า-seed-สำเร็จ)
- [ล้างข้อมูลและ Reseed](#ล้างข้อมูลและ-reseed)

---

## ก่อนเริ่ม

### ระบบสร้าง Table อัตโนมัติ

เนื่องจากใช้ `spring.jpa.hibernate.ddl-auto=update` ใน development mode:

1. **รัน Application ก่อน** อย่างน้อย 1 ครั้ง เพื่อให้ Hibernate สร้าง Tables
2. รอจนเห็น log: `Started BackendApplication in X.XXX seconds`
3. จากนั้นจึงรัน SQL script เพื่อใส่ข้อมูล

### ตรวจสอบว่า Tables ถูกสร้างแล้ว

```sql
-- ใน psql หรือ pgAdmin
\c tutorschool_db
\dt

-- ควรเห็น tables: users, students, tutors, courses, enrollments, payments, ...
```

---

## Test Accounts สรุป

| Role    | Email                  | Password    | Username              |
|---------|------------------------|-------------|-----------------------|
| ADMIN   | admin@school.com       | admin123    | admin@school.com      |
| TUTOR   | tutor@school.com       | tutor123    | tutor@school.com      |
| STUDENT | student@school.com     | student123  | student@school.com    |

> หมายเหตุ: `username` ในระบบนี้ใช้ email เป็น principal (ดู User entity)

---

## BCrypt Password Notes

### BCrypt Hash ที่ใช้ใน SQL

ระบบใช้ **BCrypt** สำหรับ hash password (strength = 10)

| Password    | BCrypt Hash                                                      |
|-------------|------------------------------------------------------------------|
| `admin123`  | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| `tutor123`  | `$2a$10$8K1p/a0dR1xqM5DTXSbWcO4PxTJQVBfM5q5e6NrHYAa8pHiZR9lEi` |
| `student123`| `$2a$10$7EqJtq98nXZvnrBPtBXoq.k1bS0rJSu6Zs6w5TDEK7Sss/XhWxnLi` |

> **สำคัญ**: หากต้องการ hash password อื่น ให้ใช้ BCrypt online generator:
> - https://bcrypt-generator.com (ใช้ rounds = 10)
> - หรือเขียน test: `new BCryptPasswordEncoder().encode("your-password")`

### Generate BCrypt ใน Java

```java
// ใช้ใน Main method หรือ unit test
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
System.out.println(encoder.encode("admin123"));
```

---

## SQL Scripts

### Step 1: Insert Users

```sql
-- =============================================
-- USERS (accounts สำหรับ login)
-- username = email (ระบบใช้ email เป็น principal)
-- =============================================

INSERT INTO users (username, email, password, role, is_enabled, created_at, updated_at)
VALUES
  (
    'admin@school.com',
    'admin@school.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    true,
    NOW(),
    NOW()
  ),
  (
    'tutor@school.com',
    'tutor@school.com',
    '$2a$10$8K1p/a0dR1xqM5DTXSbWcO4PxTJQVBfM5q5e6NrHYAa8pHiZR9lEi',
    'TUTOR',
    true,
    NOW(),
    NOW()
  ),
  (
    'student@school.com',
    'student@school.com',
    '$2a$10$7EqJtq98nXZvnrBPtBXoq.k1bS0rJSu6Zs6w5TDEK7Sss/XhWxnLi',
    'STUDENT',
    true,
    NOW(),
    NOW()
  );
```

### Step 2: Insert Tutor Profile

```sql
-- =============================================
-- TUTORS (ข้อมูลครู — ต้องใส่หลัง users)
-- user_id = 2 (tutor@school.com)
-- =============================================

INSERT INTO tutors (user_id, first_name, last_name, phone_number, specialization, bio, created_at, updated_at)
VALUES (
  2,
  'อาจารย์',
  'สมศักดิ์ วิชาการ',
  '0891234567',
  'คณิตศาสตร์ ม.ปลาย และสถิติ',
  'ผู้เชี่ยวชาญคณิตศาสตร์ระดับมัธยมปลาย ประสบการณ์สอน 10 ปี จบปริญญาเอกจากจุฬาลงกรณ์มหาวิทยาลัย',
  NOW(),
  NOW()
);
```

### Step 3: Insert Student Profile

```sql
-- =============================================
-- STUDENTS (ข้อมูลนักเรียน — ต้องใส่หลัง users)
-- user_id = 3 (student@school.com)
-- =============================================

INSERT INTO students (
  user_id,
  student_code,
  full_name,
  national_id,
  address,
  phone_number,
  birth_date,
  guardian_phone_number,
  created_at,
  updated_at
)
VALUES (
  3,
  'STU2026001',
  'สมชาย ใจดีมาก',
  '1234567890123',
  '123/45 ซอยสุขุมวิท 101 แขวงบางนา เขตบางนา กรุงเทพฯ 10260',
  '0812345678',
  '2008-03-15',
  '0897654321',
  NOW(),
  NOW()
);
```

### Step 4: Insert Course

```sql
-- =============================================
-- COURSES (คอร์สเรียน — ต้องใส่หลัง tutors)
-- teacher_id = 1 (tutor id ที่เพิ่งสร้าง)
-- =============================================

INSERT INTO courses (
  course_code,
  course_name,
  price,
  description,
  total_hours,
  seat_limit,
  registration_start_date,
  registration_end_date,
  course_start_date,
  status,
  teacher_id,
  created_at,
  updated_at
)
VALUES (
  'MATH101-2026',
  'คณิตศาสตร์ ม.6 เตรียมสอบ PAT1',
  5000.00,
  'คอร์สเข้มข้นเตรียมสอบ PAT1 ครอบคลุมทุกบท ทำโจทย์จริงจากข้อสอบย้อนหลัง 10 ปี '
  'พร้อม mock exam ก่อนสอบจริง',
  60,
  30,
  '2026-06-01',
  '2026-06-30',
  '2026-07-01',
  'OPEN_FOR_REGISTRATION',
  1,
  NOW(),
  NOW()
);
```

### Step 5: Insert Enrollment

```sql
-- =============================================
-- ENROLLMENTS (การลงทะเบียน — ต้องใส่หลัง students และ courses)
-- student_id = 1 (students table)
-- course_id = 1 (courses table)
-- =============================================

INSERT INTO enrollments (
  enrollment_code,
  student_id,
  course_id,
  enrollment_date,
  status,
  payment_status,
  payment_method,
  amount,
  discount_amount,
  final_amount,
  note,
  created_at,
  updated_at
)
VALUES (
  'ENR-2026-001',
  1,
  1,
  NOW(),
  'PENDING',
  'UNPAID',
  'BANK_TRANSFER',
  5000.00,
  0.00,
  5000.00,
  'ลงทะเบียนทดสอบระบบ',
  NOW(),
  NOW()
);
```

---

## Script รวมทั้งหมด (All-in-One)

คัดลอก script นี้ทั้งหมดไปรันใน psql หรือ pgAdmin ได้เลย:

```sql
-- ============================================================
-- TUTOR SCHOOL SYSTEM — SEED DATA
-- Version: 1.0 | Date: 2026-06-16
-- Prerequisites: ต้องรัน Application ก่อนให้ Tables ถูกสร้าง
-- ============================================================

BEGIN;

-- 1. Users
INSERT INTO users (username, email, password, role, is_enabled, created_at, updated_at)
VALUES
  ('admin@school.com', 'admin@school.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'ADMIN', true, NOW(), NOW()),

  ('tutor@school.com', 'tutor@school.com',
   '$2a$10$8K1p/a0dR1xqM5DTXSbWcO4PxTJQVBfM5q5e6NrHYAa8pHiZR9lEi',
   'TUTOR', true, NOW(), NOW()),

  ('student@school.com', 'student@school.com',
   '$2a$10$7EqJtq98nXZvnrBPtBXoq.k1bS0rJSu6Zs6w5TDEK7Sss/XhWxnLi',
   'STUDENT', true, NOW(), NOW());

-- 2. Tutor profile
INSERT INTO tutors (user_id, first_name, last_name, phone_number, specialization, bio, created_at, updated_at)
VALUES (
  2, 'อาจารย์', 'สมศักดิ์ วิชาการ', '0891234567',
  'คณิตศาสตร์ ม.ปลาย และสถิติ',
  'ผู้เชี่ยวชาญคณิตศาสตร์ระดับมัธยมปลาย ประสบการณ์สอน 10 ปี',
  NOW(), NOW()
);

-- 3. Student profile
INSERT INTO students (
  user_id, student_code, full_name, national_id, address,
  phone_number, birth_date, guardian_phone_number, created_at, updated_at
)
VALUES (
  3, 'STU2026001', 'สมชาย ใจดีมาก', '1234567890123',
  '123/45 ซอยสุขุมวิท 101 กรุงเทพฯ 10260',
  '0812345678', '2008-03-15', '0897654321',
  NOW(), NOW()
);

-- 4. Course
INSERT INTO courses (
  course_code, course_name, price, description, total_hours, seat_limit,
  registration_start_date, registration_end_date, course_start_date,
  status, teacher_id, created_at, updated_at
)
VALUES (
  'MATH101-2026', 'คณิตศาสตร์ ม.6 เตรียมสอบ PAT1',
  5000.00, 'คอร์สเข้มข้นเตรียมสอบ PAT1 ครอบคลุมทุกบท', 60, 30,
  '2026-06-01', '2026-06-30', '2026-07-01',
  'OPEN_FOR_REGISTRATION', 1,
  NOW(), NOW()
);

-- 5. Enrollment
INSERT INTO enrollments (
  enrollment_code, student_id, course_id, enrollment_date,
  status, payment_status, payment_method, amount, discount_amount, final_amount,
  note, created_at, updated_at
)
VALUES (
  'ENR-2026-001', 1, 1, NOW(),
  'PENDING', 'UNPAID', 'BANK_TRANSFER', 5000.00, 0.00, 5000.00,
  'ลงทะเบียนทดสอบระบบ',
  NOW(), NOW()
);

COMMIT;

-- ตรวจสอบ
SELECT 'users' as tbl, count(*) from users
UNION ALL SELECT 'tutors', count(*) from tutors
UNION ALL SELECT 'students', count(*) from students
UNION ALL SELECT 'courses', count(*) from courses
UNION ALL SELECT 'enrollments', count(*) from enrollments;
```

---

## วิธี Run SQL

### วิธีที่ 1: psql command line

```bash
# Windows (PowerShell)
psql -U postgres -d tutorschool_db -f seed.sql

# หรือ paste โดยตรง
psql -U postgres -d tutorschool_db
```

จากนั้น paste SQL และกด Enter

### วิธีที่ 2: pgAdmin 4

1. เปิด pgAdmin 4
2. ขยาย Servers > PostgreSQL > Databases > `tutorschool_db`
3. คลิกขวา > Query Tool
4. วาง SQL script แล้วกด **F5** หรือคลิก Run

### วิธีที่ 3: DBeaver หรือ IntelliJ Database Tool

1. เปิด connection ไปที่ `tutorschool_db`
2. เปิด SQL editor ใหม่
3. วาง script แล้วกด Ctrl+Enter หรือ Run All

### วิธีที่ 4: Spring Boot Data Initializer (Optional)

สร้างไฟล์ `src/main/resources/data.sql` แล้วใส่ SQL script:

```properties
# application.properties — เพิ่ม:
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true
```

> ระวัง: `data.sql` จะรันทุกครั้งที่ Start Application — ใช้ `INSERT ... ON CONFLICT DO NOTHING` เพื่อป้องกัน duplicate

---

## ตรวจสอบว่า Seed สำเร็จ

### ทดสอบ Login ด้วย Test Account

**Admin login:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@school.com",
  "password": "admin123"
}
```

ถ้าสำเร็จ response จะมี `"success": true` และ `"data": { "token": "...", "role": "ADMIN" }`

**Tutor login:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "tutor@school.com",
  "password": "tutor123"
}
```

**Student login:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "student@school.com",
  "password": "student123"
}
```

### ตรวจสอบด้วย SQL

```sql
-- ดูว่า data ถูก insert ถูกต้อง
SELECT id, email, role, is_enabled FROM users;
SELECT id, student_code, full_name FROM students;
SELECT id, first_name, last_name, specialization FROM tutors;
SELECT id, course_code, course_name, status, price FROM courses;
SELECT id, enrollment_code, status, payment_status FROM enrollments;
```

---

## ล้างข้อมูลและ Reseed

หากต้องการลบข้อมูลทั้งหมดและเริ่มใหม่ (development เท่านั้น):

```sql
-- ============================================================
-- DANGER: ลบข้อมูลทั้งหมด — ใช้ใน dev เท่านั้น!
-- ============================================================
BEGIN;

-- ลบตามลำดับ (FK constraints)
DELETE FROM attendance_audit_logs;
DELETE FROM exam_score_audit_logs;
DELETE FROM exam_answers;
DELETE FROM exam_submissions;
DELETE FROM question_options;
DELETE FROM exam_questions;
DELETE FROM exams;
DELETE FROM attendance_records;
DELETE FROM classroom_sessions;
DELETE FROM notifications;
DELETE FROM course_evaluations;
DELETE FROM course_schedules;
DELETE FROM payments;
DELETE FROM enrollments;
DELETE FROM course_tests;
DELETE FROM course_lessons;
DELETE FROM courses;
DELETE FROM student_achievements;
DELETE FROM students;
DELETE FROM tutors;
DELETE FROM users;
DELETE FROM institution_profiles;

-- Reset sequences (auto increment)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE tutors_id_seq RESTART WITH 1;
ALTER SEQUENCE courses_id_seq RESTART WITH 1;
ALTER SEQUENCE enrollments_id_seq RESTART WITH 1;

COMMIT;
```

จากนั้นรัน seed script ใหม่ตั้งแต่ต้น

---

## เพิ่มข้อมูลทดสอบเพิ่มเติม

### เพิ่มนักเรียนและครูหลายคน

```sql
-- เพิ่ม users เพิ่มเติม
INSERT INTO users (username, email, password, role, is_enabled, created_at, updated_at)
VALUES
  ('student2@school.com', 'student2@school.com',
   '$2a$10$7EqJtq98nXZvnrBPtBXoq.k1bS0rJSu6Zs6w5TDEK7Sss/XhWxnLi',
   'STUDENT', true, NOW(), NOW()),
  ('student3@school.com', 'student3@school.com',
   '$2a$10$7EqJtq98nXZvnrBPtBXoq.k1bS0rJSu6Zs6w5TDEK7Sss/XhWxnLi',
   'STUDENT', true, NOW(), NOW()),
  ('tutor2@school.com', 'tutor2@school.com',
   '$2a$10$8K1p/a0dR1xqM5DTXSbWcO4PxTJQVBfM5q5e6NrHYAa8pHiZR9lEi',
   'TUTOR', true, NOW(), NOW());

-- ดู user_id ที่เพิ่งสร้าง
SELECT id, email, role FROM users ORDER BY id;
```

### เพิ่มคอร์สเพิ่มเติม

```sql
-- คอร์สฟิสิกส์ (สมมติ tutor id = 1)
INSERT INTO courses (
  course_code, course_name, price, description, total_hours, seat_limit,
  registration_start_date, registration_end_date, course_start_date,
  status, teacher_id, created_at, updated_at
)
VALUES (
  'PHY101-2026', 'ฟิสิกส์ ม.6 เตรียมสอบ PAT2',
  4500.00, 'คอร์สฟิสิกส์เน้น กลศาสตร์ ไฟฟ้า แม่เหล็ก และคลื่น',
  50, 25,
  '2026-06-15', '2026-07-10', '2026-07-15',
  'OPEN_FOR_REGISTRATION', 1,
  NOW(), NOW()
);
```

---

## หมายเหตุสำคัญ

1. **BCrypt hash** จะแตกต่างกันทุกครั้งที่ generate แม้ password เดียวกัน — ดังนั้น hash ที่ให้ไว้ข้างบนคือค่าที่ทดสอบแล้วว่าทำงานได้
2. **อย่า commit** ไฟล์ seed ที่มี production data หรือ password จริง
3. ใน production ควรใช้ `ddl-auto=validate` และ migration tool เช่น **Flyway** แทน `data.sql`
4. หาก Application ยังไม่เคยรัน Tables จะยังไม่มี — ต้องรัน Spring Boot ก่อน 1 ครั้ง
5. ฐานข้อมูลใช้ timezone `Asia/Bangkok` (ดู `spring.jackson.time-zone=Asia/Bangkok` ใน application.properties)
