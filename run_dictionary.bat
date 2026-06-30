@echo off
echo ==========================================
echo  สร้าง Data Dictionary - Tutor School
echo ==========================================
echo.
echo กำลังติดตั้ง python-docx...
pip install python-docx -q
echo.
echo กำลังสร้างไฟล์ Data Dictionary...
python generate_data_dictionary.py
echo.
echo เสร็จสิ้น! ตรวจสอบไฟล์ Data_Dictionary_TutorSchool.docx
pause
