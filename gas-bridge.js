// 🔴 วาง URL Web App ของคุณครูที่ลงท้ายด้วย /exec ตรงนี้
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxzHSqhS5B-7qiphJ5toUrwm1J8kKZhIGcFPZHUlgM7DnCgq1XyBFezetQXfIO6Rz71bA/exec";

function createGasRunner(successHandler, failureHandler) {
  return new Proxy({}, {
    get(target, prop) {
      // ดักจับ .withSuccessHandler(...)
      if (prop === 'withSuccessHandler') {
        return (fn) => createGasRunner(fn, failureHandler);
      }
      // ดักจับ .withFailureHandler(...)
      if (prop === 'withFailureHandler') {
        return (fn) => createGasRunner(successHandler, fn);
      }

      // เมื่อมีการเรียกชื่อฟังก์ชันใน Code.gs เช่น .getMobileDashboardData(authKey)
      return (...args) => {
        const authKey = localStorage.getItem('sopon_preferred_email') 
                     || localStorage.getItem('sopon_mobile_auth') 
                     || "";

        fetch(GAS_API_URL, {
          method: 'POST',
          // ใช้ text/plain เพื่อเลี่ยง CORS Preflight (OPTIONS) ของ Google Apps Script
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fn: prop,       // ชื่อฟังก์ชันใน Code.gs
            args: args,     // พารามิเตอร์ทั้งหมดที่ส่งเข้าไป
            authKey: authKey // ตัวตนผู้ใช้จาก localStorage
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("HTTP Error: " + res.status);
          return res.json();
        })
        .then(json => {
          if (json.ok) {
            if (typeof successHandler === 'function') successHandler(json.data);
          } else {
            const err = new Error(json.error || "เกิดข้อผิดพลาดฝั่ง Server");
            if (typeof failureHandler === 'function') failureHandler(err);
            else console.error("GAS Error:", err);
          }
        })
        .catch(err => {
          if (typeof failureHandler === 'function') failureHandler(err);
          else console.error("Network Error:", err);
        });
      };
    }
  });
}

// สร้างตัวแปร google.script.run จำลองขึ้นมา (ทำงานเฉพาะตอนรันนอก Google Apps Script)
window.google = window.google || {};
if (!window.google.script) {
  window.google.script = {
    run: createGasRunner(null, null)
  };
}
