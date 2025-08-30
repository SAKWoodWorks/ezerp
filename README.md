# EZ-ERP: ระบบจัดการ CRM และ ERP สมัยใหม่

EZ-ERP คือระบบบริหารจัดการลูกค้าสัมพันธ์ (CRM) และวางแผนทรัพยากรองค์กร (ERP) ที่สร้างขึ้นด้วยเทคโนโลยีเว็บสมัยใหม่ ออกแบบมาเพื่อช่วยให้ธุรกิจขนาดเล็กและขนาดกลางสามารถจัดการข้อมูลต่างๆ ได้อย่างมีประสิทธิภาพในที่เดียว

![ตัวอย่างหน้า Dashboard](https://i.imgur.com/your-screenshot-url.png) <!-- ใส่ URL รูปภาพ Screenshot ของโปรเจกต์ที่นี่ -->

---

## ⚠️ ข้อควรระวัง (Disclaimer)

**ซอฟต์แวร์นี้ถูกพัฒนาขึ้นเพื่อใช้งานภายใน SAK Woodworks เท่านั้น** ไม่อนุญาตให้นำไปใช้, ดัดแปลง, หรือเผยแพร่ภายนอกโดยไม่ได้รับอนุญาต

---

## ✨ คุณสมบัติหลัก (Key Features)

- **แดชบอร์ด:** ภาพรวมข้อมูลสำคัญทางธุรกิจ เช่น ยอดขาย, สินค้าใกล้หมด, และใบแจ้งหนี้ล่าสุด
- **การจัดการลูกค้า (CRM):** จัดเก็บข้อมูลลูกค้า, ประวัติการติดต่อ, และรายการใบแจ้งหนี้
- **ระบบการขาย:** สร้างและจัดการใบเสนอราคา, ใบแจ้งหนี้, และบิลเงินสด
- **การจัดการคลังสินค้า:** ติดตามสต็อกสินค้า, จัดการคลังสินค้าหลายแห่ง, และดูประวัติการเคลื่อนไหวของสินค้า
- **การจัดการพนักงาน (HR):** จัดเก็บข้อมูลพนักงาน, จัดการคลังสินค้าที่สังกัด, และบันทึกประวัติการลา
- **การจัดการทรัพย์สิน:** ติดตามและจัดการอุปกรณ์สำนักงาน พร้อมระบบเบิกจ่ายและ QR Code
- **รายงาน:** สรุปยอดขายและข้อมูลสำคัญในรูปแบบที่เข้าใจง่าย
- **รองรับหลายภาษา:** ออกแบบมาให้รองรับภาษาไทย, อังกฤษ, และรัสเซีย

---

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Backend & Database:** [Supabase](https://supabase.io/)
- **ภาษา:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Internationalization (i18n):** [next-intl](https://next-intl-docs.vercel.app/)

---

## 🏁 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องมี (Prerequisites)

1.  **Node.js:** เวอร์ชัน 18.18.0 ขึ้นไป
2.  **Supabase Account:** สมัครใช้งานฟรีที่ [supabase.com](https://supabase.com/)

### ขั้นตอนการติดตั้ง

1.  **Clone a Repository:**

    ```bash
    git clone [https://github.com/your-username/next-crm.git](https://github.com/your-username/next-crm.git)
    cd next-crm
    ```

2.  **ติดตั้ง Dependencies:**

    ```bash
    npm install
    ```

3.  **ตั้งค่า Supabase:**

    - ไปที่ [Supabase](https://supabase.com/) เพื่อสร้างโปรเจกต์ใหม่
    - ไปที่ **SQL Editor** แล้วรันไฟล์ Schema SQL ของคุณเพื่อสร้างตารางและฟังก์ชันที่จำเป็นทั้งหมด
    - ไปที่ **Project Settings > API** เพื่อคัดลอก `Project URL` และ `anon public` key

4.  **ตั้งค่า Environment Variables:**
    สร้างไฟล์ `.env.local` ที่ Root ของโปรเจกต์ แล้วใส่ค่าที่คัดลอกมาจาก Supabase

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

5.  **รัน Development Server:**

    ```bash
    npm run dev
    ```

    เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์ของคุณ

---

## 📜 คำสั่งสคริปต์ (Available Scripts)

- `npm run dev`: รันแอปพลิเคชันในโหมดพัฒนา
- `npm run build`: Build แอปพลิเคชันสำหรับ Production
- `npm run start`: รันแอปพลิเคชันที่ Build แล้ว
- `npm run lint`: ตรวจสอบความถูกต้องของโค้ดด้วย ESLint
