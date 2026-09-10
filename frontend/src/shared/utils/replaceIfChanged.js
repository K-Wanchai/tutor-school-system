// อัปเดต state เฉพาะเมื่อข้อมูลใหม่ต่างจากเดิมจริง ๆ (เทียบด้วย JSON)
// ใช้กับ polling แบบเงียบ ๆ เพื่อไม่ให้ re-render ทั้งหน้าทุกครั้งที่ดึงข้อมูลซ้ำ (กันอาการ "กระตุก")
// ถ้าเท่าเดิม จะคืนค่า prev ตัวเดิม → React จะ bail out ไม่ re-render

function sameJson(a, b) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function replaceIfChanged(setter, next) {
  setter((prev) => (sameJson(prev, next) ? prev : next));
}

export default replaceIfChanged;
