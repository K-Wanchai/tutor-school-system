# Tutor School System — Backend

ระบบจัดการโรงเรียนกวดวิชา (Tutor School Management System) พัฒนาด้วย Java 21 + Spring Boot 3.5
รองรับการจัดการ นักเรียน, ครู (Tutor), คอร์สเรียน, การลงทะเบียน, การชำระเงิน, ข้อสอบออนไลน์, ตารางเรียน, การเช็คชื่อ และอีกมาก

---

## สารบัญ

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
- [Environment Variables](#environment-variables)
- [วิธีรัน](#วิธีรัน)
- [Swagger UI](#swagger-ui)
- [Test Accounts](#test-accounts)
- [โมดูลระบบ](#โมดูลระบบ)
- [Production Checklist](#production-checklist)

---

## Tech Stack

| Technology              | Version  | หมายเหตุ                          |
|-------------------------|----------|-----------------------------------|
| Java                    | 21       | LTS                               |
| Spring Boot             | 3.5.x    | Framework หลัก                    |
| Spring Security + JWT   | 6.x      | Authentication & Authorization    |
| Spring Data JPA         | 3.x      | ORM Layer                         |
| PostgreSQL              | 14+      | ฐานข้อมูลหลัก                     |
| Hibernate               | 6.x      | JPA Provider                      |
| Lombok                  | Latest   | ลด Boilerplate code               |
| Maven                   | 3.9+     | Build tool                        |
| springdoc-openapi       | 2.8.9    | Swagger / OpenAPI 3 documentation |
| Spring Boot Mail        | -        | ส่งอีเมลผ่าน Gmail SMTP           |
| HikariCP                | -        | Connection Pool                   |

---

## Prerequisites

ก่อนรันระบบ ต้องติดตั้งซอฟต์แวร์ต่อไปนี้:

1. **Java 21** (JDK)
   ```bash
   java -version
   # ต้องแสดง: openjdk version "21.x.x"
   ```

2. **Maven 3.9+** (หรือใช้ `mvnw` wrapper ที่มาพร้อมโปรเจกต์)
   ```bash
   mvn -version
   ```

3. **PostgreSQL 14+**
   ```bash
   psql --version
   ```

4. **Git** (สำหรับ clone โปรเจกต์)

---

## การตั้งค่าฐานข้อมูล

### 1. สร้าง Database

เปิด psql หรือ pgAdmin แล้วรันคำสั่ง:

```sql
CREATE DATABASE tutorschool_db;
```

### 2. ตรวจสอบการเชื่อมต่อ

```bash
psql -U postgres -d tutorschool_db -c "\conninfo"
```

> **หมายเหตุ**: ระบบใช้ `spring.jpa.hibernate.ddl-auto=update` ใน development mode
> ดังนั้น Hibernate จะสร้าง Table ให้อัตโนมัติเมื่อรัน Application ครั้งแรก
> ไม่ต้องรัน SQL script สร้าง schema เอง

---

## Environment Variables

ตั้งค่า environment variables ก่อนรัน (หรือแก้ไขใน `application.properties` สำหรับ dev)

| Variable        | Default Value                                          | คำอธิบาย                                 | จำเป็น (Production) |
|-----------------|--------------------------------------------------------|------------------------------------------|---------------------|
| `DB_URL`        | `jdbc:postgresql://localhost:5432/tutorschool_db`      | JDBC URL ของ PostgreSQL                  | แนะนำให้ตั้ง        |
| `DB_USERNAME`   | `postgres`                                             | username ของ PostgreSQL                  | แนะนำให้ตั้ง        |
| `DB_PASSWORD`   | `2544`                                                 | password ของ PostgreSQL **เปลี่ยนใน prod** | ต้องเปลี่ยน         |
| `JWT_SECRET`    | `VGhpcyBpcyBhIHNlY3JldCBrZXkg...` (base64)            | Secret key สำหรับ JWT signing             | ต้องเปลี่ยน         |
| `MAIL_USERNAME` | `your-email@gmail.com`                                 | Gmail address สำหรับส่ง notification     | ต้องตั้ง            |
| `MAIL_PASSWORD` | `your-app-password`                                    | Google App Password (ไม่ใช่ password Gmail จริง) | ต้องตั้ง      |

### วิธีตั้ง Environment Variable (Windows PowerShell)

```powershell
$env:DB_PASSWORD = "your_secure_password"
$env:JWT_SECRET = "your_base64_encoded_secret_key_at_least_32_chars"
$env:MAIL_USERNAME = "yourschool@gmail.com"
$env:MAIL_PASSWORD = "abcd efgh ijkl mnop"
```

### วิธีตั้ง Environment Variable (Linux/macOS)

```bash
export DB_PASSWORD="your_secure_password"
export JWT_SECRET="your_base64_encoded_secret_key_at_least_32_chars"
export MAIL_USERNAME="yourschool@gmail.com"
export MAIL_PASSWORD="abcd efgh ijkl mnop"
```

### ใช้ไฟล์ `.env` (สำหรับ dev เท่านั้น — ห้าม commit!)

```env
DB_PASSWORD=2544
JWT_SECRET=VGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIFR1dG9yIFNjaG9vbCBTeXN0ZW0gMjAyNg==
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## วิธีรัน

### วิธีที่ 1: ใช้ Maven Wrapper (แนะนำ)

```bash
# Windows
.\mvnw spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

### วิธีที่ 2: Build แล้ว Run JAR

```bash
# Build
./mvnw clean package -DskipTests

# Run
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### วิธีที่ 3: ตั้ง env vars แล้ว run

```bash
DB_PASSWORD=yourpassword JWT_SECRET=yoursecret ./mvnw spring-boot:run
```

### ตรวจสอบว่า Server ขึ้นแล้ว

หลังรันสำเร็จจะเห็น log:

```
Started BackendApplication in X.XXX seconds (process running for X.XXX)
```

จากนั้นเปิด: **http://localhost:8080/swagger-ui/index.html**

---

## Swagger UI

| URL                                          | คำอธิบาย                    |
|----------------------------------------------|-----------------------------|
| http://localhost:8080/swagger-ui/index.html  | Swagger UI (ทดสอบ API ได้)   |
| http://localhost:8080/v3/api-docs            | OpenAPI 3.0 JSON spec       |

วิธีใช้ Swagger กับ JWT:
1. เรียก `POST /api/v1/auth/login` เพื่อรับ token
2. คลิกปุ่ม **Authorize** (กุญแจ) ที่มุมขวาบน
3. ใส่ค่า: `Bearer <your-token-here>`
4. คลิก Authorize แล้วทดสอบ endpoint ได้เลย

---

## Test Accounts

บัญชีทดสอบสำหรับ development (ต้องรัน seed SQL ก่อน — ดู `SEED_DATA_GUIDE.md`):

| Role    | Email                  | Password    | สิทธิ์                                  |
|---------|------------------------|-------------|------------------------------------------|
| ADMIN   | admin@school.com       | admin123    | เข้าถึงทุกอย่าง จัดการระบบทั้งหมด       |
| TUTOR   | tutor@school.com       | tutor123    | จัดการคอร์ส, ข้อสอบ, เช็คชื่อนักเรียน  |
| STUDENT | student@school.com     | student123  | ดูคอร์ส, ลงทะเบียน, สอบ, ดูผลตัวเอง    |

---

## โมดูลระบบ

ระบบประกอบด้วยโมดูลหลักดังนี้:

| โมดูล                | Base Path                          | คำอธิบาย                                     |
|----------------------|-------------------------------------|----------------------------------------------|
| Auth                 | `/api/v1/auth`                      | Login, Register                              |
| Students             | `/api/v1/students`                  | จัดการข้อมูลนักเรียน                          |
| Tutors               | `/api/v1/tutors`                    | จัดการข้อมูลครู                               |
| Courses              | `/api/v1/courses`                   | จัดการคอร์สเรียน                              |
| Enrollments          | `/api/v1/enrollments`               | การลงทะเบียนเรียน, workflow อนุมัติ           |
| Payments             | `/api/v1/payments`                  | การชำระเงิน, ตรวจสอบสลิป                     |
| Exam Institutions    | `/api/v1/exam-institutions`         | สถาบันสอบภายนอก (เช่น สอวน., POSN)          |
| Exams                | `/api/v1/exams`                     | ข้อสอบออนไลน์ (MC, True/False, Short Answer) |
| Exam Questions       | `/api/v1/exam-questions`            | จัดการข้อคำถาม                               |
| Question Options     | `/api/v1/question-options`          | จัดการตัวเลือกคำตอบ                          |
| Exam Submissions     | `/api/v1/exam-submissions`          | การเริ่มสอบและส่งข้อสอบ                      |
| Exam Results         | `/api/v1/exam-results`              | ผลการสอบ, คะแนน                             |
| Student Achievements | `/api/v1/student-achievements`      | บันทึกความสำเร็จ/รางวัลนักเรียน             |
| Institution Profile  | `/api/v1/institution-profile`       | ข้อมูลโรงเรียน                               |
| Course Schedules     | `/api/v1/course-schedules`          | ตารางเรียน, แจ้งยกเลิกพร้อม email           |
| Notifications        | `/api/v1/notifications`             | ประวัติการแจ้งเตือนผ่าน email               |
| Classroom Sessions   | `/api/v1/classroom-sessions`        | Session การสอนออนไลน์ / ในห้อง              |
| Attendance Records   | `/api/v1/attendance-records`        | บันทึกการเข้าเรียน (join/leave)              |
| Course Evaluations   | `/api/v1/course-evaluations`        | รีวิวและให้คะแนนคอร์ส                       |

---

## Production Checklist

สิ่งที่ต้องทำก่อน deploy ขึ้น production:

### Security

- [ ] เปลี่ยน `JWT_SECRET` เป็น random base64 key ที่ยาวอย่างน้อย 64 chars
  ```bash
  # Generate secure key
  openssl rand -base64 64
  ```
- [ ] เปลี่ยน `DB_PASSWORD` เป็น password ที่แข็งแรง
- [ ] ปิด `spring.jpa.show-sql=true` (ตั้งเป็น `false`)
- [ ] ตรวจสอบ CORS origins — เปลี่ยนจาก `localhost` เป็น domain จริง

### Database

- [ ] เปลี่ยน `spring.jpa.hibernate.ddl-auto` จาก `update` เป็น `validate`
  ```properties
  spring.jpa.hibernate.ddl-auto=validate
  ```
- [ ] ทำ database backup กลยุทธ์ (pg_dump หรือ managed backup)
- [ ] ตั้งค่า Connection Pool ตาม load จริง

### Email

- [ ] ตั้ง `MAIL_USERNAME` เป็น Gmail จริงของโรงเรียน
- [ ] สร้าง Google App Password แยกสำหรับ App นี้
- [ ] ทดสอบส่ง email ผ่าน `POST /api/v1/notifications/test-email`

### Deployment

- [ ] ใช้ HTTPS (TLS certificate)
- [ ] ตั้ง reverse proxy (Nginx / Apache)
- [ ] ตั้ง LOG level เป็น `WARN` หรือ `ERROR` ใน production
- [ ] เพิ่ม health check endpoint (`/actuator/health` ถ้าเพิ่ม spring-boot-actuator)

---

## Structure ของโปรเจกต์

```
src/main/java/com/tutorschool/backend/
├── BackendApplication.java          # Entry point
├── config/
│   └── SecurityConfig.java          # JWT Filter, CORS, Role config
├── controller/                      # REST Controllers (17 controllers)
├── service/                         # Business Logic
├── repository/                      # Spring Data JPA Repositories
├── entity/                          # JPA Entities / Database Tables
├── dto/
│   ├── request/                     # Request DTOs
│   └── response/                    # Response DTOs (ApiResponse, PageResponse)
├── mapper/                          # Entity <-> DTO mappers
├── exception/                       # Custom exceptions + GlobalExceptionHandler
├── security/                        # JWT utility classes
└── ...
src/main/resources/
└── application.properties           # Configuration
```

---

## JWT Configuration

| Setting                    | Value         | คำอธิบาย            |
|----------------------------|---------------|----------------------|
| `jwt.access-token-expiration`  | 900000 ms (15 นาที) | Access token หมดอายุ |
| `jwt.refresh-token-expiration` | 604800000 ms (7 วัน) | Refresh token หมดอายุ |

---

## CORS Configuration

อนุญาต Cross-Origin จาก:
- `http://localhost:5173` (Vite / React dev server)
- `http://localhost:3000` (Next.js / Create React App dev server)

สำหรับ production ให้เพิ่ม domain จริงใน `SecurityConfig.java`
