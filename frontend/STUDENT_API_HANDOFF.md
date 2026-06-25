# Frontend Handoff — Student Module

## Base URL

```
http://localhost:8080/api/v1
```

---

## Authentication

ทุก request ต้องแนบ JWT ใน header:

```
Authorization: Bearer <accessToken>
```

### Login

```
POST /auth/login
```

**Request body**
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

**Response `data`**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "string",
  "email": "string",
  "role": "ADMIN | TUTOR | STUDENT"
}
```

### Refresh Token

```
POST /auth/refresh
```

**Request body**
```json
{
  "refreshToken": "string"
}
```

Response มี shape เดียวกับ Login

---

## Response Wrapper

ทุก endpoint ตอบกลับในรูปแบบ:

```json
{
  "success": true,
  "message": "string",
  "data": { ... },
  "errors": null,
  "timestamp": "2025-01-01T00:00:00"
}
```

เมื่อ validation fail จะมี field `errors`:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phoneNumber": "Phone number is required",
    "nationalId": "National ID must be exactly 13 digits"
  }
}
```

---

## Student Endpoints

### 1. Get All Students (paginated)

```
GET /students?page=0&size=10&keyword=
```

- **Role:** `ADMIN`, `TUTOR`
- `keyword` — ค้นหาด้วย ชื่อ / รหัส / เบอร์ ฯลฯ (optional, default = `""`)
- `page` — เริ่มจาก `0` (default `0`)
- `size` — จำนวนต่อหน้า (default `10`)

**Response `data`**
```json
{
  "content": [ StudentResponse ],
  "page": 0,
  "size": 10,
  "totalElements": 42,
  "totalPages": 5,
  "last": false
}
```

---

### 2. Get Student by ID

```
GET /students/{id}
```

- **Role:** `ADMIN`, `TUTOR`, `STUDENT`

**Response `data`** → `StudentResponse` (ดูด้านล่าง)

---

### 3. Get Student by Student Code

```
GET /students/code/{studentCode}
```

- **Role:** `ADMIN`, `TUTOR`

**Response `data`** → `StudentResponse`

---

### 4. Create Student

```
POST /students
```

- **Role:** `ADMIN` only

**Request body**
```json
{
  "username": "string (required, max 100)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "studentCode": "string (required, max 50)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "fullName": "string (required, max 255)",
  "nationalId": "string (required, exactly 13 digits)",
  "address": "string (optional)",
  "phoneNumber": "string (required, max 20)",
  "birthDate": "YYYY-MM-DD (optional)",
  "guardianPhoneNumber": "string (optional)",
  "bankQrCode": "string (optional)",
  "bankAccountName": "string (optional)",
  "bankAccountNumber": "string (optional)"
}
```

> หากไม่ส่ง `firstName` / `lastName` ระบบจะ split จาก `fullName` ให้อัตโนมัติ

**Response** HTTP `201 Created`, `data` → `StudentResponse`

---

### 5. Update Student

```
PUT /students/{id}
```

- **Role:** `ADMIN` only

**Request body**
```json
{
  "fullName": "string (required, max 255)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "address": "string (optional)",
  "phoneNumber": "string (required, max 20)",
  "birthDate": "YYYY-MM-DD (optional)",
  "guardianPhoneNumber": "string (optional)",
  "bankName": "string (optional, max 100)",
  "bankQrCode": "string (optional)",
  "bankAccountName": "string (optional)",
  "bankAccountNumber": "string (optional)"
}
```

**Response `data`** → `StudentResponse`

---

### 6. Update Student Status (Enable / Disable)

```
PATCH /students/{id}/status
```

- **Role:** `ADMIN` only

**Request body**
```json
{
  "enabled": true
}
```

**Response `data`** → `StudentResponse`

---

### 7. Delete Student

```
DELETE /students/{id}
```

- **Role:** `ADMIN` only

**Response**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": null
}
```

---

## StudentResponse Shape

```typescript
interface StudentResponse {
  id: number
  userId: number

  // User / Login info
  username: string
  email: string
  enabled: boolean
  status: "ACTIVE" | "INACTIVE"   // computed from enabled

  // Profile
  studentCode: string
  firstName: string
  lastName: string
  fullName: string
  nationalId: string
  address: string | null
  phoneNumber: string
  birthDate: string | null         // "YYYY-MM-DD"
  guardianPhoneNumber: string | null

  // Bank
  bankName: string | null
  bankQrCode: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null

  createdAt: string                // ISO datetime
  updatedAt: string                // ISO datetime
}
```

---

## Role Summary

| Endpoint | ADMIN | TUTOR | STUDENT |
|---|---|---|---|
| GET /students | ✅ | ✅ | ❌ |
| GET /students/{id} | ✅ | ✅ | ✅ (ตัวเอง) |
| GET /students/code/{code} | ✅ | ✅ | ❌ |
| POST /students | ✅ | ❌ | ❌ |
| PUT /students/{id} | ✅ | ❌ | ❌ |
| PATCH /students/{id}/status | ✅ | ❌ | ❌ |
| DELETE /students/{id} | ✅ | ❌ | ❌ |

---

## Error Codes

| HTTP Status | ความหมาย |
|---|---|
| 400 | Validation error (ดู `errors` field) |
| 401 | ไม่มี / หมดอายุ token |
| 403 | Role ไม่มีสิทธิ์ |
| 404 | ไม่พบ student ที่ระบุ |
| 409 | Duplicate — username / email / studentCode / nationalId ซ้ำ |

---

## Notes

- `status` field ใน response เป็น convenience field สำหรับ UI: `"ACTIVE"` = enabled true, `"INACTIVE"` = enabled false
- `bankName` ไม่ถูกส่งมาใน `CreateStudentRequest` แต่สามารถ update ได้ผ่าน `PUT /students/{id}`
- Pagination เริ่มจาก `page=0` (zero-based)
- `keyword` search ครอบคลุม ชื่อ, รหัสนักเรียน และ field อื่นตามที่ backend implement ใน `searchStudents()`
