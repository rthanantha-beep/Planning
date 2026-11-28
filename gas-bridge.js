// 🔴 วาง URL Web App ของคุณครูที่ลงท้ายด้วย /exec ตรงนี้
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxzHSqhS5B-7qiphJ5toUrwm1J8kKZhIGcFPZHUlgM7DnCgq1XyBFezetQXfIO6Rz71bA/exec";

function createGasRunner(successHandler, failureHandler) {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'withSuccessHandler') {
        return (fn) => createGasRunner(fn, failureHandler);
      }
      if (prop === 'withFailureHandler') {
        return (fn) => createGasRunner(successHandler, fn);
      }

      return (...args) => {
        const urlUid = new URLSearchParams(window.location.search).get('uid');
        const authKey = localStorage.getItem('sopon_session_token')
                     || urlUid
                     || localStorage.getItem('nongPhaenDee_lineUid')
                     || localStorage.getItem('sopon_mobile_auth')
                     || "";

        fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fn: prop,
            args: args,
            authKey: authKey
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("HTTP Error: " + res.status);
          return res.json();
        })
        .then(json => {
          if (json.ok) {
           if (typeof successHandler === 'function') {
              try {
                successHandler(json.data);
              } catch (uiErr) {
                console.error("Frontend Error in " + prop + ":", uiErr);
              }
            }
          } else {
            const errMsg = json.error || "เกิดข้อผิดพลาดฝั่ง Server";
            if (errMsg.includes("SESSION_EXPIRED")) {
              localStorage.removeItem('sopon_session_token');
              localStorage.removeItem('sopon_preferred_email');
              localStorage.removeItem('nongPhaenDee_lineUid');
              localStorage.removeItem('sopon_mobile_auth');
              if (!window.__RELOADING_FOR_AUTH__) {
                window.__RELOADING_FOR_AUTH__ = true;
                window.location.href = window.location.pathname;
              }
              return;
            }
            const err = new Error(errMsg);
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
