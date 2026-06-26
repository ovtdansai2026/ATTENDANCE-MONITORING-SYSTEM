// ติดตั้ง Service Worker แบบรวดเร็ว
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// เปิดใช้งานและเข้าควบคุมทันที
self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

// 🌟 ระบบดึงข้อมูล: (สำคัญมาก) 
// เราปล่อยผ่านข้อมูลทุกอย่างแบบ 100% ไม่ตั้งแคช (No-Cache) 
// เพื่อให้ข้อมูลหน้าแดชบอร์ด อัปเดตล่าสุดแบบ Real-time เสมอ
self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request));
});
