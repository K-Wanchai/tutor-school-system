import { useState } from 'react';
import { isoToDigits, digitsToIso } from '../utils/dateUtils';

function formatDigits(digits) {
  const d = digits.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// ช่องกรอกวันที่รูปแบบ วว/ดด/ปปปป — ค่าที่รับ/ส่งออกทาง value/onChange ยังเป็น ISO
// yyyy-mm-dd เหมือนเดิม เพื่อให้ state ฟอร์มและ payload ที่ส่ง backend ไม่ต้องแก้
export default function DateInput({ value, onChange, className = '', placeholder = 'วว/ดด/ปปปป', disabled }) {
  const [digits, setDigits] = useState(() => isoToDigits(value));

  function handleKeyDown(e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice(0, -1);
      setDigits(next);
      onChange(digitsToIso(next));
    }
  }

  function handleInput(e) {
    const key = e.nativeEvent?.data;
    if (!key || !/\d/.test(key)) return;
    if (digits.length >= 8) return;
    const next = digits + key;
    setDigits(next);
    onChange(digitsToIso(next));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={formatDigits(digits)}
      onKeyDown={handleKeyDown}
      onChange={handleInput}
      disabled={disabled}
    />
  );
}
