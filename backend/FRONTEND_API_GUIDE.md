# Frontend API Guide — Tutor School System

คู่มือสำหรับ Frontend Developer ในการเรียกใช้ REST API ของระบบ Tutor School System

---

## สารบัญ

- [Base URL](#base-url)
- [Auth Flow](#auth-flow)
- [Response Format](#response-format)
- [Role Permissions](#role-permissions)
- [Public Endpoints](#public-endpoints)
- [API Modules](#api-modules)
- [HTTP Status Codes](#http-status-codes)
- [Error Handling Guide](#error-handling-guide)

---

## Base URL

```
http://localhost:8080
```

> Production: เปลี่ยนเป็น domain จริง เช่น `https://api.tutorschool.com`

---

## Auth Flow

### ขั้นตอนการ Authenticate

**Step 1: Login เพื่อรับ token**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@school.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "ADMIN"
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

**Step 2: เก็บ token ใน localStorage หรือ memory**

```javascript
// ตัวอย่าง React
const { token, role } = response.data.data;
localStorage.setItem('token', token);
localStorage.setItem('role', role);
```

**Step 3: ส่ง token ใน Authorization header ทุก request**

```http
GET /api/v1/students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
// ตัวอย่าง Axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Step 4: Handle 401 — redirect ไป login**

```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Response Format

ทุก endpoint ของระบบ return `ApiResponse<T>` ในรูปแบบเดียวกัน:

### Success Response

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": { ... },
  "timestamp": "2026-06-16T10:30:00"
}
```

สำหรับ List:
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    { "id": 1, "fullName": "สมชาย ใจดี", "studentCode": "STU001" },
    { "id": 2, "fullName": "สมหญิง รักเรียน", "studentCode": "STU002" }
  ],
  "timestamp": "2026-06-16T10:30:00"
}
```

สำหรับ Paginated List (`PageResponse`):
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "content": [ {...}, {...} ],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3,
    "last": false
  },
  "timestamp": "2026-06-16T10:30:00"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Course not found with id: 999",
  "errors": null,
  "timestamp": "2026-06-16T10:30:00"
}
```

### Validation Error Response (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "must be a valid email address",
    "phoneNumber": "must not be blank"
  },
  "timestamp": "2026-06-16T10:30:00"
}
```

---

## Role Permissions

| Feature                        | ADMIN | TUTOR | STUDENT |
|--------------------------------|-------|-------|---------|
| จัดการข้อมูลนักเรียน (CRUD)    | ✅    | ดูได้ | ดูตัวเองได้ |
| จัดการข้อมูลครู (CRUD)         | ✅    | ดูได้ | ดูได้  |
| จัดการคอร์ส (CRUD)             | ✅    | ดูได้ | ดูได้  |
| อนุมัติการลงทะเบียน            | ✅    | -     | -       |
| ดูการลงทะเบียนทั้งหมด          | ✅    | ดูตาม course | ดูตัวเองได้ |
| ดูและจัดการ Payment            | ✅    | -     | จ่ายและดูตัวเองได้ |
| สร้างข้อสอบ                    | ✅    | ✅    | -       |
| เปิด/ปิดข้อสอบ                 | ✅    | ✅    | -       |
| เริ่มสอบ / ส่งข้อสอบ           | -     | -     | ✅      |
| Grading (manual)               | ✅    | ✅    | -       |
| ดูผลสอบ                        | ✅ (ทั้งหมด) | ✅ (ตาม exam) | ดูตัวเองได้ |
| จัดการตารางเรียน               | ✅    | ✅    | ดูได้  |
| สร้าง Classroom Session        | ✅    | ✅    | -       |
| Join / Leave Session           | -     | -     | ✅      |
| ดู Attendance ทั้งหมด          | ✅    | ✅ (ตาม session) | ดูตัวเองได้ |
| Update Attendance status       | -     | ✅    | -       |
| รีวิวคอร์ส                     | -     | -     | ✅ (หลังเรียนจบ) |
| อนุมัติ/ลบรีวิว                | ✅    | -     | -       |
| จัดการ Exam Institutions       | ✅    | -     | -       |
| จัดการ Student Achievements    | ✅    | ✅    | บันทึกตัวเองได้ |
| แก้ไข Institution Profile      | ✅    | -     | -       |
| ดู Notifications               | ✅ (ทั้งหมด) | ✅ (ตัวเอง) | ✅ (ตัวเอง) |

---

## Public Endpoints

Endpoints ที่ **ไม่ต้องใช้ Authorization header**:

| Method | Path                             | คำอธิบาย                      |
|--------|----------------------------------|-------------------------------|
| POST   | `/api/v1/auth/login`             | Login — รับ JWT token          |
| POST   | `/api/v1/auth/register`          | Register บัญชีใหม่             |
| GET    | `/api/v1/courses`                | ดูรายการคอร์สทั้งหมด (paginated) |
| GET    | `/api/v1/courses/{id}`           | ดูรายละเอียดคอร์ส              |
| GET    | `/api/v1/courses/code/{code}`    | ค้นหาคอร์สด้วยรหัส             |
| GET    | `/api/v1/institution-profile`    | ดูข้อมูลโรงเรียน               |
| GET    | `/swagger-ui/index.html`         | Swagger UI                    |
| GET    | `/v3/api-docs`                   | OpenAPI spec                  |

---

## API Modules

---

### 1. Auth — `/api/v1/auth`

ระบบ Authentication: Login และ Register

#### Endpoints

| Method | Path              | Role   | คำอธิบาย                    |
|--------|-------------------|--------|------------------------------|
| POST   | `/auth/login`     | Public | Login รับ JWT token           |
| POST   | `/auth/register`  | Public | สมัครบัญชีใหม่ (role ระบุใน body) |

#### ตัวอย่าง: Login

Request:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "student@school.com",
  "password": "student123"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHVkZW50QHNjaG9vbC5jb20iLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTcxOTEzNjQwMCwiZXhwIjoxNzE5MTM3MzAwfQ.xxx",
    "role": "STUDENT"
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

#### ตัวอย่าง: Register

Request:
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser@school.com",
  "email": "newuser@school.com",
  "password": "password123",
  "role": "STUDENT"
}
```

---

### 2. Students — `/api/v1/students`

จัดการข้อมูลนักเรียน รองรับ Pagination

#### Endpoints

| Method | Path                      | Role         | คำอธิบาย                        |
|--------|---------------------------|--------------|----------------------------------|
| GET    | `/students`               | ADMIN, TUTOR | ดูนักเรียนทั้งหมด (paginated)    |
| GET    | `/students/{id}`          | ADMIN, TUTOR, STUDENT | ดูนักเรียนตาม ID       |
| GET    | `/students/code/{code}`   | ADMIN, TUTOR | ค้นหานักเรียนด้วย student code  |
| POST   | `/students`               | ADMIN        | เพิ่มนักเรียนใหม่               |
| PUT    | `/students/{id}`          | ADMIN        | แก้ไขข้อมูลนักเรียน              |
| PATCH  | `/students/{id}/status`   | ADMIN        | เปลี่ยน status นักเรียน          |
| DELETE | `/students/{id}`          | ADMIN        | ลบนักเรียน                       |

#### Query Parameters (GET /students)

| Parameter | Default | คำอธิบาย           |
|-----------|---------|---------------------|
| `page`    | 0       | หน้า (เริ่มที่ 0)  |
| `size`    | 10      | จำนวนรายการต่อหน้า |

#### ตัวอย่าง: ดูรายการนักเรียน

Request:
```http
GET /api/v1/students?page=0&size=10
Authorization: Bearer <token>
```

Response `200 OK`:
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "studentCode": "STU001",
        "fullName": "สมชาย ใจดี",
        "nationalId": "1234567890123",
        "phoneNumber": "0812345678",
        "email": "student@school.com",
        "createdAt": "2026-01-01T09:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

---

### 3. Tutors — `/api/v1/tutors`

จัดการข้อมูลครูผู้สอน

#### Endpoints

| Method | Path           | Role         | คำอธิบาย                      |
|--------|----------------|--------------|-------------------------------|
| GET    | `/tutors`      | ADMIN, TUTOR, STUDENT | ดูครูทั้งหมด (paginated) |
| GET    | `/tutors/{id}` | ADMIN, TUTOR, STUDENT | ดูครูตาม ID           |
| POST   | `/tutors`      | ADMIN        | เพิ่มครูใหม่                  |
| PUT    | `/tutors/{id}` | ADMIN        | แก้ไขข้อมูลครู                |
| DELETE | `/tutors/{id}` | ADMIN        | ลบครู                         |

#### ตัวอย่าง: เพิ่มครูใหม่

Request:
```http
POST /api/v1/tutors
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": 2,
  "firstName": "อาจารย์",
  "lastName": "สมศักดิ์",
  "phoneNumber": "0891234567",
  "specialization": "คณิตศาสตร์ ม.ปลาย",
  "bio": "ผู้เชี่ยวชาญวิชาคณิตศาสตร์ ประสบการณ์ 10 ปี"
}
```

---

### 4. Courses — `/api/v1/courses`

จัดการคอร์สเรียน

#### Endpoints

| Method | Path                          | Role         | คำอธิบาย                            |
|--------|-------------------------------|--------------|--------------------------------------|
| GET    | `/courses`                    | Public       | ดูคอร์สทั้งหมด (paginated)           |
| GET    | `/courses/{id}`               | Public       | ดูรายละเอียดคอร์ส                    |
| GET    | `/courses/code/{courseCode}`  | Public       | ค้นหาคอร์สด้วยรหัส                   |
| GET    | `/courses/Tutor/{teacherId}`  | ADMIN, TUTOR | ดูคอร์สของครูคนนั้น                  |
| POST   | `/courses`                    | ADMIN        | สร้างคอร์สใหม่                       |
| PUT    | `/courses/{id}`               | ADMIN        | แก้ไขคอร์ส                           |
| PATCH  | `/courses/{id}/status`        | ADMIN        | เปลี่ยน status คอร์ส                 |
| DELETE | `/courses/{id}`               | ADMIN        | ลบคอร์ส                              |

#### Course Status Values

| Status                 | ความหมาย                      |
|------------------------|-------------------------------|
| `DRAFT`                | ร่าง ยังไม่เปิดลงทะเบียน      |
| `OPEN_FOR_REGISTRATION`| เปิดรับสมัครได้                |
| `CLOSED`               | ปิดรับสมัครแล้ว                |
| `IN_PROGRESS`          | กำลังเรียนอยู่                  |
| `COMPLETED`            | เรียนจบแล้ว                    |
| `CANCELLED`            | ยกเลิกคอร์ส                    |

#### ตัวอย่าง: สร้างคอร์ส

Request:
```http
POST /api/v1/courses
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "courseCode": "MATH101",
  "courseName": "คณิตศาสตร์ ม.6 เตรียมสอบ PAT1",
  "price": 5000.00,
  "description": "คอร์สเข้มข้น เตรียมสอบ PAT1 ครบทุกบท",
  "totalHours": 60,
  "seatLimit": 30,
  "registrationStartDate": "2026-06-01",
  "registrationEndDate": "2026-06-30",
  "courseStartDate": "2026-07-01",
  "teacherId": 1
}
```

---

### 5. Enrollments — `/api/v1/enrollments`

การลงทะเบียนเรียน พร้อม workflow อนุมัติการชำระเงิน

#### Endpoints

| Method | Path                          | Role              | คำอธิบาย                            |
|--------|-------------------------------|-------------------|--------------------------------------|
| GET    | `/enrollments`                | ADMIN             | ดูการลงทะเบียนทั้งหมด               |
| GET    | `/enrollments/{id}`           | ADMIN, TUTOR, STUDENT | ดูตาม ID                        |
| GET    | `/enrollments/student/{id}`   | ADMIN, TUTOR, STUDENT | ดูการลงทะเบียนของนักเรียน        |
| GET    | `/enrollments/course/{id}`    | ADMIN, TUTOR      | ดูผู้ลงทะเบียนในคอร์ส              |
| POST   | `/enrollments`                | ADMIN, STUDENT    | สมัครเรียน                           |
| PATCH  | `/enrollments/{id}/status`    | ADMIN             | อนุมัติ/ปฏิเสธการลงทะเบียน         |
| PATCH  | `/enrollments/{id}/payment`   | ADMIN             | อัปเดตข้อมูลการชำระเงิน             |
| PATCH  | `/enrollments/{id}/slip`      | ADMIN, STUDENT    | อัปโหลด payment slip URL            |
| PATCH  | `/enrollments/{id}/approve`   | ADMIN             | อนุมัติ enrollment                   |
| DELETE | `/enrollments/{id}`           | ADMIN, STUDENT    | ยกเลิกการลงทะเบียน                  |

#### Enrollment Workflow

```
PENDING → (student upload slip) → PAYMENT_UPLOADED → (admin approve) → APPROVED
                                                    → (admin reject) → REJECTED
APPROVED → COMPLETED (เมื่อเรียนจบ)
```

#### ตัวอย่าง: ลงทะเบียนเรียน

Request:
```http
POST /api/v1/enrollments
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1,
  "paymentMethod": "BANK_TRANSFER"
}
```

Response `201 Created`:
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "id": 1,
    "enrollmentCode": "ENR-2026001",
    "studentId": 1,
    "studentName": "สมชาย ใจดี",
    "courseId": 1,
    "courseName": "คณิตศาสตร์ ม.6",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "amount": 5000.00,
    "enrollmentDate": "2026-06-16T10:00:00"
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

#### ตัวอย่าง: อัปโหลด Payment Slip

```http
PATCH /api/v1/enrollments/1/slip
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "paymentSlipUrl": "https://drive.google.com/file/slip-image.jpg"
}
```

---

### 6. Payments — `/api/v1/payments`

การชำระเงิน (TUTOR ไม่มีสิทธิ์เข้าถึง Payment API)

#### Endpoints

| Method | Path                              | Role           | คำอธิบาย                         |
|--------|-----------------------------------|----------------|-----------------------------------|
| POST   | `/payments`                       | STUDENT        | สร้าง payment record              |
| GET    | `/payments`                       | ADMIN          | ดู payment ทั้งหมด                 |
| GET    | `/payments/{id}`                  | ADMIN, STUDENT | ดู payment ตาม ID                  |
| GET    | `/payments/code/{code}`           | ADMIN          | ค้นหาด้วย payment code            |
| GET    | `/payments/enrollment/{id}`       | ADMIN, STUDENT | ดู payment ตาม enrollment         |
| GET    | `/payments/student/{studentId}`   | ADMIN          | ดู payment ทั้งหมดของนักเรียน     |
| PATCH  | `/payments/{id}/verify`           | ADMIN          | ยืนยัน payment (approved)         |
| PATCH  | `/payments/{id}/reject`           | ADMIN          | ปฏิเสธ payment                    |
| DELETE | `/payments/{id}`                  | ADMIN          | ลบ payment record                 |

#### ตัวอย่าง: ยืนยันการชำระเงิน

```http
PATCH /api/v1/payments/1/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "adminNote": "ยืนยันการโอนเงินแล้ว"
}
```

---

### 7. Exam Institutions — `/api/v1/exam-institutions`

บันทึกสถาบันสอบภายนอก เช่น POSN, สอวน., Cambridge

#### Endpoints

| Method | Path                        | Role  | คำอธิบาย                      |
|--------|-----------------------------|-------|-------------------------------|
| GET    | `/exam-institutions`        | ADMIN | ดูสถาบันทั้งหมด               |
| GET    | `/exam-institutions/{id}`   | ADMIN | ดูตาม ID                      |
| POST   | `/exam-institutions`        | ADMIN | เพิ่มสถาบัน                   |
| PUT    | `/exam-institutions/{id}`   | ADMIN | แก้ไขสถาบัน                   |
| DELETE | `/exam-institutions/{id}`   | ADMIN | ลบสถาบัน                      |

---

### 8. Exams — `/api/v1/exams`

ระบบข้อสอบออนไลน์ (Multiple Choice, True/False, Short Answer)

#### Endpoints

| Method | Path                            | Role           | คำอธิบาย                            |
|--------|---------------------------------|----------------|--------------------------------------|
| POST   | `/exams`                        | ADMIN, TUTOR   | สร้างข้อสอบใหม่                      |
| GET    | `/exams`                        | ADMIN          | ดูข้อสอบทั้งหมด                      |
| GET    | `/exams/{id}`                   | ADMIN, TUTOR   | ดูข้อสอบตาม ID                       |
| GET    | `/exams/course/{courseId}`      | ADMIN, TUTOR   | ดูข้อสอบในคอร์ส                      |
| GET    | `/exams/lesson/{lessonId}`      | ADMIN, TUTOR   | ดูข้อสอบตาม lesson                   |
| GET    | `/exams/course/{courseId}/open` | STUDENT        | ดูข้อสอบที่เปิดอยู่ใน course         |
| PUT    | `/exams/{id}`                   | ADMIN, TUTOR   | แก้ไขข้อสอบ                           |
| PATCH  | `/exams/{id}/open`              | ADMIN, TUTOR   | เปิดข้อสอบ (นักเรียนเข้าสอบได้)      |
| PATCH  | `/exams/{id}/close`             | ADMIN, TUTOR   | ปิดข้อสอบ                             |
| DELETE | `/exams/{id}`                   | ADMIN, TUTOR   | ลบข้อสอบ                              |
| POST   | `/exams/{examId}/questions`     | ADMIN, TUTOR   | เพิ่มคำถามในข้อสอบ                   |

#### Exam Question Management

| Method | Path                                    | Role         | คำอธิบาย          |
|--------|-----------------------------------------|--------------|-------------------|
| PUT    | `/exam-questions/{id}`                  | ADMIN, TUTOR | แก้ไขคำถาม        |
| DELETE | `/exam-questions/{id}`                  | ADMIN, TUTOR | ลบคำถาม           |
| POST   | `/questions/{questionId}/options`       | ADMIN, TUTOR | เพิ่มตัวเลือก      |
| PUT    | `/question-options/{id}`                | ADMIN, TUTOR | แก้ไขตัวเลือก     |
| DELETE | `/question-options/{id}`                | ADMIN, TUTOR | ลบตัวเลือก        |

#### ตัวอย่าง: สร้างข้อสอบ

```http
POST /api/v1/exams
Authorization: Bearer <tutor-token>
Content-Type: application/json

{
  "title": "แบบทดสอบบทที่ 1 — พหุนาม",
  "description": "ทดสอบความเข้าใจเรื่องพหุนามและการแยกตัวประกอบ",
  "courseId": 1,
  "durationMinutes": 30,
  "maxAttempts": 2,
  "passingScore": 60.0
}
```

---

### 9. Exam Submissions — `/api/v1/exams/{id}/start` และ `/api/v1/exams/{id}/submit`

การเริ่มสอบและส่งข้อสอบ

#### Endpoints

| Method | Path                                        | Role           | คำอธิบาย                            |
|--------|---------------------------------------------|----------------|--------------------------------------|
| POST   | `/exams/{examId}/start`                     | STUDENT        | เริ่มทำข้อสอบ — รับคำถามทั้งหมด     |
| POST   | `/exams/{examId}/submit`                    | STUDENT        | ส่งข้อสอบ — ได้คะแนนทันที            |
| GET    | `/exam-submissions/me`                      | STUDENT        | ดูประวัติการสอบของตัวเอง             |
| GET    | `/exam-submissions/{id}`                    | Authenticated  | ดู submission ตาม ID                 |
| POST   | `/exam-submissions/{submissionId}/grade`    | ADMIN, TUTOR   | ให้คะแนน manual (short answer)      |

#### ตัวอย่าง: เริ่มสอบ

```http
POST /api/v1/exams/1/start
Authorization: Bearer <student-token>
```

Response `201 Created`:
```json
{
  "success": true,
  "message": "Exam started successfully",
  "data": {
    "submissionId": 5,
    "examId": 1,
    "examTitle": "แบบทดสอบบทที่ 1",
    "startedAt": "2026-06-16T10:00:00",
    "durationMinutes": 30,
    "questions": [
      {
        "id": 1,
        "questionText": "2x + 3y เป็นพหุนามกี่ตัวแปร",
        "questionType": "MULTIPLE_CHOICE",
        "options": [
          { "id": 1, "optionText": "1 ตัวแปร" },
          { "id": 2, "optionText": "2 ตัวแปร" },
          { "id": 3, "optionText": "3 ตัวแปร" },
          { "id": 4, "optionText": "ไม่ใช่พหุนาม" }
        ]
      }
    ]
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

#### ตัวอย่าง: ส่งข้อสอบ

```http
POST /api/v1/exams/1/submit
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "answers": [
    { "questionId": 1, "selectedOptionId": 2 },
    { "questionId": 2, "selectedOptionId": null, "textAnswer": "คำตอบของฉัน" }
  ]
}
```

---

### 10. Exam Results — `/api/v1/exam-results`

ผลการสอบ

#### Endpoints

| Method | Path                          | Role         | คำอธิบาย                    |
|--------|-------------------------------|--------------|------------------------------|
| GET    | `/exam-results/student/me`    | STUDENT      | ดูผลสอบทั้งหมดของตัวเอง     |
| GET    | `/exam-results/exam/{examId}` | ADMIN, TUTOR | ดูผลสอบทั้งหมดของข้อสอบนั้น |
| GET    | `/exam-results/course/{id}`   | ADMIN, TUTOR | ดูผลสอบทั้งหมดในคอร์ส       |

---

### 11. Student Achievements — `/api/v1/student-achievements`

บันทึกความสำเร็จและรางวัลของนักเรียน

#### Endpoints

| Method | Path                                     | Role                   | คำอธิบาย                     |
|--------|------------------------------------------|------------------------|-------------------------------|
| POST   | `/student-achievements`                  | ADMIN, TUTOR, STUDENT  | บันทึก achievement ใหม่       |
| GET    | `/student-achievements`                  | ADMIN                  | ดู achievement ทั้งหมด        |
| GET    | `/student-achievements/{id}`             | ADMIN, TUTOR, STUDENT  | ดูตาม ID                      |
| GET    | `/student-achievements/student/{id}`     | ADMIN, TUTOR, STUDENT  | ดู achievement ของนักเรียน   |
| PUT    | `/student-achievements/{id}`             | ADMIN, TUTOR, STUDENT  | แก้ไข achievement             |
| PATCH  | `/student-achievements/{id}/approve`     | ADMIN                  | อนุมัติ achievement            |
| PATCH  | `/student-achievements/{id}/reject`      | ADMIN                  | ปฏิเสธ achievement             |
| DELETE | `/student-achievements/{id}`             | ADMIN                  | ลบ achievement                 |

---

### 12. Institution Profile — `/api/v1/institution-profile`

ข้อมูลโรงเรียนกวดวิชา

#### Endpoints

| Method | Path                    | Role   | คำอธิบาย              |
|--------|-------------------------|--------|-----------------------|
| GET    | `/institution-profile`  | Public | ดูข้อมูลโรงเรียน      |
| PUT    | `/institution-profile`  | ADMIN  | แก้ไขข้อมูลโรงเรียน   |

#### ตัวอย่าง: ดูข้อมูลโรงเรียน

```http
GET /api/v1/institution-profile
```

Response:
```json
{
  "success": true,
  "message": "Institution profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "โรงเรียนกวดวิชา ABC",
    "address": "123 ถ.สุขุมวิท กรุงเทพฯ",
    "phone": "02-123-4567",
    "email": "info@tutorschool.com",
    "website": "https://tutorschool.com",
    "lineId": "@tutorschool"
  },
  "timestamp": "2026-06-16T10:00:00"
}
```

---

### 13. Course Schedules — `/api/v1/course-schedules`

ตารางการเรียน พร้อมส่ง email notification เมื่อยกเลิก

#### Endpoints

| Method | Path                          | Role            | คำอธิบาย                              |
|--------|-------------------------------|-----------------|---------------------------------------|
| POST   | `/course-schedules`           | ADMIN, TUTOR    | สร้างตารางเรียนใหม่                   |
| GET    | `/course-schedules`           | ADMIN           | ดูตารางทั้งหมด                         |
| GET    | `/course-schedules/{id}`      | ALL             | ดูตาม ID                              |
| GET    | `/course-schedules/course/{id}` | ALL           | ดูตารางของคอร์ส                        |
| GET    | `/course-schedules/student/me`| STUDENT         | ดูตารางของตัวเอง (ตาม enrollment)      |
| GET    | `/course-schedules/tutor/me`  | TUTOR           | ดูตารางที่ตัวเองสอน                   |
| PUT    | `/course-schedules/{id}`      | ADMIN, TUTOR    | แก้ไขตาราง (ก่อนถึงเวลา)              |
| PATCH  | `/course-schedules/{id}/cancel`| ADMIN, TUTOR   | ยกเลิกตาราง (ส่ง email แจ้งนักเรียน) |
| DELETE | `/course-schedules/{id}`      | ADMIN, TUTOR    | ลบตาราง                               |

#### ตัวอย่าง: ยกเลิกตาราง

```http
PATCH /api/v1/course-schedules/1/cancel
Authorization: Bearer <tutor-token>
Content-Type: application/json

{
  "reason": "ครูป่วยกะทันหัน ขออภัยในความไม่สะดวก"
}
```

> ระบบจะส่ง email แจ้งนักเรียนทุกคนที่ลงทะเบียนในคอร์สนั้นอัตโนมัติ

---

### 14. Notifications — `/api/v1/notifications`

ประวัติการแจ้งเตือน (email ที่ระบบส่งไป)

#### Endpoints

| Method | Path                                 | Role  | คำอธิบาย                          |
|--------|--------------------------------------|-------|-----------------------------------|
| GET    | `/notifications/me`                  | ALL   | ดู notification ของตัวเอง         |
| GET    | `/notifications`                     | ADMIN | ดู notification ทั้งหมด           |
| GET    | `/notifications/{id}`                | ALL   | ดูตาม ID                          |
| GET    | `/notifications/status/{status}`     | ADMIN | filter ตาม delivery status        |
| POST   | `/notifications/test-email`          | ADMIN | ส่ง test email (ทดสอบ SMTP)       |
| DELETE | `/notifications/{id}`                | ADMIN | ลบ notification record            |

#### Delivery Status Values

| Status    | ความหมาย             |
|-----------|----------------------|
| `PENDING` | รอส่ง                |
| `SENT`    | ส่งสำเร็จ             |
| `FAILED`  | ส่งล้มเหลว           |

---

### 15. Classroom Sessions — `/api/v1/classroom-sessions`

การจัดการ session การเรียน (online หรือในห้อง) + ระบบเช็คชื่ออัตโนมัติ

#### Endpoints

| Method | Path                              | Role         | คำอธิบาย                               |
|--------|-----------------------------------|--------------|----------------------------------------|
| POST   | `/classroom-sessions`             | ADMIN, TUTOR | สร้าง session ใหม่                      |
| GET    | `/classroom-sessions`             | ADMIN        | ดู session ทั้งหมด                      |
| GET    | `/classroom-sessions/{id}`        | ALL          | ดูตาม ID                               |
| GET    | `/classroom-sessions/course/{id}` | ALL          | ดู session ของคอร์ส                     |
| PATCH  | `/classroom-sessions/{id}/open`   | ADMIN, TUTOR | เปิด session (นักเรียน join ได้)         |
| PATCH  | `/classroom-sessions/{id}/close`  | ADMIN, TUTOR | ปิด session (บันทึก attendance ทันที)   |
| DELETE | `/classroom-sessions/{id}`        | ADMIN, TUTOR | ลบ session                              |
| POST   | `/classroom-sessions/{id}/join`   | STUDENT      | นักเรียน join session (เช็คชื่อเข้า)   |
| PATCH  | `/classroom-sessions/{id}/leave`  | STUDENT      | นักเรียน leave session (บันทึกเวลาออก) |

#### ตัวอย่าง: นักเรียน Join Session

```http
POST /api/v1/classroom-sessions/3/join
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "attendanceMethod": "QR_CODE",
  "qrToken": "SESSION_TOKEN_XYZ"
}
```

---

### 16. Attendance Records — `/api/v1/attendance-records`

บันทึกการเข้าเรียน

#### Endpoints

| Method | Path                                   | Role         | คำอธิบาย                          |
|--------|----------------------------------------|--------------|-----------------------------------|
| GET    | `/attendance-records`                  | ADMIN        | ดู attendance ทั้งหมด             |
| GET    | `/attendance-records/{id}`             | ALL          | ดูตาม ID                          |
| GET    | `/attendance-records/session/{id}`     | ADMIN, TUTOR | ดู attendance ของ session         |
| GET    | `/attendance-records/course/{id}`      | ADMIN, TUTOR | ดู attendance ของคอร์ส            |
| GET    | `/attendance-records/student/me`       | STUDENT      | ดู attendance ของตัวเอง           |
| PATCH  | `/attendance-records/{id}/status`      | TUTOR        | แก้ไข attendance status           |

---

### 17. Course Evaluations — `/api/v1/course-evaluations`

ระบบรีวิวและให้คะแนนคอร์ส (นักเรียนสามารถรีวิวได้หลังเรียนจบ)

#### Endpoints

| Method | Path                                       | Role         | คำอธิบาย                           |
|--------|--------------------------------------------|--------------|------------------------------------|
| POST   | `/course-evaluations`                      | STUDENT      | ส่งรีวิว (enrollment ต้อง COMPLETED) |
| GET    | `/course-evaluations`                      | ADMIN        | ดูรีวิวทั้งหมด                      |
| GET    | `/course-evaluations/{id}`                 | ALL          | ดูตาม ID                           |
| GET    | `/course-evaluations/course/{id}`          | ADMIN, TUTOR | ดูรีวิวทั้งหมดของคอร์ส             |
| GET    | `/course-evaluations/tutor/{tutorId}`      | ADMIN, TUTOR | ดูรีวิวของครู                       |
| GET    | `/course-evaluations/student/me`           | STUDENT      | ดูรีวิวที่ตัวเองเขียน              |
| GET    | `/course-evaluations/course/{id}/summary`  | ADMIN, TUTOR | ดูสรุปคะแนน/rating ของคอร์ส       |
| PUT    | `/course-evaluations/{id}`                 | STUDENT      | แก้ไขรีวิว (ภายใน 24 ชม.)          |
| PATCH  | `/course-evaluations/{id}/status`          | ADMIN        | เปลี่ยน status รีวิว                |
| DELETE | `/course-evaluations/{id}`                 | ADMIN        | ลบรีวิว                             |

#### ตัวอย่าง: ส่งรีวิว

```http
POST /api/v1/course-evaluations
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "courseId": 1,
  "rating": 5,
  "comment": "ครูสอนดีมาก อธิบายเข้าใจง่าย แนะนำเลยครับ!"
}
```

---

## HTTP Status Codes

| Status Code | ความหมาย              | เมื่อไหร่เกิด                                      |
|-------------|----------------------|-----------------------------------------------------|
| `200 OK`    | สำเร็จ               | GET, PUT, PATCH, DELETE สำเร็จ                      |
| `201 Created` | สร้างแล้ว          | POST สำเร็จ                                         |
| `400 Bad Request` | ข้อมูลไม่ถูกต้อง | Validation fail, business rule violation           |
| `401 Unauthorized` | ไม่ได้ login   | ไม่มี token หรือ token หมดอายุ                      |
| `403 Forbidden` | ไม่มีสิทธิ์       | Role ไม่ถูกต้อง หรือเข้าถึงข้อมูลคนอื่น           |
| `404 Not Found` | ไม่พบข้อมูล      | ID ที่ขอไม่มีในระบบ                                 |
| `409 Conflict` | ข้อมูลซ้ำ         | Duplicate (email, code, หรือ enrollment ซ้ำ)        |
| `500 Internal Server Error` | เกิดข้อผิดพลาด | Server error ที่ไม่คาดคิด                   |

---

## Error Handling Guide

### Frontend ควร Handle Errors อย่างไร

```javascript
// ตัวอย่างใช้ Axios + React
const handleApiError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
  const errors = error.response?.data?.errors; // สำหรับ validation errors

  switch (status) {
    case 400:
      // Validation errors — แสดง field errors
      if (errors) {
        Object.entries(errors).forEach(([field, msg]) => {
          setFieldError(field, msg);
        });
      } else {
        showToast(message, 'error');
      }
      break;

    case 401:
      // Token หมดอายุ — redirect ไป login
      localStorage.clear();
      navigate('/login');
      break;

    case 403:
      // ไม่มีสิทธิ์
      showToast('คุณไม่มีสิทธิ์ดำเนินการนี้', 'warning');
      break;

    case 404:
      // ไม่พบข้อมูล
      showToast(message, 'info');
      break;

    case 409:
      // ข้อมูลซ้ำ
      showToast(message, 'warning');
      break;

    default:
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
  }
};
```

### Tips สำหรับ Frontend

1. **Token expiry**: Access token หมดอายุใน 15 นาที — handle 401 ให้ redirect login
2. **Pagination**: ใช้ `page` (0-based) และ `size` — response มี `totalPages` และ `totalElements`
3. **Role check**: ตรวจสอบ `role` จาก login response แล้วเก็บ — ใช้ hide/show UI
4. **Content-Type**: ทุก POST/PUT/PATCH ต้องส่ง `Content-Type: application/json`
5. **Validation errors**: response มี `errors` เป็น object `{fieldName: "error message"}` — map ไป form fields ได้เลย
6. **Boolean success**: เช็ค `data.success === true` ก่อนใช้ `data.data`
7. **Timestamp**: ค่า timestamp เป็น ISO 8601 format (`Asia/Bangkok` timezone)
