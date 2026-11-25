  // ==========================================
  // 🌟 แฮ็กระบบ: แปลง alert() ธรรมดาให้เป็น SweetAlert2 อัตโนมัติ
  // ==========================================
  window.oldAlert = window.alert; // เก็บของเดิมไว้เผื่อฉุกเฉิน
  window.alert = function(message) {
      let iconType = 'info';
      let titleTxt = 'แจ้งเตือนจากระบบ';

      // เช็คคีย์เวิร์ดเพื่อเปลี่ยนสี Icon อัตโนมัติ
      if (message.includes('สำเร็จ') || message.includes('เรียบร้อย')) {
          iconType = 'success';
          titleTxt = 'สำเร็จ!';
      } else if (message.includes('ผิดพลาด') || message.includes('ล้มเหลว') || message.includes('Error')) {
          iconType = 'error';
          titleTxt = 'เกิดข้อผิดพลาด!';
      } else if (message.includes('กรุณา') || message.includes('ต้องระบุ')) {
          iconType = 'warning';
          titleTxt = 'แจ้งเตือน';
      }

      Swal.fire({
          title: titleTxt,
          text: message,
          icon: iconType,
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3498db',
          customClass: {
              container: 'kanit-font' // ถ้าใช้ฟอนต์ Kanit
          }
      });
  };
  window.onerror = function(message, source, lineno, colno, error) {
    console.error("🔴 GLOBAL ERROR DETECTED:", { message, source, lineno, colno, error });
    alert("เกิดข้อผิดพลาดบนหน้าเว็บ!\nข้อความ: " + message + "\nบรรทัดที่: " + lineno);
    return false;
  };

  // 2. ดักจับ Promise หรือ Async/Await ที่พังแบบเงียบๆ
  window.addEventListener('unhandledrejection', function(event) {
    console.error("🔴 UNHANDLED PROMISE ERROR:", event.reason);
    alert("เกิดข้อผิดพลาด Async: " + (event.reason.message || event.reason));
  });
  // ==========================================
  // ตัวแปร Global ของระบบ
  // ==========================================
  let globalConfigData = { departments: [], sections: [] };
  let globalAllProjectsData = []; 
  let globalReconData = [];
  let isReconSortAsc = true;
  let budgetChartInstance = null;
  let globalActiveProjectsForTransfer = [];
  let globalSupplyDocsData = []; // เก็บข้อมูลไว้ปริ้นท์จะได้ไม่ต้องโหลดใหม่

 
  function getDefaultYear() {
    if (window.globalSettings && window.globalSettings.ActiveProjectYear) {
      let y = String(window.globalSettings.ActiveProjectYear).trim();
      return y.length === 4 ? y.substring(2) : y; // แปลง 2569 ให้เป็น 69
    }
    // ถ้าหาการตั้งค่าไม่เจอจริงๆ ค่อยสำรองด้วยปฏิทินปัจจุบัน
    const d = new Date();
    let currentBuddhistYear = d.getFullYear() + 543;
    if (d.getMonth() >= 9) currentBuddhistYear += 1;
    return String(currentBuddhistYear).substring(2);
  }

  function initYearDropdowns() {
    const defaultYearStr = getDefaultYear();
    const baseYearForList = parseInt("25" + defaultYearStr);

    const dropdowns = [
      'dashboard-year-filter', 
      'myprojects-year-filter', 
      'all-year-filter', 
      'budget-admin-year',
      'mydisb-year-filter',
      'amendment-year-filter',
      'alldisb-year-filter'
    ];
    
    let optionsHtml = '';
    // สร้างตัวเลือกปี ถอยหลัง 3 ปี เดินหน้า 1 ปี โดยยึดปีจากระบบเป็นหลัก
    for(let y = baseYearForList + 1; y >= baseYearForList - 3; y--) {
      let shortYear = String(y).substring(2);
      optionsHtml += `<option value="${shortYear}">ปีงบประมาณ 25${shortYear}</option>`;
    }
    
    dropdowns.forEach(id => {
      let dd = document.getElementById(id);
      if(dd) { 
        dd.innerHTML = optionsHtml; 
        dd.value = defaultYearStr; // 🌟 บังคับให้เลือกปีที่แอดมินตั้งไว้
      }
    });
  }
// 🌟 ฟังก์ชันแปลงตัวเลขเป็นภาษาไทย (Thai Baht Text)
function ThaiBahtText(amount) {
  if (isNaN(amount) || amount === 0) return "ศูนย์บาทถ้วน";
  const t = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const u = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  let numStr = Number(amount).toFixed(2);
  let baht = numStr.split('.')[0];
  let satang = numStr.split('.')[1];
  
  function convert(str) {
    if (str === "00" || str === "0") return "";
    let res = "";
    for (let i = 0; i < str.length; i++) {
      let digit = parseInt(str.charAt(i));
      let pos = str.length - i - 1;
      if (digit === 0) continue;
      if (digit === 1 && pos === 0 && str.length > 1 && parseInt(str.charAt(i-1)) !== 0) {
        res += "เอ็ด";
      } else if (digit === 2 && pos === 1) {
        res += "ยี่สิบ";
      } else if (digit === 1 && pos === 1) {
        res += "สิบ";
      } else {
        res += t[digit] + u[pos % 6];
      }
      if (pos > 0 && pos % 6 === 0) res += "ล้าน";
    }
    return res;
  }
  
  let result = convert(baht) + "บาท";
  if (satang === "00") result += "ถ้วน";
  else result += convert(satang) + "สตางค์";
  return result;
}
// 🌟 ฟังก์ชันอัปเดต Preview สดๆ
// 🌟 ฟังก์ชันอัปเดต Preview สดๆ
function updateSentencePreview() {
   const section = document.getElementById('disb-project-section').value || "[สังกัด/งาน]";
   
   // ดึงค่าจาก Checkbox ที่ถูกติ๊ก แล้วเอามาต่อกันด้วย "/"
   const actions = Array.from(document.querySelectorAll('input[name="actionType"]:checked')).map(cb => cb.value);
   const actionText = actions.length > 0 ? actions.join('/') : "[ระบุกระบวนการ]";

   const categories = Array.from(document.querySelectorAll('input[name="itemCategory"]:checked')).map(cb => cb.value);
   const catText = categories.length > 0 ? categories.join('/') : "[ระบุประเภท]";

   const objective = document.getElementById('disb-objective').value || "[ระบุเหตุผล]";
   
   // ดึงชื่อโครงการจาก Span ที่ซ่อนไว้มาแสดง
   const projName = document.getElementById('hidden-project-name').innerText || "[รอเลือกโครงการ]";
   const totalText = document.getElementById('disb-grandtotal').innerText.replace(/,/g, '');
   
   document.getElementById('preview-section').innerText = section;
   document.getElementById('preview-action').innerText = `${actionText} ${catText}`;
   document.getElementById('preview-objective').innerText = objective;
   document.getElementById('preview-project').innerText = projName; 
   
   const total = Number(totalText) || 0;
   document.getElementById('preview-money').innerText = `${total.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท (${ThaiBahtText(total)})`;
}

// ผูก Event Listener เพิ่มเติม เพื่อดักจับการติ๊ก Checkbox
document.addEventListener('change', function(e) {
  if (e.target.name === 'actionType' || e.target.name === 'itemCategory') {
    updateSentencePreview();
  }
});
  

  function updateDashboardUI(stats) {
    if(document.getElementById('dash-total')) document.getElementById('dash-total').innerText = stats.total || 0;
    if(document.getElementById('dash-draft')) document.getElementById('dash-draft').innerText = stats.draft || 0;
    if(document.getElementById('dash-pending')) document.getElementById('dash-pending').innerText = stats.pending || 0;
    if(document.getElementById('dash-approved')) document.getElementById('dash-approved').innerText = stats.approved || 0;
  }
  
  function handleDashboardError(error) {
    if(document.getElementById('dash-total')) document.getElementById('dash-total').innerText = "Err";
  }

  function loadConfigData() {
    google.script.run.withSuccessHandler(function(data) {
        globalConfigData = data;
        const deptSelect = document.getElementById('departmentSelect');
        if (deptSelect) {
          let html = '<option value="">-- เลือกกลุ่มงาน --</option>';
          data.departments.forEach(d => { html += `<option value="${d.code}">${d.name}</option>`; });
          deptSelect.innerHTML = html;
        }
      }).getDepartmentAndSectionData();
  }

  function updateSectionDropdown() {
    const deptSelect = document.getElementById('departmentSelect');
    const secSelect = document.getElementById('sectionSelect');
    const selectedDept = deptSelect.value;
    if (!selectedDept) { secSelect.innerHTML = '<option value="">-- กรุณาเลือกกลุ่มงานก่อน --</option>'; return; }
    let html = '<option value="">-- เลือกงาน/กลุ่มสาระ --</option>';
    const filteredSections = globalConfigData.sections.filter(s => s.parentCode === selectedDept);
    filteredSections.forEach(s => { html += `<option value="${s.code}">${s.name}</option>`; });
    secSelect.innerHTML = html;
  }

  // ==========================================
  // 3. ระบบสร้างโครงการและการตั้งค่า Admin
  // ==========================================
  function openCreateModal() { document.getElementById('createProjectModal').style.display = 'flex'; }
  function closeCreateModal() { document.getElementById('createProjectModal').style.display = 'none'; document.getElementById('createProjectForm').reset(); }
  
  function submitNewProject(event) {
    event.preventDefault();
    const form = document.getElementById('createProjectForm');
    const btnSubmit = document.getElementById('btn-submit-project');
    btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสร้าง...';

    const formData = { 
      projectName: form.projectName.value, 
      departmentCode: form.departmentCode.value, 
      sectionCode: form.sectionCode.value,
      isCentral: form.isCentral ? form.isCentral.checked : false
    };

    google.script.run
      .withSuccessHandler(function(res) {
        closeCreateModal(); 
        loadMyProjects();
        btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-save"></i> <span>สร้างโครงการ</span>';
        

        Swal.fire({
          title: 'สร้างโครงการสำเร็จ!',
          html: `
            <div style="font-size: 1.05rem; color: #2c3e50; margin-bottom: 15px;">${res.message}</div>
            <a href="${res.docUrl}" target="_blank" style="background: #27ae60; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.3s; width: 80%;">
              <i class="fas fa-file-word"></i> เปิดเอกสาร (ผง.1) เพื่อแก้ไขทันที
            </a>
          `,
          icon: 'success',
          showConfirmButton: true,
          confirmButtonText: 'ปิดหน้าต่าง',
          confirmButtonColor: '#bdc3c7',
          customClass: { container: 'kanit-font' }
        });

      })
      .withFailureHandler(function(err) {
        alert("ผิดพลาด: " + err.message);
        btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-save"></i> <span>สร้างโครงการ</span>';
      })
      .createProjectV2(formData);
  }

 

  function submitSettings(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save-settings');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

    // 🌟 บันทึกลิงก์ Template กลับไปที่ฐานข้อมูล
    const newSettings = { 
        'ActiveProjectYear': document.getElementById('input-active-project').value, 
        'ActiveReportYear': document.getElementById('input-active-report').value,
        'TemplateProject': document.getElementById('input-template-project').value,
        'TemplateReport': document.getElementById('input-template-report').value
    };

    google.script.run
      .withSuccessHandler(function(res) { 
        alert(res.message); 
        btn.innerHTML = '<i class="fas fa-save"></i> <span>บันทึกการตั้งค่า</span>'; 
        btn.disabled = false; 
      })
      .withFailureHandler(function(err) { 
        alert(err.message); 
        btn.innerHTML = '<i class="fas fa-save"></i> <span>บันทึกการตั้งค่า</span>'; 
        btn.disabled = false; 
      })
      .saveSystemSettings(newSettings);
  }

// ==========================================
// 4. ระบบจัดการโครงการ (โครงการของฉัน) - ตารางแบบ 2 ชั้น (พร้อมป้ายกำกับสถานะ)
// ==========================================
function loadMyProjects() {
    let container = document.getElementById('my-projects-container');
    if (!container) {
        const tbody = document.getElementById('my-projects-tbody');
        if (tbody) {
            const table = tbody.closest('table');
            const newDiv = document.createElement('div');
            newDiv.id = 'my-projects-container';
            table.parentNode.insertBefore(newDiv, table);
            table.remove();
            container = newDiv;
        } else {
            return;
        }
    }

    const selectElem = document.getElementById('myprojects-year-filter');
    const selectedYear = selectElem ? selectElem.value : "";
    
    container.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x" style="color:#2980b9;"></i><br><span style="margin-top:15px; display:block; color:#7f8c8d; font-family:\'Kanit\';">กำลังโหลดข้อมูลโครงการ...</span></div>';
    
    google.script.run
      .withSuccessHandler(function(projects) {
        if(projects.length === 0) {
          container.innerHTML = `<div style="text-align: center; padding: 30px; background: #fff; border-radius: 8px; color:#e74c3c; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px dashed #e74c3c;">ไม่พบโครงการของคุณในปีงบประมาณนี้</div>`;
          return;
        }
        
        let html = `
        <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-family: 'Kanit', sans-serif;">
            <thead>
              <tr style="background: #2c3e50; color: white;">
                <th style="padding: 15px; text-align: left; width: 50%;">ชื่อโครงการ</th>
                <th style="padding: 15px; text-align: right; width: 20%;">งบที่ได้รับ (บาท)</th>
                <th style="padding: 15px; text-align: right; width: 30%;">แหล่งงบประมาณ</th>
              </tr>
            </thead>
            <tbody>
        `;

        projects.forEach(p => {
          let isApproved = p.status.includes('อนุมัติ') && !p.status.includes('รอ') && !p.status.includes('ไม่') && !p.status.includes('ยกเลิก') && !p.status.includes('แก้ไข') && !p.status.includes('ส่งกลับ'); 
          let finalExecStatus = String(p.execStatus || "").trim();
          let finalReportStatus = String(p.reportStatus || "").trim();

          if (!isApproved) {
              finalExecStatus = "-";
          } else {
              if (finalExecStatus === "" || finalExecStatus === "-") {
                  finalExecStatus = p.hasDisbursement ? "กำลังดำเนินการ" : "รอดำเนินการ"; 
              }
          }

          if (!isApproved) {
              finalReportStatus = "-";
          } else {
              if (finalReportStatus === "" || finalReportStatus === "-") finalReportStatus = "ยังไม่รายงาน"; 
          }

          // 🌟 ป้ายสถานะ (ตัดคำว่าสถานะออก + นำกรอบครอบออกให้ดูคลีนขึ้น)
          let statusColor = '#e9ecef'; let textColor = '#333';
          if(p.status === 'แบบร่าง') { statusColor = '#95a5a6'; textColor = '#fff'; }
          else if(p.status.includes('อนุมัติ') && !p.status.includes('รอ') && !p.status.includes('ไม่') && !p.status.includes('แก้ไข') && !p.status.includes('ส่งกลับ')) { statusColor = '#27ae60'; textColor = '#fff'; } 
          else if(p.status.includes('รอ')) { statusColor = '#3498db'; textColor = '#fff'; }
          else if(p.status.includes('แก้ไข') || p.status.includes('ส่งกลับ')) { statusColor = '#f39c12'; textColor = '#fff'; }
          else if(p.status.includes('ไม่อนุมัติ') || p.status.includes('ยกเลิก')) { statusColor = '#e74c3c'; textColor = '#fff'; }
          let projBadge = `<div style="display:inline-flex; align-items:center; gap:5px;"><span style="font-size:0.75rem; color:#95a5a6; font-weight:bold;">ผง.1:</span> <span style="background: ${statusColor}; color: ${textColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight:bold;">${p.status}</span></div>`;

          let execColor = '#95a5a6'; let execText = '#fff'; 
          if(finalExecStatus.includes('รอดำเนินการ')) { execColor = '#3498db'; execText = '#fff'; }
          else if(finalExecStatus.includes('กำลังดำเนินการ')) { execColor = '#9b59b6'; execText = '#fff'; }
          else if(finalExecStatus.includes('เสร็จสิ้น')) { execColor = '#2ecc71'; execText = '#fff'; }
          else if(finalExecStatus.includes('ไม่ได้') || finalExecStatus.includes('ยกเลิก')) { execColor = '#e74c3c'; execText = '#fff'; }
          let execBadge = (finalExecStatus !== '-') ? `<div style="display:inline-flex; align-items:center; gap:5px;"><span style="font-size:0.75rem; color:#95a5a6; font-weight:bold;">ดำเนินงาน:</span> <span style="background: ${execColor}; color: ${execText}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight:bold;">${finalExecStatus}</span></div>` : ``;

          let repColor = '#95a5a6'; let repText = '#fff'; 
          if(finalReportStatus.includes('แบบร่าง')) { repColor = '#f1c40f'; repText = '#fff'; }
          else if(finalReportStatus.includes('อนุมัติ') || finalReportStatus.includes('สมบูรณ์') || finalReportStatus.includes('ผ่าน')) { repColor = '#27ae60'; repText = '#fff'; }
          else if(finalReportStatus.includes('รอ')) { repColor = '#f39c12'; repText = '#fff'; }
          else if(finalReportStatus.includes('แก้ไข') || finalReportStatus.includes('ส่งกลับ')) { repColor = '#e74c3c'; repText = '#fff'; }
          let repBadge = (finalReportStatus !== '-') ? `<div style="display:inline-flex; align-items:center; gap:5px;"><span style="font-size:0.75rem; color:#95a5a6; font-weight:bold;">รายงาน:</span> <span style="background: ${repColor}; color: ${repText}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight:bold;"><i class="fas fa-file-signature"></i> ${finalReportStatus}</span></div>` : ``;

          // 🌟 ลิงก์เอกสาร (คลีนขึ้น)
          let docLinks = '';
          const docStyle = "padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; border: 1px solid #d9e2ec; transition: 0.2s;";
          if (p.projectPdfUrl && p.projectPdfUrl !== '-') docLinks += `<a href="${p.projectPdfUrl}" target="_blank" style="${docStyle} background: #fff; color: #e74c3c;"><i class="fas fa-file-pdf"></i> โครงการ</a>`;
          else if (p.url && p.url !== '-') docLinks += `<a href="${p.url}" target="_blank" style="${docStyle} background: #fff; color: #2980b9;"><i class="fas fa-file-word"></i> โครงการ</a>`;
          
          if (p.reportPdfUrl && p.reportPdfUrl !== '-') docLinks += `<a href="${p.reportPdfUrl}" target="_blank" style="${docStyle} background: #fff; color: #d35400;"><i class="fas fa-file-pdf"></i> รายงาน</a>`;
          else if (p.reportUrl && p.reportUrl !== '-') docLinks += `<a href="${p.reportUrl}" target="_blank" style="${docStyle} background: #fff; color: #f39c12;"><i class="fas fa-file-word"></i> รายงาน</a>`;
          if(docLinks === '') docLinks = '<span style="color:#bdc3c7; font-size: 0.8rem;">-</span>';

          // 🌟 แหล่งงบประมาณ (ข้อความสีเขียว / ไม่ใช้งบเป็นสีเทา)
          let sourceDisplay = '';
          if (p.budgetSource && p.budgetSource !== '-') {
             let sources = p.budgetSource.split(',');
             sourceDisplay = sources.map(s => `<span style="color:#27ae60; font-weight:500; font-size:0.95rem;">${s.trim()}</span>`).join('<span style="color:#bdc3c7;">, </span>');
          } else {
             sourceDisplay = '<span style="color:#bdc3c7; font-size:0.9rem;">ไม่ใช้งบประมาณ</span>';
          }

          // 🌟 ปุ่ม Action (แบ่งปุ่มหลัก Solid / ปุ่มรอง Outline)
          let safeProjectName = encodeURIComponent(String(p.name || "")).replace(/'/g, "%27");
          let safeId = encodeURIComponent(String(p.id || "")).replace(/'/g, "%27");
          let safeEncodedComment = encodeURIComponent(String(p.comment || "")).replace(/'/g, "%27");
          
          // สไตล์สำหรับปุ่มทึบ (Primary) และปุ่มโปร่ง (Secondary)
          let btnSolidStyle = "padding: 6px 14px; border-radius: 4px; font-size: 0.85rem; border: none; cursor: pointer; font-family: 'Kanit'; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);";
          let btnOutlineStyle = "padding: 5px 13px; border-radius: 4px; font-size: 0.85rem; background: transparent; cursor: pointer; font-family: 'Kanit'; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;";

          let commentBtn = p.comment ? `<button onclick="showProjectComment('${safeId}', '${safeEncodedComment}')" title="ประวัติการพิจารณา" style="${btnOutlineStyle} border: 1px solid #f39c12; color: #f39c12;" onmouseover="this.style.background='#f39c1215'" onmouseout="this.style.background='transparent'"><i class="fas fa-history"></i> ประวัติ</button>` : '';
          let submitBtn = '', deleteBtn = '', amendBtn = '', reportBtn = '';

          if (p.status === 'แบบร่าง' || p.status.includes('แก้ไข') || p.status.includes('ส่งกลับ')) {
             submitBtn = `<button onclick="submitForScreening('${p.id}', '${safeProjectName}')" style="${btnSolidStyle} background: #3498db; color: white;"><i class="fas fa-paper-plane"></i> ขออนุมัติ</button>`;
          }
          if (p.status === 'แบบร่าง' || p.status.includes('ไม่อนุมัติ') || p.status.includes('ยกเลิก')) {
             deleteBtn = `<button onclick="deleteProject('${p.id}', '${safeProjectName}')" style="${btnOutlineStyle} border: 1px solid #e74c3c; color: #e74c3c;" onmouseover="this.style.background='#e74c3c15'" onmouseout="this.style.background='transparent'"><i class="fas fa-trash-alt"></i> ลบ</button>`;
          }

          if(isApproved) {
             let safeReqPayload = encodeURIComponent(String(p.reqPayload || "")).replace(/'/g, "%27");
             let isReturned = p.reqStatus && p.reqStatus.includes('ส่งกลับแก้ไข');
             let btnColor = isReturned ? '#e74c3c' : '#8e44ad';
             let btnText = isReturned ? '<i class="fas fa-exclamation-circle"></i> แก้ไขคำร้อง' : '<i class="fas fa-exchange-alt"></i> เปลี่ยนแปลงรายละเอียดโครงการ';
             // ปุ่มรอง (ผง.3)
             amendBtn = `<button onclick="openAmendmentModal('${p.id}', '${safeProjectName}', '${p.url}', '${safeReqPayload}')" style="${btnOutlineStyle} border: 1px solid ${btnColor}; color: ${btnColor};" onmouseover="this.style.background='${btnColor}15'" onmouseout="this.style.background='transparent'">${btnText}</button>`;
             
             let rptBg = (finalReportStatus === 'แบบร่าง' || finalReportStatus === 'แก้ไขรายงาน') ? '#f39c12' : '#2980b9';
             let rptText = (finalReportStatus === 'แบบร่าง' || finalReportStatus === 'แก้ไขรายงาน') ? '<i class="fas fa-edit"></i> เสนอรายงาน' : '<i class="fas fa-file-signature"></i> สร้างรายงาน';
             
             // ปุ่มหลัก (รายงาน)
             if (p.hasPendingRecon) {
                 reportBtn = `<button disabled title="ต้องเคลียร์บิลเบิกจ่ายก่อน" style="${btnSolidStyle} background: #bdc3c7; color: white; cursor: not-allowed;"><i class="fas fa-lock"></i> รอกระทบยอด</button>`;
             } else {
                 reportBtn = `<button onclick="openReportModal('${p.id}', '${safeProjectName}', '${p.url}')" style="${btnSolidStyle} background: ${rptBg}; color: white;">${rptText}</button>`;
             }
          }

          let budgetDisplay = (p.budget && !isNaN(p.budget) && Number(p.budget) > 0) ? Number(p.budget).toLocaleString() : '<span style="color:#bdc3c7;">-</span>';

          // 🌟 ชั้น 1: สีขาวล้วน (ลบชื่อเจ้าของออก เหลือแค่ ID สีเทาจาง)
          // 🌟 ชั้น 2: พื้นหลังสีเทาอ่อน แยกกลุ่มสายตาชัดเจน
          html += `
            <tr style="border-top: 1px solid #d9e2ec; background: #fff;">
                <td style="padding: 16px 15px 12px 15px;">
                    <div style="font-weight: bold; color: #2c3e50; font-size: 1.05rem; line-height: 1.3;">${p.name}</div>
                    <div style="color: #95a5a6; font-size: 0.85rem; margin-top: 6px;">[${p.id}]</div>
                </td>
                <td style="padding: 16px 15px 12px 15px; text-align: right; font-weight: bold; color: #27ae60; font-size: 1.15rem;">
                    ${budgetDisplay}
                </td>
                <td style="padding: 16px 15px 12px 15px; text-align: right;">
                    ${sourceDisplay}
                </td>
            </tr>
            <tr style="background: #f8f9fa;">
                <td colspan="3" style="padding: 10px 15px 15px 15px; border-top: 1px dashed #ecf0f1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        
                        <!-- ฝั่งซ้าย: สถานะและเอกสาร -->
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            ${projBadge} ${execBadge} ${repBadge}
                            <div style="width: 1px; height: 18px; background: #d9e2ec; display: block; margin: 0 4px;"></div>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <span style="font-size: 0.75rem; color: #95a5a6; font-weight: bold; margin-right: 2px;">เอกสาร:</span>
                                ${docLinks}
                            </div>
                        </div>

                        <!-- ฝั่งขวา: กลุ่มปุ่ม -->
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                            ${submitBtn} ${commentBtn} ${amendBtn} ${reportBtn} ${deleteBtn}
                        </div>
                    </div>
                </td>
            </tr>
          `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
      })
      .withFailureHandler(function(error) { 
        container.innerHTML = `<div style="text-align: center; color: red; padding: 30px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">โหลดข้อมูลล้มเหลว: ${error.message}</div>`; 
      })
      .getMyProjectsData(selectedYear);
}
// ==========================================
// 🌟 1. ดึงข้อมูล ผง.3 เข้าตาราง (สำหรับผู้ตรวจสอบ และเจ้าของโครงการ)
// ==========================================
let globalAmendmentDocsData = [];

function loadAmendmentDocs() {
  const tbody = document.getElementById('amendment-docs-tbody');
  const yearSelect = document.getElementById('amendment-year-filter');
  const year = yearSelect ? yearSelect.value : new Date().getFullYear().toString().substring(2);
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color:#8e44ad;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงข้อมูลคำร้อง...</td></tr>';

  google.script.run
    .withSuccessHandler(function(data) {
      globalAmendmentDocsData = data;
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color:#95a5a6;">ไม่พบประวัติการยื่นคำร้องในปีงบประมาณนี้</td></tr>';
        return;
      }
      let html = '';
      data.forEach(item => {
        let statusBadge = '';
        if (item.reqStatus.includes('อนุมัติ')) statusBadge = `<span style="background:#27ae60; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;"><i class="fas fa-check"></i> ${item.reqStatus}</span>`;
        else if (item.reqStatus.includes('รอ')) statusBadge = `<span style="background:#f39c12; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;"><i class="fas fa-clock"></i> ${item.reqStatus}</span>`;
        else if (item.reqStatus.includes('แบบร่าง')) statusBadge = `<span style="background:#95a5a6; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;"><i class="fas fa-edit"></i> ${item.reqStatus}</span>`;
        else statusBadge = `<span style="background:#e74c3c; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;"><i class="fas fa-times"></i> ${item.reqStatus}</span>`;

        let actionBtn = '';
        
        // 🌟 แก้ไขเงื่อนไขให้รองรับระบบเก่า (เจอคำว่า อนุมัติ และไม่ใช่ ไม่อนุมัติ หรือ รอ)
        let isApproved = item.reqStatus.includes('อนุมัติ') && !item.reqStatus.includes('ไม่อนุมัติ') && !item.reqStatus.includes('รอ');
        
        if (isApproved) {
            actionBtn = `<button onclick="printAmendmentDoc('${item.id}')" style="background:#3498db; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; box-shadow: 0 2px 4px rgba(41,128,185,0.2);"><i class="fas fa-print"></i> พิมพ์ ผง.3</button>`;
        } 
        // ถ้ายังรอตรวจอยู่ ให้โชว์ปุ่ม "ตรวจสอบ" (สำหรับคนที่มีสิทธิ์ที่ไม่ใช่ user ทั่วไป)
        else if (item.reqStatus.includes('รอ') && window.userRole !== 'user') {
            actionBtn = `<button onclick="openAmendReviewModal('${item.id}')" style="background:#8e44ad; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold;"><i class="fas fa-search"></i> ตรวจสอบ</button>`;
        } else {
            actionBtn = `<span style="color:#95a5a6; font-size:0.85rem;">รอผู้ตรวจสอบ</span>`;
        }

        html += `
          <tr style="border-bottom: 1px solid #ecf0f1;">
            <td style="padding: 12px; font-weight: bold; color: #8e44ad;">${item.id}</td>
            <td style="padding: 12px; font-weight: 500; color: #2c3e50;">${item.name}</td>
            <td style="padding: 12px; color: #555;">${item.owner}</td>
            <td style="padding: 12px; color: #e67e22; font-size: 0.9rem;">${item.reqReason}</td>
            <td style="padding: 12px; text-align: center;">${statusBadge}</td>
            <td style="padding: 12px; text-align: center;">${actionBtn}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    })
    .getAmendmentHistoryList(year);
}

// ==========================================
// 🌟 2. เปิดหน้าต่างตรวจสอบคำร้อง (สำหรับ 4 ด่าน)
// ==========================================
function openAmendReviewModal(projectId) {
  const item = globalAmendmentDocsData.find(d => d.id === projectId);
  if(!item) return;

  document.getElementById('amend-review-pid').value = projectId;
  document.getElementById('amend-review-title').innerText = `[${projectId}] ${item.name}`;
  document.getElementById('amend-review-reason').innerText = item.reqReason;
  document.getElementById('amend-review-comment').value = '';

  let roleStr = window.userRole;
  let myRole = ''; let roleName = '';
  if (roleStr.includes('admin')) { myRole = 'admin'; roleName = 'แอดมินงานแผนงาน'; }
  else if (roleStr.includes('finance') || roleStr.includes('การเงิน')) { myRole = 'finance'; roleName = 'หัวหน้าการเงิน'; }
  else if (roleStr.includes('a2') || roleStr.includes('รอง')) { myRole = 'a2'; roleName = 'รองผู้อำนวยการ'; }
  else if (roleStr.includes('a3') || roleStr.includes('ผอ')) { myRole = 'a3'; roleName = 'ผู้อำนวยการ'; }

  document.getElementById('amend-review-role').value = myRole;
  document.getElementById('amend-review-rolename').value = roleName;

  try {
    const payload = JSON.parse(item.payload);
    
    // วาดตาราง
    let trs = '';
    if(payload.items && payload.items.length > 0){
      payload.items.forEach(it => {
        trs += `<tr>
          <td style="padding:6px; border:1px solid #ccc;">${it.oldName}</td><td style="padding:6px; border:1px solid #ccc; text-align:center;">${it.oldQty}</td><td style="padding:6px; border:1px solid #ccc; text-align:center;">${it.oldUnit}</td><td style="padding:6px; border:1px solid #ccc; text-align:right;">${it.oldPrice}</td>
          <td style="padding:6px; border:1px solid #ccc; border-left:3px solid #2980b9;">${it.newName}</td><td style="padding:6px; border:1px solid #ccc; text-align:center;">${it.newQty}</td><td style="padding:6px; border:1px solid #ccc; text-align:center;">${it.newUnit}</td><td style="padding:6px; border:1px solid #ccc; text-align:right;">${it.newPrice}</td>
        </tr>`;
      });
    }
    document.getElementById('amend-review-items-tbody').innerHTML = trs;

    // จัดการงบที่ขอเพิ่ม
    const budgetBox = document.getElementById('amend-review-budget-box');
    if (payload.isAddBudget === 'increase') {
       budgetBox.style.display = 'block';
       document.getElementById('amend-review-add-amt').innerText = Number(payload.addAmount).toLocaleString();
       
       if (myRole === 'admin') {
          document.getElementById('amend-admin-source-select').style.display = 'block';
          document.getElementById('amend-other-source-display').style.display = 'none';
          
          // ดึงรายชื่อแหล่งเงินจากระบบงบกลาง
          google.script.run.withSuccessHandler(data => {
            let opt = '<option value="">-- เลือกกองเงินจากงบกลาง --</option>';
            data.summary.forEach(s => { opt += `<option value="${s.source}">${s.source} (เหลือ ${s.balance.toLocaleString()} บ.)</option>`; });
            document.getElementById('amend-budget-source').innerHTML = opt;
          }).getCentralBudgetDashboard(new Date().getFullYear().toString().substring(2));
       } else {
          document.getElementById('amend-admin-source-select').style.display = 'none';
          document.getElementById('amend-other-source-display').style.display = 'block';
          document.getElementById('amend-source-text').innerText = item.addSource || "ไม่ได้ระบุ";
       }
    } else {
       budgetBox.style.display = 'none';
    }
  } catch(e) { console.error(e); }

  document.getElementById('amendReviewModal').style.display = 'flex';
}

function submitAmendReview(action) {
  const projectId = document.getElementById('amend-review-pid').value;
  const role = document.getElementById('amend-review-role').value;
  const roleName = document.getElementById('amend-review-rolename').value;
  const comment = document.getElementById('amend-review-comment').value.trim();
  
  if ((action === 'reject' || action === 'return') && !comment) {
     alert("กรุณาระบุข้อเสนอแนะหรือเหตุผลในช่องความเห็นครับ"); return;
  }

  let addSource = "";
  if (role === 'admin' && document.getElementById('amend-review-budget-box').style.display === 'block') {
     addSource = document.getElementById('amend-budget-source').value;
     if (action === 'approve' && !addSource) { alert("กรุณาเลือกแหล่งงบประมาณที่จะดึงไปสมทบให้โครงการครับ"); return; }
  }

  let confirmMsg = action === 'approve' ? "ยืนยันการอนุมัติและส่งต่อ?" : "ยืนยันการตีกลับ/ไม่อนุมัติ?";
  if (!confirm(confirmMsg)) return;

  Swal.fire({ title: 'กำลังประมวลผล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  google.script.run
    .withSuccessHandler(res => {
       Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message, customClass: { container: 'kanit-font' } });
       document.getElementById('amendReviewModal').style.display = 'none';
       loadAmendmentDocs();
    })
    .withFailureHandler(err => {
       Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message, customClass: { container: 'kanit-font' } });
    })
    .submitAmendReviewDecision({
       projectId: projectId, action: action, comment: comment, role: role, roleName: roleName, addSource: addSource
    });
}

// ==========================================
// 🌟 3. สร้างเอกสาร ผง.3 (Print PDF) และแนบลายเซ็น
// ==========================================
function printAmendmentDoc(projectId) {
  const data = globalAmendmentDocsData.find(d => d.id === projectId);
  if (!data) return;

  const payload = JSON.parse(data.payload || "{}");
  
  // แปลง Array ตาราง เป็น HTML 
  let tableHtml = '';
  if(payload.items && payload.items.length > 0) {
     payload.items.forEach((it, idx) => {
        let oldTotal = (Number(it.oldQty)||0) * (Number(it.oldPrice)||0);
        let newTotal = (Number(it.newQty)||0) * (Number(it.newPrice)||0);
        tableHtml += `<tr>
          <td class="center">${idx+1}</td><td>${it.oldName}</td><td class="center">${it.oldQty}</td><td class="center">${it.oldUnit}<br>${it.oldPrice}</td><td class="right">${oldTotal.toLocaleString()}</td>
          <td class="center">${idx+1}</td><td style="color:#27ae60;">${it.newName}</td><td class="center">${it.newQty}</td><td class="center">${it.newUnit}<br>${it.newPrice}</td><td class="right" style="color:#27ae60; font-weight:bold;">${newTotal.toLocaleString()}</td>
        </tr>`;
     });
  }

  // แปลงลายเซ็นจากข้อมูล (ต้องทำฟังก์ชัน createPrintSignatureBlock ดึงลายเซ็นมาเหมือน ผง.2)
  const extractSig = (text) => {
      if(!text) return "<br><br><br>";
      const match = text.match(/^\((.*?)\s*-/);
      return match ? `<br><br>( ${match[1]} )<br>` : "<br><br><br>";
  };

  let docHtml = `
    <html><head><title>แบบ ผง. 3 - ${projectId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Sarabun', sans-serif; padding: 20px 40px; font-size: 16pt; line-height: 1.2; }
      .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; } .indent { text-indent: 40px; }
      table { width: 100%; border-collapse: collapse; font-size: 14pt; margin-top: 10px; }
      td, th { border: 1px solid #000; padding: 8px; vertical-align: top; }
    </style></head><body>
      <div style="position:absolute; top:20px; right:40px; font-weight:bold; font-size:14pt;">แบบ ผง. 3</div>
      <h2 class="center" style="font-size: 22pt; margin-bottom: 5px;">บันทึกข้อความ</h2>
      
      <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
         <div><b>ส่วนราชการ</b> โรงเรียนโสภณศิริราษฎร์</div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
         <div><b>ที่</b> .....................................................</div>
         <div><b>วันที่</b> ${data.reqTime !== '-' ? data.reqTime : '.......................................'}</div>
      </div>
      <div style="margin-bottom: 5px;"><b>เรื่อง</b> ขออนุมัติเปลี่ยนแปลงรายละเอียดโครงการ/กิจกรรม</div>
      <div style="margin-bottom: 15px;"><b>เรียน</b> ผู้อำนวยการโรงเรียนโสภณศิริราษฎร์</div>
      
      <div class="indent" style="text-align: justify; margin-bottom: 10px;">
         ด้วย ข้าพเจ้า <b>${data.owner}</b> ผู้รับผิดชอบกิจกรรม <b>${data.name}</b> มีความประสงค์ขอเปลี่ยนแปลงรายละเอียดการใช้งบประมาณในโครงการ/กิจกรรมดังกล่าวตามแผนปฏิบัติการ โดยมีเหตุผลและความจำเป็นดังนี้ 
      </div>
      <div style="padding-left: 40px; margin-bottom: 10px; font-weight:bold;">"${data.reqReason}"</div>
      
      <div class="indent" style="text-align: justify; margin-bottom: 20px;">
         ในการนี้ เพื่อให้การดำเนินการโครงการ/กิจกรรมเป็นไปด้วยความเรียบร้อยตามวัตถุประสงค์ตามแผนปฏิบัติการของสถานศึกษา ข้าพเจ้าจึงขออนุมัติเปลี่ยนแปลงรายละเอียดโครงการ/กิจกรรมข้างต้น โดยข้าพเจ้าได้แนบรายละเอียดตารางแสดงรายการที่ขอเปลี่ยนแปลงในโครงการมาพร้อมเอกสารฉบับนี้แล้ว
      </div>
      <div style="margin-bottom: 30px;">จึงเรียนมาเพื่อทราบและโปรดพิจารณา ดังนี้</div>
      <div style="text-align: right; margin-bottom: 30px;">
         (ลงชื่อ) ...................................................................... ผู้รับผิดชอบกิจกรรม<br>( ${data.owner} )
      </div>

      <table style="border: none; margin: 0; padding: 0;">
        <tr>
          <td style="width: 50%; border: 1px solid #000; padding: 10px;">
             <b>ความเห็นหัวหน้างานแผนงานโรงเรียน</b><br>
             [ / ] เห็นควรอนุมัติ<br>
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ ${payload.isAddBudget==='no_change'?'/':' '} ] โดยใช้งบประมาณเดิม<br>
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ ${payload.isAddBudget==='increase'?'/':' '} ] โดยอนุมัติงบประมาณเพิ่มเติม จากงบกลาง<br><br>
             <b>แหล่งงบประมาณ:</b> ${data.source}<br>
             <div class="center" style="margin-top:10px;">ลงชื่อ ${extractSig(data.adminCom)}</div>
          </td>
          <td style="width: 50%; padding: 0; border: none;">
             <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
                <b>ความเห็นหัวหน้ากลุ่มบริหารงานงบประมาณ</b><br>[ / ] เห็นควรให้ดำเนินการ<br>
                <div class="center">ลงชื่อ ${extractSig(data.finCom)}</div>
             </div>
             <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
                <b>ความเห็นรองผู้อำนวยการโรงเรียน</b><br>[ / ] เห็นควรอนุมัติ<br>
                <div class="center">ลงชื่อ ${extractSig(data.a2Com)}</div>
             </div>
             <div style="border: 1px solid #000; padding: 10px;">
                <b>ความเห็นผู้อำนวยการโรงเรียน</b><br>[ / ] อนุมัติ<br>
                <div class="center">ลงชื่อ ${extractSig(data.a3Com)}</div>
             </div>
          </td>
        </tr>
      </table>

      <!-- หน้า 2: ตารางเปรียบเทียบ -->
      <div style="page-break-before: always;"></div>
      <h3 class="center bold" style="margin-bottom:15px; margin-top:20px;">ตารางแสดงรายการที่ขอเปลี่ยนแปลงในโครงการ/กิจกรรม</h3>
      <table>
        <thead style="background:#f0f0f0;">
          <tr><th colspan="5" style="width:50%;">รายละเอียดเดิม</th><th colspan="5" style="width:50%;">รายละเอียดใหม่</th></tr>
          <tr>
            <th>ที่</th><th>รายการ</th><th>จำนวน</th><th>หน่วย/ราคา</th><th>รวม(บ.)</th>
            <th>ที่</th><th>รายการ</th><th>จำนวน</th><th>หน่วย/ราคา</th><th>รวม(บ.)</th>
          </tr>
        </thead>
        <tbody>${tableHtml}</tbody>
      </table>
      <div style="margin-top:20px; font-weight:bold; text-align:center;">
        ทั้งนี้ ขอเปลี่ยนแปลงรายละเอียดตามข้างต้น โดย [ ${payload.isAddBudget==='no_change'?'/':' '} ] ไม่ขอเพิ่มงบประมาณ / [ ${payload.isAddBudget==='increase'?'/':' '} ] ขอเพิ่มงบประมาณตามจำนวนข้างต้น
      </div>
      <script>setTimeout(() => window.print(), 500);<\/script>
    </body></html>`;
  
  let printWindow = window.open('', '_blank', 'width=850,height=900');
  printWindow.document.write(docHtml);
  printWindow.document.close();
}

// ==========================================
// 🔍 [LOGGER] โหลดข้อมูลฐานข้อมูลโครงการทั้งหมด
// ==========================================
var currentLoadedYear = null; 
window.globalAllProjectsData = window.globalAllProjectsData || []; 

function applyAllProjectsFilters() {
  console.log("🔘 [LOGGER] มีการคลิกปุ่ม 'กรองข้อมูล'");
  
  const selectElem = document.getElementById('all-year-filter');
  let selectedYear = selectElem ? selectElem.value : "";
  if (!selectedYear) selectedYear = typeof getDefaultYear === 'function' ? getDefaultYear() : "";
  
  console.log("📅 [LOGGER] ปีงบประมาณที่เลือกในฟิลเตอร์คือ:", selectedYear);
  console.log("📅 [LOGGER] ปีที่โหลดค้างไว้ล่าสุดคือ:", currentLoadedYear);

  if (currentLoadedYear !== selectedYear) {
      console.log("🔄 [LOGGER] ปีเปลี่ยน -> สั่งโหลดข้อมูลใหม่จาก Server");
      loadAllProjects(selectedYear);
  } else {
      console.log("⚡ [LOGGER] ปีเดิม -> สั่งกรองข้อมูลจากแคชหน้าเว็บทันที");
      renderAllProjects();
  }
}

function loadAllProjects(forceYear) {
  console.log("🚀 [LOGGER 1] เริ่มต้นทำงานฟังก์ชัน loadAllProjects()");
  
  const tbody = document.getElementById('all-projects-tbody');
  if(!tbody) {
      console.error("❌ [LOGGER ERROR] ไม่พบตาราง id='all-projects-tbody' ในหน้า HTML! (หน้าเว็บอาจจะยังไม่ถูกโหลด)");
      return;
  }

  let selectedYear = forceYear;
  if (!selectedYear) {
           const selectElem = document.getElementById('all-year-filter');
           selectedYear = selectElem ? selectElem.value : "";
           if (!selectedYear) {
               selectedYear = typeof getDefaultYear === 'function' ? getDefaultYear() : ""; // 🌟 ตัด "all" ออก
           }
        }

  console.log("📡 [LOGGER 2] กำลังส่งคำขอไปดึงข้อมูลจาก Code.gs ปี:", selectedYear);
  tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#3498db;"></i><br>กำลังโหลดฐานข้อมูลโครงการ...</td></tr>';
  
  google.script.run
    .withSuccessHandler(function(projects) { 
        console.log("✅ [LOGGER 3] Server ตอบกลับข้อมูลสำเร็จ! จำนวนโครงการทั้งหมด:", projects ? projects.length : 0);
        
        window.globalAllProjectsData = projects || [];
        currentLoadedYear = selectedYear; 
        
        const selectElem = document.getElementById('all-year-filter');
        if (selectElem && selectElem.value !== selectedYear) {
            selectElem.value = selectedYear;
        }

        renderAllProjects();
    })
    .withFailureHandler(function(error) { 
        console.error("❌ [LOGGER ERROR] Server ปฏิเสธการส่งข้อมูล:", error.message);
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: red; padding: 20px;">โหลดข้อมูลล้มเหลว: ${error.message}</td></tr>`; 
    })
    .getAllProjectsData(selectedYear); 
}

// ==========================================
// 🌟 วาดตารางโครงการทั้งหมด 
// ==========================================
var currentFilteredProjects = []; // ใช้ var ป้องกัน Error ตัวแปรซ้ำ

function renderAllProjects() {
  const tbody = document.getElementById('all-projects-tbody');
  if(!tbody) return;

  if (!window.globalAllProjectsData || !Array.isArray(window.globalAllProjectsData)) {
      window.globalAllProjectsData = [];
  }

  const searchTerm = document.getElementById('all-search') ? document.getElementById('all-search').value.toLowerCase() : "";
  const statusFilter = document.getElementById('all-status-filter') ? document.getElementById('all-status-filter').value : "all";
  const execFilter = document.getElementById('all-exec-filter') ? document.getElementById('all-exec-filter').value : "all";
  const reportFilter = document.getElementById('all-report-filter') ? document.getElementById('all-report-filter').value : "all";

  let html = '';
  let countTotal = 0, countApproved = 0, countExecDone = 0, countReportDone = 0;
  currentFilteredProjects = [];

  window.globalAllProjectsData.forEach(p => {
    let matchSearch = true, matchStatus = true, matchExec = true, matchReport = true;

    let isApproved = p.status.startsWith('อนุมัติ'); 
    let finalExecStatus = String(p.execStatus || "").trim();
    let finalReportStatus = String(p.reportStatus || "").trim();

    if (finalExecStatus === "" || finalExecStatus === "-") {
        if (!isApproved) finalExecStatus = "รออนุมัติหลักการ";
        else finalExecStatus = p.hasDisbursement ? "กำลังดำเนินการ" : "รอดำเนินการ"; 
    }

    if (!isApproved) finalReportStatus = "-";
    else if (finalReportStatus === "" || finalReportStatus === "-") finalReportStatus = "ยังไม่รายงาน";

    // กรองคำค้นหา
    if (searchTerm) {
      matchSearch = p.id.toLowerCase().includes(searchTerm) || 
                    p.name.toLowerCase().includes(searchTerm) || 
                    p.owner.toLowerCase().includes(searchTerm);
    }

    // กรองสถานะ ผง.1
    if (statusFilter !== 'all') {
      if (statusFilter === 'อนุมัติ' && !p.status.includes('อนุมัติ')) matchStatus = false;
      else if (statusFilter === 'รอ' && !p.status.includes('รอ')) matchStatus = false;
      else if (statusFilter === 'แก้ไข' && !(p.status.includes('ร่าง') || p.status.includes('แก้ไข') || p.status.includes('ส่งกลับ'))) matchStatus = false;
      else if (statusFilter === 'ไม่อนุมัติ' && !(p.status.includes('ยกเลิก') || p.status.includes('ไม่อนุมัติ'))) matchStatus = false;
    }

    // กรองสถานะดำเนินการ
    if (execFilter !== 'all') {
      if (execFilter === 'รออนุมัติหลักการ' && finalExecStatus !== 'รออนุมัติหลักการ') matchExec = false; 
      else if (execFilter === 'รอดำเนินการ' && finalExecStatus !== 'รอดำเนินการ') matchExec = false;
      else if (execFilter === 'กำลังดำเนินการ' && !finalExecStatus.includes('กำลังดำเนินการ')) matchExec = false;
      else if (execFilter === 'เสร็จสิ้น' && !finalExecStatus.includes('เสร็จสิ้น')) matchExec = false;
    }

    // กรองสถานะรายงาน
    if (reportFilter !== 'all') {
      if (reportFilter === 'ยังไม่รายงาน' && finalReportStatus !== 'ยังไม่รายงาน') matchReport = false;
      else if (reportFilter === 'แบบร่าง' && !finalReportStatus.includes('แบบร่าง')) matchReport = false;
      else if (reportFilter === 'รอตรวจ' && !finalReportStatus.includes('รอแอดมินตรวจ')) matchReport = false;
      else if (reportFilter === 'แก้ไข' && !finalReportStatus.includes('แก้ไข') && !finalReportStatus.includes('ส่งกลับ')) matchReport = false;
      else if (reportFilter === 'ผ่าน' && !finalReportStatus.includes('รายงานสมบูรณ์')) matchReport = false; 
    }

    if (matchSearch && matchStatus && matchExec && matchReport) {
      let displayProject = { ...p, execStatus: finalExecStatus, reportStatus: finalReportStatus };
      currentFilteredProjects.push(displayProject);

      countTotal++;
      if (p.status.includes('อนุมัติ') && !p.status.includes('ไม่อนุมัติ')) countApproved++;
      if (finalExecStatus.includes('เสร็จสิ้น')) countExecDone++;
      if (finalReportStatus.includes('รายงานสมบูรณ์')) countReportDone++;

      let statusColor = '#95a5a6';
      if (p.status.includes('รอ')) statusColor = '#f39c12';
      else if (p.status.includes('อนุมัติ')) statusColor = '#27ae60';
      else if (p.status.includes('ส่งกลับแก้ไข') || p.status.includes('ไม่อนุมัติ') || p.status.includes('ยกเลิก')) statusColor = '#e74c3c';

      let execColor = '#95a5a6'; 
      if (finalExecStatus.includes('รอดำเนินการ')) execColor = '#3498db'; 
      else if (finalExecStatus.includes('กำลังดำเนินการ')) execColor = '#9b59b6'; 
      else if (finalExecStatus.includes('เสร็จสิ้น')) execColor = '#2ecc71'; 
      else if (finalExecStatus.includes('ยกเลิก') || finalExecStatus.includes('ไม่ได้')) execColor = '#e74c3c'; 

      let reportColor = '#95a5a6'; 
      if (finalReportStatus.includes('แบบร่าง')) reportColor = '#f1c40f'; 
      else if (finalReportStatus.includes('รอแอดมินตรวจ') || finalReportStatus.includes('รอตรวจสอบ')) reportColor = '#f39c12'; 
      else if (finalReportStatus.includes('รายงานสมบูรณ์')) reportColor = '#27ae60'; 
      else if (finalReportStatus.includes('ส่งกลับ') || finalReportStatus.includes('แก้ไข')) reportColor = '#e74c3c'; 

      let fileBtn = '-';
      let userRoleStr = (typeof window.userRole === 'string') ? window.userRole.toLowerCase() : "";
      const isAdminRole = userRoleStr.includes('admin') || userRoleStr.includes('แผน');

      if (isAdminRole) {
         let docLink = p.url ? `<a href="${p.url}" target="_blank" style="color:#2980b9; margin-right:6px;" title="เปิดเอกสารต้นฉบับ (Docs)"><i class="fas fa-file-word"></i></a>` : '';
         let pdfLink = (p.projectPdfUrl && p.projectPdfUrl !== '-') ? `<a href="${p.projectPdfUrl}" target="_blank" style="color:#e74c3c; margin-right:6px;" title="เปิดฉบับสมบูรณ์ (PDF)"><i class="fas fa-file-pdf"></i></a>` : '';
         let regenBtn = (p.status.includes('อนุมัติ') && p.url) ? `<button onclick="adminRebuildPDF('${p.id}')" style="background:none; border:none; color:#f39c12; cursor:pointer;" title="สร้าง PDF ใหม่"><i class="fas fa-sync-alt"></i></button>` : '';
         fileBtn = `<div style="display:flex; justify-content:center; align-items:center; font-size:1.1rem;">${docLink}${pdfLink}${regenBtn}</div>`;
      } else {
         if (p.projectPdfUrl && p.projectPdfUrl !== '-') {
             fileBtn = `<a href="${p.projectPdfUrl}" target="_blank" style="color: #e74c3c; font-size: 1.1rem;" title="เอกสารฉบับสมบูรณ์ (แก้ไขไม่ได้)"><i class="fas fa-file-pdf"></i></a>`;
         } else {
             fileBtn = p.url ? `<a href="${p.url}" target="_blank" style="color: #bdc3c7; font-size: 1.1rem;" title="เปิดเอกสารแบบร่าง"><i class="fas fa-file-alt"></i></a>` : '-';
         }
      }

      let repLink = p.reportPdf ? p.reportPdf : p.reportUrl;
      let reportBtn = repLink ? `<a href="${repLink}" target="_blank" style="color: #e67e22; text-decoration: none; font-size: 1.1rem;" title="เปิดไฟล์รายงานผล"><i class="fas fa-file-pdf"></i></a>` : `<span style="color:#bdc3c7;"><i class="fas fa-minus"></i></span>`;

      let sourceHtml = '', budgetHtml = '', spentHtml = '', remainHtml = '';

      if (p.budget === 0 && p.spent === 0) {
        sourceHtml = `<span style="background:#95a5a6; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">ไม่ใช้งบประมาณ</span>`;
        budgetHtml = `<span style="color:#bdc3c7;">-</span>`;
        spentHtml = `<span style="color:#bdc3c7;">-</span>`;
        remainHtml = `<span style="color:#bdc3c7;">-</span>`;
      } 
      else if (p.fundingDetails && p.fundingDetails.length > 1) {
        p.fundingDetails.forEach((f, idx) => {
          let border = idx < p.fundingDetails.length - 1 ? 'border-bottom: 1px dashed #ccc;' : '';
          let sName = f.source && f.source !== "-" ? f.source : "ไม่ระบุ";
          
          sourceHtml += `<div style="padding:6px 0; ${border}"><span style="background:#8e44ad; color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${sName}</span></div>`;
          budgetHtml += `<div style="padding:6px 0; ${border}">${f.budget.toLocaleString()}</div>`;
          spentHtml += `<div style="padding:6px 0; ${border}">${f.spent.toLocaleString()}</div>`;
          remainHtml += `<div style="padding:6px 0; ${border} color:${f.remaining < 0 ? '#e74c3c' : '#27ae60'};">${f.remaining.toLocaleString()}</div>`;
        });
        
        sourceHtml += `<div style="padding:6px 0; border-top: 2px solid #bdc3c7; font-weight:bold; color:#2c3e50;">รวมสุทธิ</div>`;
        budgetHtml += `<div style="padding:6px 0; border-top: 2px solid #bdc3c7; font-weight:bold; color:#2c3e50;">${p.budget.toLocaleString()}</div>`;
        spentHtml += `<div style="padding:6px 0; border-top: 2px solid #bdc3c7; font-weight:bold; color:#e74c3c;">${p.spent.toLocaleString()}</div>`;
        remainHtml += `<div style="padding:6px 0; border-top: 2px solid #bdc3c7; font-weight:bold; color:${p.remaining < 0 ? '#e74c3c' : '#27ae60'};">${p.remaining.toLocaleString()}</div>`;
      
      } else {
        let singleSource = p.fundingDetails && p.fundingDetails.length === 1 ? p.fundingDetails[0].source : "ไม่ระบุ";
        if (singleSource === "-" || singleSource === "" || singleSource === "ไม่ระบุแหล่งงบ") singleSource = "ไม่ระบุ";
        
        sourceHtml = `<span style="background:#8e44ad; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">${singleSource}</span>`;
        budgetHtml = p.budget.toLocaleString();
        spentHtml = p.spent.toLocaleString();
        remainHtml = p.remaining.toLocaleString();
      }

      html += `
        <tr style="border-bottom: 1px solid #ecf0f1; vertical-align: top;">
          <td style="padding: 15px;">
            <div style="font-weight:bold; color:#2c3e50; font-size:1rem;">${p.id}</div>
            <div style="color:#34495e; font-size:0.85rem; margin-top:3px;">${p.name}</div>
          </td>
          <td style="padding: 15px;">${sourceHtml}</td>
          <td style="padding: 15px; color:#555;">${p.owner}</td>
          <td style="padding: 15px; text-align:right; color:#2c3e50; font-weight:bold;">${budgetHtml}</td>
          <td style="padding: 15px; text-align:right; color:#e74c3c; font-weight:bold;">${spentHtml}</td>
          <td style="padding: 15px; text-align:right; font-weight:bold;">${remainHtml}</td>
          <td style="padding: 15px; text-align:center;"><span style="background:${statusColor}; color:white; padding:4px 10px; border-radius:12px; font-size:0.75rem; white-space: nowrap;">${p.status}</span></td>
          <td style="padding: 15px; text-align:center;"><span style="background:${execColor}; color:white; padding:4px 10px; border-radius:12px; font-size:0.75rem; white-space: nowrap;">${finalExecStatus}</span></td>
          <td style="padding: 15px; text-align:center;"><span style="background:${reportColor}; color:white; padding:4px 10px; border-radius:12px; font-size:0.75rem; white-space: nowrap;">${finalReportStatus}</span></td>
          <td style="padding: 15px; text-align:center;">${fileBtn}</td>
          <td style="padding: 15px; text-align:center;">${reportBtn}</td>
        </tr>
      `;
    }
  });

  if (countTotal === 0) {
    html = `<tr><td colspan="11" style="text-align:center; padding:30px; color:#e74c3c;">ไม่พบข้อมูลโครงการที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
  }

  tbody.innerHTML = html;

  if (document.getElementById('all-dash-total')) document.getElementById('all-dash-total').innerText = countTotal.toLocaleString();
  if (document.getElementById('all-dash-approved')) document.getElementById('all-dash-approved').innerText = countApproved.toLocaleString();
  if (document.getElementById('all-dash-exec-done')) document.getElementById('all-dash-exec-done').innerText = countExecDone.toLocaleString();
  if (document.getElementById('all-dash-report-done')) document.getElementById('all-dash-report-done').innerText = countReportDone.toLocaleString();
}
// ==========================================
// 🌟 ฟังก์ชัน Export รายงาน (อัปเกรด: 2 แท็บ + แผนการใช้จ่าย)
// ==========================================
function exportAllProjectsExcel() {
    if (!currentFilteredProjects || currentFilteredProjects.length === 0) {
        Swal.fire('ไม่มีข้อมูล', 'ไม่มีข้อมูลที่จะส่งออกครับ', 'warning'); 
        return;
    }

    Swal.fire({
        title: 'กำลังสร้างไฟล์ Excel...',
        text: 'รอสักครู่ ระบบกำลังจัดเตรียมรายงาน 2 แท็บ...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        customClass: { container: 'kanit-font' }
    });

    const ensureXLSXStyleLoaded = (callback) => {
        if (window.isXlsxStyleLoaded === true) {
            callback();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => { window.isXlsxStyleLoaded = true; callback(); };
            script.onerror = () => { Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดระบบสร้าง Excel ได้', 'error'); };
            document.head.appendChild(script);
        }
    };

    ensureXLSXStyleLoaded(() => {
      try {
        const wb = XLSX.utils.book_new();
        const fontName = "TH Sarabun New";
        const borderThin = { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } };

        // ===============================================
        // 🌟 แท็บ 1: รายงานสรุปโครงการระดับแผนงาน (บทสรุปผู้บริหาร) 🌟
        // ===============================================
        const sTitle = { font: { name: fontName, sz: 18, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
        const sDate = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "left", vertical: "center" } };
        const sHead1 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sHead2 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "27AE60" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sLeft = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "left", vertical: "top", wrapText: true }, border: borderThin };
        const sCenter = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "center", vertical: "top", wrapText: true }, border: borderThin };
        const sMoney = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "right", vertical: "top" }, numFmt: "#,##0.00", border: borderThin };
        const sProb = { font: { name: fontName, sz: 14, color: { rgb: "C0392B" } }, alignment: { horizontal: "left", vertical: "top", wrapText: true }, border: borderThin };
        const sSugg = { font: { name: fontName, sz: 14, color: { rgb: "2980B9" } }, alignment: { horizontal: "left", vertical: "top", wrapText: true }, border: borderThin };

        let rows1 = [];
        rows1.push([{ v: "รายงานสรุปโครงการ และผลการดำเนินงานระดับแผนงาน", s: sTitle }, ...Array(16).fill("")]);
        rows1.push([{ v: `ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}`, s: sDate }, ...Array(16).fill("")]);
        rows1.push(Array(17).fill(""));

        let headers1 = ["ยุทธศาสตร์/แผนงาน (SF)", "โครงการหลัก (MP)", "รหัสกิจกรรม", "ชื่อโครงการ/กิจกรรม", "ผู้รับผิดชอบ", "แหล่งงบประมาณ", "งบตั้งต้น (บาท)", "เบิกจ่ายจริง (บาท)", "คงเหลือ (บาท)", "สถานะอนุมัติโครงการ", "สถานะการทำงาน", "สถานะการรายงาน", "ผลเชิงปริมาณ", "ผลเชิงคุณภาพ", "สรุปผลสัมฤทธิ์", "ปัญหาและอุปสรรค", "ข้อเสนอแนะ"];
        rows1.push(headers1.map((h, i) => ({ v: h, s: i >= 12 ? sHead2 : sHead1 })));

        let merges1 = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } } ];

        currentFilteredProjects.forEach(p => {
            let sfDisplay = (p.sfId && p.sfId !== "ไม่ได้ระบุ SF" && p.sfId !== "-") ? `[${p.sfId}] ${p.sfName}` : (p.sfId || "-");
            let mpDisplay = (p.mpId && p.mpId !== "ไม่ได้ระบุ MP" && p.mpId !== "-") ? `[${p.mpId}] ${p.mpName}` : (p.mpId || "-");

            rows1.push([
                {v: sfDisplay, s: sLeft}, {v: mpDisplay, s: sLeft}, {v: p.id, s: sCenter}, {v: p.name, s: sLeft},
                {v: p.owner, s: sLeft}, {v: p.source, s: sLeft}, {v: p.budget, t: 'n', s: sMoney},
                {v: p.spent, t: 'n', s: sMoney}, {v: p.remaining, t: 'n', s: sMoney}, {v: p.status, s: sCenter},
                {v: p.execStatus === '-' ? 'ยังไม่ระบุ' : p.execStatus, s: sCenter},
                {v: p.reportStatus === '-' ? 'ยังไม่รายงาน' : p.reportStatus, s: sCenter},
                {v: p.quan || "-", s: sLeft}, {v: p.qual || "-", s: sLeft}, {v: p.summ || "-", s: sLeft},
                {v: p.prob || "-", s: sProb}, {v: p.sugg || "-", s: sSugg}
            ]);
        });

        const ws1 = XLSX.utils.aoa_to_sheet(rows1);
        ws1['!merges'] = merges1;
        ws1['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, ws1, "บทสรุปผู้บริหาร");

        // ========================================================
        // 🌟 แท็บ 2: แผนการใช้จ่ายงบประมาณ (Cash Flow) 🌟
        // ========================================================
        const sCFHead = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "9B59B6" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sCFFooter = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
        const sCFFooterMoney = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0", border: borderThin };
        
        let pyStr = window.currentLoadedYear || new Date().getFullYear().toString().substring(2);
        let py = parseInt(pyStr, 10);
        let prevY = py - 1;
        
        let r4 = []; let m4 = [];
        r4.push([{ v: `แผนการใช้จ่ายงบประมาณ (เฉพาะโครงการพัฒนาคุณภาพการศึกษา) - ปีงบประมาณ 25${py}`, s: sTitle }, "", "", "", "", "", ""]);
        m4.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); r4.push([]);
        
        r4.push([
            { v: "ที่", s: sCFHead }, { v: "แหล่งงบประมาณ", s: sCFHead }, { v: "งบประมาณ\nที่ได้รับจัดสรร", s: sCFHead }, 
            { v: "แผนการใช้จ่ายงบประมาณ", s: sCFHead }, "", "", ""
        ]);
        m4.push({ s: { r: 2, c: 0 }, e: { r: 3, c: 0 } });
        m4.push({ s: { r: 2, c: 1 }, e: { r: 3, c: 1 } });
        m4.push({ s: { r: 2, c: 2 }, e: { r: 3, c: 2 } });
        m4.push({ s: { r: 2, c: 3 }, e: { r: 2, c: 6 } });
        
        r4.push([
            "", "", "", 
            { v: `ไตรมาส 1\n(ต.ค.-ธ.ค.${prevY})`, s: sCFHead }, { v: `ไตรมาส 2\n(ม.ค.-มี.ค.${py})`, s: sCFHead },
            { v: `ไตรมาส 3\n(เม.ย.-มิ.ย.${py})`, s: sCFHead }, { v: `ไตรมาส 4\n(ก.ค.-ก.ย.${py})`, s: sCFHead }
        ]);

        const fundsList = [
            { name: "อุดหนุนรายหัว", total: 0, q1: 0, q2: 0, q3: 0, q4: 0, kws: ["รายหัว"] },
            { name: "กิจกรรมพัฒนาผู้เรียน", total: 0, q1: 0, q2: 0, q3: 0, q4: 0, kws: ["พัฒนาผู้เรียน", "กิจกรรม"] },
            { name: "รายได้สถานศึกษา", total: 0, q1: 0, q2: 0, q3: 0, q4: 0, kws: ["รายได้"] },
            { name: `รายได้สถานศึกษา (ผ้าป่า 69)`, total: 0, q1: 0, q2: 0, q3: 0, q4: 0, kws: ["ผ้าป่า"] },
            { name: "ลูกเสือ", total: 0, q1: 0, q2: 0, q3: 0, q4: 0, kws: ["ลูกเสือ"] }
        ];

        currentFilteredProjects.forEach(p => {
            // 🌟 กรองเฉพาะโครงการพัฒนาคุณภาพ (K=1)
            let isK1 = p.projectType ? (!p.projectType.includes("บริหาร") && !p.projectType.includes("ประจำ") && !p.projectType.includes("ทั่วไป") && !p.projectType.includes("2")) : true;
            if (!isK1 || !p.status.includes("อนุมัติ") || p.status.includes("ไม่อนุมัติ")) return; 

            let qRaw = String(p.quarter || "1");
            let isAllYear = (qRaw.includes("5") || qRaw.includes("ตลอด") || qRaw.includes("ทั้งปี"));
            let qNum = parseInt(qRaw) || 1;
            
            if (p.fundingDetails && p.fundingDetails.length > 0) {
                p.fundingDetails.forEach(f => {
                    let sName = String(f.source || "").trim();
                    let amt = Number(f.budget) || 0;
                    if (amt <= 0) return;

                    let matchedFund = fundsList.find(fd => fd.kws.some(kw => sName.includes(kw)));
                    if (!matchedFund) matchedFund = fundsList[2]; // เข้ากองรายได้ถ้าหาไม่เจอ

                    matchedFund.total += amt;
                    if (isAllYear) {
                        let split = amt / 4;
                        matchedFund.q1 += split; matchedFund.q2 += split; matchedFund.q3 += split; matchedFund.q4 += split;
                    } else {
                        if(qNum===1) matchedFund.q1+=amt; else if(qNum===2) matchedFund.q2+=amt; else if(qNum===3) matchedFund.q3+=amt; else matchedFund.q4+=amt;
                    }
                });
            }
        });

        fundsList.forEach((f, idx) => {
            r4.push([
                { v: idx + 1, t: 'n', s: sCenter }, { v: f.name, s: sLeft }, { v: f.total, t: 'n', s: { ...sMoney, numFmt: "#,##0" } },
                { v: f.q1, t: 'n', s: { ...sMoney, numFmt: "#,##0" } }, { v: f.q2, t: 'n', s: { ...sMoney, numFmt: "#,##0" } },
                { v: f.q3, t: 'n', s: { ...sMoney, numFmt: "#,##0" } }, { v: f.q4, t: 'n', s: { ...sMoney, numFmt: "#,##0" } }
            ]);
        });

        let sumTotal = fundsList.reduce((acc, f) => acc + f.total, 0);
        let sumQ1 = fundsList.reduce((acc, f) => acc + f.q1, 0);
        let sumQ2 = fundsList.reduce((acc, f) => acc + f.q2, 0);
        let sumQ3 = fundsList.reduce((acc, f) => acc + f.q3, 0);
        let sumQ4 = fundsList.reduce((acc, f) => acc + f.q4, 0);

        r4.push([
            { v: "รวม", s: sCFFooter }, "", { v: sumTotal, t: 'n', s: sCFFooterMoney },
            { v: sumQ1, t: 'n', s: sCFFooterMoney }, { v: sumQ2, t: 'n', s: sCFFooterMoney },
            { v: sumQ3, t: 'n', s: sCFFooterMoney }, { v: sumQ4, t: 'n', s: sCFFooterMoney }
        ]);
        m4.push({ s: { r: r4.length - 1, c: 0 }, e: { r: r4.length - 1, c: 1 } });

        r4.push([
            { v: "ร้อยละ", s: sCFFooter }, "", { v: 100, t: 'n', s: sCFFooter },
            { v: sumTotal>0 ? Math.round((sumQ1/sumTotal)*100) : 0, t: 'n', s: sCFFooter },
            { v: sumTotal>0 ? Math.round((sumQ2/sumTotal)*100) : 0, t: 'n', s: sCFFooter },
            { v: sumTotal>0 ? Math.round((sumQ3/sumTotal)*100) : 0, t: 'n', s: sCFFooter },
            { v: sumTotal>0 ? Math.round((sumQ4/sumTotal)*100) : 0, t: 'n', s: sCFFooter }
        ]);
        m4.push({ s: { r: r4.length - 1, c: 0 }, e: { r: r4.length - 1, c: 1 } });

        const ws4 = XLSX.utils.aoa_to_sheet(r4);
        ws4['!merges'] = m4; 
        ws4['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws4, "แผนการใช้จ่ายงบประมาณ");

        // 🌟 ดาวน์โหลดไฟล์ Excel ออกมา! 🌟
        XLSX.writeFile(wb, `รายงานบทสรุปผู้บริหาร_ปี25${py}_${new Date().getTime()}.xlsx`);
        Swal.close();

      } catch (err) {
        Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
      }
    });
}

  function submitForScreening(projectId, encodedProjectName) {
    // 🌟 ถอดรหัสชื่อโครงการ (ถ้าไม่ได้ส่งมา ให้แสดงรหัสโครงการแทนเพื่อกันพัง)
    let projectName = projectId;
    if (encodedProjectName) {
        projectName = decodeURIComponent(encodedProjectName);
    }

    // 🌟 เปลี่ยนจาก confirm() เดิม มาใช้ SweetAlert2
    Swal.fire({
      title: 'ยืนยันการส่งขออนุมัติ?',
      text: `คุณต้องการส่งโครงการ "${projectName}" เพื่อขออนุมัติหลักการ ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3498db',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ใช่, ส่งขออนุมัติเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: {
          container: 'kanit-font'
      }
    }).then((result) => {
      // 🌟 ถ้ากด "ใช่" (isConfirmed) ค่อยให้ระบบทำงาน
      if (result.isConfirmed) {
        const loader = document.createElement('div');
        loader.id = 'send-loader';
        loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:#3498db; margin-bottom:15px;"></i><h3 style="font-family:\'Kanit\'; color:#333;">กำลังส่งโครงการ...</h3>';
        document.body.appendChild(loader);

        google.script.run
          .withSuccessHandler(function(response) {
            document.body.removeChild(loader); 
            alert("สำเร็จ! " + response.message);
            loadMyProjects(); 
            if(typeof loadDashboardStats === 'function') loadDashboardStats();
          })
          .withFailureHandler(function(error) { 
            document.body.removeChild(loader); 
            alert("เกิดข้อผิดพลาด: " + error.message); 
          })
          .sendProjectForScreening(projectId);
      }
    });
  }

  // ==========================================
  // 5. ระบบพิจารณาโครงการ (Admin, A1, A2, A3)
  // ==========================================
  function loadPendingApprovals() {
    const tbody = document.getElementById('approve-projects-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#9b59b6;"></i></td></tr>';
    google.script.run
      .withSuccessHandler(function(projects) {
        if(projects.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีโครงการรออนุมัติหลักการ</td></tr>`; return; }
        let html = '';
        projects.forEach(p => {
          let btnDoc = p.url ? `<a href="${p.url}" target="_blank" style="background: #f4f6f8; color: #2980b9; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; display: inline-block; white-space: nowrap; border: 1px solid #d9e2ec; transition: 0.2s;"><i class="fas fa-external-link-alt"></i> เปิดดู</a>` : '-';
          let budgetDisplay = p.budget ? Number(p.budget).toLocaleString() + ' บาท' : '<span style="color:#95a5a6; font-size:0.85em;">รอแอดมินจัดสรร</span>';
          let sourceDisplay = p.source ? `<br><small style="color:#666;">(${p.source})</small>` : '';

          let encodedHistory = encodeURIComponent(p.history);
          let historyBtn = p.history ? `<button onclick="showProjectComment('${p.id}', '${encodedHistory}')" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;" title="ดูประวัติการแก้ไข"><i class="fas fa-history"></i></button>` : '';

          let actionBtn = '';
          let badgePrefix = '';
          
          if (p.type === 'report') {
             // 🌟 ถ้าเป็นรายงาน (Report)
             badgePrefix = `<span style="background:#e67e22; color:white; padding:3px 8px; border-radius:12px; font-size:0.75rem; margin-right:5px;"><i class="fas fa-file-signature"></i> รายงาน</span>`;
             
             // 🎯 ผูกปุ่มเข้ากับฟังก์ชันเปิด Modal ตรวจรายงานผล (ที่เราเพิ่งสร้าง)
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openReportReviewModal('${p.id}')" style="background: #e67e22; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-search"></i> ตรวจรายงาน</button>
                           </div>`;
          } else {
             // 🌟 ถ้าเป็นโครงการ (Project)
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openScreeningModal('${p.id}')" style="background: #9b59b6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-edit"></i> บันทึกผล</button>
                           </div>`;
          }

          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #9b59b6;">${p.id}</td>
                    <td style="padding: 12px;">${badgePrefix}${p.name}</td>
                    <td style="padding: 12px;">${p.owner}</td>
                    <td style="padding: 12px;">${budgetDisplay} ${sourceDisplay}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; })
      .getPendingScreeningProjects();
  }
// ==========================================
// 🌟 ดิกชันนารีรหัสแหล่งเงิน 1-5 (ปรับแก้ชื่อเต็มตรงนี้ได้ตลอดเวลา)
// ==========================================
const FUNDING_CODE_MAP = {
  "1": "รายหัว",
  "2": "พัฒนาผู้เรียน",
  "3": "รายได้",
  "4": "รายได้ (ผ้าป่า69ฯ)",
  "5": "ลูกเสือ"
};

// ฟังก์ชันแปลรหัส 1-5 เป็นชื่อแหล่งเงินเต็ม (รองรับทั้งกองเดียวและหลายกอง เช่น 1=5000, 2=3000)
function parseFundingSourceCode(rawInput) {
  if (!rawInput) return "";
  let str = String(rawInput).trim();

  // กรณีที่ 1: พิมพ์แค่ตัวเลขเดี่ยวๆ เช่น "1" หรือ "4"
  if (FUNDING_CODE_MAP[str]) {
    return FUNDING_CODE_MAP[str];
  }

  // กรณีที่ 2: พิมพ์หลายกองแบบมีจำนวนเงิน เช่น "1=5000, 2=3000" หรือ "5=10000+2=5000"
  if (str.includes('=')) {
    let parts = str.split(/[,+]/);
    let translated = parts.map(p => {
      let sp = p.split('=');
      if (sp.length === 2) {
        let codeOrName = sp[0].trim();
        let amt = sp[1].replace(/,/g, '').trim();
        let fullName = FUNDING_CODE_MAP[codeOrName] || codeOrName;
        return `${fullName}=${amt}`;
      }
      return p.trim();
    });
    return translated.join(', ');
  }

  // กรณีที่ 3: พิมพ์รหัสหลายตัวแต่ไม่ได้ระบุแยกยอดเงิน เช่น "1, 2"
  if (/^[1-5](\s*[,+]\s*[1-5])+$/.test(str)) {
    return str.split(/[,+]/).map(c => FUNDING_CODE_MAP[c.trim()] || c.trim()).join(', ');
  }

  // ถ้าพิมพ์เป็นชื่อเต็มมาอยู่แล้ว ก็ส่งค่าเดิมกลับไป
  return str;
}



// ==========================================
// 🌟 ฟังก์ชันสร้างไฟล์ Excel ตารางตัดงบ + ชีต Livestream Dashboard คำนวณสด
// ==========================================
function exportScreeningData() {
    Swal.fire({
        title: 'กำลังดึงข้อมูลโครงการ...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        customClass: { container: 'kanit-font' }
    });

    const ensureXLSXStyleLoaded = (callback) => {
        if (window.isXlsxStyleLoaded === true) {
            callback();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => { window.isXlsxStyleLoaded = true; callback(); };
            document.head.appendChild(script);
        }
    };

    const activeYear = typeof getDefaultYear === 'function' ? getDefaultYear() : "70";

    google.script.run
      .withSuccessHandler(function(data) {
          Swal.close();
          if(!data || data.length === 0) {
              Swal.fire('ไม่มีข้อมูล', 'ไม่มีโครงการที่รออนุมัติหลักการครับ', 'info'); return;
          }

          // 🌟 1. ดึงความจำเดิมจากเบราว์เซอร์ (ถ้าเคยเซฟไว้) แยกตามปีงบประมาณ
          let savedCampIds = [];
          try {
              savedCampIds = JSON.parse(localStorage.getItem(`campProjects_${activeYear}`) || "[]");
          } catch(e) {}

          // สร้าง Checklist โครงการทั้งหมดให้แอดมินเลือก
          let checkboxHtml = '<div style="text-align:left; max-height:250px; overflow-y:auto; background:#f4f6f8; padding:10px; border-radius:6px; border:1px solid #bdc3c7;">';
          data.forEach(p => {
             // 🌟 2. เช็คว่ารหัสนี้เคยถูกเซฟไว้หรือไม่ ถ้าใช่ให้ใส่คำว่า 'checked' รอไว้เลย
             let isChecked = savedCampIds.includes(p.id) ? "checked" : "";
             
             checkboxHtml += `<label style="display:block; margin-bottom:8px; cursor:pointer; font-size:0.95rem;">
                                <input type="checkbox" class="swal-camp-cb" value="${p.id}" ${isChecked} style="transform: scale(1.2); margin-right:8px; cursor:pointer;"> 
                                <span style="color:#8e44ad; font-weight:bold;">[${p.id}]</span> ${p.name}
                              </label>`;
          });
          checkboxHtml += '</div>';

          // Pop-up ถามว่าโครงการไหนเป็นค่าย/วิชาการ
          Swal.fire({
              title: 'ระบุโครงการค่าย / งานวิชาการ',
              html: '<div style="font-size:0.95rem; color:#d35400; margin-bottom:10px;">โปรดติ๊กเลือกโครงการที่เป็นค่ายหรือวิชาการ (ใช้เงินกิจกรรมพัฒนาผู้เรียน)<br>ระบบจะแยกโครงการเหล่านี้ไปไว้ในแท็บใหม่ให้โดยอัตโนมัติ<br><span style="color:#27ae60; font-weight:bold; font-size:0.85rem;"><i class="fas fa-save"></i> ระบบจะจดจำการเลือกของคุณไว้สำหรับการ Export ครั้งถัดไป</span></div>' + checkboxHtml,
              showCancelButton: true,
              confirmButtonText: 'ดำเนินการสร้าง Excel',
              cancelButtonText: 'ยกเลิก',
              confirmButtonColor: '#27ae60',
              customClass: { container: 'kanit-font' },
              preConfirm: () => {
                  return Array.from(document.querySelectorAll('.swal-camp-cb:checked')).map(cb => cb.value);
              }
          }).then(result => {
              if (result.isConfirmed) {
                  let campIds = result.value || [];
                  
                  // 🌟 3. บันทึกการเลือกล่าสุดลงในความจำเบราว์เซอร์
                  localStorage.setItem(`campProjects_${activeYear}`, JSON.stringify(campIds));

                  // แปะป้ายบอกว่าโครงการไหนเป็นค่าย
                  data.forEach(p => { p.isCamp = campIds.includes(p.id); });

                  Swal.fire({
                      title: 'กำลังสร้างไฟล์ Excel...',
                      text: 'ระบบกำลังดึงข้อมูลเงินงบกลางและจัดเรียงแท็บ...',
                      allowOutsideClick: false,
                      didOpen: () => Swal.showLoading(),
                      customClass: { container: 'kanit-font' }
                  });

                  google.script.run
                    .withSuccessHandler(function(centralRes) {
                        ensureXLSXStyleLoaded(() => {
                            Swal.close();
                            buildAndDownloadScreeningWorkbook(data, centralRes, activeYear);
                        });
                    })
                    .withFailureHandler(function() {
                        ensureXLSXStyleLoaded(() => {
                            Swal.close();
                            buildAndDownloadScreeningWorkbook(data, { summary: [] }, activeYear);
                        });
                    })
                    .getCentralBudgetDashboard(activeYear);
              }
          });
      })
      .withFailureHandler(function(err) {
          Swal.close();
          Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      })
      .extractDataForBudgetScreening();
}

function buildAndDownloadScreeningWorkbook(data, centralRes, activeYear) {
    data.sort((a, b) => String(a.id || "").localeCompare(String(b.id || ""), undefined, { numeric: true }));

    let secMap = {};
    if (typeof globalConfigData !== 'undefined' && globalConfigData) {
        (globalConfigData.sections || []).forEach(s => {
            let pCode = String(s.parentCode).padStart(2, '0');
            let sCode = String(s.code).padStart(2, '0');
            secMap[`${pCode}-${sCode}`] = s.name;
        });
    }

    let urlMap = {}; let typeMap = {};
    if (typeof globalAllProjectsData !== 'undefined' && Array.isArray(globalAllProjectsData)) {
        globalAllProjectsData.forEach(p => {
            if (p.id && p.url) urlMap[p.id] = p.url;
            if (p.id && p.type) typeMap[p.id] = p.type;
        });
    }

    const fundList = [
        { code: "1", name: "รายหัว", col: "N", initBudget: 0 },
        { code: "2", name: "พัฒนาผู้เรียน", col: "O", initBudget: 0 },
        { code: "3", name: "รายได้", col: "P", initBudget: 0 },
        { code: "4", name: "รายได้ (ผ้าป่า69ฯ)", col: "Q", initBudget: 0 },
        { code: "5", name: "ลูกเสือ", col: "R", initBudget: 0 }
    ];
    if (centralRes && Array.isArray(centralRes.summary)) {
        centralRes.summary.forEach(s => {
            let srcName = String(s.source || "").trim();
            fundList.forEach(f => {
                if (srcName === f.name || (f.code === "1" && srcName.includes("รายหัว")) || (f.code === "2" && srcName.includes("พัฒนาผู้เรียน")) || (f.code === "4" && srcName.includes("ผ้าป่า")) || (f.code === "5" && srcName.includes("ลูกเสือ")) || (f.code === "3" && srcName === "เงินรายได้สถานศึกษา")) {
                    f.initBudget = Number(s.total) || 0;
                }
            });
        });
    }

    let docRefNum = 1;
    let attachmentsData = [];
    let normalProjects = [];
    let campProjects = [];

    data.forEach(p => {
        let parts = String(p.id || "").split('-');
        p._deptCode = parts.length >= 2 ? parts[1].padStart(2, '0') : "อื่นๆ";
        p._secCode = parts.length >= 3 ? parts[2].padStart(2, '0') : "00";
        
        let totalItemsCharLength = 0;
        if (p.items && p.items.length > 0) {
            p.items.forEach(it => { totalItemsCharLength += String(it.name || "").length; });
        }

        if (p.items && (p.items.length > 10 || totalItemsCharLength > 200)) {
            p._hasAttachment = true;
            p._docRefNum = docRefNum;
            attachmentsData.push({ docNum: docRefNum, project: p });
            docRefNum++;
        } else {
            p._hasAttachment = false;
        }

        if (p.isCamp) campProjects.push(p);
        else normalProjects.push(p);
    });

    const wb = XLSX.utils.book_new();

    const fontName = "TH Sarabun New";
    const borderThin = { top: { style: "thin", color: { rgb: "BDC3C7" } }, bottom: { style: "thin", color: { rgb: "BDC3C7" } }, left: { style: "thin", color: { rgb: "BDC3C7" } }, right: { style: "thin", color: { rgb: "BDC3C7" } } };
    const borderThick = { top: { style: "medium", color: { rgb: "2C3E50" } }, bottom: { style: "medium", color: { rgb: "2C3E50" } }, left: { style: "thin", color: { rgb: "BDC3C7" } }, right: { style: "thin", color: { rgb: "BDC3C7" } } };
    
    const styleTitle = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "2C3E50" } }, alignment: { vertical: "center" } };
    const styleHeaderRead = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "34495E" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
    const styleHeaderInput = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "27AE60" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
    const styleHeaderAuto = { font: { name: fontName, sz: 12, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7F8C8D" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
    const styleSecBanner = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "1F618D" } }, fill: { fgColor: { rgb: "D4E6F1" } }, alignment: { vertical: "center" }, border: borderThin };
    const styleSecCampBanner = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "8E44AD" } }, fill: { fgColor: { rgb: "F5EEF8" } }, alignment: { vertical: "center" }, border: borderThin };
    const styleCellText = { font: { name: fontName, sz: 12 }, alignment: { vertical: "top", horizontal: "left", wrapText: true }, border: borderThin };
    const styleCellCenter = { font: { name: fontName, sz: 12, bold: true }, alignment: { horizontal: "center", vertical: "top", wrapText: true }, border: borderThin };
    const styleCellMoney = { font: { name: fontName, sz: 12, bold: true, color: { rgb: "D35400" } }, alignment: { horizontal: "right", vertical: "top" }, numFmt: "#,##0.00", border: borderThin };
    const styleInputMoney = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "1E8449" } }, fill: { fgColor: { rgb: "EAFAF1" } }, alignment: { horizontal: "right", vertical: "top" }, numFmt: "#,##0.00", border: borderThin };
    const styleInputCenter = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "2C3E50" } }, fill: { fgColor: { rgb: "FEF9E7" } }, alignment: { horizontal: "center", vertical: "top", wrapText: true }, border: borderThin };
    const styleInputType = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "8E44AD" } }, fill: { fgColor: { rgb: "F5EEF8" } }, alignment: { horizontal: "center", vertical: "top", wrapText: true }, border: borderThin };
    const styleInputNote = { font: { name: fontName, sz: 12, color: { rgb: "C0392B" } }, fill: { fgColor: { rgb: "FDEDEC" } }, alignment: { vertical: "top", wrapText: true }, border: borderThin };
    const styleAutoSplitMoney = { font: { name: fontName, sz: 11, color: { rgb: "555555" } }, fill: { fgColor: { rgb: "F8F9F9" } }, alignment: { horizontal: "right", vertical: "top" }, numFmt: "#,##0.00;\"-\";\"-\"", border: borderThin };
    const styleFooterTotal = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThin };

    const countWrappedLines = (text, colCharLimit) => {
        if (!text) return 1;
        let lines = String(text).split(/\r?\n/);
        let totalLines = 0;
        lines.forEach(line => { totalLines += (Math.ceil(line.length / colCharLimit) || 1); });
        return totalLines;
    };

    const makeFundSplitFormula = (rowNum, codeNum) => {
        return `IF(TRIM(K${rowNum})="${codeNum}", IF(J${rowNum}="",0,J${rowNum}), IF(ISNUMBER(SEARCH("${codeNum}=", K${rowNum})), VALUE(TRIM(LEFT(SUBSTITUTE(MID(K${rowNum}&",", SEARCH("${codeNum}=", K${rowNum})+2, 20), ",", REPT(" ", 20)), 20))), 0))`;
    };

    const buildStyledSheet = (sheetTitle, projectsList, isCampSheet) => {
        let rows = []; let merges = []; let rowHeights = [];
        
        rows.push([{ v: sheetTitle, s: styleTitle }, ...new Array(20).fill("")]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 20 } });
        rowHeights.push({ hpt: 28 });

        rows.push([{ v: "ข้อมูลจำแนกตามรหัสโครงการและหน่วยงาน", s: styleCellText }, ...new Array(20).fill("")]);
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 20 } });
        rowHeights.push({ hpt: 20 });

        const baseHeaders = [
            "ลำดับ", "รหัสโครงการ", "ชื่อโครงการ", "ผู้รับผิดชอบ", "ยอดขออนุมัติ (บาท)",
            "วัตถุประสงค์", "เป้าหมาย (ปริมาณ)", "เป้าหมาย (คุณภาพ)", "รายละเอียดการใช้งบ",
            "อนุมัติงบ (บาท)", "รหัสแหล่งเงิน (1-5)", "ประเภทงบ\n(1=พัฒนา, 2=ประจำ)", "ข้อเสนอแนะแอดมิน (กรอกเมื่อตีกลับ)",
            "แยกงบอัตโนมัติ:\n1.รายหัว", "แยกงบอัตโนมัติ:\n2.พัฒนาผู้เรียน", "แยกงบอัตโนมัติ:\n3.รายได้",
            "แยกงบอัตโนมัติ:\n4.ผ้าป่า", "แยกงบอัตโนมัติ:\n5.ลูกเสือ", "รหัสกลุ่มงาน\n(ห้ามลบ)", "สถานะจัดสรร\n(Auto)", "ไตรมาส\n(Auto)" // 🌟 เพิ่มคอลัมน์ U
        ];
        
        let headerRow = baseHeaders.map((h, idx) => {
            if (idx >= 13) return { v: h, s: styleHeaderAuto };
            if (idx >= 9) return { v: h, s: styleHeaderInput };
            return { v: h, s: styleHeaderRead };
        });

        rows.push(headerRow);
        rowHeights.push({ hpt: 36 });

        let currentSec = null;
        let dataRowIndices = [];
        let bannerStyle = isCampSheet ? styleSecCampBanner : styleSecBanner;
        let runningNumber = 1;

        if (projectsList.length === 0) {
            let excelRowNum = rows.length + 1;
            rows.push([
                { v: "", s: styleCellCenter }, { v: "-", s: styleCellCenter }, { v: "ไม่มีโครงการในหมวดหมู่นี้", s: styleCellText }, 
                { v: "", s: styleCellText }, { v: 0, t: 'n', s: styleCellMoney }, { v: "", s: styleCellText }, 
                { v: "", s: styleCellText }, { v: "", s: styleCellText }, { v: "", s: styleCellText }, 
                { v: "", s: styleInputMoney }, { v: "", t: 's', s: styleInputCenter }, { v: "", t: 's', s: styleInputType }, { v: "", t: 's', s: styleInputNote },
                { f: makeFundSplitFormula(excelRowNum, "1"), t: 'n', s: styleAutoSplitMoney }, { f: makeFundSplitFormula(excelRowNum, "2"), t: 'n', s: styleAutoSplitMoney }, 
                { f: makeFundSplitFormula(excelRowNum, "3"), t: 'n', s: styleAutoSplitMoney }, { f: makeFundSplitFormula(excelRowNum, "4"), t: 'n', s: styleAutoSplitMoney }, 
                { f: makeFundSplitFormula(excelRowNum, "5"), t: 'n', s: styleAutoSplitMoney }, { v: "", t: 's', s: styleCellCenter }, { v: "รอจัดสรร", t: 's', s: styleCellCenter }, { v: "1", t: 's', s: styleCellCenter }
            ]);
            rowHeights.push({ hpt: 30 });
            dataRowIndices.push(excelRowNum);
        } else {
            projectsList.forEach(p => {
                if (p._secCode !== currentSec) {
                    currentSec = p._secCode;
                    let secName = secMap[`${p._deptCode}-${currentSec}`] || `งาน/กลุ่มสาระฯ รหัส ${p._deptCode}-${currentSec}`;
                    let bannerRowIdx = rows.length;
                    let bannerArr = [];
                    for (let c = 0; c <= 20; c++) bannerArr.push({ v: c === 0 ? `📌 [รหัสงาน ${p._deptCode}-${currentSec}] ${secName}` : "", s: bannerStyle });
                    rows.push(bannerArr);
                    merges.push({ s: { r: bannerRowIdx, c: 0 }, e: { r: bannerRowIdx, c: 20 } });
                    rowHeights.push({ hpt: 26 });
                }

                let reqAmt = Number(String(p.requestedBudget || "0").replace(/,/g, '')) || 0;
                
                let itemsStr = "";
                if (p._hasAttachment) {
                    itemsStr = `📌 ดูรายการเบิกจ่ายที่เอกสารประกอบรายการที่ ${p._docRefNum}`;
                } else {
                    itemsStr = (p.items || []).map(it => {
                        let cleanAmt = Number(String(it.amount).replace(/[^\d.]/g, '')) || 0;
                        return `• ${it.name} (${cleanAmt.toLocaleString()} บ.)`;
                    }).join('\r\n') || "-";
                }

                let objStr = String(p.objective || "-").replace(/\n/g, '\r\n');
                let quanStr = String(p.quanGoal || "-").replace(/\n/g, '\r\n');
                let qualStr = String(p.qualGoal || "-").replace(/\n/g, '\r\n');

                let docUrl = p.docUrl || urlMap[p.id] || "";
                let nameCell = { v: p.name || "-", s: styleCellText };
                if (docUrl && docUrl.startsWith("http")) {
                    nameCell.l = { Target: docUrl, Tooltip: "เปิดไฟล์โครงการ" };
                    nameCell.s = { font: { name: fontName, sz: 12, bold: true, color: { rgb: "2980B9" }, underline: true }, alignment: { vertical: "top", horizontal: "left", wrapText: true }, border: borderThin };
                }

                let savedType = String(p.projectType || typeMap[p.id] || "");
                let defaultTypeCode = (savedType.includes("บริหาร") || savedType.includes("ประจำ") || savedType.includes("ทั่วไป")) ? "2" : "1";
                if (isCampSheet) defaultTypeCode = "1";

                // 🌟 ประมวลผลเลขไตรมาส (เปลี่ยนข้อความให้เป็นเลข 1, 2, 3, 4, 5)
                let rawQ = String(p.quarter || "1");
                let qNum = "1";
                if (rawQ.includes("5") || rawQ.includes("ตลอด") || rawQ.includes("ทั้งปี")) qNum = "5";
                else if (rawQ.includes("4")) qNum = "4";
                else if (rawQ.includes("3")) qNum = "3";
                else if (rawQ.includes("2")) qNum = "2";

                let excelRowNum = rows.length + 1;
                dataRowIndices.push(excelRowNum);

                let rowCells = [
                    { v: runningNumber++, t: 'n', s: styleCellCenter }, 
                    { v: p.id, s: styleCellCenter }, 
                    nameCell, 
                    { v: p.owner || "-", s: styleCellText }, 
                    { v: reqAmt, t: 'n', s: styleCellMoney }, 
                    { v: objStr, s: styleCellText }, 
                    { v: quanStr, s: styleCellText }, 
                    { v: qualStr, s: styleCellText }, 
                    { v: itemsStr, s: styleCellText }, 
                    { v: "", s: styleInputMoney }, 
                    { v: isCampSheet ? "2" : "", t: 's', s: styleInputCenter }, 
                    { v: defaultTypeCode, t: 's', s: styleInputType }, 
                    { v: "", t: 's', s: styleInputNote },
                    { f: makeFundSplitFormula(excelRowNum, "1"), t: 'n', s: styleAutoSplitMoney }, 
                    { f: makeFundSplitFormula(excelRowNum, "2"), t: 'n', s: styleAutoSplitMoney }, 
                    { f: makeFundSplitFormula(excelRowNum, "3"), t: 'n', s: styleAutoSplitMoney }, 
                    { f: makeFundSplitFormula(excelRowNum, "4"), t: 'n', s: styleAutoSplitMoney }, 
                    { f: makeFundSplitFormula(excelRowNum, "5"), t: 'n', s: styleAutoSplitMoney }, 
                    { v: p._deptCode, t: 's', s: styleCellCenter }, 
                    { f: `IF(OR(TRIM(K${excelRowNum})<>"", TRIM(M${excelRowNum})<>""), "จัดสรรแล้ว", "รอจัดสรร")`, t: 's', s: styleCellCenter },
                    { v: qNum, t: 's', s: styleCellCenter } // 🌟 ใส่ไตรมาส (คอลัมน์ U)
                ];

                rows.push(rowCells);

                let maxLines = Math.max(countWrappedLines(p.name, 28), countWrappedLines(objStr, 35), countWrappedLines(quanStr, 30), countWrappedLines(qualStr, 30), countWrappedLines(itemsStr, 35));
                rowHeights.push({ hpt: Math.min(280, Math.max(32, maxLines * 18 + 10)) });
            });
        }

        let firstR = dataRowIndices[0]; let lastR = dataRowIndices[dataRowIndices.length - 1];
        let sumRowIdx = rows.length + 1;
        let sumRow = [
            { v: `รวม (${projectsList.length} โครงการ)`, s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal },
            { f: `SUM(E${firstR}:E${lastR})`, t: 'n', s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "ยอดอนุมัติรวม 👉", s: styleFooterTotal },
            { f: `SUM(J${firstR}:J${lastR})`, t: 'n', s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal },
            { f: `SUM(N${firstR}:N${lastR})`, t: 'n', s: styleFooterTotal }, { f: `SUM(O${firstR}:O${lastR})`, t: 'n', s: styleFooterTotal }, { f: `SUM(P${firstR}:P${lastR})`, t: 'n', s: styleFooterTotal }, { f: `SUM(Q${firstR}:Q${lastR})`, t: 'n', s: styleFooterTotal }, { f: `SUM(R${firstR}:R${lastR})`, t: 'n', s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }, { v: "", s: styleFooterTotal }
        ];
        
        rows.push(sumRow);
        merges.push({ s: { r: sumRowIdx - 1, c: 0 }, e: { r: sumRowIdx - 1, c: 3 } });
        rowHeights.push({ hpt: 28 });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!merges'] = merges; ws['!rows'] = rowHeights;
        ws['!cols'] = [
            { wch: 6 }, { wch: 14 }, { wch: 32 }, { wch: 20 }, { wch: 15 }, { wch: 42 }, { wch: 35 }, { wch: 35 }, { wch: 42 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 28 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 10 }
        ];
        ws['!views'] = [{ state: 'frozen', xSplit: 3, ySplit: 3 }];
        
        ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, footer: '&Cหน้า &P จาก &N' };
        ws['!margins'] = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
        
        return ws;
    };

    const buildInstructionSheet = () => {
        let rows = [];
        const sTitle = { font: { name: fontName, sz: 20, bold: true, color: { rgb: "2C3E50" } }, alignment: { vertical: "center" } };
        const sHead = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "34495E" } }, alignment: { vertical: "center" } };
        const sText = { font: { name: fontName, sz: 14 }, alignment: { vertical: "top" } };
        const sHighlight = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "D35400" } }, alignment: { vertical: "top" } };

        rows.push([{ v: "📘 คู่มือการใช้งานระบบพิจารณาและจัดสรรงบประมาณ (ผง.1)", s: sTitle }, "", ""]);
        rows.push([]);
        rows.push([{ v: "การกรอกรหัสแหล่งเงิน (คอลัมน์ K)", s: sHead }, "", ""]);
        rows.push([{ v: "ให้พิมพ์ตัวเลขรหัสแหล่งเงิน หากมีหลายกองให้ใส่เครื่องหมาย = ตามด้วยยอดเงิน แล้วคั่นด้วยลูกน้ำ (,)", s: sText }, "", ""]);
        rows.push([{ v: "1 = รายหัว", s: sHighlight }, { v: "ตัวอย่างแหล่งเดียว:", s: sText }, { v: "พิมพ์ 1 (ระบบจะดึงยอดเงินทั้งหมดไปกองรายหัว)", s: sText }]);
        rows.push([{ v: "2 = พัฒนาผู้เรียน", s: sHighlight }, { v: "ตัวอย่างหลายแหล่ง:", s: sText }, { v: "พิมพ์ 1=5000, 2=3000 (แยกกอง 5,000 บ. และ 3,000 บ.)", s: sText }]);
        rows.push([{ v: "3 = รายได้สถานศึกษา", s: sHighlight }, "", ""]);
        rows.push([{ v: "4 = ผ้าป่า", s: sHighlight }, "", ""]);
        rows.push([{ v: "5 = ลูกเสือ", s: sHighlight }, "", ""]);
        rows.push([]);
        rows.push([{ v: "การกรอกรหัสประเภทงบ (คอลัมน์ L)", s: sHead }, "", ""]);
        rows.push([{ v: "1 = โครงการพัฒนาคุณภาพการศึกษา (เช่น ค่าย, กิจกรรมนักเรียน)", s: sHighlight }, "", ""]);
        rows.push([{ v: "2 = งบบริหารจัดการ / รายจ่ายประจำ (เช่น ซ่อมแซม, จัดซื้อวัสดุสำนักงาน)", s: sHighlight }, "", ""]);
        rows.push([]);
        rows.push([{ v: "การนำข้อมูลกลับเข้าสู่ระบบ (Import)", s: sHead }, "", ""]);
        rows.push([{ v: "1. จัดสรรงบประมาณในไฟล์ Excel นี้ให้เรียบร้อย", s: sText }, "", ""]);
        rows.push([{ v: "2. ไฮไลต์คลุมข้อมูลตั้งแต่ คอลัมน์ A (ลำดับ) จนถึง คอลัมน์ M (ข้อเสนอแนะแอดมิน) *เฉพาะส่วนที่เป็นข้อมูล ไม่เอาหัวตาราง", s: sText }, "", ""]);
        rows.push([{ v: "3. กด Copy (Ctrl+C) แล้วนำไปวางในหน้าต่าง นำเข้า (Bulk Import) บนระบบแผนงานเว็บ", s: sText }, "", ""]);
        
        const wsInst = XLSX.utils.aoa_to_sheet(rows);
        wsInst['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 60 }];
        return wsInst;
    };

    const wsInst = buildInstructionSheet();
    XLSX.utils.book_append_sheet(wb, wsInst, "คู่มือการใช้งาน");

    const wsAll = buildStyledSheet(`ตารางพิจารณาอนุมัติหลักการ (ผง.1) - โครงการทั่วไป`, normalProjects, false);
    XLSX.utils.book_append_sheet(wb, wsAll, "ตารางตัดงบ_ทั่วไป");

    const wsCamp = buildStyledSheet(`ตารางพิจารณาอนุมัติหลักการ (ผง.1) - โครงการค่ายและงานวิชาการ`, campProjects, true);
    XLSX.utils.book_append_sheet(wb, wsCamp, "ค่ายและวิชาการ");

    if (attachmentsData.length > 0) {
        let attRows = []; let attMerges = [];
        const sHead = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "34495E" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
        const sItem = { font: { name: fontName, sz: 12 }, border: borderThin };
        const sItemNum = { font: { name: fontName, sz: 12 }, alignment: { horizontal: "center" }, border: borderThin };

        attachmentsData.forEach(att => {
            let startRow = attRows.length;
            attRows.push([{ v: `เอกสารประกอบรายการที่ ${att.docNum}`, s: { font: { name: fontName, sz: 18, bold: true } } }, "", ""]);
            attMerges.push({ s: { r: startRow, c: 0 }, e: { r: startRow, c: 2 } });
            
            attRows.push([{ v: `อ้างอิงรหัส: [${att.project.id}] ${att.project.name}`, s: { font: { name: fontName, sz: 14, bold: true, color: { rgb: "2980B9" } } } }, "", ""]);
            attMerges.push({ s: { r: startRow+1, c: 0 }, e: { r: startRow+1, c: 2 } });
            
            attRows.push([{ v: "ลำดับ", s: sHead }, { v: "รายการ", s: sHead }, { v: "จำนวนเงิน (บาท)", s: sHead }]);
            
            if (att.project.items && att.project.items.length > 0) {
                att.project.items.forEach((it, idx) => {
                    let cleanAmount = Number(String(it.amount).replace(/[^\d.]/g, '')) || 0;
                    attRows.push([
                        { v: idx + 1, t: 'n', s: sItemNum }, { v: it.name, s: sItem },
                        { v: cleanAmount, t: 'n', s: { ...sItem, alignment: { horizontal: "right" }, numFmt: "#,##0.00" } }
                    ]);
                });
            }
            attRows.push(["", "", ""]); 
        });

        const wsAtt = XLSX.utils.aoa_to_sheet(attRows);
        wsAtt['!merges'] = attMerges; wsAtt['!cols'] = [{ wch: 8 }, { wch: 60 }, { wch: 20 }];
        wsAtt['!pageSetup'] = { paperSize: 9, orientation: 'portrait', footer: '&Cหน้า &P จาก &N' };
        XLSX.utils.book_append_sheet(wb, wsAtt, "เอกสารประกอบรายการ");
    }

    const buildLivestreamDashboardSheet = () => {
        const sBanner = { font: { name: fontName, sz: 18, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1A252F" } }, alignment: { horizontal: "center", vertical: "center" } };
        const sSubBanner = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "F39C12" } }, fill: { fgColor: { rgb: "2C3E50" } }, alignment: { horizontal: "center", vertical: "center" } };
        const sSectionTitle = { font: { name: fontName, sz: 15, bold: true, color: { rgb: "1F618D" } }, alignment: { horizontal: "left", vertical: "center" } };
        const sThProgress = { font: { name: fontName, sz: 13.5, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "D35400" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sTh = { font: { name: fontName, sz: 13.5, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2980B9" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sThDeptDev = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "27AE60" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sThDeptRoutine = { font: { name: fontName, sz: 13, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7F8C8D" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const sTdCenter = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "2C3E50" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
        const sTdName = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "2C3E50" } }, alignment: { horizontal: "left", vertical: "center" }, border: borderThin };
        const sTdInitBudget = { font: { name: fontName, sz: 15, bold: true, color: { rgb: "1F618D" } }, fill: { fgColor: { rgb: "FEF9E7" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThin };
        const sTdUsed = { font: { name: fontName, sz: 15, bold: true, color: { rgb: "D35400" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThin };
        const sTdRemain = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "1E8449" } }, fill: { fgColor: { rgb: "EAFAF1" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00;[Red]-#,##0.00;\"0.00\"", border: borderThin };
        const sTdHighlightWait = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "C0392B" } }, fill: { fgColor: { rgb: "FDEDEC" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThick };
        const sTdHighlightWaitCount = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "C0392B" } }, fill: { fgColor: { rgb: "FDEDEC" } }, alignment: { horizontal: "center", vertical: "center" }, numFmt: "#,##0", border: borderThick };
        const sTdPct = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "2C3E50" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "0.00%", border: borderThin };
        const sTdMoneyNormal = { font: { name: fontName, sz: 13.5, color: { rgb: "2C3E50" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThin };
        const sTotalRow = { font: { name: fontName, sz: 15, bold: true, color: { rgb: "2C3E50" } }, fill: { fgColor: { rgb: "D5F5E3" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00;[Red]-#,##0.00;\"0.00\"", border: borderThick };
        const sTotalPct = { font: { name: fontName, sz: 15, bold: true, color: { rgb: "2C3E50" } }, fill: { fgColor: { rgb: "D5F5E3" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "0.00%", border: borderThick };

        let dRows = []; let dMerges = []; let dHeights = [];

        dRows.push([{ v: `📺 กระดานรายงานผลการจัดสรรงบประมาณสด (Livestream Dashboard) ปีงบประมาณ 25${activeYear}`, s: sBanner }, "", "", "", "", "", "", "", "", "", ""]);
        dMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }); dHeights.push({ hpt: 38 });
        dRows.push([{ v: "⚡ แยกคำนวณสัดส่วน % ระหว่าง 'งบพัฒนาคุณภาพ (รหัส K=1)' และ 'งบบริหารจัดการ/รายจ่ายประจำ (รหัส K=2)' อัตโนมัติ", s: sSubBanner }, "", "", "", "", "", "", "", "", "", ""]);
        dMerges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }); dHeights.push({ hpt: 26 });
        dRows.push([]); dHeights.push({ hpt: 10 });

        dRows.push([{ v: "1. ติดตามความคืบหน้าการพิจารณาโครงการ (ตัดยอดเสนอขอเต็มจำนวนทันทีที่โครงการได้รับการจัดสรร)", s: sSectionTitle }, "", "", "", "", "", "", "", "", "", ""]);
        dMerges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 10 } }); dHeights.push({ hpt: 28 });

        dRows.push([
            { v: "สถานะการพิจารณาจัดสรร", s: sThProgress }, { v: "", s: sThProgress }, { v: "จำนวนโครงการ\n(โครงการ)", s: sThProgress },
            { v: "สัดส่วนโครงการ\n(%)", s: sThProgress }, { v: "ยอดเงินตามที่เสนอขอ\n(บาท)", s: sThProgress }, { v: "อนุมัติจัดสรรจริง\n(บาท)", s: sThProgress },
            { v: "ยอดที่ตัดลด/ทอนได้สะสม\n(เอาไปช่วยส่วนอื่นได้)", s: sThProgress }, { v: "การวิเคราะห์สถานะงบประมาณสด", s: sThProgress }, { v: "", s: sThProgress }, "", ""
        ]);
        dMerges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }); dMerges.push({ s: { r: 4, c: 7 }, e: { r: 4, c: 8 } }); dHeights.push({ hpt: 36 });

        const buildFormula = (col) => `SUM('ตารางตัดงบ_ทั่วไป'!${col}4:${col}500) + IFERROR(SUM('ค่ายและวิชาการ'!${col}4:${col}500), 0)`;
        const countFormula = (col, criteria) => `COUNTIF('ตารางตัดงบ_ทั่วไป'!${col}4:${col}500, "${criteria}") + IFERROR(COUNTIF('ค่ายและวิชาการ'!${col}4:${col}500, "${criteria}"), 0)`;
        const sumifFormula = (criteriaCol, criteria, sumCol) => `SUMIF('ตารางตัดงบ_ทั่วไป'!${criteriaCol}4:${criteriaCol}500, "${criteria}", 'ตารางตัดงบ_ทั่วไป'!${sumCol}4:${sumCol}500) + IFERROR(SUMIF('ค่ายและวิชาการ'!${criteriaCol}4:${criteriaCol}500, "${criteria}", 'ค่ายและวิชาการ'!${sumCol}4:${sumCol}500), 0)`;

        dRows.push([
            { v: "📋 โครงการที่เสนอขออนุมัติทั้งหมด (ตั้งต้น)", s: sTdName }, { v: "", s: sTdName },
            { f: `C7+C8`, t: 'n', s: sTdCenter }, { v: 1, t: 'n', s: sTdPct },
            { f: buildFormula('E'), t: 'n', s: sTdMoneyNormal }, { v: "-", s: sTdCenter }, { v: "-", s: sTdCenter },
            { v: "วงเงินคำขอตั้งต้นรวมทุกโครงการ", s: sTdCenter }, { v: "", s: sTdCenter }, "", ""
        ]);
        dMerges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }); dMerges.push({ s: { r: 5, c: 7 }, e: { r: 5, c: 8 } }); dHeights.push({ hpt: 28 });

        dRows.push([
            { v: "✅ พิจารณาจัดสรรเสร็จแล้ว (ระบุแหล่งเงินแล้ว)", s: sTdName }, { v: "", s: sTdName },
            { f: countFormula('T', 'จัดสรรแล้ว'), t: 'n', s: { ...sTdCenter, color: { rgb: "1E8449" } } },
            { f: `IF(C6>0, C7/C6, 0)`, t: 'n', s: sTdPct },
            { f: sumifFormula('T', 'จัดสรรแล้ว', 'E'), t: 'n', s: sTdMoneyNormal },
            { f: sumifFormula('T', 'จัดสรรแล้ว', 'J'), t: 'n', s: sTdUsed },
            { f: `E7-F7`, t: 'n', s: sTdRemain },
            { v: "ตัดยอดเสนอขอ (ช่อง E) ออกเต็มจำนวนแล้ว", s: { ...sTdCenter, font: { name: fontName, sz: 12.5, color: { rgb: "1E8449" } } } }, { v: "", s: sTdCenter }, "", ""
        ]);
        dMerges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }); dMerges.push({ s: { r: 6, c: 7 }, e: { r: 6, c: 8 } }); dHeights.push({ hpt: 30 });

        dRows.push([
            { v: "⏳ คงเหลือที่ยังไม่ได้จัดสรร (รอพิจารณา)", s: { ...sTdName, fill: { fgColor: { rgb: "FDEDEC" } }, font: { name: fontName, sz: 15, bold: true, color: { rgb: "C0392B" } }, border: borderThick } }, { v: "", s: { ...sTdName, fill: { fgColor: { rgb: "FDEDEC" } }, border: borderThick } },
            { f: countFormula('T', 'รอจัดสรร'), t: 'n', s: sTdHighlightWaitCount },
            { f: `IF(C6>0, C8/C6, 0)`, t: 'n', s: { ...sTdPct, fill: { fgColor: { rgb: "FDEDEC" } }, border: borderThick } },
            { f: sumifFormula('T', 'รอจัดสรร', 'E'), t: 'n', s: sTdHighlightWait },
            { v: "รอเคาะยอด", s: { ...sTdCenter, fill: { fgColor: { rgb: "FDEDEC" } }, border: borderThick } },
            { f: `F17-E8`, t: 'n', s: sTdRemain },
            { f: `IF(C8=0, "🎉 จัดสรรครบทุกโครงการแล้ว!", IF(F17>=E8, "✅ งบคงเหลือพอจ่ายที่เหลือได้เต็ม 100%", "⚠️ งบเหลือไม่พอคำขอที่เหลือ (ต้องตัดลดตามช่อง G)"))`, t: 's', s: { ...sTdCenter, fill: { fgColor: { rgb: "FEF9E7" } }, border: borderThick } }, { v: "", s: { ...sTdCenter, fill: { fgColor: { rgb: "FEF9E7" } }, border: borderThick } }, "", ""
        ]);
        dMerges.push({ s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }); dMerges.push({ s: { r: 7, c: 7 }, e: { r: 7, c: 8 } }); dHeights.push({ hpt: 34 });

        dRows.push([]); dHeights.push({ hpt: 12 });

        dRows.push([{ v: "2. สรุปวงเงินงบประมาณทั้งหมด ยอดจัดสรร (แยกงบพัฒนา / งบบริหารจัดการ) และยอดคงเหลือสุทธิ (5 แหล่งงบประมาณ)", s: sSectionTitle }, "", "", "", "", "", "", "", "", "", ""]);
        dMerges.push({ s: { r: 9, c: 0 }, e: { r: 9, c: 10 } }); dHeights.push({ hpt: 28 });

        dRows.push([
            { v: "รหัส", s: sTh }, { v: "ประเภทแหล่งงบประมาณ", s: sTh }, { v: "งบประมาณตั้งต้นที่มีทั้งหมด\n(พิมพ์แก้ช่องสีเหลืองได้)", s: sTh },
            { v: "จัดสรร: งบพัฒนาคุณภาพ\n(รหัส K=1)", s: sTh }, { v: "จัดสรร: งบบริหาร/ประจำ\n(รหัส K=2)", s: sTh },
            { v: "คงเหลือสุทธิ (บาท)\n(หากติดลบจะแสดงสีแดง)", s: sTh }, { v: "ร้อยละที่ใช้ไปรวม (%)", s: sTh }, { v: "สถานะงบประมาณ", s: sTh }, "", "", ""
        ]);
        dHeights.push({ hpt: 36 });

        const buildSplitFormula = (col, kType) => `SUMIFS('ตารางตัดงบ_ทั่วไป'!${col}4:${col}500, 'ตารางตัดงบ_ทั่วไป'!L4:L500, "${kType}") + IFERROR(SUMIFS('ค่ายและวิชาการ'!${col}4:${col}500, 'ค่ายและวิชาการ'!L4:L500, "${kType}"), 0)`;

        fundList.forEach((f, idx) => {
            let rNum = 12 + idx;
            dRows.push([
                { v: `รหัส ${f.code}`, s: sTdCenter }, { v: f.name, s: sTdName }, { v: f.initBudget, t: 'n', s: sTdInitBudget },
                { f: buildSplitFormula(f.col, "1"), t: 'n', s: sTdMoneyNormal },
                { f: buildSplitFormula(f.col, "2"), t: 'n', s: sTdMoneyNormal },
                { f: `C${rNum}-(D${rNum}+E${rNum})`, t: 'n', s: sTdRemain },
                { f: `IF(C${rNum}>0, (D${rNum}+E${rNum})/C${rNum}, 0)`, t: 'n', s: sTdPct },
                { f: `IF(F${rNum}<0, "❌ งบติดลบ! (เกินวงเงิน)", IF((D${rNum}+E${rNum})=0, "⚪ ยังไม่จัดสรร", "✅ งบเพียงพอ"))`, t: 's', s: sTdCenter }, "", "", ""
            ]);
            dHeights.push({ hpt: 30 });
        });

        dRows.push([
            { v: "รวมงบประมาณทั้ง 5 แหล่งเงิน", s: { ...sTotalRow, alignment: { horizontal: "center", vertical: "center" } } }, { v: "", s: sTotalRow },
            { f: `SUM(C12:C16)`, t: 'n', s: sTotalRow }, { f: `SUM(D12:D16)`, t: 'n', s: sTotalRow }, { f: `SUM(E12:E16)`, t: 'n', s: sTotalRow },
            { f: `SUM(F12:F16)`, t: 'n', s: sTotalRow }, { f: `IF(C17>0, (D17+E17)/C17, 0)`, t: 'n', s: sTotalPct },
            { f: `IF(F17<0, "❌ ภาพรวมเกินวงเงิน!", "✅ ภาพรวมสมดุล")`, t: 's', s: { ...sTotalRow, alignment: { horizontal: "center", vertical: "center" } } }, "", "", ""
        ]);
        dMerges.push({ s: { r: 16, c: 0 }, e: { r: 16, c: 1 } }); dHeights.push({ hpt: 32 });
        dRows.push([]); dHeights.push({ hpt: 12 });

        const deptsList = [{ code: "01", name: "1. กลุ่มบริหารวิชาการ" }, { code: "02", name: "2. กลุ่มบริหารงบประมาณ" }, { code: "03", name: "3. กลุ่มบริหารงานบุคคล" }, { code: "04", name: "4. กลุ่มบริหารทั่วไป" }];

        const countDeptFormula = (deptCode, typeCode) => `COUNTIFS('ตารางตัดงบ_ทั่วไป'!S4:S500, "${deptCode}", 'ตารางตัดงบ_ทั่วไป'!L4:L500, "${typeCode}") + IFERROR(COUNTIFS('ค่ายและวิชาการ'!S4:S500, "${deptCode}", 'ค่ายและวิชาการ'!L4:L500, "${typeCode}"), 0)`;
        const sumDeptFundFormula = (fundCol, deptCode, typeCode) => `SUMIFS('ตารางตัดงบ_ทั่วไป'!${fundCol}4:${fundCol}500, 'ตารางตัดงบ_ทั่วไป'!S4:S500, "${deptCode}", 'ตารางตัดงบ_ทั่วไป'!L4:L500, "${typeCode}") + IFERROR(SUMIFS('ค่ายและวิชาการ'!${fundCol}4:${fundCol}500, 'ค่ายและวิชาการ'!S4:S500, "${deptCode}", 'ค่ายและวิชาการ'!L4:L500, "${typeCode}"), 0)`;
        const countDeptWaitFormula = (deptCode, typeCode) => `COUNTIFS('ตารางตัดงบ_ทั่วไป'!S4:S500, "${deptCode}", 'ตารางตัดงบ_ทั่วไป'!L4:L500, "${typeCode}", 'ตารางตัดงบ_ทั่วไป'!T4:T500, "รอจัดสรร") + IFERROR(COUNTIFS('ค่ายและวิชาการ'!S4:S500, "${deptCode}", 'ค่ายและวิชาการ'!L4:L500, "${typeCode}", 'ค่ายและวิชาการ'!T4:T500, "รอจัดสรร"), 0)`;
        const sumDeptWaitFormula = (deptCode, typeCode) => `SUMIFS('ตารางตัดงบ_ทั่วไป'!E4:E500, 'ตารางตัดงบ_ทั่วไป'!S4:S500, "${deptCode}", 'ตารางตัดงบ_ทั่วไป'!L4:L500, "${typeCode}", 'ตารางตัดงบ_ทั่วไป'!T4:T500, "รอจัดสรร") + IFERROR(SUMIFS('ค่ายและวิชาการ'!E4:E500, 'ค่ายและวิชาการ'!S4:S500, "${deptCode}", 'ค่ายและวิชาการ'!L4:L500, "${typeCode}", 'ค่ายและวิชาการ'!T4:T500, "รอจัดสรร"), 0)`;

        const appendDeptBreakdownTable = (sectionTitleText, typeCodeStr, headerStyle) => {
            dRows.push([{ v: sectionTitleText, s: sSectionTitle }, "", "", "", "", "", "", "", "", "", ""]);
            dMerges.push({ s: { r: dRows.length - 1, c: 0 }, e: { r: dRows.length - 1, c: 10 } }); dHeights.push({ hpt: 28 });

            dRows.push([
                { v: "กลุ่มบริหารงาน", s: headerStyle }, { v: "จำนวน\nโครงการ", s: headerStyle }, { v: "1. รายหัว\n(บาท)", s: headerStyle }, { v: "2. พัฒนาผู้เรียน\n(บาท)", s: headerStyle },
                { v: "3. รายได้\n(บาท)", s: headerStyle }, { v: "4. ผ้าป่า\n(บาท)", s: headerStyle }, { v: "5. ลูกเสือ\n(บาท)", s: headerStyle }, { v: "รวมงบที่ได้รับ\nจัดสรร (บาท)", s: headerStyle },
                { v: "คิดเป็นร้อยละ (%)\n(เฉพาะหมวดนี้)", s: headerStyle }, { v: "⏳ เหลือรอจัดสรร\n(โครงการ)", s: sThProgress }, { v: "⏳ ยอดขอที่เหลือ\nรอจัดสรร (บาท)", s: sThProgress }
            ]);
            dHeights.push({ hpt: 36 });

            let firstDataR = dRows.length + 1; let lastDataR = firstDataR + 3; let sumR = lastDataR + 1;

            deptsList.forEach((d, idx) => {
                let rNum = firstDataR + idx;
                dRows.push([
                    { v: d.name, s: sTdName },
                    { f: countDeptFormula(d.code, typeCodeStr), t: 'n', s: sTdCenter },
                    { f: sumDeptFundFormula('N', d.code, typeCodeStr), t: 'n', s: sTdMoneyNormal },
                    { f: sumDeptFundFormula('O', d.code, typeCodeStr), t: 'n', s: sTdMoneyNormal },
                    { f: sumDeptFundFormula('P', d.code, typeCodeStr), t: 'n', s: sTdMoneyNormal },
                    { f: sumDeptFundFormula('Q', d.code, typeCodeStr), t: 'n', s: sTdMoneyNormal },
                    { f: sumDeptFundFormula('R', d.code, typeCodeStr), t: 'n', s: sTdMoneyNormal },
                    { f: `SUM(C${rNum}:G${rNum})`, t: 'n', s: sTdUsed },
                    { f: `IF($H$${sumR}>0, H${rNum}/$H$${sumR}, 0)`, t: 'n', s: sTdPct },
                    { f: countDeptWaitFormula(d.code, typeCodeStr), t: 'n', s: { ...sTdCenter, fill: { fgColor: { rgb: "FDEDEC" } }, color: { rgb: "C0392B" } } },
                    { f: sumDeptWaitFormula(d.code, typeCodeStr), t: 'n', s: { ...sTdMoneyNormal, fill: { fgColor: { rgb: "FDEDEC" } }, font: { name: fontName, sz: 13.5, bold: true, color: { rgb: "C0392B" } } } }
                ]);
                dHeights.push({ hpt: 30 });
            });

            dRows.push([
                { v: "รวมทั้งสิ้น", s: { ...sTotalRow, alignment: { horizontal: "center", vertical: "center" } } }, { f: `SUM(B${firstDataR}:B${lastDataR})`, t: 'n', s: { ...sTotalRow, alignment: { horizontal: "center", vertical: "center" }, numFmt: "#,##0" } },
                { f: `SUM(C${firstDataR}:C${lastDataR})`, t: 'n', s: sTotalRow }, { f: `SUM(D${firstDataR}:D${lastDataR})`, t: 'n', s: sTotalRow }, { f: `SUM(E${firstDataR}:E${lastDataR})`, t: 'n', s: sTotalRow },
                { f: `SUM(F${firstDataR}:F${lastDataR})`, t: 'n', s: sTotalRow }, { f: `SUM(G${firstDataR}:G${lastDataR})`, t: 'n', s: sTotalRow }, { f: `SUM(H${firstDataR}:H${lastDataR})`, t: 'n', s: sTotalRow },
                { f: `SUM(I${firstDataR}:I${lastDataR})`, t: 'n', s: sTotalPct }, { f: `SUM(J${firstDataR}:J${lastDataR})`, t: 'n', s: sTdHighlightWaitCount }, { f: `SUM(K${firstDataR}:K${lastDataR})`, t: 'n', s: sTdHighlightWait }
            ]);
            dHeights.push({ hpt: 32 });
        };

        appendDeptBreakdownTable("3.1 สรุปงบประมาณจำแนกตาม 4 กลุ่มบริหารงาน - เฉพาะ [งบพัฒนาคุณภาพการศึกษา] (รหัส K = 1)", "1", sThDeptDev);
        dRows.push([]); dHeights.push({ hpt: 12 });
        appendDeptBreakdownTable("3.2 สรุปงบประมาณจำแนกตาม 4 กลุ่มบริหารงาน - เฉพาะ [งบบริหารจัดการ / รายจ่ายประจำ] (รหัส K = 2)", "2", sThDeptRoutine);

        const wsDash = XLSX.utils.aoa_to_sheet(dRows);
        wsDash['!merges'] = dMerges; wsDash['!rows'] = dHeights;
        wsDash['!cols'] = [{ wch: 28 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
        wsDash['!pageSetup'] = { paperSize: 9, orientation: 'landscape', footer: '&Cหน้า &P จาก &N' };
        
        return wsDash;
    };

    const wsDashboard = buildLivestreamDashboardSheet();
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard_จอประชุม");

    // ========================================================
    // 🌟 ส่วนที่เพิ่มใหม่: แผนการใช้จ่ายงบประมาณ (Cash Flow)
    // ========================================================
    const buildCashFlowSheet = (aYear) => {
        const fontName = "TH Sarabun New";
        const borderThin = { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } };
        
        const styleTitle = { font: { name: fontName, sz: 16, bold: true, color: { rgb: "2C3E50" } }, alignment: { horizontal: "left", vertical: "center" } };
        const styleHeader = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "9B59B6" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
        const styleCellCenter = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "000000" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
        const styleCellLeft = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "000000" } }, alignment: { horizontal: "left", vertical: "center" }, border: borderThin };
        const styleCellMoney = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0", border: borderThin };
        const styleFooterTotal = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
        const styleFooterMoney = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0", border: borderThin };
        
        let cRows = []; let cMerges = []; let cHeights = [];
        let py = parseInt(aYear, 10);
        let prevY = py - 1;
        
        cRows.push([{ v: `แผนการใช้จ่ายงบประมาณ (เฉพาะโครงการพัฒนาคุณภาพการศึกษา) - ปีงบประมาณ ${py}`, s: styleTitle }, "", "", "", "", "", ""]);
        cMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
        cHeights.push({ hpt: 30 });
        
        cRows.push([
            { v: "ที่", s: styleHeader }, 
            { v: "แหล่งงบประมาณ", s: styleHeader }, 
            { v: "งบประมาณ\nที่ได้รับจัดสรร", s: styleHeader }, 
            { v: "แผนการใช้จ่ายงบประมาณ", s: styleHeader }, "", "", ""
        ]);
        cMerges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });
        cMerges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } });
        cMerges.push({ s: { r: 1, c: 2 }, e: { r: 2, c: 2 } });
        cMerges.push({ s: { r: 1, c: 3 }, e: { r: 1, c: 6 } });
        cHeights.push({ hpt: 30 });

        cRows.push([
            "", "", "", 
            { v: `ไตรมาส 1\n(ต.ค.-ธ.ค.${prevY})`, s: styleHeader },
            { v: `ไตรมาส 2\n(ม.ค.-มี.ค.${py})`, s: styleHeader },
            { v: `ไตรมาส 3\n(เม.ย.-มิ.ย.${py})`, s: styleHeader },
            { v: `ไตรมาส 4\n(ก.ค.-ก.ย.${py})`, s: styleHeader }
        ]);
        cHeights.push({ hpt: 40 });

        const funds = [
            { code: "1", name: "อุดหนุนรายหัว", col: "N" },
            { code: "2", name: "กิจกรรมพัฒนาผู้เรียน", col: "O" },
            { code: "3", name: "รายได้สถานศึกษา", col: "P" },
            { code: "4", name: `รายได้สถานศึกษา (ผ้าป่า ${py})`, col: "Q" },
            { code: "5", name: "ลูกเสือ", col: "R" }
        ];

        // สูตรนี้จะดึงยอดเฉพาะ K=1 และแยกตามไตรมาส (1,2,3,4) + จับไตรมาส 5 มาหาร 4
        const buildQFormula = (fCol, qVal) => `SUMIFS('ตารางตัดงบ_ทั่วไป'!${fCol}4:${fCol}500, 'ตารางตัดงบ_ทั่วไป'!L4:L500, "1", 'ตารางตัดงบ_ทั่วไป'!U4:U500, "${qVal}") + IFERROR(SUMIFS('ค่ายและวิชาการ'!${fCol}4:${fCol}500, 'ค่ายและวิชาการ'!L4:L500, "1", 'ค่ายและวิชาการ'!U4:U500, "${qVal}"), 0) + ((SUMIFS('ตารางตัดงบ_ทั่วไป'!${fCol}4:${fCol}500, 'ตารางตัดงบ_ทั่วไป'!L4:L500, "1", 'ตารางตัดงบ_ทั่วไป'!U4:U500, "5") + IFERROR(SUMIFS('ค่ายและวิชาการ'!${fCol}4:${fCol}500, 'ค่ายและวิชาการ'!L4:L500, "1", 'ค่ายและวิชาการ'!U4:U500, "5"), 0)) / 4)`;

        funds.forEach((f, idx) => {
            let rowNum = idx + 4; // แถวใน Excel (เริ่มที่ 4)
            cRows.push([
                { v: idx + 1, t: 'n', s: styleCellCenter },
                { v: f.name, s: styleCellLeft },
                { f: `SUM(D${rowNum}:G${rowNum})`, t: 'n', s: styleCellMoney },
                { f: buildQFormula(f.col, "1"), t: 'n', s: styleCellMoney },
                { f: buildQFormula(f.col, "2"), t: 'n', s: styleCellMoney },
                { f: buildQFormula(f.col, "3"), t: 'n', s: styleCellMoney },
                { f: buildQFormula(f.col, "4"), t: 'n', s: styleCellMoney }
            ]);
            cHeights.push({ hpt: 25 });
        });

        let totalRowIdx = funds.length + 4;
        cRows.push([
            { v: "รวม", s: styleFooterTotal }, "", 
            { f: `SUM(C4:C${totalRowIdx-1})`, t: 'n', s: styleFooterMoney },
            { f: `SUM(D4:D${totalRowIdx-1})`, t: 'n', s: styleFooterMoney },
            { f: `SUM(E4:E${totalRowIdx-1})`, t: 'n', s: styleFooterMoney },
            { f: `SUM(F4:F${totalRowIdx-1})`, t: 'n', s: styleFooterMoney },
            { f: `SUM(G4:G${totalRowIdx-1})`, t: 'n', s: styleFooterMoney }
        ]);
        cMerges.push({ s: { r: totalRowIdx - 1, c: 0 }, e: { r: totalRowIdx - 1, c: 1 } });
        cHeights.push({ hpt: 30 });

        let pctRowIdx = totalRowIdx + 1;
        cRows.push([
            { v: "ร้อยละ", s: styleFooterTotal }, "",
            { v: 100, t: 'n', s: styleFooterTotal },
            { f: `IF(C${totalRowIdx}>0, ROUND(D${totalRowIdx}/C${totalRowIdx}*100, 0), 0)`, t: 'n', s: styleFooterMoney },
            { f: `IF(C${totalRowIdx}>0, ROUND(E${totalRowIdx}/C${totalRowIdx}*100, 0), 0)`, t: 'n', s: styleFooterMoney },
            { f: `IF(C${totalRowIdx}>0, ROUND(F${totalRowIdx}/C${totalRowIdx}*100, 0), 0)`, t: 'n', s: styleFooterMoney },
            { f: `IF(C${totalRowIdx}>0, ROUND(G${totalRowIdx}/C${totalRowIdx}*100, 0), 0)`, t: 'n', s: styleFooterMoney }
        ]);
        cMerges.push({ s: { r: pctRowIdx - 1, c: 0 }, e: { r: pctRowIdx - 1, c: 1 } });
        cHeights.push({ hpt: 30 });

        const wsCashFlow = XLSX.utils.aoa_to_sheet(cRows);
        wsCashFlow['!merges'] = cMerges; 
        wsCashFlow['!rows'] = cHeights;
        wsCashFlow['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        return wsCashFlow;
    };

    const wsCashFlow = buildCashFlowSheet(activeYear);
    XLSX.utils.book_append_sheet(wb, wsCashFlow, "แผนการใช้จ่ายงบประมาณ");
    // ========================================================

    XLSX.writeFile(wb, `ตารางตัดงบ_ผง1_พร้อมจอ_Livestream_${new Date().getTime()}.xlsx`);
}
// ==========================================
// 🌟 อัปเดตฟังก์ชัน Bulk Import (รองรับคอลัมน์ลำดับด้านหน้าสุด)
// ==========================================
function processBulkPastedData() {
    const rawData = document.getElementById('bulk-paste-area').value.trim();
    if (!rawData) { alert("กรุณาวางข้อมูลก่อนครับ"); return; }

    const rows = rawData.split('\n');
    let parsedData = [];

    rows.forEach(r => {
        const cols = r.split('\t');
        // 🌟 ตรวจสอบว่าคอลัมน์ที่ 2 (Index 1) คือ รหัสโครงการ (เพราะ Index 0 คือ ลำดับ)
        if (cols.length >= 11 && /^\d{2}-\d{2}/.test((cols[1] || "").trim())) {
            
            // 🌟 เลื่อน Index ให้ตรงกับตารางใหม่ (J = 9, K = 10, L = 11, M = 12)
            let rawBudget = (cols[9] || "").trim().replace(/,/g, '');
            let rawSourceCode = (cols[10] || "").trim();
            let fullSourceName = parseFundingSourceCode(rawSourceCode);

            let projTypeStr = "โครงการพัฒนาคุณภาพ";
            let commentText = "";
            
            if (cols.length >= 13) {
                let rawType = (cols[11] || "").trim();
                projTypeStr = (rawType === "2" || rawType.includes("บริหาร") || rawType.includes("ประจำ")) ? "งบบริหารจัดการ/ประจำ" : "โครงการพัฒนาคุณภาพ";
                commentText = cols[12] ? cols[12].trim() : "";
            } else if (cols.length >= 12) {
                commentText = cols[11] ? cols[11].trim() : "";
            }

            parsedData.push({
                id: cols[1].trim(), // รหัสโครงการคือคอลัมน์ B (Index 1)
                budget: rawBudget,
                source: fullSourceName,
                projectType: projTypeStr,
                comment: commentText,
                startMonth: "",
                endMonth: ""
            });
        }
    });

    if (parsedData.length === 0) {
        alert("ไม่พบแถวข้อมูลโครงการที่ถูกต้อง กรุณาก๊อปปี้ตั้งแต่คอลัมน์ A (ลำดับ) ถึงคอลัมน์ M (ข้อเสนอแนะแอดมิน) มาวางครับ");
        return;
    }

    let previewLines = parsedData.slice(0, 5).map(p => 
        `<div style="background:#f9fbfc; border-left:4px solid #3498db; padding:8px; margin-bottom:5px; border-radius:4px; text-align:left;">
            <strong style="color:#2c3e50;">[${p.id}]</strong> งบ <strong style="color:#e67e22;">${Number(p.budget || 0).toLocaleString()} ฿</strong><br>
            <span style="font-size:0.85rem; color:#7f8c8d;">${p.source || 'ไม่ระบุ'} | ${p.projectType}</span>
         </div>`
    ).join('');
    
    if (parsedData.length > 5) {
        previewLines += `<div style="text-align:center; color:#95a5a6; font-size:0.9rem; margin-top:10px;">...และอีก ${parsedData.length - 5} โครงการ</div>`;
    }

    // ใช้ SweetAlert2 แทน confirm ธรรมดา
    Swal.fire({
        title: 'ตรวจสอบความถูกต้อง',
        html: `<div style="font-size:1.1rem; color:#27ae60; font-weight:bold; margin-bottom:15px;">อ่านข้อมูลสำเร็จ ${parsedData.length} โครงการ</div>
               <div style="font-size:0.9rem; color:#d35400; font-weight:bold; text-align:left; margin-bottom:5px;">ตัวอย่างการดึงข้อมูล 5 รายการแรก:</div>
               ${previewLines}
               <div style="margin-top:20px; font-size:0.95rem; color:#c0392b; font-weight:bold;">
                  หากกดยืนยัน ระบบจะบันทึกข้อมูลและส่ง LINE แจ้งเตือนทันที!
               </div>`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#bdc3c7',
        confirmButtonText: 'ยืนยันและส่งแจ้งเตือน',
        cancelButtonText: 'ยกเลิก',
        customClass: { container: 'kanit-font' }
    }).then((result) => {
        if (result.isConfirmed) {
            const btn = document.getElementById('btn-process-bulk');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังประมวลผล...'; 
                btn.disabled = true;
            }

            Swal.fire({
                title: 'กำลังประมวลผลและส่ง LINE...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                customClass: { container: 'kanit-font' }
            });

            google.script.run
              .withSuccessHandler(function(res) {
                  Swal.fire('สำเร็จ!', res.message, 'success').then(() => {
                      const modal = document.getElementById('bulkImportModal');
                      if (modal) modal.remove();
                      if(typeof loadPendingApprovals === 'function') loadPendingApprovals();
                      else location.reload();
                  });
              })
              .withFailureHandler(function(err) {
                  Swal.fire('ผิดพลาด', err.message, 'error');
                  if (btn) {
                      btn.innerHTML = '<i class="fas fa-magic"></i> ประมวลผลและส่งไลน์แจ้งเตือน'; 
                      btn.disabled = false;
                  }
              })
              .processSmartBulkScreening(parsedData);
        }
    });
}
// 🌟 ตัวดักจับเพื่อแทรกปุ่มลงไปในหน้า "พิจารณาโครงการ" (ด่าน Admin) อัตโนมัติ
document.addEventListener("DOMContentLoaded", function() {
    // รอดูว่าตารางโหลดเสร็จเมื่อไหร่ แล้วเอาปุ่มไปแปะข้างบน
    const checkExist = setInterval(function() {
       const section = document.getElementById('section-admin-screening');
       if (section && !document.getElementById('btn-export-doc-screening')) {
          const btnHtml = `<button id="btn-export-doc-screening" onclick="exportScreeningData()" style="margin-bottom:15px; background:#2980b9; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-robot"></i> อ่านไฟล์ Docs สร้างตารางตัดงบ (Excel)</button>`;
          section.insertAdjacentHTML('afterbegin', btnHtml);
          clearInterval(checkExist);
       }
    }, 1000);
});
  function toggleOtherSource() {
    const select = document.getElementById('budgetSourceSelect');
    const otherInput = document.getElementById('budgetSourceOther');
    if(select && select.value === 'other') { otherInput.style.display = 'block'; } else if(otherInput) { otherInput.style.display = 'none'; }
  }
// ==========================================
  // 🌟 ระบบเพิ่มแหล่งงบประมาณแบบแยกยอดเงิน (Dynamic Funding Rows)
  // ==========================================
  function addFundingRow(sourceVal = "", amountVal = "") {
      const container = document.getElementById('dynamic-funding-container');
      const rowId = 'fund-row-' + Date.now() + Math.floor(Math.random()*1000);
      
      const row = document.createElement('div');
      row.id = rowId;
      row.className = 'funding-row-item';
      row.style.cssText = "display: flex; gap: 10px; margin-bottom: 8px; align-items: center;";
      
      // เช็คว่าเป็นตัวเลือก "อื่นๆ" หรือไม่
      let isCustom = sourceVal !== '' && !['เงินอุดหนุนรายหัว','เงินรายได้สถานศึกษา','เงินค่ากิจกรรมพัฒนาผู้เรียน'].includes(sourceVal);
      let displaySelect = isCustom ? 'other' : sourceVal;
      
      row.innerHTML = `
          <select class="dyn-source-select" onchange="checkOtherSource('${rowId}')" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: 'Kanit';">
              <option value="">-- เลือกแหล่งงบ --</option>
              <option value="เงินอุดหนุนรายหัว" ${displaySelect==='เงินอุดหนุนรายหัว'?'selected':''}>เงินอุดหนุนรายหัว</option>
              <option value="เงินรายได้สถานศึกษา" ${displaySelect==='เงินรายได้สถานศึกษา'?'selected':''}>เงินรายได้สถานศึกษา</option>
              <option value="เงินค่ากิจกรรมพัฒนาผู้เรียน" ${displaySelect==='เงินค่ากิจกรรมพัฒนาผู้เรียน'?'selected':''}>เงินค่ากิจกรรมพัฒนาผู้เรียน</option>
              <option value="other" ${displaySelect==='other'?'selected':''}>อื่น ๆ (ระบุ)</option>
          </select>
          <input type="text" class="dyn-source-other" placeholder="พิมพ์ชื่อแหล่งเงิน..." value="${isCustom ? sourceVal : ''}" style="flex: 1.5; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: 'Kanit'; display: ${isCustom ? 'block' : 'none'};">
          <input type="number" class="dyn-amount-input" placeholder="ยอดเงิน (บาท)" value="${amountVal}" oninput="calcTotalAllocated()" style="flex: 1.5; padding: 8px; text-align: right; border: 1px solid #ccc; border-radius: 4px; font-family: 'Kanit';">
          <button type="button" onclick="document.getElementById('${rowId}').remove(); calcTotalAllocated();" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;" title="ลบแถวนี้"><i class="fas fa-trash"></i></button>
      `;
      container.appendChild(row);
      calcTotalAllocated();
  }

  function checkOtherSource(rowId) {
      const row = document.getElementById(rowId);
      const sel = row.querySelector('.dyn-source-select');
      const other = row.querySelector('.dyn-source-other');
      other.style.display = sel.value === 'other' ? 'block' : 'none';
      calcTotalAllocated();
  }

  function calcTotalAllocated() {
      let total = 0;
      let sourceArray = [];
      document.querySelectorAll('.funding-row-item').forEach(row => {
          let amt = Number(row.querySelector('.dyn-amount-input').value) || 0;
          let sel = row.querySelector('.dyn-source-select').value;
          let srcName = sel === 'other' ? row.querySelector('.dyn-source-other').value.trim() : sel;
          
          if (srcName && amt > 0) {
              total += amt;
              // จัดฟอร์แมตให้หลังบ้านอ่านง่าย เช่น "เงินรายหัว=20000"
              sourceArray.push(`${srcName}=${amt}`); 
          }
      });
      
      document.getElementById('total-allocated-display').innerText = total.toLocaleString();
      document.getElementById('hidden-approved-budget').value = total;
      document.getElementById('hidden-budget-source').value = sourceArray.join(', '); // กลายเป็น "เงินรายหัว=20000, รายได้=5000"
  }
  function openScreeningModal(projectId) {
    document.getElementById('screen-id').value = projectId;
    
    const form = document.getElementById('screeningForm');
    form.reset(); 
    
    // 🌟 ล้างตารางแหล่งเงินเดิมออกให้หมดก่อน
    const dynamicContainer = document.getElementById('dynamic-funding-container');
    if (dynamicContainer) dynamicContainer.innerHTML = ''; 
    
    // 🌟 สร้าง Dropdown รายชื่อเดือน พร้อมปีงบประมาณอัตโนมัติ
    let pYear = parseInt(projectId.substring(0, 2), 10);
    if (!isNaN(pYear)) {
       let fYear = 2500 + pYear;
       let optionsHtml = '<option value="">-- เลือกเดือน --</option>';
       const months = [
         { name: "ตุลาคม", y: fYear - 1 }, { name: "พฤศจิกายน", y: fYear - 1 }, { name: "ธันวาคม", y: fYear - 1 },
         { name: "มกราคม", y: fYear }, { name: "กุมภาพันธ์", y: fYear }, { name: "มีนาคม", y: fYear },
         { name: "เมษายน", y: fYear }, { name: "พฤษภาคม", y: fYear }, { name: "มิถุนายน", y: fYear },
         { name: "กรกฎาคม", y: fYear }, { name: "สิงหาคม", y: fYear }, { name: "กันยายน", y: fYear }
       ];
       months.forEach(m => { optionsHtml += `<option value="${m.name} ${m.y}">${m.name} ${m.y}</option>`; });
       
       const startDateElem = document.getElementById('screen-start-date');
       const endDateElem = document.getElementById('screen-end-date');
       if(startDateElem) startDateElem.innerHTML = optionsHtml;
       if(endDateElem) endDateElem.innerHTML = optionsHtml;
    }

    // โชว์สถานะกำลังโหลด
    const titleDisplay = document.getElementById('screening-project-id');
    if(titleDisplay) titleDisplay.innerHTML = `รหัสโครงการ: ${projectId} <i class="fas fa-spinner fa-spin" style="color:#f39c12; font-size:0.8rem; margin-left:5px;"></i>`;

    // 🌟 วิ่งไปดึงข้อมูลที่แอดมินเคยกรอกไว้
    google.script.run
      .withSuccessHandler(function(data) {
         if (data) {
            // 🌟 สร้างปุ่มเปิดเอกสาร (ถ้ามีลิงก์)
            let docLinkHtml = "";
            if (data.docUrl && data.docUrl.startsWith("http")) {
                docLinkHtml = `<a href="${data.docUrl}" target="_blank" style="margin-left: 15px; background: #e8f4f8; color: #2980b9; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; border: 1px solid #3498db; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><i class="fas fa-external-link-alt"></i> เปิดเอกสารตรวจสอบ</a>`;
            }

            // อัปเดตหัว Modal ให้มีทั้งรหัสและปุ่มเปิดเอกสาร
            if(titleDisplay) titleDisplay.innerHTML = `รหัสโครงการ: ${projectId} ${docLinkHtml}`; 
            
            // หยอดไตรมาส
            const quarterElem = form.querySelector('[name="quarter"]');
            if(quarterElem && data.quarter) quarterElem.value = data.quarter;

            // หยอดประเภทโครงการ
            const typeElem = form.querySelector('[name="projectType"]');
            if(typeElem && data.type) typeElem.value = data.type;

            // หยอดเดือนที่เริ่ม-สิ้นสุด
            const startElem = document.getElementById('screen-start-date');
            if(startElem && data.start) startElem.value = data.start;

            const endElem = document.getElementById('screen-end-date');
            if(endElem && data.end) endElem.value = data.end;
            
            // 🌟 จุดที่ต้องแก้: นำข้อมูลแหล่งเงินเก่ามาสวมลงในแถว Dynamic Rows 🌟
            if (data.source && data.source.includes('=')) {
                let parts = data.source.split(',');
                parts.forEach(p => {
                    let s = p.split('=');
                    if (s.length === 2 && typeof addFundingRow === 'function') {
                        addFundingRow(s[0].trim(), s[1].trim());
                    }
                });
            } else if (data.source && data.budget) {
                if (typeof addFundingRow === 'function') addFundingRow(data.source, data.budget);
            } else {
                if (typeof addFundingRow === 'function') addFundingRow(); // สร้างแถวว่างรอไว้ 1 แถวเสมอ
            }
            
            // หยอดข้อเสนอแนะเดิม
            const commentElem = document.getElementById('admin-comment-box');
            if(commentElem && data.comment) {
                commentElem.value = data.comment;
            }
         } else {
            // กรณีไม่มีข้อมูลร่าง
            if(titleDisplay) titleDisplay.innerText = "รหัสโครงการ: " + projectId; 
            if (typeof addFundingRow === 'function') addFundingRow();
         }
      })
      .withFailureHandler(function(err) {
         if(titleDisplay) titleDisplay.innerText = "รหัสโครงการ: " + projectId; 
         if (typeof addFundingRow === 'function') addFundingRow();
         alert("ดึงข้อมูลร่างล้มเหลว: " + err.message);
      })
      .getProjectDraftScreeningData(projectId);

    document.getElementById('screeningModal').style.display = 'flex';
  }

  function closeScreeningModal() { 
    document.getElementById('screeningModal').style.display = 'none'; 
    document.getElementById('screeningForm').reset(); 
    const dynamicContainer = document.getElementById('dynamic-funding-container');
    if (dynamicContainer) dynamicContainer.innerHTML = ''; 
  }

  function processScreening(action) {
    const form = document.getElementById('screeningForm');
    const projectId = form.projectId.value;
    const comments = form.adminComments.value.trim();

    if ((action === 'reject' || action === 'return') && !comments) { 
        alert('กรุณาระบุข้อเสนอแนะหรือเหตุผล ในช่องข้อเสนอแนะ'); 
        return; 
    }

    // 🌟 บังคับคำนวณยอดเงินและแหล่งเงินทั้งหมดให้เป็นปัจจุบันที่สุด
    if(typeof calcTotalAllocated === 'function') calcTotalAllocated(); 
    
    // 🌟 ดึงค่ายอดรวมและแหล่งเงินจาก Hidden Inputs ที่ถูกคำนวณไว้
    let finalSource = document.getElementById('hidden-budget-source') ? document.getElementById('hidden-budget-source').value : '';
    const totalBudget = document.getElementById('hidden-approved-budget') ? document.getElementById('hidden-approved-budget').value : '0';
    const numericBudget = Number(totalBudget) || 0;

    if (action === 'approve') {
      // 🟢 หากงบประมาณเป็น 0 บาท แล้วไม่ได้เลือกแหล่งเงิน ให้กำหนดเป็น "ไม่ใช้งบประมาณ" อัตโนมัติ
      if (numericBudget === 0 && (!finalSource || finalSource.trim() === '')) {
        finalSource = 'ไม่ใช้งบประมาณ';
      }

      // 🟢 เปลี่ยนจาก <= 0 เป็น < 0 เพื่อยอมรับยอดเงิน 0 บาทได้
      if (numericBudget < 0 || !finalSource || !form.quarter.value || !form.startDate.value || !form.endDate.value || !form.projectType.value) {
        alert('กรุณาระบุยอดเงินจัดสรรแต่ละแหล่ง ประเภทโครงการ และระยะเวลาให้ครบถ้วนก่อนกด "อนุมัติ"'); 
        return;
      }
    }

    let confirmMsg = action === 'approve' ? `ยืนยัน "อนุมัติหลักการและส่งต่อให้หัวหน้างานพิจารณา" ใช่หรือไม่?` : action === 'return' ? `ยืนยัน "ส่งกลับไปให้เจ้าของแก้ไข" ใช่หรือไม่?` : `ยืนยัน "ไม่อนุมัติโครงการนี้" ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    // 🌟 ดึงค่าตัวเลือกโยกเงินงบอำนวยการ
    const useCentralCheckbox = document.getElementById('useCentralBudget');
    const useCentralVal = useCentralCheckbox ? useCentralCheckbox.checked : false;

    // 🌟 ส่งข้อมูลกลับไปแบบแพ็กเกจสมบูรณ์
    const formData = { 
        projectId: projectId, 
        action: action, 
        approvedBudget: numericBudget, 
        quarter: form.quarter.value, 
        budgetSource: finalSource, 
        startDate: form.startDate.value, 
        endDate: form.endDate.value, 
        projectType: form.projectType.value, 
        adminComments: comments,
        useCentralBudget: useCentralVal
    };

    const loader = document.createElement('div');
    loader.id = 'screen-loader';
    loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:10000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
    loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:#9b59b6; margin-bottom:15px;"></i><h3 style="font-family:\'Kanit\'; color:#333;">กำลังบันทึกข้อมูล...</h3>';
    document.body.appendChild(loader);

    google.script.run
      .withSuccessHandler(function(res) { document.body.removeChild(loader); alert("สำเร็จ! " + res.message); closeScreeningModal(); loadPendingApprovals(); })
      .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
      .submitPrincipalScreening(formData);
}

  function loadA1Approvals() {
    const tbody = document.getElementById('a1-projects-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#00bcd4;"></i></td></tr>';
    google.script.run
      .withSuccessHandler(function(projects) {
        if(projects.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีโครงการรอพิจารณาในส่วนของคุณ</td></tr>`; return; }
        let html = '';
        projects.forEach(p => {
          // ปุ่มเปิดเอกสาร
          let btnDoc = p.url && p.url !== '-' ? `<a href="${p.url}" target="_blank" style="background: #f4f6f8; color: #2980b9; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; display: inline-block; white-space: nowrap; border: 1px solid #d9e2ec; transition: 0.2s;"><i class="fas fa-external-link-alt"></i> เปิดดู</a>` : '-';
          
          // แสดงข้อมูลงบประมาณและแหล่งงบ
          let budgetDisplay = p.budget ? Number(p.budget).toLocaleString() + ' บาท' : '<span style="color:#95a5a6; font-size:0.85em;">รอแอดมินจัดสรร</span>';
          let sourceDisplay = p.source ? `<br><small style="color:#666;">(${p.source})</small>` : '';

          // ปุ่มประวัติคอมเมนต์
          let encodedHistory = encodeURIComponent(p.history);
          let historyBtn = p.history ? `<button onclick="showProjectComment('${p.id}', '${encodedHistory}')" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;" title="ดูประวัติการแก้ไข"><i class="fas fa-history"></i></button>` : '';

          // รวมกลุ่มปุ่มจัดการ
          let actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openA1Modal('${p.id}')" style="background: linear-gradient(135deg, #00bcd4, #0097a7); color: white; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem; font-weight: 500; box-shadow: 0 3px 6px rgba(0, 188, 212, 0.3);"><i class="fas fa-search"></i> พิจารณา</button>
                           </div>`;

          // 🌟 สร้าง HTML ตารางให้ครบ 6 คอลัมน์ (<td>) ตรงกับหัวตาราง
          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #00bcd4;">${p.id}</td>
                    <td style="padding: 12px;">${p.name}</td>
                    <td style="padding: 12px;">${p.owner}</td>
                    <td style="padding: 12px;">${budgetDisplay} ${sourceDisplay}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; })
      .getPendingA1Projects();
  }

  function openA1Modal(projectId) { document.getElementById('a1-project-id').value = projectId; document.getElementById('a1-project-id-display').innerText = "รหัสโครงการ: " + projectId; document.getElementById('a1Modal').style.display = 'flex'; }
  function closeA1Modal() { document.getElementById('a1Modal').style.display = 'none'; document.getElementById('a1Form').reset(); }

  function processA1(action) {
    const projectId = document.getElementById('a1-project-id').value;
    const comment = document.getElementById('a1-comment').value;
    
    if(action === 'reject' && !comment.trim()) { 
        alert('กรุณาระบุข้อเสนอแนะหรือเหตุผล หากต้องการส่งกลับแก้ไข'); 
        return; 
    }
    
    // 🌟 ใช้ SweetAlert แทน confirm() เดิม
    let confirmTitle = action === 'approve' ? 'ยืนยันการเห็นชอบ?' : 'ยืนยันการตีกลับ?';
    let confirmText = action === 'approve' ? `คุณต้องการ "เห็นชอบ" โครงการ ${projectId} ใช่หรือไม่?` : `คุณต้องการ "ส่งกลับแก้ไข" โครงการ ${projectId} ใช่หรือไม่?`;
    let btnColor = action === 'approve' ? '#00bcd4' : '#e74c3c';

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ใช่, ดำเนินการเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      
      // 🌟 ถ้าผู้ใช้กด "ใช่" ค่อยให้โค้ดทำงานต่อตรงนี้
      if (result.isConfirmed) {
        
        const loader = document.createElement('div');
        loader.id = 'a1-loader';
        loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:10000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:#00bcd4; margin-bottom:15px;"></i><h3 style="font-family:\'Kanit\'; color:#333;">กำลังประมวลผล...</h3>';
        document.body.appendChild(loader);

        google.script.run
          .withSuccessHandler(function(res) { document.body.removeChild(loader); alert(res.message); closeA1Modal(); loadA1Approvals(); })
          .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
          .submitA1Approval({ projectId: projectId, action: action, comment: comment });
      }
    });
  }

  function loadA2Approvals() {
    console.log("▶️ [LOGGER A2-1] เริ่มฟังก์ชัน loadA2Approvals()");
    const tbody = document.getElementById('a2-projects-tbody');
    console.log("▶️ [LOGGER A2-2] ค้นหาตาราง A2 tbody:", tbody);
    
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#2980b9;"></i></td></tr>';
    
    google.script.run
      .withSuccessHandler(function(projects) {
        console.log("📥 [LOGGER A2-3] ข้อมูลที่ได้จาก Server (A2):", projects);
        if(projects.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีโครงการรอพิจารณาในส่วนของคุณ</td></tr>`; return; }
        
        let html = '';
        projects.forEach(p => {
          let btnDoc = p.url ? `<a href="${p.url}" target="_blank" style="background: #f4f6f8; color: #2980b9; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; display: inline-block; white-space: nowrap; border: 1px solid #d9e2ec; transition: 0.2s;"><i class="fas fa-external-link-alt"></i> เปิดดู</a>` : '-';
          let budgetDisplay = p.budget && p.budget !== '-' ? Number(p.budget).toLocaleString() + ' บาท' : '-';
          let sourceDisplay = p.source && p.source !== '-' ? `<br><small style="color:#666;">(${p.source})</small>` : '';

          let encodedHistory = encodeURIComponent(p.history);
          let historyBtn = p.history ? `<button onclick="showProjectComment('${p.id}', '${encodedHistory}')" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;" title="ดูประวัติการแก้ไข"><i class="fas fa-history"></i></button>` : '';

          let actionBtn = '';
          let badgePrefix = '';
          
          if (p.type === 'report') {
             // 🌟 ถ้าเป็นรายงาน (Report)
             badgePrefix = `<span style="background:#e67e22; color:white; padding:3px 8px; border-radius:12px; font-size:0.75rem; margin-right:5px;"><i class="fas fa-file-signature"></i> รายงาน</span>`;
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openReportReviewModal('${p.id}')" style="background: #e67e22; color: white; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem; font-weight: 500; box-shadow: 0 3px 6px rgba(230, 126, 34, 0.3);"><i class="fas fa-search"></i> ตรวจรายงาน</button>
                           </div>`;
          } else {
             // 🌟 ถ้าเป็นโครงการ (Project)
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openA2Modal('${p.id}')" style="background: linear-gradient(135deg, #2980b9, #1f618d); color: white; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem; font-weight: 500; box-shadow: 0 3px 6px rgba(41, 128, 185, 0.3);"><i class="fas fa-search"></i> พิจารณา</button>
                           </div>`;
          }

          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #2980b9;">${p.id}</td>
                    <td style="padding: 12px;">${badgePrefix}${p.name}</td>
                    <td style="padding: 12px;">${p.owner}</td>
                    <td style="padding: 12px;">${budgetDisplay} ${sourceDisplay}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
        console.log("✅ [LOGGER A2-4] วาดตาราง A2 เสร็จสมบูรณ์");
      })
      .withFailureHandler(function(err) { 
        console.error("❌ [LOGGER A2-ERROR]:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; 
      })
      .getPendingA2Projects();
}

  function openA2Modal(projectId) { document.getElementById('a2-project-id').value = projectId; document.getElementById('a2-project-id-display').innerText = "รหัสโครงการ: " + projectId; document.getElementById('a2Modal').style.display = 'flex'; }
  function closeA2Modal() { document.getElementById('a2Modal').style.display = 'none'; document.getElementById('a2Form').reset(); }

  function processA2(action) {
    const projectId = document.getElementById('a2-project-id').value;
    const comment = document.getElementById('a2-comment').value;

    if(action === 'reject' && !comment.trim()) { 
        alert('กรุณาระบุข้อเสนอแนะหรือเหตุผล หากต้องการส่งกลับแก้ไข'); 
        return; 
    }
    
    // 🌟 เปลี่ยนจาก confirm() เดิม มาใช้ SweetAlert2
    let confirmTitle = action === 'approve' ? 'ยืนยันการเห็นชอบ?' : 'ยืนยันการตีกลับ?';
    let confirmText = action === 'approve' ? `คุณต้องการ "เห็นชอบ" โครงการ ${projectId} และส่งต่อผู้อำนวยการ ใช่หรือไม่?` : `คุณต้องการ "ส่งกลับแก้ไข" โครงการ ${projectId} ใช่หรือไม่?`;
    let btnColor = action === 'approve' ? '#2980b9' : '#e74c3c'; // สีฟ้าสำหรับ A2

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ใช่, ดำเนินการเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: {
          container: 'kanit-font'
      }
    }).then((result) => {
      // 🌟 ถ้ากด "ใช่" (isConfirmed) ค่อยให้ระบบทำงาน
      if (result.isConfirmed) {
        const loader = document.createElement('div');
        loader.id = 'a2-loader';
        loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:#2980b9; margin-bottom:15px;"></i><h3 style="font-family:\'Kanit\'; color:#333;">กำลังประมวลผล...</h3>';
        document.body.appendChild(loader);

        google.script.run
          .withSuccessHandler(function(res) { document.body.removeChild(loader); alert(res.message); closeA2Modal(); loadA2Approvals(); })
          .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
          .submitA2Approval({ projectId: projectId, action: action, comment: comment });
      }
    });
  }

  function loadA3Approvals() {
    console.log("▶️ [LOGGER A3-1] เริ่มฟังก์ชัน loadA3Approvals()");
    const tbody = document.getElementById('a3-projects-tbody');
    console.log("▶️ [LOGGER A3-2] ค้นหาตาราง A3 tbody:", tbody);
    
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#27ae60;"></i></td></tr>';
    
    google.script.run
      .withSuccessHandler(function(projects) {
        console.log("📥 [LOGGER A3-3] ข้อมูลที่ได้จาก Server (A3):", projects);
        if(projects.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีโครงการรออนุมัติ</td></tr>`; return; }
        
        let html = '';
        projects.forEach(p => {
          let btnDoc = p.url ? `<a href="${p.url}" target="_blank" style="background: #f4f6f8; color: #2980b9; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; display: inline-block; white-space: nowrap; border: 1px solid #d9e2ec; transition: 0.2s;"><i class="fas fa-external-link-alt"></i> เปิดดู</a>` : '-';
          let budgetDisplay = p.budget && p.budget !== '-' ? Number(p.budget).toLocaleString() + ' บาท' : '-';
          let sourceDisplay = p.source && p.source !== '-' ? `<br><small style="color:#666;">(${p.source})</small>` : '';

          let encodedHistory = encodeURIComponent(p.history);
          let historyBtn = p.history ? `<button onclick="showProjectComment('${p.id}', '${encodedHistory}')" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;" title="ดูประวัติการแก้ไข"><i class="fas fa-history"></i></button>` : '';

          let actionBtn = '';
          let badgePrefix = '';
          
          if (p.type === 'report') {
             // 🌟 ถ้าเป็นรายงาน (Report)
             badgePrefix = `<span style="background:#e67e22; color:white; padding:3px 8px; border-radius:12px; font-size:0.75rem; margin-right:5px;"><i class="fas fa-file-signature"></i> รายงาน</span>`;
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openReportReviewModal('${p.id}')" style="background: #e67e22; color: white; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem; font-weight: 500; box-shadow: 0 3px 6px rgba(230, 126, 34, 0.3);"><i class="fas fa-search"></i> ตรวจรายงาน</button>
                           </div>`;
          } else {
             // 🌟 ถ้าเป็นโครงการ (Project)
             actionBtn = `<div style="display: flex; gap: 5px; justify-content: center;">
                            ${historyBtn}
                            <button onclick="openA3Modal('${p.id}')" style="background: linear-gradient(135deg, #27ae60, #1e8449); color: white; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem; font-weight: 500; box-shadow: 0 3px 6px rgba(39, 174, 96, 0.3);"><i class="fas fa-stamp"></i> พิจารณาอนุมัติ</button>
                           </div>`;
          }

          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #27ae60;">${p.id}</td>
                    <td style="padding: 12px;">${badgePrefix}${p.name}</td>
                    <td style="padding: 12px;">${p.owner}</td>
                    <td style="padding: 12px;">${budgetDisplay} ${sourceDisplay}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
        console.log("✅ [LOGGER A3-4] วาดตาราง A3 เสร็จสมบูรณ์");
      })
      .withFailureHandler(function(err) { 
        console.error("❌ [LOGGER A3-ERROR]:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; 
      })
      .getPendingA3Projects();
}

  function openA3Modal(projectId) { document.getElementById('a3-project-id').value = projectId; document.getElementById('a3-project-id-display').innerText = "รหัสโครงการ: " + projectId; document.getElementById('a3Modal').style.display = 'flex'; }
  function closeA3Modal() { document.getElementById('a3Modal').style.display = 'none'; document.getElementById('a3Form').reset(); }

  function processA3(action) {
    const projectId = document.getElementById('a3-project-id').value;
    const comment = document.getElementById('a3-comment').value;

    if(action === 'reject' && !comment.trim()) { 
        alert('กรุณาระบุข้อเสนอแนะหรือเหตุผล หากต้องการส่งกลับแก้ไข'); 
        return; 
    }
    
    // 🌟 เปลี่ยนจาก confirm() เดิม มาใช้ SweetAlert2
    let confirmTitle = action === 'approve' ? 'ยืนยันการอนุมัติ?' : 'ยืนยันการตีกลับ?';
    let confirmText = action === 'approve' ? `คุณต้องการ "อนุมัติสมบูรณ์" โครงการ ${projectId} ใช่หรือไม่? (สถานะจะสิ้นสุดและประทับลายเซ็นทันที)` : `คุณต้องการ "ส่งกลับแก้ไข" โครงการ ${projectId} ใช่หรือไม่?`;
    let btnColor = action === 'approve' ? '#27ae60' : '#e74c3c'; // สีเขียวสำหรับ A3

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: action === 'approve' ? 'ใช่, อนุมัติเลย!' : 'ใช่, ตีกลับเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: {
          container: 'kanit-font'
      }
    }).then((result) => {
      // 🌟 ถ้ากด "ใช่" (isConfirmed) ค่อยให้ระบบทำงาน
      if (result.isConfirmed) {
        const loader = document.createElement('div');
        loader.id = 'a3-loader';
        loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
        loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:#27ae60; margin-bottom:15px;"></i><h3 style="font-family:\'Kanit\'; color:#333;">กำลังประมวลผล...</h3>';
        document.body.appendChild(loader);

        google.script.run
          .withSuccessHandler(function(res) { document.body.removeChild(loader); alert(res.message); closeA3Modal(); loadA3Approvals(); })
          .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
          .submitA3Approval({ projectId: projectId, action: action, comment: comment });
      }
    });
  }

  // ==========================================
  // ระบบดูประวัติข้อเสนอแนะ (History Modal)
  // ==========================================
  function showProjectComment(encodedProjectId, encodedComment) {
    try {
      const projectId = decodeURIComponent(encodedProjectId);
      const comment = decodeURIComponent(encodedComment);
      const modal = document.getElementById('commentHistoryModal');
      
      if (modal) {
        document.getElementById('history-project-id-display').innerText = "รหัสโครงการ: " + projectId;
        document.getElementById('history-content').innerText = comment ? comment : "ไม่มีประวัติข้อเสนอแนะ";
        modal.style.display = 'flex';
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเปิดประวัติ: " + error.message);
    }
  }

  function closeCommentHistoryModal() {
    const modal = document.getElementById('commentHistoryModal');
    if (modal) modal.style.display = 'none';
  }

  // ==========================================
  // 7. ระบบขอเปลี่ยนแปลงโครงการ (Amendment Modal)
  // ==========================================
  function openAmendmentModal(projectId, projectName, docUrl, reqDataJson) {
    document.getElementById('amend-project-id').value = projectId;
    document.getElementById('amend-project-id-display').innerText = "รหัสโครงการ: " + projectId;
    
    // ดึงชื่อโครงการมาใส่ในตำแหน่งให้เป๊ะตามฟอร์ม ผง.3[cite: 8]
    document.getElementById('amend-position-display').innerText = decodeURIComponent(projectName);
    
    const docLinkBtn = document.getElementById('amend-doc-link');
    if (docUrl && docUrl !== '-' && docUrl !== 'undefined') { 
        docLinkBtn.href = docUrl; docLinkBtn.style.display = 'inline-block'; 
    } else { 
        docLinkBtn.style.display = 'none'; 
    }

    // ล้างข้อมูลฟอร์มเดิม
    document.getElementById('amendmentForm').reset();
    document.getElementById('amend-items-tbody').innerHTML = '';
    toggleAmendBudget();
    
    const feedbackBox = document.getElementById('amend-admin-feedback-box');
    feedbackBox.style.display = 'none';

    // โหลดข้อมูลเก่า (ถ้าเป็นการแก้ไขแบบร่าง หรือโดนตีกลับ)
    if (reqDataJson && reqDataJson !== 'undefined' && reqDataJson !== "") {
        try {
            const data = JSON.parse(decodeURIComponent(reqDataJson));
            document.getElementById('amend-reason').value = data.reason || "";
            
            if (data.isAddBudget === 'yes') {
                document.querySelector('input[name="amendBudgetType"][value="increase"]').checked = true;
                document.getElementById('amend-add-amount').value = data.addAmount || "";
                toggleAmendBudget();
            }

            if (data.status.includes('ส่งกลับแก้ไข') || data.status.includes('ไม่อนุมัติ')) {
                feedbackBox.style.display = 'block';
                document.getElementById('amend-admin-feedback-text').innerText = data.comments || "ไม่ระบุเหตุผล";
            }

            // วาดตารางเดิม
            if (data.items && data.items.length > 0) {
                data.items.forEach(it => addAmendItemRow(it));
            } else {
                addAmendItemRow();
            }
        } catch(e) {
            console.error("JSON Parse Error:", e);
            addAmendItemRow();
        }
    } else {
        addAmendItemRow(); // สร้างแถวว่างๆ ไว้ 1 แถวเสมอ
    }

    document.getElementById('amendmentModal').style.display = 'flex';
  }

  function closeAmendmentModal() {
    document.getElementById('amendmentModal').style.display = 'none';
  }
function toggleAmendBudget() {
     const isIncrease = document.querySelector('input[name="amendBudgetType"]:checked').value === 'increase';
     document.getElementById('amend-budget-input-container').style.display = isIncrease ? 'flex' : 'none';
     if (!isIncrease) document.getElementById('amend-add-amount').value = '';
  }

  // เพิ่มแถวในตาราง
  function addAmendItemRow(itemData = null) {
      const tbody = document.getElementById('amend-items-tbody');
      const tr = document.createElement('tr');
      
      const oldN = itemData ? itemData.oldName : ""; const oldQ = itemData ? itemData.oldQty : "";
      const oldU = itemData ? itemData.oldUnit : ""; const oldP = itemData ? itemData.oldPrice : "";
      const newN = itemData ? itemData.newName : ""; const newQ = itemData ? itemData.newQty : "";
      const newU = itemData ? itemData.newUnit : ""; const newP = itemData ? itemData.newPrice : "";

      tr.innerHTML = `
        <td style="padding:4px; border:1px solid #ccc;"><input type="text" class="amend-old-name" value="${oldN}" style="width:100%; padding:6px; font-family:'Kanit'; border:1px solid #eee; background:#fcfcfc;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="number" class="amend-old-qty" value="${oldQ}" style="width:100%; padding:6px; text-align:center; border:1px solid #eee; background:#fcfcfc;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="text" class="amend-old-unit" value="${oldU}" style="width:100%; padding:6px; text-align:center; border:1px solid #eee; background:#fcfcfc;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="number" class="amend-old-price" value="${oldP}" style="width:100%; padding:6px; text-align:right; border:1px solid #eee; background:#fcfcfc;"></td>
        
        <td style="padding:4px; border:1px solid #ccc; border-left:3px solid #2980b9;"><input type="text" class="amend-new-name" value="${newN}" style="width:100%; padding:6px; font-family:'Kanit'; border:1px solid #eaf2f8; background:#f4f9fd;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="number" class="amend-new-qty" value="${newQ}" style="width:100%; padding:6px; text-align:center; border:1px solid #eaf2f8; background:#f4f9fd;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="text" class="amend-new-unit" value="${newU}" style="width:100%; padding:6px; text-align:center; border:1px solid #eaf2f8; background:#f4f9fd;"></td>
        <td style="padding:4px; border:1px solid #ccc;"><input type="number" class="amend-new-price" value="${newP}" style="width:100%; padding:6px; text-align:right; border:1px solid #eaf2f8; background:#f4f9fd;"></td>
        
        <td style="padding:4px; border:1px solid #ccc; text-align:center;"><button type="button" onclick="this.closest('tr').remove()" style="background:#e74c3c; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(tr);
  }

  // กดปุ่มส่งเรื่อง
  function submitAmendmentRequest(actionType) {
    const reason = document.getElementById('amend-reason').value.trim();
    const isAddBudget = document.querySelector('input[name="amendBudgetType"]:checked').value;
    const addAmount = Number(document.getElementById('amend-add-amount').value) || 0;

    if (actionType === 'submit') {
      if (!reason) { alert('กรุณาระบุเหตุผลและความจำเป็นด้วยครับ'); return; }
      if (isAddBudget === 'increase' && addAmount <= 0) { alert('กรุณาระบุยอดเงินที่ขอเพิ่มให้ถูกต้องครับ'); return; }
    }

    // เก็บข้อมูลตาราง (มัดรวมเป็น JSON ส่งไปหลังบ้าน)
    let itemsData = [];
    const rows = document.querySelectorAll('#amend-items-tbody tr');
    rows.forEach(tr => {
       const oldN = tr.querySelector('.amend-old-name').value.trim();
       const newN = tr.querySelector('.amend-new-name').value.trim();
       if (oldN !== "" || newN !== "") {
          itemsData.push({
             oldName: oldN, oldQty: tr.querySelector('.amend-old-qty').value, oldUnit: tr.querySelector('.amend-old-unit').value, oldPrice: tr.querySelector('.amend-old-price').value,
             newName: newN, newQty: tr.querySelector('.amend-new-qty').value, newUnit: tr.querySelector('.amend-new-unit').value, newPrice: tr.querySelector('.amend-new-price').value
          });
       }
    });

    if (actionType === 'submit' && itemsData.length === 0) {
       alert("กรุณากรอกรายการตารางที่ขอเปลี่ยนแปลงอย่างน้อย 1 แถวครับ"); return;
    }

    if (actionType === 'submit' && !confirm("คุณต้องการยื่นคำร้องนี้ให้งานแผนงานพิจารณาใช่หรือไม่?")) return;

    const btnDraft = document.getElementById('btn-draft-amendment');
    const btnSubmit = document.getElementById('btn-submit-amendment');
    
    if (actionType === 'draft') {
      btnDraft.disabled = true; btnDraft.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึก...'; btnSubmit.disabled = true;
    } else {
      btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่ง...'; btnDraft.disabled = true;
    }

    const payloadJSON = JSON.stringify({
       reason: reason,
       isAddBudget: isAddBudget,
       addAmount: addAmount,
       items: itemsData,
       status: "", // Backend จะไปเติมให้เอง
       comments: ""
    });

    const formData = {
      projectId: document.getElementById('amend-project-id').value,
      requestPayload: payloadJSON,
      action: actionType
    };

    google.script.run
      .withSuccessHandler(function(response) {
        alert(response.message); closeAmendmentModal(); loadMyProjects();
        btnDraft.disabled = false; btnDraft.innerHTML = '<i class="fas fa-save"></i> บันทึกร่างคำร้อง';
        btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> ยื่นคำร้อง (ผง.3)';
      })
      .withFailureHandler(function(error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
        btnDraft.disabled = false; btnDraft.innerHTML = '<i class="fas fa-save"></i> บันทึกร่างคำร้อง';
        btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> ยื่นคำร้อง (ผง.3)';
      })
      .submitAmendmentData(formData); // Backend รับ Payload ไปเซฟแบบใหม่
  }
  

  // ==========================================
  // ระบบกลั่นกรองคำร้องขอแก้ไข (Admin Amendment Screening)
  // ==========================================
  function loadPendingAmendments() {
    const tbody = document.getElementById('amend-admin-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#8e44ad;"></i></td></tr>';
    
    google.script.run
      .withSuccessHandler(function(amendments) {
        if(amendments.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีคำร้องขอเปลี่ยนแปลงรายละเอียด</td></tr>`;
          return;
        }
        let html = '';
        amendments.forEach(a => {
          let btnDoc = a.url ? `<a href="${a.url}" target="_blank" style="background:#f4f6f8; color:#8e44ad; padding:4px 10px; border-radius:15px; text-decoration:none; font-size:0.85rem; border:1px solid #ebdef0;"><i class="fas fa-file-alt"></i> ดูเอกสาร</a>` : '-';
          let safeReason = encodeURIComponent(String(a.reqReason || "")).replace(/'/g, "%27");
          let safeOld = encodeURIComponent(String(a.reqOld || "")).replace(/'/g, "%27");
          let safeNew = encodeURIComponent(String(a.reqNew || "")).replace(/'/g, "%27");

          let actionBtn = `<button onclick="openAmendAdminModal('${a.id}', '${safeReason}', '${safeOld}', '${safeNew}')" style="background:#8e44ad; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-search"></i> ตรวจสอบ</button>`;

          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #8e44ad;">${a.id}</td>
                    <td style="padding: 12px;">${a.name}</td>
                    <td style="padding: 12px;">${a.owner}</td>
                    <td style="padding: 12px; font-size:0.9rem; color:#e67e22;">${a.reqReason}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; })
      .getPendingAmendments();
  }

  function openAmendAdminModal(projectId, encodedReason, encodedOld, encodedNew) {
    const oldModal = document.getElementById('amendAdminScreeningModal');
    if (oldModal) oldModal.remove();

    const reason = decodeURIComponent(encodedReason);
    const oldDet = decodeURIComponent(encodedOld);
    const newDet = decodeURIComponent(encodedNew);

    const modal = document.createElement('div');
    modal.id = 'amendAdminScreeningModal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    modal.innerHTML = `
      <div style="background:white; width:90%; max-width:600px; border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,0.3); overflow:hidden; font-family:'Kanit', sans-serif;">
        <div style="background:#8e44ad; color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1.2rem;"><i class="fas fa-clipboard-check"></i> กลั่นกรองคำร้องขอเปลี่ยนแปลง</h3>
          <button onclick="document.getElementById('amendAdminScreeningModal').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px; max-height:70vh; overflow-y:auto;">
          <p style="font-weight:bold; color:#8e44ad; margin-top:0;">รหัสโครงการ: ${projectId}</p>
          <div style="background:#fdf2e9; padding:10px; border-radius:5px; margin-bottom:10px;">
            <strong style="color:#d35400;">เหตุผลที่ขอแก้:</strong><br><span style="font-size:0.95rem;">${reason}</span>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:15px;">
            <div style="flex:1; background:#fdf2f2; padding:10px; border-radius:5px;">
              <strong style="color:#c0392b;">รายละเอียดเดิม:</strong><br><span style="font-size:0.9rem;">${oldDet}</span>
            </div>
            <div style="flex:1; background:#eaeded; padding:10px; border-radius:5px;">
              <strong style="color:#27ae60;">รายละเอียดใหม่:</strong><br><span style="font-size:0.9rem;">${newDet}</span>
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display:block; font-weight:bold; margin-bottom:5px;">ข้อเสนอแนะแอดมิน (Admin Comment)</label>
            <textarea id="amend-admin-comment" rows="2" placeholder="พิมพ์ข้อเสนอแนะหรือเหตุผลการตีกลับ..." style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; box-sizing:border-box;"></textarea>
          </div>
        </div>
        <div style="padding:15px 20px; background:#f4f6f8; display:flex; justify-content:space-between;">
          <button onclick="document.getElementById('amendAdminScreeningModal').remove()" style="background:#bbb; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ยกเลิก</button>
          <div style="display:flex; gap:5px;">
            <button onclick="submitAmendAdminDecision('${projectId}', 'reject')" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ไม่อนุมัติคำร้อง</button>
            <button onclick="submitAmendAdminDecision('${projectId}', 'return')" style="background:#f39c12; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ส่งกลับแก้ไข</button>
            <button onclick="submitAmendAdminDecision('${projectId}', 'approve')" style="background:#27ae60; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">ส่งต่อ ผอ.</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function submitAmendAdminDecision(projectId, action) {
    const comment = document.getElementById('amend-admin-comment').value;
    if ((action === 'reject' || action === 'return') && !comment.trim()) { alert("กรุณาระบุข้อเสนอแนะหรือเหตุผล ในช่อง Admin Comment ครับ"); return; }
    let msg = action === 'approve' ? "ส่งต่อคำร้องให้ ผอ. พิจารณา" : action === 'return' ? "ตีกลับคำร้องให้ครูแก้ไข" : "ปัดตกคำร้อง";
    if(!confirm(`ยืนยันการ "${msg}" ใช่หรือไม่?`)) return;

    document.getElementById('amendAdminScreeningModal').remove(); 
    
    const loader = document.createElement('div');
    loader.id = 'amend-loader';
    loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
    loader.innerHTML = `<i class="fas fa-spinner fa-spin fa-3x" style="color:#8e44ad; margin-bottom:15px;"></i><h3 style="font-family:'Kanit';">กำลังบันทึกข้อมูล...</h3>`;
    document.body.appendChild(loader);

    google.script.run
      .withSuccessHandler(function(res) { document.body.removeChild(loader); alert(res.message); loadPendingAmendments(); })
      .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
      .submitAmendmentAdminDecision({ projectId: projectId, action: action, adminComment: comment });
  }

  // ==========================================
  // ระบบพิจารณาคำร้องขอแก้ไข (A3 - Director)
  // ==========================================
  function loadA3Amendments() {
    const tbody = document.getElementById('amend-a3-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#27ae60;"></i></td></tr>';
    
    google.script.run
      .withSuccessHandler(function(amendments) {
        if(amendments.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color:#666;">ไม่มีคำร้องขอเปลี่ยนแปลงรายละเอียด</td></tr>`; return; }
        let html = '';
        amendments.forEach(a => {
          let btnDoc = a.url ? `<a href="${a.url}" target="_blank" style="background:#f4f6f8; color:#2980b9; padding:4px 10px; border-radius:15px; text-decoration:none; font-size:0.85rem; border:1px solid #ebdef0;"><i class="fas fa-file-alt"></i> ดูเอกสาร</a>` : '-';
          let safeReason = encodeURIComponent(String(a.reqReason || "")).replace(/'/g, "%27");
          let safeOld = encodeURIComponent(String(a.reqOld || "")).replace(/'/g, "%27");
          let safeNew = encodeURIComponent(String(a.reqNew || "")).replace(/'/g, "%27");
          let safeAdminCom = encodeURIComponent(String(a.adminComment || "")).replace(/'/g, "%27");

          let adminIcon = a.adminComment ? `<span style="color:#8e44ad;" title="${a.adminComment}"><i class="fas fa-comment-dots fa-lg"></i></span>` : '-';
          let actionBtn = `<button onclick="openAmendA3Modal('${a.id}', '${safeReason}', '${safeOld}', '${safeNew}', '${safeAdminCom}')" style="background:#27ae60; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-stamp"></i> พิจารณา</button>`;

          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color: #27ae60;">${a.id}</td>
                    <td style="padding: 12px;">${a.name}</td>
                    <td style="padding: 12px; font-size:0.9rem; color:#e67e22;">${a.reqReason}</td>
                    <td style="padding: 12px; text-align: center; cursor:help;">${adminIcon}</td>
                    <td style="padding: 12px; text-align: center;">${btnDoc}</td>
                    <td style="padding: 12px; text-align: center;">${actionBtn}</td>
                  </tr>`;
        });
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="6" style="color: red;">${err.message}</td></tr>`; })
      .getPendingA3Amendments();
  }

  function openAmendA3Modal(projectId, encodedReason, encodedOld, encodedNew, encodedAdminCom) {
    const oldModal = document.getElementById('amendA3Modal');
    if (oldModal) oldModal.remove();

    const reason = decodeURIComponent(encodedReason);
    const oldDet = decodeURIComponent(encodedOld);
    const newDet = decodeURIComponent(encodedNew);
    const adminCom = decodeURIComponent(encodedAdminCom);

    const modal = document.createElement('div');
    modal.id = 'amendA3Modal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    modal.innerHTML = `
      <div style="background:white; width:90%; max-width:600px; border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,0.3); overflow:hidden; font-family:'Kanit', sans-serif;">
        <div style="background:#27ae60; color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1.2rem;"><i class="fas fa-stamp"></i> อนุมัติคำร้องขอเปลี่ยนแปลง</h3>
          <button onclick="document.getElementById('amendA3Modal').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px; max-height:75vh; overflow-y:auto;">
          <p style="font-weight:bold; color:#27ae60; margin-top:0;">รหัสโครงการ: ${projectId}</p>
          <div style="background:#fdf2e9; padding:10px; border-radius:5px; margin-bottom:10px;">
            <strong style="color:#d35400;">เหตุผลที่ขอแก้:</strong><br><span style="font-size:0.95rem;">${reason}</span>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:15px;">
            <div style="flex:1; background:#fdf2f2; padding:10px; border-radius:5px;">
              <strong style="color:#c0392b;">รายละเอียดเดิม:</strong><br><span style="font-size:0.9rem;">${oldDet}</span>
            </div>
            <div style="flex:1; background:#eaeded; padding:10px; border-radius:5px;">
              <strong style="color:#27ae60;">รายละเอียดใหม่:</strong><br><span style="font-size:0.9rem;">${newDet}</span>
            </div>
          </div>
          <div style="background:#f4ecf7; padding:10px; border-left:4px solid #8e44ad; border-radius:4px; margin-bottom:15px;">
            <strong style="color:#8e44ad;"><i class="fas fa-comment-dots"></i> ความเห็นจากแอดมิน:</strong><br><span style="font-size:0.95rem;">${adminCom || "-"}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display:block; font-weight:bold; margin-bottom:5px;">ข้อเสนอแนะ / ความเห็น ผอ.</label>
            <textarea id="amend-a3-comment" rows="2" placeholder="พิมพ์ข้อเสนอแนะ (บังคับกรอกกรณีส่งกลับ/ไม่อนุมัติ)..." style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; box-sizing:border-box;"></textarea>
          </div>
        </div>
        <div style="padding:15px 20px; background:#f4f6f8; display:flex; justify-content:space-between;">
          <button onclick="document.getElementById('amendA3Modal').remove()" style="background:#bbb; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ยกเลิก</button>
          <div style="display:flex; gap:5px;">
            <button onclick="submitAmendA3Decision('${projectId}', 'reject')" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ไม่อนุมัติ</button>
            <button onclick="submitAmendA3Decision('${projectId}', 'return')" style="background:#f39c12; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">ส่งกลับแก้ไข</button>
            <button onclick="submitAmendA3Decision('${projectId}', 'approve')" style="background:#27ae60; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;"><i class="fas fa-check"></i> อนุมัติ</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function submitAmendA3Decision(projectId, action) {
    const comment = document.getElementById('amend-a3-comment').value;
    if ((action === 'reject' || action === 'return') && !comment.trim()) { alert("กรุณาระบุข้อเสนอแนะหรือเหตุผล ในช่องความเห็น ผอ. ด้วยครับ"); return; }
    let msg = action === 'approve' ? "อนุมัติการแก้ไขโครงการ" : action === 'return' ? "ตีกลับคำร้องให้ครูแก้ไข" : "ปัดตกคำร้อง";
    if(!confirm(`ยืนยันการ "${msg}" ใช่หรือไม่?`)) return;

    document.getElementById('amendA3Modal').remove(); 
    const loader = document.createElement('div');
    loader.id = 'amend-loader';
    loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center;';
    loader.innerHTML = `<i class="fas fa-spinner fa-spin fa-3x" style="color:#27ae60; margin-bottom:15px;"></i><h3 style="font-family:'Kanit';">กำลังบันทึกข้อมูล...</h3>`;
    document.body.appendChild(loader);

    google.script.run
      .withSuccessHandler(function(res) { document.body.removeChild(loader); alert(res.message); loadA3Amendments(); })
      .withFailureHandler(function(err) { document.body.removeChild(loader); alert("ผิดพลาด: " + err.message); })
      .submitAmendmentA3Decision({ projectId: projectId, action: action, a3Comment: comment });
  }

  // ==========================================
  // ระบบรายงานผลโครงการ (Project Reporting)
  // ==========================================
  function openReportModal(projectId, encodedProjectName, projectUrl) {
  document.getElementById('report-project-id').value = projectId;
  const projectName = decodeURIComponent(encodedProjectName);
  const defaultReportName = "รายงานผลการดำเนินการโครงการ " + projectName;

  const form = document.getElementById('reportForm');
  let viewProjBtn = document.getElementById('btn-view-proj-doc');
  
  if (!viewProjBtn) {
     viewProjBtn = document.createElement('a');
     viewProjBtn.id = 'btn-view-proj-doc';
     viewProjBtn.target = '_blank';
     viewProjBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> เปิดดูเอกสารโครงการ (ผง.1) เพื่อดูเป้าหมายประกอบ';
     viewProjBtn.style.cssText = 'display:inline-block; margin-bottom:15px; background:#f9fbfc; color:#8e44ad; padding:8px 15px; border-radius:4px; text-decoration:none; font-size:0.9rem; border:1px solid #ebdef0; font-family:"Kanit"; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.05); width:100%; box-sizing:border-box; text-align:center; transition:0.2s;';
     form.parentNode.insertBefore(viewProjBtn, form);
  }
  
  if (projectUrl && projectUrl !== '-' && projectUrl !== 'undefined') {
     viewProjBtn.href = projectUrl;
     viewProjBtn.style.display = 'inline-block';
  } else {
     viewProjBtn.style.display = 'none';
  }

  const loader = document.createElement('div');
  loader.id = 'fetch-report-loader';
  loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:2001; display:flex; flex-direction:column; justify-content:center; align-items:center;';
  loader.innerHTML = `<i class="fas fa-spinner fa-spin fa-3x" style="color:#2980b9; margin-bottom:15px;"></i><h3 style="font-family:'Kanit';">กำลังดึงข้อมูลรายงาน...</h3>`;
  document.body.appendChild(loader);

  document.getElementById('reportModal').style.display = 'flex';

  google.script.run
    .withSuccessHandler(function(reportData) {
      document.body.removeChild(loader);
      form.reset(); 
      form.reportName.value = defaultReportName;
      
      const footerDiv = document.getElementById('report-status-badge').nextElementSibling;

      if (reportData && reportData.ReportStatus) { 
        form.operationalStatus.value = reportData.OperationalStatus || "ดำเนินการเสร็จสิ้น";
        form.quantitativeResult.value = reportData.QuantitativeResult || "";
        form.qualitativeResult.value = reportData.QualitativeResult || "";
        form.summaryOfOutcomes.value = reportData.SummaryOfOutcomes || "";
        form.problemsObstacles.value = reportData.ProblemsObstacles || "";
        form.suggestions.value = reportData.Suggestions || "";
        document.getElementById('report-status-badge').innerText = "สถานะปัจจุบัน: " + (reportData.ReportStatus || "แบบร่าง");
        
        // 🌟 แยกการแสดงปุ่ม: ถ้าเคยสร้างไฟล์ Docs แล้วให้โชว์ปุ่ม "ส่งให้แอดมิน"
        if (reportData.ReportDocID && reportData.ReportDocID !== "") {
            footerDiv.innerHTML = `
              <button type="button" onclick="closeReportModal()" style="background:#bbb; color:white; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-family:'Kanit'; margin-right:5px;">ยกเลิก</button>
              <button type="button" onclick="submitProjectReport('draft')" id="btn-draft-report" style="background:#f39c12; color:white; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-family:'Kanit'; margin-right:5px;"><i class="fas fa-save"></i> บันทึกข้อมูล</button>
              <button type="button" onclick="submitProjectReport('submit')" id="btn-submit-report" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold;"><i class="fas fa-paper-plane"></i> ส่งรายงานให้แอดมิน</button>
            `;
        } else {
            // ถ้ายังไม่เคยสร้างไฟล์ Docs ให้โชว์ปุ่ม "สร้างเอกสาร"
            footerDiv.innerHTML = `
              <button type="button" onclick="closeReportModal()" style="background:#bbb; color:white; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-family:'Kanit'; margin-right:5px;">ยกเลิก</button>
              <button type="button" onclick="submitProjectReport('create_doc')" id="btn-create-doc" style="background:#2980b9; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold;"><i class="fas fa-file-word"></i> สร้างเอกสารรายงาน</button>
            `;
        }
      } else {
        document.getElementById('report-status-badge').innerText = "สถานะปัจจุบัน: ยังไม่เคยรายงาน";
        footerDiv.innerHTML = `
          <button type="button" onclick="closeReportModal()" style="background:#bbb; color:white; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-family:'Kanit'; margin-right:5px;">ยกเลิก</button>
          <button type="button" onclick="submitProjectReport('create_doc')" id="btn-create-doc" style="background:#2980b9; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold;"><i class="fas fa-file-word"></i> สร้างเอกสารรายงาน</button>
        `;
      }
    })
    .withFailureHandler(function(err) {
      document.body.removeChild(loader);
      alert("ไม่สามารถดึงข้อมูลรายงานได้: " + err.message);
    })
    .getProjectReport(projectId);
}

  function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; }

function submitProjectReport(actionType) {
  const form = document.getElementById('reportForm');
  
  // 🌟 ถ้ากดปุ่ม "สร้างเอกสารรายงาน"
  if (actionType === 'create_doc') {
    if (!form.summaryOfOutcomes.value.trim()) { alert("กรุณากรอก 'สรุปผลสัมฤทธิ์' ให้ครบถ้วนก่อนสร้างเอกสารครับ"); return; }
    
    Swal.fire({
      title: 'ยืนยันการสร้างเอกสารรายงาน?',
      text: 'ระบบจะนำข้อมูลที่คุณกรอกไปสร้างไฟล์ Google Docs หลังจากนั้นคุณสามารถเข้าไปจัดหน้า หรือแทรกรูปภาพในไฟล์ได้ ก่อนที่จะกด "ส่งรายงานให้แอดมิน" ในภายหลังครับ',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2980b9',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'สร้างเอกสารเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: { container: 'kanit-font' }
    }).then((result) => {
      if (result.isConfirmed) executeSubmitReport(form, actionType);
    });
    return; 
  }
  
  // 🌟 ถ้ากดปุ่ม "ส่งรายงานให้แอดมิน"
  if (actionType === 'submit') {
    if (!form.summaryOfOutcomes.value.trim()) { alert("กรุณากรอก 'สรุปผลสัมฤทธิ์' ให้ครบถ้วนก่อนส่งครับ"); return; }
    
    Swal.fire({
      title: 'ยืนยันการส่งรายงาน?',
      text: 'ตรวจสอบความถูกต้องและแทรกรูปภาพในเอกสาร Google Docs เรียบร้อยแล้วใช่หรือไม่? หากส่งรายงานแล้วจะไม่สามารถแก้ไขได้จนกว่าแอดมินจะตีกลับครับ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ใช่, ส่งรายงานเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: { container: 'kanit-font' }
    }).then((result) => {
      if (result.isConfirmed) executeSubmitReport(form, actionType);
    });
    return; 
  }
  
  // 🌟 ถ้ากด "บันทึกข้อมูล" (draft) ข้ามไปทำได้เลยไม่ต้องเตือน
  executeSubmitReport(form, actionType);
}

  // ==========================================
  // ระบบรายงานผลโครงการ (Project Reporting)
  // ==========================================
  function submitProjectReport(actionType) {
    const form = document.getElementById('reportForm');
    
    // 🌟 ถ้ากดปุ่ม "ส่งรายงาน" ให้เด้ง SweetAlert2
    if (actionType === 'submit') {
      if (!form.summaryOfOutcomes.value.trim()) { alert("กรุณากรอก 'สรุปผลสัมฤทธิ์' ให้ครบถ้วนก่อนส่งครับ"); return; }
      
      Swal.fire({
        title: 'ยืนยันการส่งรายงาน?',
        text: 'คุณต้องการส่งรายงานผลนี้ให้แอดมินตรวจ ใช่หรือไม่? (หากส่งแล้วจะไม่สามารถแก้ไขได้จนกว่าจะถูกตีกลับ)',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2980b9',
        cancelButtonColor: '#bdc3c7',
        confirmButtonText: 'ใช่, ส่งรายงานเลย!',
        cancelButtonText: 'ยกเลิก',
        customClass: {
            container: 'kanit-font'
        }
      }).then((result) => {
        // ถ้าผู้ใช้กด "ใช่" ค่อยให้ฟังก์ชันทำงานต่อ
        if (result.isConfirmed) {
          executeSubmitReport(form, actionType);
        }
      });
      return; // หยุดโค้ดตรงนี้เพื่อรอผู้ใช้กดปุ่ม
    } 
    
    // 🌟 ถ้าแค่กด "บันทึกแบบร่าง" ก็ให้ทำงานผ่านไปเลย ไม่ต้องเด้งถาม
    executeSubmitReport(form, actionType);
  }
// 🌟 ฟังก์ชันตัวช่วย: ทำหน้าที่บันทึกและส่งข้อมูลไปหลังบ้าน (อัปเกรด Spinner)
function executeSubmitReport(form, actionType) {
  const btnDraft = document.getElementById('btn-draft-report');
  const btnSubmit = document.getElementById('btn-submit-report');
  const btnCreate = document.getElementById('btn-create-doc');
  
  if (btnDraft) btnDraft.disabled = true;
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnCreate) btnCreate.disabled = true;

  // 🌟 เพิ่ม Spinner ปิดทับหน้าจอ ป้องกันการกดซ้ำ
  Swal.fire({
    title: actionType === 'create_doc' ? 'กำลังสร้างเอกสารรายงาน...' : 'กำลังบันทึกข้อมูล...',
    text: actionType === 'create_doc' ? 'ระบบกำลังเชื่อมต่อ Google Drive เพื่อสร้างไฟล์ กรุณารอสักครู่' : 'กรุณารอสักครู่',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
    customClass: { container: 'kanit-font' }
  });

  const formData = {
    projectId: form.projectId.value, reportName: form.reportName.value, operationalStatus: form.operationalStatus.value,
    actualExpenses: "", reportUrl: "", quantitativeResult: form.quantitativeResult.value,
    qualitativeResult: form.qualitativeResult.value, summaryOfOutcomes: form.summaryOfOutcomes.value,
    problemsObstacles: form.problemsObstacles.value, suggestions: form.suggestions.value
  };

  google.script.run
    .withSuccessHandler(function(response) {
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: response.message, customClass: { container: 'kanit-font' } });
      closeReportModal(); 
      loadMyProjects();
      if(typeof loadMyReports === 'function') loadMyReports();
    })
    .withFailureHandler(function(error) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.message, customClass: { container: 'kanit-font' } });
      
      // ปลดล็อกปุ่มให้กดใหม่ได้ถ้าเกิด Error
      if (btnDraft) { btnDraft.disabled = false; btnDraft.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล'; }
      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> ส่งรายงานให้แอดมิน'; }
      if (btnCreate) { btnCreate.disabled = false; btnCreate.innerHTML = '<i class="fas fa-file-word"></i> สร้างเอกสารรายงาน'; }
    })
    .saveProjectReport(formData, actionType);
}
  
  // ==========================================
  // ระบบรายงานของฉัน (My Reports Page)
  // ==========================================
  function loadMyReports() {
    const tbody = document.getElementById('my-reports-tbody');
    const selectElem = document.getElementById('myreports-year-filter');
    const selectedYear = selectElem ? selectElem.value : "all"; 
    
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#2980b9;"></i><br>กำลังประมวลผลข้อมูล...</td></tr>';

    // 1. ดึงการตั้งค่า Template รายงาน
    google.script.run.withSuccessHandler(function(settings) {
      const inputTemplate = document.getElementById('display-template-report');
      const btnTemplate = document.getElementById('btn-open-report-template');
      if (settings['TemplateReport'] && settings['TemplateReport'].trim() !== '') {
        if(inputTemplate) inputTemplate.value = settings['TemplateReport']; 
        if(btnTemplate) {
            btnTemplate.href = settings['TemplateReport']; 
            btnTemplate.style.display = 'inline-block';
        }
      } else {
        if(inputTemplate) inputTemplate.value = "ยังไม่ได้ตั้งค่าลิงก์ Template"; 
        if(btnTemplate) btnTemplate.style.display = 'none';
      }
    }).getSystemSettings();
    
    // 2. ดึงข้อมูลโครงการเพื่อสร้างตาราง
    google.script.run
      .withSuccessHandler(function(projects) {
        // กรองเอาเฉพาะโครงการที่ "อนุมัติ" แล้วเท่านั้น
        const approvedProjects = projects.filter(p => p.status.includes('อนุมัติ'));
        
        if(approvedProjects.length === 0) { 
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color:#e74c3c;">ไม่พบโครงการที่อนุมัติในปีงบประมาณนี้</td></tr>`; 
            return; 
        }

        let html = '';
        approvedProjects.forEach(p => {
          // 🌟 ป้ายสถานะการดำเนินงาน
          let execColor = '#e9ecef'; let execText = '#333';
          let safeExec = String(p.execStatus || "").trim();
          
          if(safeExec === 'รอดำเนินการ') { execColor = '#3498db'; execText = '#fff'; }
          else if(safeExec === 'กำลังดำเนินการ') { execColor = '#9b59b6'; execText = '#fff'; }
          else if(safeExec.includes('เสร็จสิ้น')) { execColor = '#27ae60'; execText = '#fff'; }
          else if(safeExec.includes('ไม่ได้') || safeExec.includes('ยกเลิก')) { execColor = '#e74c3c'; execText = '#fff'; }
          let execBadge = (safeExec !== '' && safeExec !== '-') ? `<span style="background: ${execColor}; color: ${execText}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; display: inline-block; white-space: nowrap;">${safeExec}</span>` : `<span style="color:#aaa;">-</span>`;

          // 🌟 ป้ายสถานะรายงาน
          let repColor = '#e9ecef'; let repText = '#333';
          let safeRep = String(p.reportStatus || "").trim();
          
          if(safeRep === 'แบบร่าง') { repColor = '#95a5a6'; repText = '#fff'; }
          else if(safeRep.includes('อนุมัติ') || safeRep.includes('ผ่าน') || safeRep.includes('สมบูรณ์')) { repColor = '#27ae60'; repText = '#fff'; }
          else if(safeRep.includes('รอ')) { repColor = '#3498db'; repText = '#fff'; }
          else if(safeRep.includes('แก้ไข') || safeRep.includes('ส่งกลับ')) { repColor = '#f39c12'; repText = '#fff'; }
          let repBadge = (safeRep !== '' && safeRep !== '-') ? `<span style="background: ${repColor}; color: ${repText}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; display: inline-block; white-space: nowrap;">${safeRep}</span>` : `<span style="color:#aaa;">-</span>`;

          // 🌟 เข้ารหัสชื่อโครงการเพื่อส่งข้ามฟังก์ชัน
          let safeProjectName = encodeURIComponent(String(p.name || "")).replace(/'/g, "%27");

          // 🌟 สร้างปุ่ม และ ล็อคปุ่มกุญแจ 🔒 ถ้ารอกระทบยอด
          let reportBtn = '';
          let rptBg = (safeRep === 'แบบร่าง' || safeRep.includes('แก้ไข') || safeRep.includes('ส่งกลับ')) ? '#f39c12' : '#2980b9';
          let rptText = (safeRep === 'แบบร่าง' || safeRep.includes('แก้ไข') || safeRep.includes('ส่งกลับ')) ? '<i class="fas fa-edit"></i> ทำรายงานต่อ' : '<i class="fas fa-file-signature"></i> ทำรายงาน';

          if (p.hasPendingRecon) {
             // ถ้าบัญชียังกระทบยอดไม่เสร็จ (บิลยังไม่เคลียร์) ให้ล็อคปุ่ม
             reportBtn = `<button disabled title="ต้องรอเคลียร์บิลเบิกจ่าย/กระทบยอดให้เสร็จสิ้นก่อนครับ" style="background: #bdc3c7; color: white; border: none; padding: 6px 15px; border-radius: 4px; cursor: not-allowed; font-family: 'Kanit'; font-size: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><i class="fas fa-lock"></i> รอกระทบยอด</button>`;
          } else {
             // ถ้าเคลียร์บิลเรียบร้อยแล้ว หรือไม่เคยเบิกเลย เปิดให้กดทำรายงานได้
             reportBtn = `<button onclick="openReportModal('${p.id}', '${safeProjectName}', '${p.url}')" style="background: ${rptBg}; color: white; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-family: 'Kanit'; font-size: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${rptText}</button>`;
          }

          // 🌟 ประกอบร่างตาราง
          html += `<tr style="border-bottom: 1px solid #eee; transition: 0.2s;" onmouseover="this.style.background='#f9fbfc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px; font-weight: bold; color: #2980b9; font-size: 1.05rem;">${p.id}</td>
                    <td style="padding: 15px; font-weight: 500; color: #2c3e50;">${p.name}</td>
                    <td style="padding: 15px; text-align: center;">${execBadge}</td>
                    <td style="padding: 15px; text-align: center;">${repBadge}</td>
                    <td style="padding: 15px; text-align: center;">${reportBtn}</td>
                  </tr>`;
        });
        
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(error) { 
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 20px;">โหลดข้อมูลล้มเหลว: ${error.message}</td></tr>`; 
      })
      .getMyProjectsData(selectedYear);
  }



  // ==========================================
  // ระบบงบกลาง
  // ==========================================
  function loadBudgetAdminDashboard() {
    const yearSelect = document.getElementById('budget-admin-year');
    let year = yearSelect ? yearSelect.value : new Date().getFullYear().toString().substring(2);
    if (year === 'all') {
       let d = new Date(); let by = d.getFullYear() + 543;
       if (d.getMonth() >= 9) by += 1;
       year = String(by).substring(2);
       yearSelect.value = year;
    }
    
    const tbody = document.getElementById('budget-summary-tbody');
    const cardsContainer = document.getElementById('budget-cards-container');
    if (!tbody || !cardsContainer) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #3498db;"></i></td></tr>';
    cardsContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</div>';

    google.script.run
      .withSuccessHandler(function(data) {
        globalActiveProjectsForTransfer = data.projects;
        let tableHtml = ''; let cardsHtml = ''; let labels = [];

        if (data.summary.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #e74c3c; padding: 20px;">ไม่พบข้อมูลประวัติงบอำนวยการกลางในระบบ</td></tr>';
          cardsContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #e74c3c; padding: 20px; background: #fdedec; border-radius: 8px;">ยังไม่มีการตั้งค่างบอำนวยการกลางในปีนี้</div>';
          return;
        }

        data.summary.forEach((item) => {
          let percentUsed = item.total > 0 ? ((item.used / item.total) * 100).toFixed(1) : 0;
          tableHtml += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: 500; color:#2c3e50;">${item.source}</td>
                    <td style="padding: 12px; text-align: right; color:#7f8c8d;">${item.total.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: right; color:#e74c3c;">${item.used.toLocaleString()} <small>(${percentUsed}%)</small></td>
                    <td style="padding: 12px; text-align: right; font-weight:bold; color:#27ae60; font-size:1.1rem;">${item.balance.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center;">
                      <button onclick="openBudgetHistoryModal('${item.source}')" style="background:#3498db; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-size:0.85rem;"><i class="fas fa-search"></i> รายละเอียด</button>
                    </td>
                   </tr>`;
                   
          cardsHtml += `
            <div style="background: white; border: 1px solid #e0e6ed; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.04); border-top: 4px solid #3498db;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 0.95rem; color: #7f8c8d; font-weight: 500;"><i class="fas fa-coins" style="color: #f1c40f;"></i> ${item.source}</div>
              </div>
              <div style="font-size: 1.8rem; font-weight: bold; color: #2c3e50; margin-bottom: 15px; text-align: center;">
                ${item.balance.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: #95a5a6;">บาท</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; border-top: 1px dashed #ecf0f1; padding-top: 10px;">
                <span style="color: #7f8c8d;">ตั้งต้น: <b style="color: #34495e;">${item.total.toLocaleString()}</b></span>
                <span style="color: #e74c3c;">ใช้ไป: <b>${item.used.toLocaleString()}</b></span>
              </div>
            </div>`;
          labels.push(item.source);
        });

        tbody.innerHTML = tableHtml; cardsContainer.innerHTML = cardsHtml;
        populateTransferDropdowns(year, labels);
        loadAllBudgetAdminHistory(year);
      })
      .withFailureHandler(function(error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red; font-weight: bold; padding: 20px;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
        cardsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red; padding: 20px;">โหลดข้อมูลล้มเหลว: ${error.message}</div>`;
      })
      .getCentralBudgetDashboard(year);
  }

  function openBudgetHistoryModal(source) {
    document.getElementById('bh-source-title').innerText = source;
    const tbody = document.getElementById('bh-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังประมวลผลประวัติ...</td></tr>';
    document.getElementById('budgetHistoryModal').style.display = 'flex';

    const yearSelect = document.getElementById('budget-admin-year');
    let year = yearSelect ? yearSelect.value : new Date().getFullYear().toString().substring(2);

    google.script.run
      .withSuccessHandler(function(history) {
        if (history.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c; padding: 30px;">ไม่พบประวัติการเคลื่อนไหวในบัญชีนี้</td></tr>'; return; }
        let html = '';
        history.forEach(h => {
          let isIncome = h.amount > 0; let amtColor = isIncome ? '#27ae60' : '#e74c3c'; let amtSign = isIncome ? '+' : ''; let rowBg = isIncome ? '#f4fdf7' : '#fff'; 
          html += `<tr style="border-bottom: 1px solid #eee; background: ${rowBg};">
                     <td style="padding: 12px; font-size: 0.85rem; color: #7f8c8d;">${h.date}</td>
                     <td style="padding: 12px;"><span style="background: #eaf2f8; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${h.type}</span></td>
                     <td style="padding: 12px; font-size: 0.9rem; color: #333; line-height: 1.4;">${h.desc}</td>
                     <td style="padding: 12px; text-align: right; font-weight: bold; color: ${amtColor};">${amtSign}${h.amount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                     <td style="padding: 12px; text-align: right; font-weight: bold; color: #2c3e50;">${h.balance.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                   </tr>`;
        });
        tbody.innerHTML = html;
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; font-weight: bold; padding: 20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`; })
      .getBudgetAdminHistory(year, source);
  }

  function populateTransferDropdowns(year, sources) {
    const centralId = `BUDGET-ADM-FY${year}`;
    const centralOption = `<option value="${centralId}" style="font-weight:bold; color:#2980b9;">[ส่วนกลาง] งบอำนวยการกลาง</option>`;
    let projectOptions = '';
    globalActiveProjectsForTransfer.forEach(p => { projectOptions += `<option value="${p.id}">[โครงการ] ${p.name}</option>`; });
    const allOptions = `<option value="">-- เลือกโครงการ --</option>` + centralOption + projectOptions;
    document.getElementById('transfer-from').innerHTML = allOptions;
    document.getElementById('transfer-to').innerHTML = allOptions;
    document.getElementById('source-budget-info').style.display = 'none';
    document.getElementById('transfer-source').innerHTML = '<option value="">-- กรุณาเลือกต้นทางก่อน --</option>';
  }

  function fetchSourceBudgetDetails() {
    const fromId = document.getElementById('transfer-from').value;
    const infoBox = document.getElementById('source-budget-info');
    const sourceSelect = document.getElementById('transfer-source');

    if (!fromId) { infoBox.style.display = 'none'; sourceSelect.innerHTML = '<option value="">-- กรุณาเลือกต้นทางก่อน --</option>'; return; }

    infoBox.style.display = 'block'; infoBox.innerHTML = '<div style="text-align:center; color:#7f8c8d;"><i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบกระเป๋าเงิน...</div>';
    sourceSelect.innerHTML = '<option value="">-- กำลังดึงแหล่งเงิน... --</option>';

    google.script.run
      .withSuccessHandler(function(data) {
        if (data.length === 0) {
          infoBox.innerHTML = '<div style="color:#e74c3c; font-weight:bold; text-align:center;"><i class="fas fa-exclamation-triangle"></i> ไม่พบประวัติงบประมาณสำหรับโครงการนี้</div>';
          sourceSelect.innerHTML = '<option value="">-- ไม่มีแหล่งเงินให้โอน --</option>'; return;
        }
        let html = '<div style="font-size:0.95rem; font-weight:bold; color:#2c3e50; margin-bottom:8px;"><i class="fas fa-wallet"></i> สถานะการเงินของโครงการ:</div>';
        let options = '<option value="">-- เลือกแหล่งเงิน --</option>';

        data.forEach(item => {
          let color = item.balance > 0 ? '#27ae60' : '#e74c3c';
          html += `
            <div style="background:#f9fbfc; border:1px solid #eee; border-left:4px solid ${color}; padding:8px; margin-bottom:5px; border-radius:4px;">
              <div style="font-weight:bold; color:#34495e; font-size:0.9rem;">${item.source}</div>
              <div style="font-size:0.85rem; color:#555; display:flex; justify-content:space-between; margin-top:3px;">
                <span>จัดสรร: <b>${item.allocated.toLocaleString()}</b></span>
                <span>ใช้/กันไว้: <b style="color:#e74c3c;">${item.used.toLocaleString()}</b></span>
                <span>คงเหลือ: <b style="color:${color}; font-size:1rem;">${item.balance.toLocaleString()}</b> บ.</span>
              </div>
            </div>`;
          if (item.balance > 0) { options += `<option value="${item.source}">${item.source} (ยอดที่โอนได้: ${item.balance.toLocaleString()} บ.)</option>`; }
        });
        infoBox.innerHTML = html;
        if (options === '<option value="">-- เลือกแหล่งเงิน --</option>') { sourceSelect.innerHTML = '<option value="">-- ยอดเงินคงเหลือไม่พอให้โอน --</option>'; } 
        else { sourceSelect.innerHTML = options; }
      })
      .withFailureHandler(function(err) {
        infoBox.innerHTML = `<div style="color:red;">เกิดข้อผิดพลาด: ${err.message}</div>`;
        sourceSelect.innerHTML = '<option value="">-- เกิดข้อผิดพลาด --</option>';
      })
      .getProjectBudgetDetailsForTransfer(fromId);
  }

  function openTransferModal() { document.getElementById('transferBudgetModal').style.display = 'flex'; }

  function submitBudgetTransfer() {
    const form = document.getElementById('transferBudgetForm');
    if (!form.source.value || !form.fromId.value || !form.toId.value || !form.amount.value || !form.reason.value) { alert("กรุณากรอกข้อมูลให้ครบทุกช่อง"); return; }
    if (form.fromId.value === form.toId.value) { alert("ต้นทางและปลายทางไม่สามารถเป็นโครงการเดียวกันได้"); return; }
    
    const amountStr = Number(form.amount.value).toLocaleString();
    if (!confirm(`ยืนยันการโอนเงิน ${amountStr} บาท จาก ${form.fromId.value} ไปยัง ${form.toId.value} ใช่หรือไม่?`)) return;

    const btn = document.getElementById('btn-submit-transfer');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

    const formData = { source: form.source.value, fromId: form.fromId.value, toId: form.toId.value, amount: form.amount.value, reason: form.reason.value };

    google.script.run
      .withSuccessHandler(function(res) {
        alert(res.message); document.getElementById('transferBudgetModal').style.display = 'none'; form.reset();
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการโอนเงิน';
        loadBudgetAdminDashboard(); 
      })
      .withFailureHandler(function(err) {
        alert("ผิดพลาด: " + err.message);
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการโอนเงิน';
      })
      .executeBudgetTransfer(formData);
  }

  // ==========================================
  // ลอจิกหน้าตะกร้าพิจารณา ผง.2 (Inbox 5 ด่าน)
  // ==========================================
function loadDisbApproveInbox(forceRefresh = false) {
  const tbody = document.getElementById('disb-approve-tbody');
  if (!tbody) return;

  // ⚡ ถ้าโหลดล่วงหน้าไว้แล้ว และไม่ได้กดรีเฟรชใหม่ -> แสดงผลทันทีไม่ต้องรอโหลดซ้ำ
  if (!forceRefresh && window.AppCache && window.AppCache.disbApproveInbox) {
    renderDisbApproveInbox(window.AppCache.disbApproveInbox);
    return;
  }

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังตรวจสอบคิวงาน...</td></tr>';

  google.script.run
    .withSuccessHandler(function(res) {
      console.log("✅ [STEP 2] Server ตอบกลับข้อมูลสำเร็จ:", res);
      window.AppCache = window.AppCache || {};
      window.AppCache.disbApproveInbox = res;
      renderDisbApproveInbox(res);
    })
    .withFailureHandler(function(err) {
      console.error("❌ [STEP 2 FAIL] Server คืนค่า Error:", err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px; font-weight:bold;">เกิดข้อผิดพลาดจากระบบ: ${err.message}</td></tr>`;
    })
    .getDisbApproveInbox();
}

function renderDisbApproveInbox(res) {
  const tbody = document.getElementById('disb-approve-tbody');
  const roleDisplay = document.getElementById('disb-approver-role-display');
  if (!tbody) return;

  try {
    if (!res) {
      throw new Error("Server คืนค่าเป็น null/undefined");
    }

    window.currentDisbInboxData = res.data || [];
    window.currentSignatures = res.signatures || {};
    window.currentCentralBudget = res.centralBudget || 0;

    let roleName = "ผู้ตรวจสอบ";
    let userRole = String(res.role || window.userRole || '').toLowerCase();

    if (userRole.includes('admin')) {
      roleName = "หัวหน้างานแผน (ด่าน 1)";
    } else if (userRole.includes('supply') || userRole.includes('พัสดุ')) {
      roleName = "หัวหน้างานพัสดุ (ด่าน 2)";
    } else if (userRole.includes('finance') || userRole.includes('financial') || userRole.includes('การเงิน')) {
      roleName = "หัวหน้ากลุ่มบริหารงานงบประมาณ (ด่าน 3)";
    } else if (userRole.includes('approver2') || userRole.includes('a2')) {
      roleName = "รองผู้อำนวยการ (ด่าน 4)";
    } else if (userRole.includes('approver3') || userRole.includes('a3')) {
      roleName = "ผู้อำนวยการ (ด่าน 5)";
    }

    if (roleDisplay) {
      roleDisplay.innerText = roleName;
    }

    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #27ae60;"><i class="fas fa-check-circle fa-3x" style="margin-bottom:15px;"></i><br><span style="font-size:1.1rem; font-weight:bold;">เยี่ยมมาก! ตะกร้างานของคุณว่างเปล่า</span><br><span style="font-size:0.9rem; color:#7f8c8d;">ไม่มีคำขอเบิกจ่ายที่รอคิวคุณพิจารณาในขณะนี้</span></td></tr>`;

      if (typeof hideLoading === 'function') hideLoading();
      const overlay = document.getElementById('loading-overlay') || document.getElementById('spinner');
      if (overlay) overlay.style.display = 'none';
      return;
    }

    let html = '';
    res.data.forEach((item, index) => {
      let itemsListHtml = '';

      let realItemCount = 0;
      if (item.items && Array.isArray(item.items)) {
        item.items.forEach(it => {
          if (it.name !== '#SYS_SHIPPING#' && it.name !== '#SYS_VAT#') realItemCount++;
        });
      }

      if (item.items && item.items.length > 0) {
        itemsListHtml = `
          <div style="margin-top: 5px; padding: 15px; border-top: 1px dashed #e0e6ed; background: #fdfefe; border-radius: 8px;">
            <div style="font-weight:bold; color:#8e44ad; margin-bottom:10px;"><i class="fas fa-boxes"></i> รายการที่ขอเบิก (${realItemCount} รายการ)</div>
            <table style="width: 100%; font-size: 0.95rem; border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <thead>
                <tr style="background: #f4f6f8; color: #555; border-bottom: 2px solid #bdc3c7;">
                  <th style="padding: 10px; text-align: left; width: 45%;">รายการ</th>
                  <th style="padding: 10px; text-align: center; width: 15%;">จำนวน</th>
                  <th style="padding: 10px; text-align: right; width: 20%;">ราคา/หน่วย</th>
                  <th style="padding: 10px; text-align: right; width: 20%;">รวม (บ.)</th>
                </tr>
              </thead>
              <tbody>`;

        item.items.forEach(it => {
          let itemName = it.name || '-';
          let qtyText = `${Number(it.qty) || 0} ${it.unit || ''}`;
          let price = Number(it.price) || 0;
          let sum = (Number(it.qty) || 0) * price;

          if (itemName === '#SYS_VAT#') {
            itemName = 'ภาษีมูลค่าเพิ่ม (VAT)';
            qtyText = '-';
            sum = price;
          } else if (itemName === '#SYS_SHIPPING#') {
            itemName = 'ค่าจัดส่ง';
            qtyText = '-';
            sum = price;
          }

          let priceDisplay = price > 0 ? price.toLocaleString() : '-';
          let sumDisplay = sum > 0 ? sum.toLocaleString() : '0.00';

          itemsListHtml += `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px; color: #333;">${itemName}</td>
                  <td style="padding: 10px; text-align: center; color: #666;">${qtyText}</td>
                  <td style="padding: 10px; text-align: right; color: #666;">${priceDisplay}</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #c0392b;">${sumDisplay}</td>
                </tr>`;
        });

        itemsListHtml += `
                <tr style="background: #fdf2e9; border-top: 2px solid #e67e22;">
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; color: #d35400;">รวมเป็นเงินทั้งสิ้น</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #c0392b; font-size: 1.05rem;">${Number(item.grandTotal || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                </tr>`;

        itemsListHtml += `
              </tbody>
            </table>
          </div>`;
      } else {
        itemsListHtml = `<div style="font-size: 0.9rem; color: #e74c3c; margin-top: 10px; padding: 10px; background: #fdf2e9; border-radius: 6px;"><i class="fas fa-exclamation-circle"></i> ไม่พบรายละเอียดรายการพัสดุ</div>`;
      }

      let timestamp = item.timestamp || '-';
      let projectName = item.projectName || '-';
      let projectId = item.projectId || '-';
      let reqId = item.reqId || '-';
      let requesterName = item.requesterName || item.ownerName || '-';
      let grandTotal = Number(item.grandTotal) || 0;
      let status = item.status || '-';

      html += `
        <tr style="border-bottom: 1px solid #eee; background: #fff; transition: 0.2s;" onmouseover="this.style.background='#f9fbfc'" onmouseout="this.style.background='#fff'">
          <td style="padding: 12px; font-size: 0.9rem; color:#555; vertical-align: middle; cursor: pointer;" onclick="toggleDisbApproveCard('${reqId}')">
             ${timestamp.split(' ')[0]}<br><span style="font-size:0.8rem; color:#95a5a6;"><i class="far fa-clock"></i> ${timestamp.split(' ')[1] || ''}</span>
          </td>
          <td style="padding: 12px; vertical-align: middle; cursor: pointer;" onclick="toggleDisbApproveCard('${reqId}')">
             <div style="font-weight: bold; color: #2c3e50; font-size: 1.05rem;">${projectName}</div>
             <div style="font-size:0.85rem; color:#7f8c8d;">[รหัสโครงการ: ${projectId}] | [รหัสคำขอ: <b>${reqId}</b>]</div>
             <div style="font-size: 0.85rem; color: #3498db; margin-top: 6px; font-weight:bold;"><i class="fas fa-chevron-down"></i> คลิกรถเข็นเพื่อกางรายการพัสดุ</div>
          </td>
          <td style="padding: 12px; font-size: 0.95rem; font-weight: bold; color:#2980b9; vertical-align: middle;"><i class="fas fa-user-circle"></i> ${requesterName}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; color: #c0392b; font-size: 1.1rem; vertical-align: middle;">${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
          <td style="padding: 12px; text-align: center; vertical-align: middle;"><span style="background: #f39c12; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight:bold; display: inline-block;">${status}</span></td>
          <td style="padding: 12px; text-align: center; vertical-align: middle;">
            <button onclick="openDisbReviewModal(${index})" style="background: #8e44ad; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Kanit'; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-search"></i> ตรวจสอบ</button>
          </td>
        </tr>
        <tr id="disb-app-detail-${reqId}" style="display: none; background: #fdfefe;">
          <td colspan="6" style="padding: 0 20px 20px 20px; border-bottom: 2px solid #bdc3c7;">
             ${itemsListHtml}
          </td>
        </tr>`;
    });

    tbody.innerHTML = html;
  } catch (renderError) {
    console.error("❌ [STEP 3 ERROR] เกิดข้อผิดพลาดขณะแสดงผล UI:", renderError);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px; font-weight:bold;">เกิดข้อผิดพลาดในการแสดงผล: ${renderError.message}</td></tr>`;
  }
}
function filterDisbAdminTable() {
  const input = document.getElementById('search-disb-admin');
  const filter = input.value.toLowerCase();
  const tbody = document.getElementById('disb-approve-tbody');
  
  if (!tbody) return;
  const trs = tbody.getElementsByTagName('tr');

  for (let i = 0; i < trs.length; i++) {
    // ข้ามแถวที่เป็น Loading หรือแถวที่บอกว่าตะกร้างานว่างเปล่า
    if (trs[i].innerText.includes('กำลังตรวจสอบคิวงาน') || trs[i].innerText.includes('ตะกร้างานว่างเปล่า') || trs[i].innerText.includes('เกิดข้อผิดพลาด')) {
      continue;
    }
    
    // ดึงข้อความทั้งหมดในแถวนั้นมาเช็ค
    const textContent = trs[i].innerText.toLowerCase();
    
    // ถ้าเจอคำค้นหา ให้แสดงแถวไว้ ถ้าไม่เจอให้ซ่อน
    if (textContent.includes(filter)) {
      trs[i].style.display = '';
    } else {
      trs[i].style.display = 'none';
    }
  }
}
// ==========================================
// สร้างกล่องแสดงประวัติความเห็น (Audit Trail)
// ==========================================
function createAuditSignatureBlock(icon, roleName, commentText, position, signs) {
  if (!commentText || commentText === '-') return '';
  
  let nameStr = "ผู้ตรวจสอบ";
  let dateStr = "";
  let cleanComment = commentText;
  
  // 1. แยกชื่อ และวันที่ ออกจากข้อความ
  const match = commentText.match(/^\((.*?)\s*-\s*(.*?)\):\s*([\s\S]*)/);
  if (match) {
    nameStr = match[1].trim();
    dateStr = match[2].trim();
    cleanComment = match[3].trim();
  }

  // 2. เช็คว่าเป็นการปฏิเสธหรือไม่
  const isRejected = cleanComment.includes('✗') || cleanComment.includes('ไม่อนุมัติ') || cleanComment.includes('ส่งกลับ') || cleanComment.includes('ไม่เห็นควร');

  // 3. 🌟 ดึงรูปลายเซ็นมาโชว์ พร้อมเติม Prefix ให้ Base64 🌟
  let signHtml = '';
  if (isRejected) {
     signHtml = `<div style="text-align:right; margin-top:10px; color:#e74c3c; font-size:0.85rem; font-weight:bold;"><i class="fas fa-times-circle"></i> ตีกลับ / ไม่อนุมัติ<br><span style="font-size:0.8rem; color:#7f8c8d; font-weight:normal;">(${nameStr})<br>${position}</span></div>`;
  } 
  else if (nameStr && signs && signs[nameStr] && signs[nameStr].trim() !== '') {
     
     // 💡 จุดสำคัญ: เช็คและเติม data:image ให้ถ้ามันแหว่งไป เบราว์เซอร์จะได้อ่านเป็นรูปภาพได้
     let rawSig = signs[nameStr].trim();
     let imgSrc = rawSig.startsWith('data:image') ? rawSig : `data:image/png;base64,${rawSig}`;
     
     signHtml = `<div style="text-align:right; margin-top:10px;">
                   <img src="${imgSrc}" style="max-height:45px;" onerror="this.style.display='none'"/>
                   <br><span style="font-size:0.8rem; color:#7f8c8d;">(${nameStr})<br>${position}</span>
                 </div>`;
  } 
  else {
     // ถ้าไม่มีข้อมูลลายเซ็น ให้โชว์แค่ชื่อ
     signHtml = `<div style="text-align:right; margin-top:10px; font-size:0.85rem; color:#7f8c8d;">(${nameStr})<br>${position}</div>`;
  }
  
  return `
  <div style="background:white; border-left:4px solid ${isRejected ? '#e74c3c' : '#27ae60'}; border-radius:6px; padding:12px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
     <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dashed #eee; padding-bottom:5px;">
        <b style="color:${isRejected ? '#e74c3c' : '#2c3e50'}; font-size:0.95rem;"><i class="${icon}"></i> ${roleName}</b>
        <span style="font-size:0.8rem; color:#95a5a6;"><i class="far fa-clock"></i> ${dateStr}</span>
     </div>
     <div style="font-size:0.9rem; color:#34495e; line-height:1.5; white-space:pre-wrap;">${cleanComment}</div>
     ${signHtml}
  </div>`;
}

// ==========================================
// แสดงหน้าต่างรายละเอียดคำขอ (สำหรับแอดมิน 5 ด่าน)
// ==========================================
function openDisbReviewModal(index) {
  const item = window.currentDisbInboxData?.[index];
  if (!item) return;

  const el = (id) => document.getElementById(id);
  const fmt = (num) => Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const roleText = el('disb-approver-role-display')?.innerText || '';
  const isPlanRole = roleText.includes('แผน');

  // แกะรายชื่อแหล่งเงินทั้งหมดของโครงการ
  let projectSources = [];
  let rawSrc = String(item.fundingSource || "").trim();
  if (rawSrc.includes('=')) {
    rawSrc.split(',').forEach(s => {
      let name = s.split('=')[0].trim();
      if (name && !projectSources.includes(name)) projectSources.push(name);
    });
  } else if (rawSrc && rawSrc !== '-' && rawSrc !== 'ไม่ระบุแหล่งงบ') {
    projectSources.push(rawSrc);
  }
  if (projectSources.length === 0) projectSources.push('ไม่ระบุแหล่งงบ');

  // --- 1. ข้อมูลทั่วไป ---
  if (el('review-req-id')) el('review-req-id').value = item.reqId || '';
  if (el('review-project-name')) el('review-project-name').innerText = `[${item.projectId || '-'}] ${item.projectName || '-'}`;
  if (el('review-date')) el('review-date').innerText = item.timestamp || '-';
  if (el('review-owner')) el('review-owner').innerText = item.ownerName || '-';

  // --- 2. ประกอบประโยคความประสงค์ ---
  if (el('review-objective-text')) {
    let actionType = item.actionType || 'จัดซื้อ/จัดจ้าง';
    let category = item.itemCategory || 'วัสดุ/ครุภัณฑ์';
    let objText = (item.objective && String(item.objective).trim() !== '' && String(item.objective).trim() !== '-')
      ? String(item.objective).trim() : "การดำเนินงานตามแผน";

    let secText = String(item.projectSection || '-').trim();
    if (/^\d+$/.test(secText) && typeof globalConfigData !== 'undefined' && globalConfigData.sections) {
      let foundSec = globalConfigData.sections.find(s => String(s.code) === secText);
      if (foundSec) secText = foundSec.name;
    }

    el('review-objective-text').innerHTML = `ด้วย <b>${secText}</b> มีความประสงค์ขอดำเนินการ <b>${actionType} ${category}</b> เพื่อ <b>${objText}</b> ตามโครงการ <b>${item.projectName}</b> จึงขออนุมัติงบประมาณ จำนวน <b>${fmt(item.grandTotal)} บาท</b>`;
  }

  // --- 3. ลิงก์เอกสารแนบ ---
  const docLink = el('review-doc-link');
  if (docLink) {
    let linksHtml = '';
    const btnStyle = "display:inline-block; padding:6px 15px; border-radius:20px; text-decoration:none; font-size:0.85rem; margin-bottom:5px; margin-right:5px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);";
    if (item.projectUrl && item.projectUrl.startsWith('http')) {
      linksHtml += `<a href="${item.projectUrl}" target="_blank" style="${btnStyle} background:#f4f6f8; color:#2c3e50; border:1px solid #bdc3c7;"><i class="fas fa-file-word" style="color:#2980b9;"></i> เอกสารโครงการ (ผง.1)</a>`;
    }
    if (item.quotationUrl && item.quotationUrl.startsWith('http')) {
      linksHtml += `<a href="${item.quotationUrl}" target="_blank" style="${btnStyle} background:#3498db; color:white; border:1px solid #2980b9;"><i class="fas fa-file-pdf"></i> ใบเสนอราคา (ผง.2)</a>`;
    }
    docLink.innerHTML = linksHtml || '<span style="color:#e74c3c; font-weight:bold; font-size:0.85rem;"><i class="fas fa-times-circle"></i> ไม่มีเอกสารแนบ</span>';
  }

  // --- 4. ข้อมูลงบประมาณโครงการ ---
  const allocated = Number(item.allocatedBudget) || 0;
  const used = Number(item.usedBudget) || 0;
  const balanceBefore = Number(item.remainingBalance) || 0;
  const requestAmt = Number(item.grandTotal) || 0;
  const balanceAfter = balanceBefore - requestAmt;

  if (el('review-funding-source')) el('review-funding-source').innerText = item.fundingSource || 'ไม่ระบุ';
  if (el('review-fin-allocated')) el('review-fin-allocated').innerText = fmt(allocated);

  let balanceBeforeTr = el('review-fin-balance-before')?.parentElement;
  if (balanceBeforeTr && !el('review-fin-used')) {
    let usedTr = document.createElement('tr');
    usedTr.innerHTML = `<td style="padding:4px 0; color:#7f8c8d;">เบิกไปแล้ว:</td> <td style="text-align:right; font-weight:bold; color:#e74c3c;" id="review-fin-used">${fmt(used)}</td>`;
    balanceBeforeTr.parentNode.insertBefore(usedTr, balanceBeforeTr);
  } else if (el('review-fin-used')) {
    el('review-fin-used').innerText = fmt(used);
  }

  if (el('review-fin-balance-before')) el('review-fin-balance-before').innerText = fmt(balanceBefore);
  if (el('review-fin-request')) el('review-fin-request').innerText = fmt(requestAmt);

  let requestTr = el('review-fin-request')?.parentElement;
  if (requestTr && !el('review-fin-balance-after')) {
    let afterTr = document.createElement('tr');
    afterTr.style.background = '#f4f6f8';
    afterTr.innerHTML = `<td style="padding:8px 10px; color:#2c3e50; font-weight:bold; border-radius:4px 0 0 4px; border-top: 1px solid #d9e2ec;">คงเหลือหลังเบิก:</td> 
                         <td style="text-align: right; font-weight: bold; padding: 8px 10px; border-radius: 0px 4px 4px 0px; font-size: 1.1rem; border-top: 1px solid #d9e2ec;" id="review-fin-balance-after"></td>`;
    requestTr.parentNode.appendChild(afterTr);
  }

  if (el('review-fin-balance-after')) {
    el('review-fin-balance-after').innerText = fmt(balanceAfter);
    el('review-fin-balance-after').style.color = balanceAfter < 0 ? '#c0392b' : '#27ae60';
  }

  // --- 5. จัดการระบบตัดยอด และ ดึงงบส่วนกลาง ---
  let topupAmt = 0;
  if (item.adminComm?.includes('งบอำนวยการสมทบ')) {
    const matchTopup = item.adminComm.match(/งบอำนวยการสมทบ\s*([\d,.]+)/);
    if (matchTopup) topupAmt = Number(matchTopup[1].replace(/,/g, ''));
  } else if (balanceAfter < 0) {
    topupAmt = balanceBefore <= 0 ? requestAmt : requestAmt - balanceBefore;
  }

  const topupBox = el('review-topup-box');
  const normalBox = el('review-normal-box');
  if (topupAmt > 0) {
    if (normalBox) normalBox.style.display = 'none';
    if (topupBox) {
      topupBox.style.display = 'block';
      el('review-fin-from-proj').innerText = fmt(balanceBefore > 0 ? balanceBefore : 0) + " บาท";
      el('review-fin-topup').innerText = fmt(topupAmt) + " บาท";
    }
  } else {
    if (topupBox) topupBox.style.display = 'none';
    if (normalBox) normalBox.style.display = 'block';
  }

  // --- 6. ตารางรายการค่าใช้จ่าย (พร้อม Dropdown เลือกแหล่งเงินรายบรรทัดสำหรับงานแผนงาน) ---
  const itemsTbody = el('review-items-tbody') || document.getElementById('review-items-tbody');
  if (itemsTbody) {
    if (item.items?.length > 0) {
      let sumTotal = 0; let vatAmt = 0; let realItems = [];

      item.items.forEach(it => {
        if (it.name === '#SYS_VAT#') vatAmt = Number(it.price);
        else if (it.name === '#SYS_SHIPPING#') { /* ignore */ }
        else {
          realItems.push(it);
          sumTotal += Number(it.qty) * Number(it.price);
        }
      });

      if (!item.items.some(it => it.name === '#SYS_VAT#')) {
        let diff = requestAmt - sumTotal;
        if (diff > 0) vatAmt = diff;
      }

      const rowsHtml = realItems.map((it, i) => {
        const total = Number(it.qty) * Number(it.price);
        let sourceControlHtml = '';
        if (isPlanRole) {
          let selectedSrc = it.fundingSource || projectSources[0];
          let opts = projectSources.map(s => `<option value="${s}" ${s === selectedSrc ? 'selected' : ''}>${s}</option>`).join('');
          sourceControlHtml = `
            <div style="margin-top:6px;">
              <select class="item-funding-select" data-index="${i}" data-name="${it.name.replace(/"/g, '&quot;')}" data-amount="${total}"
                onchange="updateItemSourceSummary()"
                style="padding:4px 8px; font-size:0.82rem; border:1px solid #3498db; border-radius:4px; background:#eaf2f8; color:#2980b9; font-family:'Kanit'; font-weight:bold; max-width:100%;">
                ${opts}
              </select>
            </div>`;
        } else if (it.fundingSource) {
          sourceControlHtml = `<div style="margin-top:4px;"><span style="background:#eaf2f8; color:#2980b9; padding:2px 8px; border-radius:4px; font-size:0.78rem; font-weight:bold;">แหล่งงบ: ${it.fundingSource}</span></div>`;
        }

        return `
          <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fbfc'}; border-bottom: 1px solid #e0e6ed;">
            <td style="padding: 12px 15px; color:#2c3e50; font-size: 1.05rem;">
              <b>${i + 1}. ${it.name}</b>
              ${sourceControlHtml}
            </td>
            <td style="padding: 12px 15px; text-align:center; font-size: 1rem; color:#555;">${it.qty} ${it.unit}</td>
            <td style="padding: 12px 15px; text-align:right; font-size: 1rem; color:#555;">${fmt(it.price)}</td>
            <td style="padding: 12px 15px; text-align:right; font-weight:bold; color:#c0392b; font-size: 1.1rem; background: #fdf2e9; border-left: 1px solid #fad7a1;">${fmt(total)}</td>
          </tr>`;
      }).join('');

      const footerHtml = `
          <tr style="background: #fdfefe; border-top: 2px solid #bdc3c7;">
            <td colspan="3" style="padding: 8px 15px; text-align:right; font-weight:bold; color:#7f8c8d;">รวมมูลค่าสินค้า</td>
            <td style="padding: 8px 15px; text-align:right; font-weight:bold; color:#34495e;">${fmt(sumTotal)}</td>
          </tr>
          <tr style="background: #fdfefe;">
            <td colspan="3" style="padding: 8px 15px; text-align:right; font-weight:bold; color:#7f8c8d;">ภาษีมูลค่าเพิ่ม (VAT)</td>
            <td style="padding: 8px 15px; text-align:right; font-weight:bold; color:#e67e22;">${fmt(vatAmt)}</td>
          </tr>
          <tr style="background: #2c3e50; color: white; border-top: 2px solid #e74c3c;">
            <td colspan="3" style="padding: 15px; text-align:right; font-size: 1.1rem; font-weight:bold;">รวมเป็นเงินทั้งสิ้น</td>
            <td style="padding: 15px; text-align:right; font-size: 1.3rem; font-weight:bold; color: #f1c40f;">${fmt(requestAmt)} ฿</td>
          </tr>`;

      itemsTbody.innerHTML = rowsHtml + footerHtml;
    } else {
      itemsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding:20px; font-size:1.1rem; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> ไม่พบรายการค่าใช้จ่าย</td></tr>';
    }
  }

  // --- 7. คณะกรรมการ ---
  const commList = el('review-committee-list');
  if (commList) {
    commList.innerHTML = `
      <li style="margin-bottom:5px;"><b>ประธานกรรมการ:</b> ${item.comm1 || '-'}</li>
      ${item.comm2 ? `<li style="margin-bottom:5px;"><b>กรรมการคนที่ 1:</b> ${item.comm2}</li>` : ''}
      ${item.comm3 ? `<li style="margin-bottom:5px;"><b>กรรมการคนที่ 2:</b> ${item.comm3}</li>` : ''}
    `;
  }

  // --- 8. Audit Trail ---
  const signs = window.currentSignatures || {};
  let historyHtml = '';
  if (typeof createAuditSignatureBlock === 'function') {
    if (item.ownerComm) historyHtml += createAuditSignatureBlock('fas fa-user-check', 'เจ้าของโครงการ', item.ownerComm, 'เจ้าของโครงการ', signs);
    if (item.adminComm) historyHtml += createAuditSignatureBlock('fas fa-clipboard-check', 'งานแผนงาน', item.adminComm, 'หัวหน้างานแผนงาน', signs);
    if (item.supplyComm) historyHtml += createAuditSignatureBlock('fas fa-boxes', 'งานพัสดุ', item.supplyComm, 'หัวหน้างานพัสดุ', signs);
    if (item.finComm) historyHtml += createAuditSignatureBlock('fas fa-coins', 'งานการเงิน', item.finComm, 'หัวหน้ากลุ่มบริหารงานงบประมาณ', signs);
    if (item.a2Comm) historyHtml += createAuditSignatureBlock('fas fa-user-tie', 'รองผู้อำนวยการ', item.a2Comm, 'รองผู้อำนวยการฯ', signs);
    if (item.a3Comm) historyHtml += createAuditSignatureBlock('fas fa-stamp', 'ผู้อำนวยการ', item.a3Comm, 'ผู้อำนวยการ', signs);
  }

  const histContainer = el('review-comment-history');
  if (histContainer) {
    if (historyHtml) {
      el('history-content-blocks').innerHTML = historyHtml;
      histContainer.style.display = 'block';
    } else {
      histContainer.style.display = 'none';
    }
  }

  // --- 9. ควบคุมการแสดงผลฟอร์มตามสิทธิ์ผู้ใช้ ---
  const allSections = [
    'review-plan-action-section',
    'review-supply-action-section',
    'review-finance-action-section',
    'review-a2-action-section',
    'review-a3-action-section'
  ];
  allSections.forEach(id => { if (el(id)) el(id).style.display = 'none'; });

  if (isPlanRole) {
  if (el('review-plan-action-section')) el('review-plan-action-section').style.display = 'block';

  // 🌟 รีเซ็ตและตั้งค่าสถานะงบประมาณ + ยอดสมทบอัตโนมัติตามยอดคงเหลือจริง
  const chkExist = el('chk-plan-exist');
  const chkOk = el('chk-budget-ok');
  const chkNotOk = el('chk-budget-not-ok');
  if (chkExist) chkExist.checked = true;
  if (topupAmt > 0) {
    if (chkNotOk) chkNotOk.checked = true;
  } else {
    if (chkOk) chkOk.checked = true;
  }
  togglePlanTopup();

  // 🌟 กล่องสรุปยอดแยกตามแหล่งเงินอัตโนมัติ (คำนวณจาก Dropdown ท้ายแต่ละรายการด้านบน)
  let splitBox = el('plan-split-container');
  if (!splitBox) {
    splitBox = document.createElement('div');
    splitBox.id = 'plan-split-container';
    splitBox.style.cssText = 'margin:10px 0; padding:12px; background:#eaf2f8; border-radius:6px; border-left:4px solid #2980b9;';
    el('review-plan-action-section').insertBefore(splitBox, el('review-plan-action-section').firstChild);
  }
  updateItemSourceSummary();
}
  else if (roleText.includes('พัสดุ')) { if (el('review-supply-action-section')) el('review-supply-action-section').style.display = 'block'; }
  else if (roleText.includes('งบประมาณ') || roleText.includes('การเงิน')) { if (el('review-finance-action-section')) el('review-finance-action-section').style.display = 'block'; }
  else if (roleText.includes('รอง')) { if (el('review-a2-action-section')) el('review-a2-action-section').style.display = 'block'; }
  else if (roleText.includes('ผอ') && !roleText.includes('รอง')) { if (el('review-a3-action-section')) el('review-a3-action-section').style.display = 'block'; }

  const commentInput = el('review-comment');
  if (commentInput) {
    commentInput.value = '';
    commentInput.disabled = false;
    if (commentInput.parentElement) commentInput.parentElement.style.display = 'block';
  }

  // --- 10. ปุ่มด้านล่าง ---
  const footerBtnContainer = document.querySelector('#disbReviewModal .fa-undo')?.closest('div');
  if (footerBtnContainer) {
    let cancelBtnHtml = isPlanRole
      ? `<button onclick="submitDisbReview('cancel')" style="background:#c0392b; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:1rem;"><i class="fas fa-trash-alt"></i> ยกเลิกคำขอ</button>`
      : '';
    footerBtnContainer.innerHTML = `
      ${cancelBtnHtml}
      <button onclick="submitDisbReview('return')" style="background:#e67e22; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:1rem;"><i class="fas fa-undo"></i> ส่งกลับแก้ไข</button>
      <button onclick="submitDisbReview('approve')" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:1rem;"><i class="fas fa-check-circle"></i> อนุมัติ / ส่งต่อ</button>
    `;
  }

  if (el('disbReviewModal')) el('disbReviewModal').style.display = 'flex';
}
function updateItemSourceSummary() {
  const splitBox = document.getElementById('plan-split-container');
  if (!splitBox) return;

  const selects = document.querySelectorAll('.item-funding-select');
  let totals = {};
  let sumItems = 0;

  selects.forEach(sel => {
    let src = sel.value;
    let amt = Number(sel.getAttribute('data-amount')) || 0;
    totals[src] = (totals[src] || 0) + amt;
    sumItems += amt;
  });

  // ถ้ายอดขอเบิกรวม (มี VAT/ค่าส่ง) มากกว่าผลรวมสินค้า ให้บวกส่วนต่างเข้ากองแรกอัตโนมัติ
  const reqTotal = Number(String(document.getElementById('review-fin-request')?.innerText || '0').replace(/,/g, '')) || 0;
  const extraDiff = Number((reqTotal - sumItems).toFixed(2));
  const keys = Object.keys(totals);
  if (extraDiff > 0 && keys.length > 0) {
    totals[keys[0]] += extraDiff;
  }

  let html = `<div style="font-size:0.9rem; font-weight:bold; color:#2980b9; margin-bottom:6px;">
                📌 สรุปยอดตัดงบอัตโนมัติ (เลือกแหล่งเงินที่ท้ายแต่ละรายการด้านบน):
              </div>`;
  keys.forEach(k => {
    html += `<div style="display:flex; justify-content:space-between; font-size:0.88rem; color:#2c3e50; padding:3px 0; border-bottom:1px dashed #d6eaf8;">
               <span>• ${k}</span>
               <b>${totals[k].toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</b>
             </div>`;
  });
  html += `<div style="font-size:0.78rem; color:#27ae60; margin-top:6px;">
             ✓ หากกองใดเงินโครงการไม่พอ ระบบจะดึงงบอำนวยการประเภทเดียวกันมาสมทบอัตโนมัติเมื่อ ผอ. อนุมัติ
           </div>`;
  splitBox.innerHTML = html;
}
function updatePlanSplitSum(targetTotal) {
  let sum = 0;
  document.querySelectorAll('.plan-split-input').forEach(inp => { sum += Number(inp.value) || 0; });
  const statusEl = document.getElementById('plan-split-sum-status');
  if (!statusEl) return;
  const diff = Number((targetTotal - sum).toFixed(2));
  if (Math.abs(diff) < 0.01) {
    statusEl.style.color = '#27ae60';
    statusEl.innerText = `✓ ยอดรวมตรงกับคำขอ (${sum.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท) — หากกองใดไม่พอ ระบบจะดึงงบอำนวยการประเภทเดียวกันมาสมทบอัตโนมัติ`;
  } else {
    statusEl.style.color = '#e74c3c';
    statusEl.innerText = `⚠ ยอดรวมยังไม่ตรง (${sum.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${targetTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท | ต่างกัน ${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท)`;
  }
}
// 🌟 อัปเดตฟังก์ชันตอนกดแก้ไขคำขอ (โชว์กล่องข้อความตีกลับสีแดงด้านบน)
function openEditDisbursementForm(reqId, projectId, encodedName, budget, remaining, encodedSection) {
   const safeBudget = Number(budget) || 0;
   const safeRemaining = Number(remaining) || 0;
   const projName = encodedName ? decodeURIComponent(encodedName) : "ไม่ระบุชื่อโครงการ";
   const projSection = encodedSection ? decodeURIComponent(encodedSection) : "-"; 
   
   const data = window.globalDisbursementsData.find(d => d.reqId === reqId);
   
   // 🌟 1. ดึงข้อเสนอแนะทุกด่านมาโชว์ 🌟
   const reasonBox1 = document.getElementById('disb-return-reason-container');
   const reasonBox2 = document.getElementById('edit-disb-feedback-box');
   
   if (data) {
       // รวบรวมข้อเสนอแนะจากด่านต่างๆ
       let allComments = [data.adminComm, data.supplyComm, data.finComm, data.a2Comm, data.a3Comm]
                         .filter(c => c && String(c).trim() !== "").join('\n\n');
       
       if (allComments !== "") {
           if(reasonBox2) {
               document.getElementById('edit-disb-feedback-text').innerText = allComments;
               reasonBox2.style.display = 'block';
           } else if(reasonBox1) {
               document.getElementById('disb-return-reason-display').innerText = allComments;
               reasonBox1.style.display = 'block';
           }
       } else {
           if (data.comments && data.comments.trim() !== "") {
               if(reasonBox2) { document.getElementById('edit-disb-feedback-text').innerText = data.comments; reasonBox2.style.display = 'block'; }
               else if(reasonBox1) { document.getElementById('disb-return-reason-display').innerText = data.comments; reasonBox1.style.display = 'block'; }
           } else {
               if(reasonBox1) reasonBox1.style.display = 'none';
               if(reasonBox2) reasonBox2.style.display = 'none';
           }
       }
   }

   if(!data) {
      alert("เกิดข้อผิดพลาด: ไม่พบข้อมูลคำขอนี้ในระบบ");
      return;
   }

   document.getElementById('edit-disb-req-id').value = data.reqId || "";
   document.getElementById('edit-disb-old-url').value = data.oldDocUrl || "";
   document.getElementById('edit-old-file-notice').style.display = 'block';

   const displayId = projectId || data.projectId || "";
   document.getElementById('disb-project-id').value = displayId;
   document.getElementById('disb-project-budget').value = safeBudget;
   document.getElementById('disb-project-name-display').innerText = `[${displayId}] ${projName} (รหัสคำขอ: ${data.reqId})`;
   document.getElementById('disb-project-budget-display').innerHTML = `งบประมาณโครงการ: <b>${safeBudget.toLocaleString()}</b> บาท | คงเหลือ: <b style="color:${safeRemaining<0?'red':'green'}">${safeRemaining.toLocaleString()}</b> บาท`;

   // 🌟 นำค่าสังกัดงานไปใส่ในช่อง
   const sectionInput = document.getElementById('disb-project-section');
   if (sectionInput) {
       sectionInput.value = projSection;
       sectionInput.readOnly = false; 
       sectionInput.style.backgroundColor = '#ffffff';
       sectionInput.style.cursor = 'text';
   }

   document.getElementById('comm-1').value = data.comm1 || "";
   document.getElementById('comm-2').value = data.comm2 || "";
   document.getElementById('comm-3').value = data.comm3 || "";
   
   const tbody = document.getElementById('disb-items-tbody');
   tbody.innerHTML = ''; 
   
   if (data.items && data.items.length > 0) {
       data.items.forEach(it => {
           addDisbursementItemRow();
           const lastRow = tbody.lastElementChild;
           lastRow.querySelector('.item-name').value = it.name || "";
           lastRow.querySelector('.item-qty').value = it.qty || 1;
           lastRow.querySelector('.item-unit').value = it.unit || "";
           lastRow.querySelector('.item-price').value = it.price || 0;
       });
   } else {
       addDisbursementItemRow();
   }
   calculateDisbursementTotal();

   document.getElementById('btn-draft-disb').innerHTML = '<i class="fas fa-save"></i> บันทึกแบบร่าง';
   const btnSubmit = document.getElementById('btn-submit-disb');
   btnSubmit.innerHTML = '<i class="fas fa-sync-alt"></i> ส่งคำขอที่แก้ไขแล้ว (Resubmit)';
   btnSubmit.style.background = "#e67e22"; 
   
  document.getElementById('hidden-project-name').innerText = projName;

  const savedActions = data.actionType || "";
  document.querySelectorAll('input[name="actionType"]').forEach(cb => {
      cb.checked = savedActions.includes(cb.value);
  });
  const savedCats = data.itemCategory || "";
  document.querySelectorAll('input[name="itemCategory"]').forEach(cb => {
      cb.checked = savedCats.includes(cb.value);
  });
  
  const objInput = document.getElementById('disb-objective');
  if (objInput) objInput.value = data.objective || "";
  
  const reqTypeInput = document.getElementById('disb-req-type');
  if (reqTypeInput) reqTypeInput.value = 'normal';
  const normalDisplay = document.getElementById('normal-project-display');
  const centralDisplay = document.getElementById('central-project-display');
  if (normalDisplay) normalDisplay.style.display = 'block';
  if (centralDisplay) centralDisplay.style.display = 'none';

  document.getElementById('disbursementModal').style.display = 'flex'; 
   
  setTimeout(updateSentencePreview, 100); 
}

  // ==========================================
// 🌟 ฟังก์ชันส่งข้อมูลพิจารณาและดึงตัวเลือก
// ==========================================
function submitDisbReview(action) {
  const reqId = document.getElementById('review-req-id').value;
  let comment = document.getElementById('review-comment').value.trim();

  const roleDisplay = document.getElementById('disb-approver-role-display');
  const roleText = roleDisplay ? roleDisplay.innerText : '';
  let topupAmount = 0;
  let itemSources = [];

  // 1. ด่านงานแผนงาน
  if (roleText.includes('แผน')) {
    if (action === 'approve') {
      let planOpinion = "[บันทึกความเห็นจากงานแผนงาน] \n";

      // 🌟 เก็บแหล่งงบประมาณรายบรรทัด + รวมยอดแยกกองอัตโนมัติ
      const selects = document.querySelectorAll('.item-funding-select');
      let totals = {};
      let sumItems = 0;

      selects.forEach(sel => {
        let src = sel.value;
        let name = sel.getAttribute('data-name');
        let amt = Number(sel.getAttribute('data-amount')) || 0;
        itemSources.push({ name: name, source: src });
        totals[src] = (totals[src] || 0) + amt;
        sumItems += amt;
      });

      const reqTotal = Number(String(document.getElementById('review-fin-request')?.innerText || '0').replace(/,/g, '')) || 0;
      const extraDiff = Number((reqTotal - sumItems).toFixed(2));
      const keys = Object.keys(totals);
      if (extraDiff > 0 && keys.length > 0) {
        totals[keys[0]] += extraDiff;
      }

      if (keys.length > 0) {
        let splitParts = keys.map(k => `${k}=${Number(totals[k].toFixed(2))}`);
        planOpinion += `[แผนการตัดงบ: ${splitParts.join(', ')}] \n`;
      }

      if (document.getElementById('chk-plan-exist') && document.getElementById('chk-plan-exist').checked) planOpinion += "✓ มีโครงการในแผนปฏิบัติการ \n";
      if (document.getElementById('chk-budget-ok') && document.getElementById('chk-budget-ok').checked) planOpinion += "✓ งบประมาณเพียงพอ \n";
      if (document.getElementById('chk-budget-not-ok') && document.getElementById('chk-budget-not-ok').checked) {
        topupAmount = Number(document.getElementById('plan-topup-amount')?.value) || 0;
        if (topupAmount <= 0) {
          Swal.fire({
            icon: 'warning',
            title: 'กรุณาระบุยอดงบสมทบ',
            text: 'คุณเลือก "งบประมาณไม่เพียงพอ" กรุณาระบุยอดงบอำนวยการสมทบให้มากกว่า 0 บาทครับ',
            confirmButtonColor: '#e74c3c'
          });
          return;
        }
        planOpinion += `⚠ งบประมาณไม่เพียงพอ (เสนอขอใช้งบอำนวยการสมทบ ${topupAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท) \n`;
      }
      comment = planOpinion + (comment ? "\nหมายเหตุเพิ่มเติม: " + comment : "");
    } else if (action === 'return' || action === 'cancel') {
      let prefix = action === 'return' ? "✗ ตีกลับให้แก้ไข\n" : "✗ ยกเลิกคำขอ\n";
      comment = "[บันทึกความเห็นจากงานแผนงาน]\n" + prefix + (comment ? "เหตุผล: " + comment : "");
    }
  }

  // 2. ด่านงานพัสดุ
  if (roleText.includes('พัสดุ')) {
    const chkOk = document.getElementById('chk-supply-ok');
    const chkNotOk = document.getElementById('chk-supply-not-ok');
    if (action === 'approve' && chkNotOk && chkNotOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณติ๊กเลือก 'ไม่เห็นควรอนุมัติ' กรุณากดปุ่มสีแดง 'ส่งกลับไปแก้ไข' แทนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    if (action === 'return' && chkOk && chkOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณกดปุ่มตีกลับ แต่ยังไม่ได้ติ๊กเลือก 'ไม่เห็นควรอนุมัติ' กรุณาเปลี่ยนตัวเลือกก่อนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    let supplyOpinion = "[ความเห็นงานพัสดุ] \n";
    if (chkOk && chkOk.checked) supplyOpinion += "✓ เห็นควรอนุมัติให้ดำเนินการได้ตามระเบียบ \n";
    else if (chkNotOk && chkNotOk.checked) {
      supplyOpinion += "✗ ไม่เห็นควรอนุมัติให้ดำเนินการ \n";
      if (!comment) {
        Swal.fire({ icon: 'warning', title: 'โปรดระบุเหตุผล', text: "กรุณาระบุเหตุผลในช่องข้อเสนอแนะด้วยครับ ว่าทำไมถึงไม่อนุมัติ", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
      }
    }
    comment = supplyOpinion + (comment ? "\nเหตุผลประกอบ: " + comment : "");
  }

  // 3. ด่านงานการเงิน
  if (roleText.includes('งบประมาณ') || roleText.includes('ด่าน 3')) {
    const chkOk = document.getElementById('chk-finance-ok');
    const chkNotOk = document.getElementById('chk-finance-not-ok');
    if (action === 'approve' && chkNotOk && chkNotOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณติ๊กเลือก 'ไม่เห็นควรให้ดำเนินการ' กรุณากดปุ่มสีแดง 'ส่งกลับไปแก้ไข' แทนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    if (action === 'return' && chkOk && chkOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณกดปุ่มตีกลับ แต่ยังไม่ได้ติ๊กเลือก 'ไม่เห็นควรให้ดำเนินการ' กรุณาเปลี่ยนตัวเลือกก่อนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    let finOpinion = "[ความเห็นงานการเงิน] \n";
    if (chkOk && chkOk.checked) finOpinion += "✓ เห็นควรให้ดำเนินการ \n";
    else if (chkNotOk && chkNotOk.checked) {
      finOpinion += "✗ ไม่เห็นควรให้ดำเนินการ \n";
      if (!comment) {
        Swal.fire({ icon: 'warning', title: 'โปรดระบุเหตุผล', text: "กรุณาระบุเหตุผลในช่องข้อเสนอแนะด้วยครับ ว่าทำไมถึงไม่เห็นควรให้ดำเนินการ", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
      }
    }
    comment = finOpinion + (comment ? "\nเหตุผลประกอบ: " + comment : "");
  }

  // 4. ด่านรองผู้อำนวยการ (A2)
  if (roleText.includes('รอง') || roleText.includes('ด่าน 4')) {
    const chkOk = document.getElementById('chk-a2-ok');
    const chkNotOk = document.getElementById('chk-a2-not-ok');
    if (action === 'approve' && chkNotOk && chkNotOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณติ๊กเลือก 'ไม่เห็นควรอนุมัติ' กรุณากดปุ่มสีแดง 'ส่งกลับไปแก้ไข' แทนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    if (action === 'return' && chkOk && chkOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณกดปุ่มตีกลับ แต่ยังไม่ได้ติ๊กเลือก 'ไม่เห็นควรอนุมัติ' กรุณาเปลี่ยนตัวเลือกก่อนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    let a2Opinion = "[ความเห็นรองผู้อำนวยการ] \n";
    if (chkOk && chkOk.checked) a2Opinion += "✓ เห็นควรอนุมัติ \n";
    else if (chkNotOk && chkNotOk.checked) {
      a2Opinion += "✗ ไม่เห็นควรอนุมัติ \n";
      if (!comment) {
        Swal.fire({ icon: 'warning', title: 'โปรดระบุเหตุผล', text: "กรุณาระบุเหตุผลในช่องข้อเสนอแนะด้วยครับ ว่าทำไมถึงไม่เห็นควรอนุมัติ", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
      }
    }
    comment = a2Opinion + (comment ? "\nเหตุผลประกอบ: " + comment : "");
  }

  // 5. ด่านผู้อำนวยการ (A3)
  if ((roleText.includes('ผอ') || roleText.includes('ด่าน 5')) && !roleText.includes('รอง')) {
    const chkOk = document.getElementById('chk-a3-ok');
    const chkNotOk = document.getElementById('chk-a3-not-ok');
    if (action === 'approve' && chkNotOk && chkNotOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณติ๊กเลือก 'ไม่อนุมัติ' กรุณากดปุ่มสีแดง 'ส่งกลับไปแก้ไข' แทนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    if (action === 'return' && chkOk && chkOk.checked) {
      Swal.fire({ icon: 'warning', title: 'ปุ่มไม่สอดคล้อง', text: "คุณกดปุ่มตีกลับ แต่ยังไม่ได้ติ๊กเลือก 'ไม่อนุมัติ' กรุณาเปลี่ยนตัวเลือกก่อนครับ!", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
    }
    let a3Opinion = "[คำสั่งผู้อำนวยการ] \n";
    if (chkOk && chkOk.checked) a3Opinion += "✓ อนุมัติ \n";
    else if (chkNotOk && chkNotOk.checked) {
      a3Opinion += "✗ ไม่อนุมัติ \n";
      if (!comment) {
        Swal.fire({ icon: 'warning', title: 'โปรดระบุเหตุผล', text: "กรุณาระบุเหตุผลในช่องข้อเสนอแนะด้วยครับ ว่าทำไมถึงไม่อนุมัติ", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }); return;
      }
    }
    comment = a3Opinion + (comment ? "\nเหตุผลประกอบ: " + comment : "");
  }

  if ((action === 'return' || action === 'cancel') && !comment) {
    Swal.fire({ icon: 'warning', title: 'ขาดข้อมูลเหตุผล', text: "กรุณาระบุเหตุผลที่ตีกลับหรือยกเลิก ลงในช่องบันทึกความเห็นด้านล่างครับ", confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } });
    return;
  }

  let swalTitle = action === 'approve' ? 'ยืนยันการผ่านเรื่อง/อนุมัติ?' : (action === 'cancel' ? 'ยืนยันการยกเลิกคำขอนี้ถาวร?' : 'ยืนยันการส่งกลับแก้ไข/ไม่อนุมัติ?');
  let btnColor = action === 'approve' ? '#27ae60' : (action === 'cancel' ? '#c0392b' : '#e67e22');
  let confirmText = action === 'approve' ? 'ใช่, อนุมัติ/ส่งต่อ' : (action === 'cancel' ? 'ใช่, ยกเลิกคำขอ (คืนเงิน)' : 'ใช่, ตีกลับเลย');

  Swal.fire({
    title: swalTitle,
    text: action === 'cancel' ? "หากยกเลิกแล้วยอดเงินจะถูกคืนกลับเข้าโครงการอัตโนมัติ และคำขอนี้จะไม่สามารถนำกลับมาแก้ไขได้อีก ยืนยันหรือไม่?" : "คุณตรวจสอบความถูกต้องครบถ้วนแล้วใช่หรือไม่?",
    icon: action === 'cancel' ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: btnColor,
    cancelButtonColor: '#bdc3c7',
    confirmButtonText: confirmText,
    cancelButtonText: 'ปิด',
    customClass: { container: 'kanit-font' }
  }).then((result) => {
    if (result.isConfirmed) {
      document.getElementById('disbReviewModal').style.display = 'none';
      const tbody = document.getElementById('disb-approve-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-3x" style="color: #8e44ad; margin-bottom: 15px;"></i><br><span style="font-size: 1.1rem; color: #333;">กำลังประมวลผลคำสั่งและแจ้งเตือน...</span></td></tr>';
      }

      google.script.run
        .withSuccessHandler(function(res) {
          if (window.AppCache) {
            window.AppCache.disbApproveInbox = null;
            window.AppCache.supplyDocs = null;
          }
          Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: res.message, confirmButtonColor: '#27ae60', customClass: { container: 'kanit-font' } }).then(() => { loadDisbApproveInbox(true); });
        })
        .withFailureHandler(function(err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: "ไม่สามารถบันทึกข้อมูลได้: " + err.message, confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } }).then(() => { loadDisbApproveInbox(true); });
        })
        .processDisbursementReview({ reqId: reqId, action: action, comment: comment, topupAmount: topupAmount, itemSources: itemSources });
    }
  });
}

// ==========================================
// 🌟 2. อัปเดตฟังก์ชันโหลดตะกร้าพัสดุ (ใส่ปุ่มใหม่)
// ==========================================
function loadSupplyDocsDashboard(forceRefresh = false) {
  const tbodyPending = document.getElementById('supply-docs-pending-tbody');
  const tbodyCompleted = document.getElementById('supply-docs-completed-tbody');
  if (!tbodyPending || !tbodyCompleted) return;

  // ⚡ ถ้าโหลดล่วงหน้าไว้แล้ว และไม่ได้กดรีเฟรชใหม่ -> แสดงผลทันทีไม่ต้องรอโหลดซ้ำ
  if (!forceRefresh && window.AppCache && Array.isArray(window.AppCache.supplyDocs)) {
    renderSupplyDocsDashboard(window.AppCache.supplyDocs);
    return;
  }

  tbodyPending.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color:#8e44ad;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงคิวงาน...</td></tr>';
  tbodyCompleted.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color:#27ae60;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงคิวงาน...</td></tr>';

  google.script.run
    .withSuccessHandler(function(res) {
      const dataList = (res && res.data) ? res.data : [];
      window.AppCache = window.AppCache || {};
      window.AppCache.supplyDocs = dataList;
      renderSupplyDocsDashboard(dataList);
    })
    .withFailureHandler(function(err) { alert("โหลดพัสดุผิดพลาด: " + err.message); })
    .getSupplyDocsList();
}
function renderSupplyDocsDashboard(dataList) {
  const tbodyPending = document.getElementById('supply-docs-pending-tbody');
  const tbodyCompleted = document.getElementById('supply-docs-completed-tbody');
  if (!tbodyPending || !tbodyCompleted) return;

  globalSupplyDocsData = dataList || [];

  // ฟังก์ชันย่อยสร้าง HTML ของแต่ละแถว (ซ่อนรายละเอียดเป็น default ทั้งหมด)
  const buildSupplyRowHtml = (item, isPending) => {
    const bills = item.bills || [];
    const allMatchedText = bills.map(b => b.matchedItems || '').join(' | ');

    let itemsListHtml = `<ul style="margin: 0; padding-left: 15px; font-size: 0.85rem; color: #2c3e50; line-height: 1.8;">`;
    if (item.items && item.items.length > 0) {
      item.items.forEach(it => {
        if (it.name === '#SYS_VAT#' || it.name === '#SYS_SHIPPING#') return;
        let srcTag = it.fundingSource
          ? ` <span style="background:#eaf2f8; color:#2980b9; padding:1px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${it.fundingSource}</span>`
          : '';
        let hasBillTag = (allMatchedText && allMatchedText.includes(it.name))
          ? ` <span style="background:#e9f7ef; color:#27ae60; border:1px solid #a9dfbf; padding:1px 6px; border-radius:4px; font-size:0.72rem; font-weight:bold;"><i class="fas fa-check-circle"></i> มีบิลแล้ว</span>`
          : '';
        itemsListHtml += `<li><b>${it.name}</b> <span style="color:#7f8c8d;">(${it.qty} ${it.unit} x ${Number(it.price).toLocaleString()} บ.)</span>${srcTag}${hasBillTag}</li>`;
      });
    } else {
      itemsListHtml += `<li style="color:#e74c3c;">ไม่มีข้อมูลรายการ</li>`;
    }
    itemsListHtml += '</ul>';

    let attachedBillsHtml = '';
    if (bills.length > 0) {
      let billBtns = bills.map((b, idx) => `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; padding:6px 8px; background:#f8f9fa; border:1px solid #d5f5e3; border-radius:5px;">
          <a href="${b.url}" target="_blank" style="background:#27ae60; color:white; padding:3px 10px; border-radius:4px; text-decoration:none; font-size:0.78rem; font-weight:bold; white-space:nowrap;">
            <i class="fas fa-receipt"></i> ดูบิล ${idx + 1} (${Number(b.amount).toLocaleString()} ฿)
          </a>
          <span style="font-size:0.8rem; color:#2c3e50;"><b>จับคู่รายการ:</b> ${b.matchedItems || '-'}</span>
        </div>`).join('');

      attachedBillsHtml = `
        <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #a9dfbf;">
          <div style="font-size:0.82rem; font-weight:bold; color:#27ae60; margin-bottom:6px;">
            <i class="fas fa-file-invoice-dollar"></i> บิลที่ครูแนบเข้ามาในระบบ (${bills.length} ใบ):
          </div>
          ${billBtns}
        </div>`;
    } else {
      attachedBillsHtml = `
        <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #eee; font-size:0.78rem; color:#95a5a6;">
          <i class="far fa-clock"></i> ครูยังไม่ได้แนบบิลเข้ามาในระบบ
        </div>`;
    }

    let billCountBadge = bills.length > 0
      ? `<div style="margin-top:4px;"><span style="background:#27ae60; color:white; padding:2px 6px; border-radius:10px; font-size:0.7rem; font-weight:bold;"><i class="fas fa-receipt"></i> มีบิล ${bills.length} ใบ</span></div>`
      : '';

    let statuses = ['รอจัดทำเอกสาร', 'จัดทำเอกสารแล้ว', 'ยกเลิกรายการ'];
    let statusOptions = statuses.map(s => `<option value="${s}" ${(item.docStatus === s) ? 'selected' : ''}>${s}</option>`).join('');
    let bgDrop = item.docStatus === 'จัดทำเอกสารแล้ว' ? '#e9f7ef' : (item.docStatus === 'ยกเลิกรายการ' ? '#fdedec' : '#fff');
    let selectHtml = `<select onchange="toggleSupplyDocStatus('${item.reqId}', this.value)" style="padding:6px; border-radius:4px; font-family:'Kanit'; border:1px solid #bdc3c7; width:100%; font-size:0.85rem; background:${bgDrop}; cursor:pointer;">${statusOptions}</select>`;

    let actionButtons = `
      <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
        <div style="display:flex; gap:4px;">
          <button onclick="exportExcelSupply('${item.reqId}')" style="flex:1; background:#27ae60; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.75rem;"><i class="fas fa-file-excel"></i> Excel</button>
          <button onclick="printDisbursementDocument('${item.reqId}')" style="flex:1; background:#e74c3c; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.75rem;"><i class="fas fa-print"></i> ผง.2</button>
        </div>
        <div style="display:flex; gap:4px;">
          <button onclick="openSupplyDocModal('${item.reqId}', 'จัดซื้อ')" style="flex:1; background:#2980b9; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.75rem;"><i class="fas fa-file-word"></i> จัดซื้อ</button>
          <button onclick="openSupplyDocModal('${item.reqId}', 'จัดจ้าง')" style="flex:1; background:#8e44ad; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.75rem;"><i class="fas fa-file-word"></i> จัดจ้าง</button>
        </div>
      </div>`;

    let actionBadge = item.actionType || "จัดซื้อ/จัดจ้าง";
    let catBadge = item.itemCategory || "วัสดุ/ครุภัณฑ์";
    let sectionText = item.projectSection || "-";
    let objectiveText = item.objective || "การดำเนินงานของโครงการ";
    let fundingText = (item.fundingSource && item.fundingSource !== '-') ? item.fundingSource : "งบประมาณที่ได้รับจัดสรร";

    let displayStyle = 'none';
    let iconClass = 'fa-chevron-down';

    return `
      <tr style="border-top: 2px solid #ecf0f1; background:${isPending ? '#fff' : '#f9fbfc'}; transition: 0.2s;">
        <td style="padding: 12px; cursor: pointer; width:10%;" onclick="toggleSupplyCard('${item.reqId}')">
          <div style="color:#7f8c8d; font-size:0.8rem;"><i class="far fa-clock"></i> ${item.timestamp.split(' ')[0]}</div>
          <div style="font-weight:bold; color:#8e44ad; font-size:0.85rem;">[${item.reqId}]</div>
          ${billCountBadge}
        </td>
        <td style="padding: 12px; cursor: pointer; width:52%; border-right: 1px dashed #eee;" colspan="2" onclick="toggleSupplyCard('${item.reqId}')">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight:bold; color:#2c3e50; font-size:1.05rem; margin-bottom:4px;">
                ${item.projectName} <span style="font-size:0.8rem; background:#f1c40f; color:#333; padding:2px 6px; border-radius:4px; margin-left:5px;">${actionBadge} ${catBadge}</span>
              </div>
              <div style="font-size:0.85rem; color:#e67e22;"><i class="fas fa-building"></i> ${sectionText} <span style="color:#bdc3c7;">|</span> <i class="fas fa-user"></i> ${item.requesterName}</div>
            </div>
            <i id="supply-icon-${item.reqId}" class="fas ${iconClass} fa-lg" style="color:#bdc3c7; transition:0.3s;"></i>
          </div>
        </td>
        <td style="padding: 12px; text-align:right; font-weight:bold; color:#c0392b; width:10%;">${Number(item.total).toLocaleString('en-US')} ฿</td>
        <td style="padding: 12px; text-align:center; width:12%;">${selectHtml}</td>
        <td style="padding: 12px; text-align:center; width:16%;">${actionButtons}</td>
      </tr>
      <tr id="supply-detail-${item.reqId}" style="display: ${displayStyle}; background: #fdfefe;">
        <td colspan="6" style="padding: 15px 20px; border-bottom: 2px solid #ecf0f1;">
          <div style="display:flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex:1; min-width: 250px; background:#eaf2f8; padding:10px; border-radius:6px; border-left:4px solid #3498db;">
              <div style="font-size:0.8rem; color:#7f8c8d; font-weight:bold; margin-bottom:5px;">สรุปความประสงค์:</div>
              <div style="font-size:0.9rem; color:#34495e;">"ด้วย <b>${sectionText}</b> มีความประสงค์ขอดำเนินการ <b>${actionBadge} ${catBadge}</b> เพื่อ <b>${objectiveText}</b> ตามโครงการนี้ โดยใช้งบ <b>${fundingText}</b>"</div>
            </div>
            <div style="flex:2; min-width: 300px; background:#fff; padding:10px; border-radius:6px; border:1px solid #e0e6ed;">
              <div style="font-size:0.85rem; font-weight:bold; color:#2c3e50; margin-bottom:5px; border-bottom:1px dashed #eee; padding-bottom:5px;"><i class="fas fa-box"></i> รายการสิ่งของที่ขอเบิก:</div>
              ${itemsListHtml}
              ${attachedBillsHtml}
              <div style="font-size:0.8rem; color:#7f8c8d; margin-top:8px; padding-top:5px; border-top:1px dashed #eee;"><i class="fas fa-users"></i> กรรมการ: ${item.comm1 || '-'} | ${item.comm2 || '-'} | ${item.comm3 || '-'}</div>
            </div>
          </div>
        </td>
      </tr>`;
  };

  const pendingItems = globalSupplyDocsData.filter(item => item.docStatus === 'รอจัดทำเอกสาร' || !item.docStatus);
  const completedItems = globalSupplyDocsData.filter(item => item.docStatus && item.docStatus !== 'รอจัดทำเอกสาร');

  const pendingWithBills = pendingItems
    .filter(item => item.bills && item.bills.length > 0)
    .sort((a, b) => a.reqId.localeCompare(b.reqId));

  const pendingNoBills = pendingItems
    .filter(item => !item.bills || item.bills.length === 0)
    .sort((a, b) => a.reqId.localeCompare(b.reqId));

  completedItems.sort((a, b) => b.reqId.localeCompare(a.reqId));

  let pendingHtml = '';
  if (pendingWithBills.length > 0) {
    pendingHtml += `
      <tr style="background:#e9f7ef; border-top:2px solid #27ae60; border-bottom:2px solid #a9dfbf;">
        <td colspan="6" style="padding:10px 15px; font-weight:bold; color:#1e8449; font-size:0.95rem;">
          <i class="fas fa-receipt"></i> ส่วนที่ 1: รายการที่แนบบิลแล้ว (${pendingWithBills.length} รายการ) — เรียงตามลำดับมาก่อนอยู่บน
        </td>
      </tr>`;
    pendingWithBills.forEach(item => { pendingHtml += buildSupplyRowHtml(item, true); });
  }

  if (pendingNoBills.length > 0) {
    pendingHtml += `
      <tr style="background:#fef5e7; border-top:3px solid #e67e22; border-bottom:2px solid #fad7a0;">
        <td colspan="6" style="padding:10px 15px; font-weight:bold; color:#d35400; font-size:0.95rem;">
          <i class="far fa-clock"></i> ส่วนที่ 2: รายการที่ยังไม่ได้แนบบิล (${pendingNoBills.length} รายการ) — เรียงตามลำดับมาก่อนอยู่บน
        </td>
      </tr>`;
    pendingNoBills.forEach(item => { pendingHtml += buildSupplyRowHtml(item, true); });
  }

  let completedHtml = '';
  completedItems.forEach(item => { completedHtml += buildSupplyRowHtml(item, false); });

  tbodyPending.innerHTML = pendingHtml || '<tr><td colspan="6" style="text-align: center; padding: 30px; color:#95a5a6;">ไม่มีคิวงานรอจัดทำเอกสาร</td></tr>';
  tbodyCompleted.innerHTML = completedHtml || '<tr><td colspan="6" style="text-align: center; padding: 30px; color:#95a5a6;">ยังไม่มีงานที่ออกเอกสารแล้ว</td></tr>';
}
// ==========================================
// 🌟 3. ฟังก์ชันจองที่ไว้สำหรับ ออกเอกสารจัดซื้อ/จัดจ้าง
// ==========================================
function generatePurchaseDoc(reqId) {
    Swal.fire({
        icon: 'info',
        title: 'เตรียมพร้อม',
        text: `ระบบเตรียมพร้อมสำหรับสร้าง "เอกสารจัดซื้อ" รหัส ${reqId} แล้วครับ รอเชื่อมต่อเทมเพลตเท่านั้น`,
        customClass: { container: 'kanit-font' }
    });
}

function generateHireDoc(reqId) {
    Swal.fire({
        icon: 'info',
        title: 'เตรียมพร้อม',
        text: `ระบบเตรียมพร้อมสำหรับสร้าง "เอกสารจัดจ้าง" รหัส ${reqId} แล้วครับ รอเชื่อมต่อเทมเพลตเท่านั้น`,
        customClass: { container: 'kanit-font' }
    });
}

  // ==========================================
  // 🌟 ฟังก์ชันตอบสนองเมื่อเปลี่ยนสถานะใน Dropdown (โชว์การโหลดทั้ง 2 กล่อง)
  // ==========================================
  function toggleSupplyDocStatus(reqId, newStatus) {
     const tbodyPending = document.getElementById('supply-docs-pending-tbody');
     const tbodyCompleted = document.getElementById('supply-docs-completed-tbody');
     
     if (tbodyPending) tbodyPending.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color:#e67e22;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังย้ายรายการ...</td></tr>';
     if (tbodyCompleted) tbodyCompleted.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color:#27ae60;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังย้ายรายการ...</td></tr>';
     
     google.script.run
       .withSuccessHandler(function(res) { 
           loadSupplyDocsDashboard(true); 
       })
       .withFailureHandler(function(err) { 
           alert("ผิดพลาด: " + err.message);
           loadSupplyDocsDashboard(true); 
       })
       .updateSupplyDocStatus(reqId, newStatus);
  }

  // ==========================================
  // 🌟 ฟังก์ชันเปิด Modal ผง.2 (โหมด View Only - หน้าทะเบียนพัสดุ)
  // ==========================================
  function openSupplyDisbModal(index) {
     const item = globalSupplyDocsData[index];
     if (!item) return;

     const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
     const setText = (id, text) => { const el = document.getElementById(id); if(el) el.innerText = text; };
     const hideEl = (id) => { const el = document.getElementById(id); if(el) el.style.display = 'none'; };
     const fmt = (num) => Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

     setVal('review-req-id', item.reqId);
     setText('review-project-name', `[${item.projectId}] ${item.projectName}`);
     setText('review-date', item.timestamp);
     setText('review-owner', item.requesterName); 
     
     const docLink = document.getElementById('review-doc-link');
     if (docLink) docLink.innerHTML = '<span style="color:#27ae60; font-weight:bold; font-size:0.85rem;"><i class="fas fa-check-circle"></i> คำขอผ่านการอนุมัติแล้ว</span>';

     // 🌟 คำนวณยอดเงิน (แม่นยำก่อนใบนี้จะถูกอนุมัติ) 🌟
     let allocated = Number(item.budgetReceived) || 0;
     let reqAmount = Number(item.total) || 0;
     let usedBefore = Number(item.totalUsedInBudget) || 0; 
     
     let remainingBefore = allocated - usedBefore;
     let balanceAfter = remainingBefore - reqAmount;

     setText('review-funding-source', item.fundingSource || 'ไม่ระบุ');
     setText('review-fin-allocated', fmt(allocated));
     setText('review-fin-used', fmt(usedBefore));
     setText('review-fin-balance-before', fmt(remainingBefore));
     setText('review-fin-request', fmt(reqAmount));
     
     const elBalanceAfter = document.getElementById('review-fin-balance-after');
     if (elBalanceAfter) {
        elBalanceAfter.innerText = fmt(balanceAfter);
        elBalanceAfter.style.color = balanceAfter < 0 ? '#c0392b' : '#27ae60';
     }

     // ===============================================
     // 🌟 อัปเกรดตารางรายการค่าใช้จ่าย (แสดง 4 บรรทัดเสมอ) 🌟
     // ===============================================
     const itemsTbody = document.getElementById('review-items-tbody');
     if (itemsTbody) {
       if (item.items && item.items.length > 0) {
         let sumTotal = 0; let vatAmt = 0; let shipAmt = 0; let realItems = [];

         // 1. คัดกรองตัวล่องหนออกมา
         item.items.forEach(it => {
           if (it.name === '#SYS_VAT#') vatAmt = Number(it.price);
           else if (it.name === '#SYS_SHIPPING#') shipAmt = Number(it.price);
           else {
               realItems.push(it);
               sumTotal += Number(it.qty) * Number(it.price);
           }
         });

         // ซัพพอร์ตบิลเก่าที่ยังไม่แยกระบบ
         if (!item.items.some(it => it.name === '#SYS_VAT#')) {
              let diff = reqAmount - sumTotal;
              if (diff > 0) vatAmt = diff;
         }

         // 2. วาดตารางสินค้า
         const rowsHtml = realItems.map((it, i) => {
           const total = Number(it.qty) * Number(it.price);
           return `
             <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fbfc'}; border-bottom: 1px solid #e0e6ed;">
               <td style="padding: 10px;"><b>${i + 1}. ${it.name}</b></td>
               <td style="padding: 10px; text-align:center;">${it.qty} ${it.unit}</td>
               <td style="padding: 10px; text-align:right;">${fmt(it.price)}</td>
               <td style="padding: 10px; text-align:right; font-weight:bold; color:#c0392b;">${fmt(total)}</td>
             </tr>`;
         }).join('');

         // 3. วาด Footer 4 บรรทัดเสมอ
         const footerHtml = `
             <tr style="background: #fdfefe; border-top: 2px solid #bdc3c7;">
            <td colspan="3" style="padding: 8px 15px; text-align:right; font-weight:bold; color:#7f8c8d;">รวมมูลค่าสินค้า</td>
            <td style="padding: 8px 15px; text-align:right; font-weight:bold; color:#34495e;">${fmt(sumTotal)}</td>
          </tr>
          <tr style="background: #fdfefe;">
            <td colspan="3" style="padding: 8px 15px; text-align:right; font-weight:bold; color:#7f8c8d;">ภาษีมูลค่าเพิ่ม (VAT)</td>
            <td style="padding: 8px 15px; text-align:right; font-weight:bold; color:#e67e22;">${fmt(vatAmt)}</td>
          </tr>
          <tr style="background: #2c3e50; color: white; border-top: 2px solid #e74c3c;">
            <td colspan="3" style="padding: 15px; text-align:right; font-size: 1.1rem; font-weight:bold;">รวมเป็นเงินทั้งสิ้น</td>
            <td style="padding: 15px; text-align:right; font-size: 1.3rem; font-weight:bold; color: #f1c40f;">${fmt(requestAmt)} ฿</td>
          </tr>`;

         itemsTbody.innerHTML = rowsHtml + footerHtml;
       } else {
         itemsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding:20px; font-weight:bold;">ไม่พบรายการค่าใช้จ่าย</td></tr>';
       }
     }

     const commList = document.getElementById('review-committee-list');
     if (commList) {
       let commHtml = `<li style="margin-bottom:5px;"><b>ประธานกรรมการ:</b> ${item.comm1 || '-'}</li>`;
       if (item.comm2) commHtml += `<li style="margin-bottom:5px;"><b>กรรมการคนที่ 1:</b> ${item.comm2}</li>`;
       if (item.comm3) commHtml += `<li style="margin-bottom:5px;"><b>กรรมการคนที่ 2:</b> ${item.comm3}</li>`;
       commList.innerHTML = commHtml;
     }

     // 🌟 วาดกล่องประวัติความเห็นและลายเซ็นให้ครบทุกด่าน 🌟
     let historyHtml = '';
     if (item.adminComm) historyHtml += createAuditSignatureBlock('fas fa-tasks', 'งานแผนงาน', item.adminComm, 'หัวหน้างานแผนงาน', window.currentSignatures);
     if (item.supplyComm) historyHtml += createAuditSignatureBlock('fas fa-boxes', 'งานพัสดุ', item.supplyComm, 'หัวหน้างานพัสดุ', window.currentSignatures);
     if (item.finComm) historyHtml += createAuditSignatureBlock('fas fa-coins', 'งานการเงิน', item.finComm, 'หัวหน้ากลุ่มบริหารงานงบประมาณ', window.currentSignatures);
     if (item.a2Comm) historyHtml += createAuditSignatureBlock('fas fa-user-tie', 'รองผู้อำนวยการ', item.a2Comm, 'รองผู้อำนวยการ', window.currentSignatures);
     if (item.a3Comm) historyHtml += createAuditSignatureBlock('fas fa-stamp', 'ผู้อำนวยการ', item.a3Comm, 'ผู้อำนวยการโรงเรียน', window.currentSignatures);
     
     const histContainer = document.getElementById('review-comment-history');
     if (histContainer) {
        if (historyHtml) {
           document.getElementById('history-content-blocks').innerHTML = historyHtml;
           histContainer.style.display = 'block'; 
        } else {
           histContainer.style.display = 'none';
        }
     }

     // ซ่อนแผงปุ่มสำหรับอนุมัติ (เพราะนี่คือการดูข้อมูลเฉยๆ)
     hideEl('review-plan-action-section');
     hideEl('review-supply-action-section');
     hideEl('review-finance-action-section');
     hideEl('review-a2-action-section');
     hideEl('review-a3-action-section');

     // 🌟 ปิดกล่องพิมพ์ความเห็นแบบเด็ดขาด (Bulletproof) 🌟
     const commentInput = document.getElementById('review-comment');
     if (commentInput) {
        commentInput.disabled = true; // ปิดการพิมพ์
        if (commentInput.parentElement) {
            // ซ่อนกล่อง div สีส้มที่คลุมมันอยู่
            commentInput.parentElement.style.display = 'none';
        }
     }

     // 🌟 ซ่อนปุ่ม ส่งกลับ/อนุมัติ แบบเด็ดขาด 🌟
     const modalButtons = document.querySelectorAll('#disbReviewModal button');
     modalButtons.forEach(btn => {
         const onclickAction = btn.getAttribute('onclick');
         if (onclickAction && onclickAction.includes('submitDisbReview')) {
             btn.style.display = 'none';
         }
     });

     // เปิด Modal
     const disbReviewModal = document.getElementById('disbReviewModal');
     if (disbReviewModal) disbReviewModal.style.display = 'flex';
}

 // ==========================================
// 🌟 โหลดหน้า "เบิกจ่ายของฉัน" (เขียนทับเวอร์ชันเดิมที่พัง)
// ==========================================
function loadMyDisbursements() {
  // รองรับ ID ตารางหลายรูปแบบ (เผื่อคุณครูตั้งชื่อไว้แบบไหนก็ให้มันหาเจอ)
  const tbody = document.getElementById('my-disb-tbody') || document.getElementById('my-disbursements-tbody') || document.getElementById('disb-tbody');
  if (!tbody) return;
  
  const yearSelect = document.getElementById('mydisb-year-filter');
  let year = yearSelect ? yearSelect.value : new Date().getFullYear().toString().substring(2);

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#e67e22;"></i><br>กำลังโหลดข้อมูล...</td></tr>';

  google.script.run
    .withSuccessHandler(function(data) {
      window.globalDisbursementsData = data; // จำไว้ใช้ตอนเปิดป๊อปอัป

      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d; padding: 20px;">ยังไม่มีประวัติการขอเบิกจ่าย</td></tr>';
        return;
      }

      let html = '';
      
      // 🌟 ใช้ตัวแปรชื่อ item ตรงนี้! (แก้ปัญหา item is not defined ถาวร)
      data.forEach((item, index) => {
         
         let statusBadge = `<span style="background: #f39c12; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem;">${item.status}</span>`;
         if (item.status.includes('อนุมัติ') || item.status.includes('เสร็จสิ้น')) {
             statusBadge = `<span style="background: #27ae60; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem;">${item.status}</span>`;
         } else if (item.status.includes('ตีกลับ') || item.status.includes('ยกเลิก')) {
             statusBadge = `<span style="background: #e74c3c; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem;">${item.status}</span>`;
         }

         // 🌟 1. ปุ่มแนบบิล 
         let billBtn = '';
         if (item.reconStatus === 'รอแนบบิล' || item.status.includes('อนุมัติเบิกจ่าย')) {
             let itemsStr = encodeURIComponent(JSON.stringify(item.items || [])).replace(/'/g, "%27").replace(/"/g, "%22");
             let safeProjName = String(item.projectName || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");

             billBtn = `<button onclick="openBillPopup('${item.reqId}', '${safeProjName}', ${Number(item.grandTotal || 0)}, '${itemsStr}')" style="background:#f39c12; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.8rem; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-right: 5px;"><i class="fas fa-camera"></i> แนบบิล</button>`;
         }

         // 🌟 2. ปุ่มพิมพ์ ผง.2
         let printBtn = `<button onclick="printDisbursementDocument('${item.reqId}')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:0.8rem; box-shadow:0 1px 3px rgba(0,0,0,0.1);"><i class="fas fa-print"></i> พิมพ์ ผง.2</button>`;

         let actionButtons = `<div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">${billBtn}${printBtn}</div>`;

         html += `
         <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-size: 0.9rem; color:#7f8c8d;">${item.timestamp}</td>
            <td style="padding: 12px;">
                <div style="font-weight:bold; color:#2c3e50;">${item.projectName}</div>
                <div style="font-size:0.85rem; color:#8e44ad;">[รหัสคำขอ: ${item.reqId}]</div>
            </td>
            <td style="padding: 12px; text-align:right; font-weight:bold; color:#c0392b;">${Number(item.grandTotal).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td style="padding: 12px; text-align:center;">${statusBadge}</td>
            <td style="padding: 12px; text-align:center;">${actionButtons}</td>
         </tr>`;
      });

      tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    })
    .getMyDisbursements(year); // เรียกใช้ฟังก์ชันหลังบ้านที่ครูส่งมาเป๊ะๆ
}


  // ==========================================
// 🌟 ฟังก์ชันอัปเดตช่องกรอกเงินสมทบให้อัตโนมัติ (ตอนแอดมินแผนงานติ๊ก)
// ==========================================
function togglePlanTopup() {
  const topupSection = document.getElementById('plan-topup-section');
  const topupInput = document.getElementById('plan-topup-amount');
  const chkNotOk = document.getElementById('chk-budget-not-ok');

  const elBalBefore = document.getElementById('review-fin-balance-before');
  const elReq = document.getElementById('review-fin-request');

  if (chkNotOk && topupSection && topupInput) {
    if (chkNotOk.checked) {
      topupSection.style.display = 'block';
      if (elBalBefore && elReq) {
        const balBefore = Number(String(elBalBefore.innerText || '0').replace(/,/g, '')) || 0;
        const reqAmt = Number(String(elReq.innerText || '0').replace(/,/g, '')) || 0;

        // 🌟 ลอจิกแนะนำยอดสมทบอัตโนมัติ (ปัดเศษ 2 ตำแหน่ง)
        let suggestedTopup = 0;
        if (balBefore <= 0) suggestedTopup = reqAmt;
        else if (balBefore < reqAmt) suggestedTopup = reqAmt - balBefore;

        topupInput.value = Number(suggestedTopup.toFixed(2));
      }
    } else {
      topupSection.style.display = 'none';
      topupInput.value = 0;
    }
  }
}

  // ==========================================
  // ระบบกระทบยอดบัญชี
  // ==========================================
  function loadReconciliationDashboard() {
    const tbody = document.getElementById('recon-tbody');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color:#7f8c8d;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงข้อมูลระบบบัญชี...</td></tr>`;

    google.script.run
      .withSuccessHandler(function(data) {
         globalReconData = data; isReconSortAsc = true; 
         updateSortButtonUI(); renderReconciliationTable();
      })
      .withFailureHandler(function(err) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color:red; padding:20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`; })
      .getReconciliationList();
  }

  function renderReconciliationTable() {
    const tbody = document.getElementById('recon-tbody');
    if (globalReconData.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color:#95a5a6;">ไม่มีรายการรอการกระทบยอด</td></tr>`; return; }

    let html = '';
    globalReconData.forEach(item => {
       let reconBadgeColor = item.reconStatus === 'รอแนบบิล' ? '#f39c12' : (item.reconStatus === 'รอกระทบยอด' ? '#3498db' : '#27ae60');
       let billsHtml = '';
       if (item.bills && item.bills.length > 0) {
           item.bills.forEach((b, index) => {
               billsHtml += `<button onclick="window.open('${b.url}', '_blank')" style="background:#2980b9; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; margin:2px;"><i class="fas fa-external-link-alt"></i> บิล ${index + 1} (${Number(b.amount).toLocaleString()} บ.)</button>`;
           });
       } else { billsHtml = `<span style="color:#e74c3c; font-size:0.85rem;"><i class="fas fa-exclamation-circle"></i> ยังไม่ส่งบิล</span>`; }

       let actionBtn = '';
       if (item.reconStatus === 'รอกระทบยอด') {
           actionBtn = `<button onclick="openReconActionModal('${item.reqId}', ${item.total})" style="background:#8e44ad; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-family:'Kanit'; width:100%;"><i class="fas fa-tasks"></i> ตรวจสอบ</button>`;
       } else if (item.reconStatus === 'กระทบยอดแล้ว') { actionBtn = `<span style="color:#27ae60; font-weight:bold; font-size:0.9rem;"><i class="fas fa-check-circle"></i> เรียบร้อย</span>`; } 
       else { actionBtn = `<span style="color:#95a5a6; font-size:0.85rem;">รอผู้ขอเบิก</span>`; }

       html += `
         <tr style="border-bottom: 1px solid #ecf0f1;">
            <td style="padding: 12px; color:#7f8c8d; font-size:0.9rem;">${item.timestamp || '-'}</td>
            <td style="padding: 12px;"><div style="font-weight:bold; color:#2c3e50;">${item.reqId}</div><div style="font-size:0.85rem; color:#8e44ad;"><i class="fas fa-user"></i> ${item.requester}</div></td>
            <td style="padding: 12px; text-align:right; font-weight:bold; color:#c0392b;">${Number(item.total).toLocaleString()}</td>
            <td style="padding: 12px; text-align:center;"><span style="background:${reconBadgeColor}; color:white; padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:bold;">${item.reconStatus}</span></td>
            <td style="padding: 12px; text-align:center;"><div style="display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">${billsHtml}</div></td>
            <td style="padding: 12px; text-align:center;">${actionBtn}</td>
         </tr>`;
    });
    tbody.innerHTML = html;
  }

  function toggleReconSort() { isReconSortAsc = !isReconSortAsc; globalReconData.reverse(); updateSortButtonUI(); renderReconciliationTable(); }

  function updateSortButtonUI() {
    const btn = document.getElementById('btn-sort-recon');
    if(!btn) return;
    if (isReconSortAsc) { btn.innerHTML = `<i class="fas fa-sort-amount-down"></i> เรียงจาก: เก่าสุดอยู่บน`; btn.style.background = "#34495e"; } 
    else { btn.innerHTML = `<i class="fas fa-sort-amount-up"></i> เรียงจาก: ใหม่สุดอยู่บน`; btn.style.background = "#e67e22"; }
  }

  // =========================================================================
// 🌟 ส่วนหน้าต่างตรวจสอบบิล (เปลี่ยนลิงก์ให้กลายเป็นปุ่มกด)
// =========================================================================
function openReconActionModal(reqId, requestedTotal) {
   document.getElementById('recon-action-req-id').value = reqId;
   
   // ทำความสะอาดข้อความ ป้องกัน undefined และตัดลูกน้ำออกก่อนแปลงเป็นตัวเลข
   let cleanTotal = Number(String(requestedTotal || "0").replace(/,/g, '')) || 0;
   
   document.getElementById('recon-action-total-display').innerText = cleanTotal.toLocaleString('th-TH');
   
   let defaultActual = 0;
   const reqData = globalReconData.find(d => d.reqId === reqId);
   
   // 🌟 1. สร้างปุ่มลิงก์บิล 🌟
   let billsHtml = '';
   if (reqData && reqData.bills && reqData.bills.length > 0) { 
       reqData.bills.forEach((b, idx) => {
           defaultActual += (Number(b.amount) || 0);
           
           // แปลง URL ให้เป็นปุ่มพร้อมยอดเงิน
           billsHtml += `
             <a href="${b.url}" target="_blank" style="display:inline-flex; align-items:center; gap:8px; margin:5px; padding:8px 12px; background:#3498db; color:white; border-radius:6px; text-decoration:none; font-size:0.95rem; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1); transition: 0.2s;">
                <i class="fas fa-file-invoice"></i> บิลใบที่ ${idx + 1} 
                <span style="background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px; font-size:0.85rem;">${Number(b.amount).toLocaleString()} ฿</span>
             </a>`;
       });
   } else {
       billsHtml = `<div style="color:#e74c3c; font-size:0.9rem; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> ไม่พบรูปบิลที่แนบมาในระบบ</div>`;
   }
   
   // นำปุ่มบิลไปแสดงในกล่อง
   document.getElementById('recon-bills-container').innerHTML = billsHtml;

   // 🌟 2. ดึงยอดรวมที่ครูกรอกตอนส่งบิล มาเป็นค่าตั้งต้นให้บัญชี
   document.getElementById('recon-actual-amount').value = defaultActual > 0 ? defaultActual : cleanTotal;
   document.getElementById('recon-comment').value = '';
   document.getElementById('reconActionModal').style.display = 'flex';
}

 function submitReconAction(action) {
  const reqId = document.getElementById('recon-action-req-id').value;
  
  // 🌟 แก้ไข: ดึงข้อความมาแปลงเป็น String ก่อนใช้ .replace ป้องกันบั๊ก undefined
  let displayTotalStr = document.getElementById('recon-action-total-display').innerText;
  const requestedTotal = Number(String(displayTotalStr || "0").replace(/,/g, '')) || 0;
  
  const actualAmount = Number(document.getElementById('recon-actual-amount').value);
  const comment = document.getElementById('recon-comment').value.trim();
  
  if (action === 'reject' && !comment) { 
      Swal.fire({
          icon: 'warning',
          title: 'โปรดระบุเหตุผล',
          text: 'กรุณาระบุหมายเหตุหรือเหตุผล เพื่อให้ผู้เบิกทราบว่าต้องแก้ไขอะไรครับ',
          confirmButtonColor: '#e74c3c',
          customClass: { container: 'kanit-font' }
      });
      return; 
  }

  let topupAmount = 0;
  let confirmTitle = action === 'approve' ? 'ยืนยันการกระทบยอด?' : 'ยืนยันการตีกลับ?';
  let confirmText = action === 'approve' ? `ยอดใช้จ่ายจริงคือ ${actualAmount.toLocaleString()} บาท ใช่หรือไม่?` : 'ยืนยันการตีกลับให้ผู้เบิกแก้ไขบิล ใช่หรือไม่?';
  let btnColor = action === 'approve' ? '#27ae60' : '#e74c3c';
  let btnText = action === 'approve' ? 'ใช่, กระทบยอดเลย!' : 'ใช่, ตีกลับเลย!';

  // ถ้าเป็นการอนุมัติ และ จ่ายจริง > ขอเบิก
  if (action === 'approve' && actualAmount > requestedTotal) {
      topupAmount = actualAmount - requestedTotal; 
      confirmTitle = '⚠️ ยอดเบิกเกินกว่าที่ขอไว้!';
      confirmText = `ยอดจ่ายจริง (${actualAmount.toLocaleString()} ฿) สูงกว่าที่ขอเบิกไว้ (${requestedTotal.toLocaleString()} ฿) \n\nต้องการให้ระบบดึง "งบอำนวยการกลาง" มาสมทบส่วนต่าง ${topupAmount.toLocaleString()} บาท อัตโนมัติหรือไม่?`;
      btnColor = '#f39c12';
      btnText = 'ใช่, สมทบงบและกระทบยอด!';
  }

  Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: topupAmount > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: btnText,
      cancelButtonText: 'ยกเลิก',
      customClass: { container: 'kanit-font' }
  }).then((result) => {
      if (result.isConfirmed) {
          document.getElementById('reconActionModal').style.display = 'none';
          const tbody = document.getElementById('recon-tbody');
          if (tbody) {
              tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color:#2980b9;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังบันทึกข้อมูลและปรับปรุงงบประมาณ...</td></tr>`;
          }

          google.script.run
            .withSuccessHandler(function(res) { 
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message, customClass: { container: 'kanit-font' } });
                loadReconciliationDashboard(); 
            })
            .withFailureHandler(function(err) { 
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message, customClass: { container: 'kanit-font' } });
                loadReconciliationDashboard(); 
            })
            .processReconciliationDecision(reqId, action, actualAmount, comment, topupAmount); 
      }
  });
}

  // ==========================================
  // 🌟 ฟังก์ชัน Export ข้อมูลพัสดุเป็นไฟล์ Excel
  // ==========================================
  function exportExcelSupply(reqId) {
    // ค้นหาข้อมูลคำขอจากตัวแปร Global
    const item = globalSupplyDocsData.find(d => d.reqId === reqId);
    if (!item) {
        alert("ไม่พบข้อมูลสำหรับ Export");
        return;
    }

    // 1. ดึงวันที่จากระบบ แปลงเป็น ddmmyy
    let dParts = item.timestamp.split(' ')[0].split('/');
    let ddmmyy = dParts.length === 3 ? `${dParts[0]}${dParts[1]}${dParts[2].substring(2)}` : "000000";

    // 2. ลบอักขระพิเศษที่ห้ามใช้ตั้งชื่อไฟล์ใน Windows ออก
    let safeReqName = item.requesterName.replace(/[\\/:*?"<>|]/g, '').trim();
    let safeProjName = item.projectName.replace(/[\\/:*?"<>|]/g, '').trim();

    // 3. ประกอบชื่อไฟล์ตามรูปแบบที่ต้องการ
    let finalFileName = `${ddmmyy}_${safeReqName}_${safeProjName}.xls`;

    // แหล่งงบสำรองกรณีรายการเก่ายังไม่ได้ระบุรายบรรทัด
    let fallbackSrc = (item.fundingSource && !item.fundingSource.includes(','))
        ? item.fundingSource.split('=')[0].trim()
        : "-";

    // สร้างโครงสร้างตาราง HTML เพื่อแปลงเป็น Excel (รองรับภาษาไทย)
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: 'Sarabun', sans-serif; font-size: 14px; }
          th, td { border: 1px solid #000000; padding: 5px; }
          .header-row { background-color: #27ae60; color: #ffffff; font-weight: bold; text-align: center; }
          .title-row { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" style="font-size: 18px; font-weight: bold; text-align: center;">รายละเอียดขอจัดซื้อ/จัดจ้างพัสดุ</td></tr>
          <tr><td colspan="2" class="title-row">รหัสคำขอ:</td><td colspan="4">${item.reqId}</td></tr>
          <tr><td colspan="2" class="title-row">ชื่อโครงการ:</td><td colspan="4">${item.projectName}</td></tr>
          <tr><td colspan="2" class="title-row">สังกัด/งาน:</td><td colspan="4">${item.projectSection || '-'}</td></tr>
          <tr><td colspan="2" class="title-row">ผู้ขอเบิก:</td><td colspan="4">${item.requesterName}</td></tr>
          <tr><td colspan="2" class="title-row">ความประสงค์:</td><td colspan="4">${item.actionType || '-'} ${item.itemCategory || '-'} เพื่อ ${item.objective || '-'}</td></tr>
          <tr><td colspan="2" class="title-row">แหล่งงบประมาณ:</td><td colspan="4">${item.fundingSource || '-'}</td></tr>
          <tr><td colspan="2" class="title-row">คณะกรรมการตรวจรับ:</td><td colspan="4">1. ${item.comm1 || '-'} | 2. ${item.comm2 || '-'} | 3. ${item.comm3 || '-'}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr class="header-row">
            <th>ลำดับ</th>
            <th>รายการพัสดุ</th>
            <th>แหล่งงบประมาณ</th>
            <th>จำนวน/หน่วยนับ</th>
            <th>ราคา/หน่วย (บาท)</th>
            <th>จำนวนเงินรวม (บาท)</th>
          </tr>
    `;

    let sum = 0;
    if (item.items && item.items.length > 0) {
        item.items.forEach((it, idx) => {
            if (it.name === '#SYS_VAT#' || it.name === '#SYS_SHIPPING#') return;
            let lineTotal = Number(it.qty) * Number(it.price);
            sum += lineTotal;
            let itemSrc = it.fundingSource || fallbackSrc;
            let qtyWithUnit = `${it.qty} ${it.unit || ''}`.trim();
            tableHtml += `
          <tr>
            <td align="center">${idx + 1}</td>
            <td>${it.name}</td>
            <td align="center">${itemSrc}</td>
            <td align="center">${qtyWithUnit}</td>
            <td align="right">${Number(it.price).toFixed(2)}</td>
            <td align="right">${lineTotal.toFixed(2)}</td>
          </tr>
        `;
        });
    } else {
        tableHtml += `<tr><td colspan="6" align="center">ไม่มีข้อมูลรายการสิ่งของ</td></tr>`;
    }

    tableHtml += `
          <tr>
            <td colspan="5" align="right" class="title-row">รวมเป็นเงินทั้งสิ้น (บาท)</td>
            <td align="right" class="title-row" style="color: red;">${sum.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
  // ==========================================
  // 🌟 ฟังก์ชันสลับเปิด/ปิด การ์ดรายละเอียด
  // ==========================================
  function toggleSupplyCard(reqId) {
      const detailRow = document.getElementById(`supply-detail-${reqId}`);
      const icon = document.getElementById(`supply-icon-${reqId}`);
      if (detailRow) {
          if (detailRow.style.display === 'none') {
              detailRow.style.display = 'table-row';
              icon.classList.remove('fa-chevron-down');
              icon.classList.add('fa-chevron-up');
          } else {
              detailRow.style.display = 'none';
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
          }
      }
  }
// =========================================================================
// 🌟 ส่วนของบัญชี: บันทึกบิล (ลงตะกร้า)
// =========================================================================
function openFinanceInputModal() {
  document.getElementById('finance-expense-tbody').innerHTML = '';
  addFinanceRow();
  document.getElementById('financeInputModal').style.display = 'flex';
}

function addFinanceRow() {
  const tbody = document.getElementById('finance-expense-tbody');
  const tr = document.createElement('tr');
  tr.style.borderBottom = "1px dashed #e0e6ed";
  const today = new Date().toISOString().split('T')[0];

  tr.innerHTML = `
      <td style="padding:10px 5px;"><input type="date" class="f-date" value="${today}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; font-size:0.9rem; box-sizing: border-box;"></td>
      
      <td style="padding:10px 5px;">
        <!-- 🌟 เรียกใช้ Autocomplete จาก list="preset-expenses" -->
        <input type="text" class="f-desc" list="preset-expenses" placeholder="เลือกหรือพิมพ์ชื่อรายการ..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; font-size:0.95rem; box-sizing: border-box;">
      </td>
      
      <td style="padding:10px 5px;">
        <!-- 🌟 Dropdown เลือกแหล่งงบประมาณ -->
        <select class="f-source" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; font-size:0.9rem; box-sizing: border-box;">
            <option value="">-- เลือกแหล่งงบ --</option>
            <option value="เงินอุดหนุนรายหัว">เงินอุดหนุนรายหัว</option>
            <option value="เงินรายได้สถานศึกษา">เงินรายได้สถานศึกษา</option>
            <option value="เงินอุดหนุนปัจจัยพื้นฐาน">เงินอุดหนุนปัจจัยพื้นฐาน</option>
            <option value="เงินอุดหนุนเรียนฟรี 15 ปี">เงินอุดหนุนเรียนฟรี 15 ปี</option>
            <option value="เงินค่ากิจกรรมพัฒนาผู้เรียน">เงินค่ากิจกรรมพัฒนาผู้เรียน</option>
        </select>
      </td>
      
      <td style="padding:10px 5px;"><input type="number" class="f-amt" min="0" value="0" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; text-align:right; font-size:1rem; font-weight:bold; color:#e67e22; box-sizing: border-box;"></td>
      
      <td style="padding:10px 5px; text-align:center;"><button type="button" onclick="this.closest('tr').remove()" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" title="ลบรายการนี้"><i class="fas fa-trash"></i></button></td>
  `;
  tbody.appendChild(tr);
}

// =========================================================================
// 🌟 ส่งข้อมูลรายจ่ายตรงไปบันทึกหลังบ้าน
// =========================================================================
function submitFinanceExpenses() {
  const rows = document.querySelectorAll('#finance-expense-tbody tr');
  let expenses = [];
  
  for (let r of rows) {
     let date = r.querySelector('.f-date').value;
     let desc = r.querySelector('.f-desc').value.trim();
     let source = r.querySelector('.f-source').value;
     let amt = Number(r.querySelector('.f-amt').value);
     
     if (desc && amt > 0 && source) {
         expenses.push({ date: date, desc: desc, source: source, amount: amt });
     } else if (desc || amt > 0 || source) {
         Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุคำอธิบาย เลือกแหล่งงบ และใส่ยอดเงินให้ครบถ้วนครับ', 'warning');
         return;
     }
  }
  
  if (expenses.length === 0) { 
      Swal.fire('แจ้งเตือน', 'กรุณาระบุรายการอย่างน้อย 1 รายการ', 'warning'); 
      return; 
  }

  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  google.script.run
    .withSuccessHandler(res => {
        if(res.success) {
            Swal.fire('สำเร็จ', res.message, 'success');
            document.getElementById('expenseModal').style.display = 'none';
        } else {
            Swal.fire('ผิดพลาด', res.message, 'error'); 
        }
    })
    .withFailureHandler(err => Swal.fire('ผิดพลาด', err.message, 'error'))
    .savePendingExpenses(expenses); // ส่ง Object ที่มี source ไปให้หลังบ้าน
}
// =========================================================================
// 🌟 ส่วนของแผนงาน: ตัดยอดบิล
// =========================================================================
let planPendingBills = [];
let planProjectOptions = '';

function openPlanAssignModal() {
  document.getElementById('planAssignModal').style.display = 'flex';
  const tbody = document.getElementById('plan-assign-tbody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">กำลังโหลดข้อมูล...</td></tr>';
  
  // 1. โหลดโครงการที่อนุมัติแล้วมาเตรียมไว้ทำ Dropdown
  google.script.run.withSuccessHandler(projects => {
      planProjectOptions = '<option value="">-- รอแผนงานเลือกโครงการ --</option>';
      projects.forEach(p => { planProjectOptions += `<option value="${p.id}">[${p.id}] ${p.name}</option>`; });
      
      // 2. โหลดบิลที่ค้างอยู่ในตะกร้า
      google.script.run.withSuccessHandler(bills => {
          planPendingBills = bills;
          renderPlanAssignTable();
      }).getPendingExpenses();

  }).getActiveApprovedProjects();
}


function submitPlanAssignments() {
  const rows = document.querySelectorAll('#plan-assign-tbody tr[data-expid]');
  let assignList = [];

  rows.forEach(tr => {
      const pId = tr.querySelector('.p-project').value;
      if (pId !== "") { // เอาเฉพาะรายการที่แผนงาน "เลือกโครงการแล้ว"
          assignList.push({
              expenseId: tr.getAttribute('data-expid'),
              date: tr.getAttribute('data-date'),
              desc: tr.getAttribute('data-desc'),
              amount: tr.getAttribute('data-amt'),
              projectId: pId
          });
      }
  });

  if (assignList.length === 0) {
      alert("คุณยังไม่ได้เลือกโครงการให้บิลใดเลยครับ"); return;
  }

  if(!confirm(`ยืนยันการตัดงบประมาณจำนวน ${assignList.length} รายการ เข้าโครงการที่เลือกใช่หรือไม่?`)) return;

  const btn = document.getElementById('btn-save-plan');
  btn.innerHTML = 'กำลังบันทึก...'; btn.disabled = true;

  google.script.run
      .withSuccessHandler(res => {
          alert(res.message);
          btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการตัดงบ'; btn.disabled = false;
          openPlanAssignModal(); // โหลดข้อมูลที่เหลือใหม่
      })
      .withFailureHandler(err => {
          alert("Error: " + err.message);
          btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการตัดงบ'; btn.disabled = false;
      })
      .assignProjectToExpenses(assignList);
}

// =========================================================================
// 🌟 โหลดและวาดหน้าจอ Dashboard สรุปผล
// =========================================================================
let isDashboardYearLoaded = false; 
let fundChartInstance = null;      

function loadDashboardData() {
    const yearFilter = document.getElementById('dash-year-filter');
    const year = yearFilter ? yearFilter.value : 'ALL';
    Swal.fire({ title: 'กำลังโหลดข้อมูลแดชบอร์ด...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    google.script.run
      .withSuccessHandler(function(res) {
          Swal.close();
          if (!res || !res.success) { 
              Swal.fire('ไม่พบข้อมูล', res ? res.message : 'เกิดข้อผิดพลาดในการโหลด', 'info'); 
              return; 
          }

          document.getElementById('dash-central-budget').innerText = (res.centralBudget || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
          document.getElementById('dash-central-spent').innerText = (res.centralSpent || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
          document.getElementById('dash-central-remaining').innerText = (res.centralRemaining || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

          document.getElementById('dash-stat-total').innerText = (res.stat && res.stat.total) || 0;
          document.getElementById('dash-stat-draft').innerText = (res.stat && res.stat.draft) || 0;
          document.getElementById('dash-stat-pending').innerText = (res.stat && res.stat.pending) || 0;
          document.getElementById('dash-stat-approved').innerText = (res.stat && res.stat.approved) || 0;

          document.getElementById('dash-stat-impl-pending').innerText = (res.impl && res.impl.pending) || 0;
          document.getElementById('dash-stat-impl-progress').innerText = (res.impl && res.impl.progress) || 0;
          document.getElementById('dash-stat-cancelled').innerText = (res.impl && res.impl.cancelled) || 0;

          document.getElementById('dash-stat-report-waiting').innerText = (res.rep && res.rep.waiting) || 0;
          document.getElementById('dash-stat-reported').innerText = (res.rep && res.rep.reported) || 0;

          let tSpent = res.totalSpent || 0;
          let tBud = res.totalBudget || 0;
          let pctOverall = tBud > 0 ? (tSpent / tBud) * 100 : 0;
          document.getElementById('dash-overall-percent').innerText = Math.round(pctOverall) + '%';
          document.getElementById('dash-overall-bar').style.width = Math.min(pctOverall, 100) + '%';
          document.getElementById('dash-overall-spent').innerText = tSpent.toLocaleString(undefined, {minimumFractionDigits:2});
          document.getElementById('dash-overall-budget').innerText = tBud.toLocaleString(undefined, {minimumFractionDigits:2});

          let qSpent = (res.catQ && res.catQ.spent) || 0; 
          let qBud = (res.catQ && res.catQ.budget) || 0;
          let pctQ = qBud > 0 ? (qSpent / qBud) * 100 : 0;
          document.getElementById('dash-q-pct').innerText = Math.round(pctQ) + '%';
          document.getElementById('dash-q-bar').style.width = Math.min(pctQ, 100) + '%';
          document.getElementById('dash-q-text').innerText = `ใช้จริง ${qSpent.toLocaleString()} / แผน ${qBud.toLocaleString()} บาท`;

          let aSpent = (res.catA && res.catA.spent) || 0; 
          let aBud = (res.catA && res.catA.budget) || 0;
          let pctA = aBud > 0 ? (aSpent / aBud) * 100 : 0;
          document.getElementById('dash-a-pct').innerText = Math.round(pctA) + '%';
          document.getElementById('dash-a-bar').style.width = Math.min(pctA, 100) + '%';
          document.getElementById('dash-a-text').innerText = `ใช้จริง ${aSpent.toLocaleString()} / แผน ${aBud.toLocaleString()} บาท`;

          if (typeof drawFundBarChart === 'function') {
              drawFundBarChart(res.funds || []);
          }

          let deptHtml = '';
          if (res.depts) {
              for (let dName in res.depts) {
                  let d = res.depts[dName];
                  deptHtml += `<tr style="border-bottom: 1px solid #ecf0f1;">
                     <td style="padding: 12px; text-align: left; font-weight: bold; color: #34495e;">${dName}</td>
                     <td style="padding: 12px; font-weight: bold;">${d.total}</td>
                     <td style="padding: 12px; color: #f39c12; font-weight: bold;">${d.pendingApprove}</td>
                     <td style="padding: 12px; color: #3498db; font-weight: bold;">${d.ready}</td>
                     <td style="padding: 12px; color: #9b59b6; font-weight: bold;">${d.progress}</td>
                     <td style="padding: 12px; color: #27ae60; font-weight: bold;">${d.completed}</td>
                     <td style="padding: 12px; color: #e74c3c; font-weight: bold;">${d.cancelled}</td>
                  </tr>`;
              }
          }
          if (!deptHtml) deptHtml = '<tr><td colspan="7" style="padding: 20px; text-align: center;">ไม่มีข้อมูลกลุ่มงาน</td></tr>';
          if (document.getElementById('dash-dept-tbody')) document.getElementById('dash-dept-tbody').innerHTML = deptHtml;

          let qHtml = '';
          if (res.quarterly) {
              let totalQ = { 1:{p:0, a:0}, 2:{p:0, a:0}, 3:{p:0, a:0}, 4:{p:0, a:0} };
              for (let src in res.quarterly) {
                  let q = res.quarterly[src];
                  totalQ[1].p += q[1].plan; totalQ[1].a += q[1].actual;
                  totalQ[2].p += q[2].plan; totalQ[2].a += q[2].actual;
                  totalQ[3].p += q[3].plan; totalQ[3].a += q[3].actual;
                  totalQ[4].p += q[4].plan; totalQ[4].a += q[4].actual;
                  
                  qHtml += `<tr style="border-bottom: 1px solid #ecf0f1;">
                     <td style="padding: 12px; text-align: left; font-weight: bold; color: #2c3e50; border-right: 1px solid #ecf0f1;">${src}</td>
                     <td style="padding: 12px;">${q[1].plan.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; color: #c0392b;">${q[1].actual.toLocaleString()}</td>
                     <td style="padding: 12px;">${q[2].plan.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; color: #c0392b;">${q[2].actual.toLocaleString()}</td>
                     <td style="padding: 12px;">${q[3].plan.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; color: #c0392b;">${q[3].actual.toLocaleString()}</td>
                     <td style="padding: 12px;">${q[4].plan.toLocaleString()}</td><td style="padding: 12px; color: #c0392b;">${q[4].actual.toLocaleString()}</td>
                  </tr>`;
              }
              qHtml += `<tr style="background: #fdfefe; border-top: 2px solid #bdc3c7;">
                 <td style="padding: 12px; text-align: right; font-weight: bold; color: #2c3e50; border-right: 1px solid #ecf0f1;">รวมทุกแหล่งงบ</td>
                 <td style="padding: 12px; font-weight: bold;">${totalQ[1].p.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; font-weight: bold; color: #c0392b;">${totalQ[1].a.toLocaleString()}</td>
                 <td style="padding: 12px; font-weight: bold;">${totalQ[2].p.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; font-weight: bold; color: #c0392b;">${totalQ[2].a.toLocaleString()}</td>
                 <td style="padding: 12px; font-weight: bold;">${totalQ[3].p.toLocaleString()}</td><td style="padding: 12px; border-right: 1px solid #ecf0f1; font-weight: bold; color: #c0392b;">${totalQ[3].a.toLocaleString()}</td>
                 <td style="padding: 12px; font-weight: bold;">${totalQ[4].p.toLocaleString()}</td><td style="padding: 12px; font-weight: bold; color: #c0392b;">${totalQ[4].a.toLocaleString()}</td>
              </tr>`;
          }
          if (!qHtml) qHtml = '<tr><td colspan="9" style="padding: 20px; text-align: center;">ไม่มีข้อมูลไตรมาส</td></tr>';
          if (document.getElementById('dash-quarterly-tbody')) document.getElementById('dash-quarterly-tbody').innerHTML = qHtml;
      })
      .withFailureHandler(function(err) {
          Swal.close();
          Swal.fire('ข้อผิดพลาด', 'ระบบเชื่อมต่อหลังบ้านไม่สำเร็จ: ' + err.message, 'error');
      })
      .getDashboardData(year);
  }

// =========================================================================
// 🌟 ฟังก์ชันวาดกราฟแท่ง (Chart.js) แยกตามกองเงิน
// =========================================================================
function drawFundBarChart(fundsData) {
    const ctx = document.getElementById('fundBarChart');
    if (!ctx) return;
    
    if (fundChartInstance) fundChartInstance.destroy();

    // 🌟 เอาเงื่อนไข filter 'อำนวยการ' ออก ปล่อยให้มันวาดข้อมูลอิสระ
    let activeFunds = fundsData.filter(f => f.budget > 0);
    
    let labels = activeFunds.map(f => f.source);
    let budgetData = activeFunds.map(f => f.budget);
    let spentData = activeFunds.map(f => f.spent);

    fundChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'งบตามแผน (จัดสรรไว้)',
                    data: budgetData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'ใช้จริงไปแล้ว',
                    data: spentData,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: 'rgba(192, 57, 43, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { family: "'Kanit', sans-serif" } } },
                tooltip: { 
                    callbacks: { 
                        label: function(context) {
                            let val = context.raw || 0;
                            return context.dataset.label + ': ' + val.toLocaleString() + ' บาท';
                        }
                    },
                    titleFont: { family: "'Kanit', sans-serif" },
                    bodyFont: { family: "'Kanit', sans-serif" }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return value.toLocaleString(); },
                        font: { family: "'Kanit', sans-serif" }
                    }
                },
                x: { ticks: { font: { family: "'Kanit', sans-serif" } } }
            }
        }
    });
}


// ==========================================
// 🌟 ฟังก์ชันอัปเดตตัวเลขแจ้งเตือน (Badges)
// ==========================================
function updateNavBadges() {
  google.script.run
    .withSuccessHandler(function(counts) {
      const setBadge = (id, count) => {
        const badge = document.getElementById(id);
        if (badge) {
          badge.innerText = count;
          badge.style.display = count > 0 ? 'inline-block' : 'none'; 
        }
      };
      
      setBadge('badge-approve', counts.approve);
      setBadge('badge-disb', counts.disbApprove);
      setBadge('badge-supply', counts.supplyDocs);
      setBadge('badge-owner-disb', counts.ownerApprove); // 🌟 แจ้งเตือนเจ้าของโครงการ
      
      let totalReconInbox = (counts.recon || 0) + (counts.planningExpense || 0);
      setBadge('badge-recon', totalReconInbox);
    })
    .getPendingTaskCounts();
}
// ==========================================
  // 🌟 ระบบโปรไฟล์ ลายเซ็น และ LINE OA (รองรับวาด + อัปโหลดภาพ)
  // ==========================================
  let signaturePadCanvas, ctxSignature;
  let isDrawing = false;
  let hasSigned = false; // เช็คว่ามีการวาดหรือยัง
  let currentSigMode = 'draw'; // ค่าเริ่มต้นให้เป็นโหมดวาด
  let uploadedSignatureBase64 = ""; // เก็บรูปภาพที่อัปโหลด

  // 🌟 ฟังก์ชันสลับแท็บ (วาด vs อัปโหลด)
  function switchSigTab(mode) {
    currentSigMode = mode;
    const btnDraw = document.getElementById('btn-tab-draw');
    const btnUpload = document.getElementById('btn-tab-upload');
    const areaDraw = document.getElementById('sig-area-draw');
    const areaUpload = document.getElementById('sig-area-upload');

    if (mode === 'draw') {
      btnDraw.style.background = '#2980b9'; btnDraw.style.color = 'white';
      btnUpload.style.background = '#ecf0f1'; btnUpload.style.color = '#7f8c8d';
      areaDraw.style.display = 'block';
      areaUpload.style.display = 'none';
    } else {
      btnUpload.style.background = '#8e44ad'; btnUpload.style.color = 'white';
      btnDraw.style.background = '#ecf0f1'; btnDraw.style.color = '#7f8c8d';
      areaUpload.style.display = 'block';
      areaDraw.style.display = 'none';
    }
  }

  // 🌟 ฟังก์ชันจัดการไฟล์อัปโหลด
  function handleSignatureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("ไฟล์รูปภาพมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 2MB ครับ");
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedSignatureBase64 = e.target.result;
      const preview = document.getElementById('upload-preview');
      preview.src = uploadedSignatureBase64;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function initSignaturePad() {
    signaturePadCanvas = document.getElementById('signature-pad');
    if (!signaturePadCanvas) return;
    
    ctxSignature = signaturePadCanvas.getContext('2d');
    ctxSignature.lineWidth = 3;
    ctxSignature.lineCap = 'round';
    ctxSignature.strokeStyle = '#000080'; // ลายเซ็นหมึกสีน้ำเงิน

    // รองรับเมาส์
    signaturePadCanvas.addEventListener('mousedown', startDrawing);
    signaturePadCanvas.addEventListener('mousemove', draw);
    signaturePadCanvas.addEventListener('mouseup', stopDrawing);
    signaturePadCanvas.addEventListener('mouseout', stopDrawing);

    // รองรับการทัชสกรีนบนมือถือ/แท็บเล็ต
    signaturePadCanvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    signaturePadCanvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    signaturePadCanvas.addEventListener('touchend', stopDrawing);
  }

  function startDrawing(e) {
    isDrawing = true;
    hasSigned = true;
    draw(e);
  }

  function draw(e) {
    if (!isDrawing) return;
    const rect = signaturePadCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctxSignature.lineTo(x, y);
    ctxSignature.stroke();
    ctxSignature.beginPath();
    ctxSignature.moveTo(x, y);
  }

  function stopDrawing() {
    isDrawing = false;
    ctxSignature.beginPath();
  }

  // ฟังก์ชันช่วยแปลง Touch เป็นพิกัดเมาส์
  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", { clientX: touch.clientX, clientY: touch.clientY });
    signaturePadCanvas.dispatchEvent(mouseEvent);
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
    signaturePadCanvas.dispatchEvent(mouseEvent);
  }

  function clearSignature() {
    if (!ctxSignature) return;
    ctxSignature.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height);
    hasSigned = false;
  }

  function loadProfilePage() {
    document.getElementById('profile-name').innerText = "กำลังโหลด...";
    
    google.script.run
      .withSuccessHandler(function(profile) {
         document.getElementById('profile-name').innerText = profile.name;
         document.getElementById('profile-email').innerText = profile.email;
         document.getElementById('profile-role').innerText = profile.role;
         document.getElementById('profile-status').innerText = profile.status;

         const imgSig = document.getElementById('current-signature-img');
         const noSig = document.getElementById('no-signature-text');
         if (profile.signature && profile.signature !== "") {
            imgSig.src = profile.signature.startsWith('data:image') ? profile.signature : `data:image/png;base64,${profile.signature}`;
            imgSig.style.display = 'block';
            noSig.style.display = 'none';
         } else {
            imgSig.style.display = 'none';
            noSig.style.display = 'block';
         }

         // 🌟 จัดการกล่อง LINE Official Account 🌟
         const lineBox = document.getElementById('profile-line-status');
         if (profile.lineUserID && profile.lineUserID !== "") {
            lineBox.style.background = "#e9f7ef";
            lineBox.innerHTML = `
              <div style="color:#27ae60; font-weight:bold; font-size:1.1rem;"><i class="fas fa-check-circle"></i> ผูกบัญชีกับ "น้องแผนดี" แล้ว</div>
              <div style="font-size:0.85rem; color:#7f8c8d; margin-top:5px;">ระบบพร้อมแจ้งเตือนงานแผนงานถึงคุณโดยตรง</div>
              <div style="margin-top:15px; display:flex; gap:10px; justify-content:center;">
                <button onclick="testLineOANotify()" style="background:#f39c12; color:white; border:none; padding:8px 15px; border-radius:20px; font-family:'Kanit'; cursor:pointer; font-size:0.85rem; font-weight:bold;"><i class="fas fa-bell"></i> ทดสอบแจ้งเตือน</button>
                <button onclick="revokeLineUserID()" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:20px; font-family:'Kanit'; cursor:pointer; font-size:0.85rem; font-weight:bold;"><i class="fas fa-unlink"></i> ยกเลิกผูกบัญชี</button>
              </div>`;
         } else {
            lineBox.style.background = "#fdf2e9";
            lineBox.innerHTML = `
              <div style="color:#d35400; font-weight:bold; font-size:1.1rem;"><i class="fas fa-exclamation-triangle"></i> ยังไม่ได้เชื่อมต่อ LINE</div>
              <div style="font-size:0.9rem; color:#555; margin-top:10px; text-align:left; background:#fff; padding:10px; border-radius:6px; border:1px dashed #e67e22;">
                1. แอดไลน์ OA: <b>@น้องแผนดี</b><br>
                2. กดปุ่มเพื่อรับรหัสยืนยัน 5 หลัก<br>
                3. นำรหัสไปพิมพ์ส่งในแชทของน้องแผนดี
              </div>
              <div id="line-code-display" style="margin-top:15px;">
                <button onclick="generateLineCode()" style="background:#00b900; color:white; border:none; padding:8px 20px; border-radius:20px; font-family:'Kanit'; cursor:pointer; font-weight:bold;"><i class="fas fa-key"></i> สร้างรหัสเชื่อมต่อ 5 หลัก</button>
              </div>`;
         }

         initSignaturePad();
      })
      .getUserProfileData();
  }

  // ฟังก์ชันสร้างรหัส 5 หลัก และดึงข้อมูลจาก Properties
  function generateLineCode() {
    const display = document.getElementById('line-code-display');
    display.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#00b900;"></i> กำลังสร้างรหัสและดึงข้อมูล LINE...';
    
    google.script.run
      .withSuccessHandler(function(res) {
         display.innerHTML = '<button onclick="generateLineCode()" style="background:#00b900; color:white; border:none; padding:8px 20px; border-radius:20px; font-family:\'Kanit\'; cursor:pointer; font-weight:bold;"><i class="fas fa-key"></i> สร้างรหัสเชื่อมต่อ 5 หลักอีกครั้ง</button>';
         showLineAuthModal(res.code, res.lineOaId, res.lineOaQrUrl);
      })
      .withFailureHandler(function(err) { alert("ผิดพลาด: " + err.message); loadProfilePage(); })
      .createLineAuthCode();
  }

  function showLineAuthModal(code, lineId, qrUrl) {
      const oldModal = document.getElementById('lineAuthModal');
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.id = 'lineAuthModal';
      modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center;";
      
      modal.innerHTML = `
        <div style="background:white; width:90%; max-width:400px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.3); overflow:hidden; font-family:'Kanit', sans-serif; text-align:center;">
          <div style="background:#00b900; color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; font-size:1.2rem;"><i class="fab fa-line"></i> เชื่อมต่อ "น้องแผนดี"</h3>
            <button onclick="document.getElementById('lineAuthModal').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:25px;">
            <p style="color:#34495e; margin-top:0; font-size:0.95rem; font-weight:bold;">1. สแกน QR Code หรือแอดไอดี <span style="color:#00b900;">${lineId}</span></p>
            <img src="${qrUrl}" alt="LINE OA QR" style="width:160px; height:160px; margin-bottom:15px; border:1px solid #ecf0f1; border-radius:8px; padding:5px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            <p style="color:#34495e; margin-bottom:5px; font-size:0.95rem; font-weight:bold;">2. พิมพ์รหัส 5 หลักนี้ ส่งเข้าไปในแชท</p>
            <div style="background:#f4fdf7; border:2px dashed #27ae60; padding:15px; border-radius:8px; margin-bottom:20px;">
               <div style="font-size:2.8rem; font-weight:bold; color:#27ae60; letter-spacing:8px;">${code}</div>
            </div>
            <button onclick="document.getElementById('lineAuthModal').remove(); loadProfilePage();" style="background:#3498db; color:white; border:none; padding:10px 20px; border-radius:20px; font-family:'Kanit'; cursor:pointer; font-size:0.95rem; width:100%; font-weight:bold; box-shadow:0 4px 6px rgba(52,152,219,0.2);">
              <i class="fas fa-check-circle"></i> ฉันพิมพ์รหัสในไลน์เรียบร้อยแล้ว
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
  }

  function revokeLineUserID() {
    if (!confirm("คุณต้องการยกเลิกการผูกบัญชี LINE ใช่หรือไม่?")) return;
    document.getElementById('profile-line-status').innerHTML = '<i class="fas fa-spinner fa-spin fa-2x" style="color:#e74c3c;"></i><br>กำลังยกเลิก...';
    
    google.script.run
      .withSuccessHandler(function(res) { alert(res.message); loadProfilePage(); })
      .withFailureHandler(function(err) { alert("ผิดพลาด: " + err.message); loadProfilePage(); })
      .removeLineUserID();
  }

  function testLineOANotify() {
    google.script.run
      .withSuccessHandler(function(res) { alert(res.message); })
      .withFailureHandler(function(err) { alert("ไม่สามารถส่งแจ้งเตือนได้: " + err.message); })
      .testLinePushMessage();
  }

  // 🌟 อัปเดตฟังก์ชันบันทึก ให้แยกว่ากำลังใช้โหมดวาด หรือ โหมดอัปโหลด
  function saveSignature() {
    let finalBase64Img = "";

    if (currentSigMode === 'draw') {
      if (!hasSigned) { alert("กรุณาวาดลายเซ็นก่อนกดบันทึกครับ"); return; }
      finalBase64Img = signaturePadCanvas.toDataURL("image/png");
    } else {
      if (!uploadedSignatureBase64) { alert("กรุณาอัปโหลดไฟล์รูปภาพลายเซ็นก่อนครับ"); return; }
      finalBase64Img = uploadedSignatureBase64;
    }

    if (!confirm("ต้องการใช้ลายเซ็นนี้เป็นลายเซ็นหลักในระบบใช่หรือไม่?")) return;

    const btn = document.getElementById('btn-save-signature');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    google.script.run
      .withSuccessHandler(function(res) {
         alert(res.message);
         btn.innerHTML = '<i class="fas fa-save"></i> บันทึกลายเซ็น';
         btn.disabled = false;
         loadProfilePage(); 
         if(currentSigMode === 'draw') clearSignature();
      })
      .withFailureHandler(function(err) {
         alert("ผิดพลาด: " + err.message);
         btn.innerHTML = '<i class="fas fa-save"></i> บันทึกลายเซ็น';
         btn.disabled = false;
      })
      .updateUserSignature(finalBase64Img);
  }

  // 🌟 เพิ่มคำสั่งดักจับการคลิกเมนูเพื่อโหลดข้อมูลหน้าโปรไฟล์
  document.addEventListener("DOMContentLoaded", function() {
      const oldShowPage = showPage;
      showPage = function(pageId) {
          oldShowPage(pageId);
          if (pageId === 'page-profile') {
              loadProfilePage();
          }
      };
  });
// ==========================================
// 🌟 สคริปต์ระบบจัดการโครงสร้างแผนงาน
// ==========================================

function switchStrategyTab(tabId) {
  document.querySelectorAll('.strategy-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('[id^="btn-strat-"]').forEach(b => {
    b.style.color = '#7f8c8d';
    b.style.borderBottom = '3px solid transparent';
  });
  
  document.getElementById(tabId).style.display = 'block';
  const btn = document.getElementById(tabId.replace('tab-', 'btn-'));
  if (btn) {
    btn.style.color = '#8e44ad';
    btn.style.borderBottom = '3px solid #8e44ad';
  }

  // ถ้ากดมาที่หน้าภาพรวมโครงสร้าง ให้โหลดข้อมูล Tree View สดๆ ทันที
  if (tabId === 'tab-strat-tree' || tabId === 'tab-strat-map') {
    loadStrategyStructure();
  }
}


function renderMappingTable(data) {
  const tbody = document.getElementById('mapping-tbody');
  if(!tbody) return;
  
  let mpOptions = '<option value="">-- ไม่ได้ระบุสังกัด --</option>';
  data.mp.forEach(m => { mpOptions += `<option value="${m.id}">[${m.id}] ${m.name}</option>`; });

  let html = '';
  data.projects.forEach(p => {
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px; color:#8e44ad; font-weight:bold;">${p.id}</td>
        <td style="padding:10px;">${p.name}</td>
        <td style="padding:10px;">
          <select class="mp-mapping-select" data-pid="${p.id}" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit';">
            ${mpOptions}
          </select>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  
  data.projects.forEach(p => {
    const sel = document.querySelector(`.mp-mapping-select[data-pid="${p.id}"]`);
    if(sel && p.mpId) sel.value = p.mpId;
  });
}

function submitMapping() {
  const selects = document.querySelectorAll('.mp-mapping-select');
  let mappingData = {};
  selects.forEach(sel => { mappingData[sel.getAttribute('data-pid')] = sel.value; });

  const btn = document.getElementById('btn-save-mapping');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
  btn.disabled = true;

  google.script.run
    .withSuccessHandler(function(res) {
      alert(res.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกการเชื่อมโยง'; btn.disabled = false;
      loadStrategyStructure();
    })
    .withFailureHandler(function(err) {
      alert("ผิดพลาด: " + err.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกการเชื่อมโยง'; btn.disabled = false;
    })
    .saveProjectMapping(mappingData);
}

// ==========================================
// 🌟 ฟังก์ชันตัวช่วย: สลับการแสดงผล ย่อ/ขยาย (Collapse/Expand)
// ==========================================
function toggleTree(targetId, el) {
  const target = document.getElementById(targetId);
  const icon = el.querySelector('.toggle-icon');
  
  if (target.style.display === 'none') {
    target.style.display = 'block';
    if (icon) {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-down');
    }
  } else {
    target.style.display = 'none';
    if (icon) {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-right');
    }
  }
}

// ==========================================
// 🌟 ฟังก์ชันวาดแผนผัง Tree View (อัปเดต: รองรับการกาง/หุบข้อมูล)
// ==========================================
function renderTreeView(data) {
  const container = document.getElementById('tree-container');
  if(!container) return;

  try {
    if (!data.sf || data.sf.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:30px; color:#e74c3c;">ยังไม่มีข้อมูลแผนงานระยะ 5 ปี ในระบบ<br><span style="font-size:0.9rem; color:#7f8c8d;">(กรุณาเพิ่มข้อมูลที่แท็บ "จัดการแผนงาน" ก่อนครับ)</span></div>';
      return;
    }

    let html = '';

    // วนลูปวาดโครงสร้างแผนงาน (SF)
    data.sf.forEach((sf, sfIndex) => {
      let sfProjects = [];
      let sfBudget = 0; let sfSpent = 0;

      let relatedMps = (data.mp || []).filter(m => m.sfId === sf.id);
      let mpHtml = '';

      // วนลูปวาดโครงการหลัก (MP)
      relatedMps.forEach((mp, mpIndex) => {
        let relatedProjs = (data.projects || []).filter(p => p.mpId === mp.id);
        let mpBudget = 0; let mpSpent = 0;
        let projHtml = '';

        // วนลูปวาดกิจกรรมย่อย
        relatedProjs.forEach(proj => {
          let budget = Number(proj.budget) || 0;
          let spent = Number(proj.spent) || 0;
          
          mpBudget += budget; mpSpent += spent;
          sfProjects.push(proj);

          let statusText = proj.status ? String(proj.status) : "ยังไม่ได้ดำเนินการ";
          let badgeColor = '#95a5a6';
          
          if (statusText.includes('เสร็จสิ้น') || statusText.includes('สมบูรณ์')) badgeColor = '#27ae60';
          else if (statusText.includes('ดำเนินการ') || statusText.includes('อนุมัติ')) badgeColor = '#3498db';

          projHtml += `
            <div style="background:#fff; border-left:3px solid #2ecc71; padding:12px; margin-bottom:8px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-left:30px;">
              <div style="font-weight:bold; color:#2c3e50; font-size:0.95rem; margin-bottom:5px;">
                <i class="fas fa-tasks" style="color:#2ecc71;"></i> ${proj.name || 'ไม่ระบุชื่อกิจกรรม'} 
                <span style="color:#7f8c8d; font-size:0.8rem;">(ID: ${proj.id})</span>
              </div>
              <div style="font-size:0.85rem; color:#555;">
                งบ: <b>${budget.toLocaleString()}</b> | โดย: ${proj.owner || '-'} | สถานะ: 
                <span style="background:${badgeColor}; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">${statusText}</span>
              </div>
            </div>
          `;
        });

        sfBudget += mpBudget; sfSpent += mpSpent;
        let mpRemaining = mpBudget - mpSpent;

        // 🌟 ใส่ปุ่มกดสลับการกาง/หุบ โครงการหลัก (MP) 🌟
        mpHtml += `
          <div style="margin-left:20px; margin-bottom:15px; border-left:2px solid #bdc3c7; padding-left:15px;">
            <div onclick="toggleTree('mp-content-${mp.id}', this)" style="background:#f4f6f8; padding:12px; border-radius:6px; margin-bottom:10px; border-left:4px solid #2980b9; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition: background 0.2s;" onmouseover="this.style.background='#ebf5fb'" onmouseout="this.style.background='#f4f6f8'">
              <div>
                <div style="font-weight:bold; color:#2980b9; font-size:1.05rem; margin-bottom:5px;">
                  <i class="fas fa-chevron-down toggle-icon" style="width:20px;"></i> <i class="fas fa-bullseye"></i> โครงการหลัก: ${mp.name || 'ไม่ระบุชื่อ'}
                </div>
                <div style="font-size:0.85rem; color:#555; padding-left:25px;">
                  งบรวม: <b>${mpBudget.toLocaleString()}</b> &nbsp; เบิกจ่าย: <b>${mpSpent.toLocaleString()}</b> &nbsp; คงเหลือ: <b>${mpRemaining.toLocaleString()}</b>
                  &nbsp;&nbsp;|&nbsp;&nbsp; กิจกรรมย่อย: <b>${relatedProjs.length}</b> รายการ
                </div>
              </div>
            </div>
            <!-- ส่วนกล่องเก็บกิจกรรมที่จะถูกย่อ/ขยาย -->
            <div id="mp-content-${mp.id}" style="display:block;">
              ${projHtml}
            </div>
          </div>
        `;
      });

      let sfRemaining = sfBudget - sfSpent;

      // 🌟 ใส่ปุ่มกดสลับการกาง/หุบ แผนงานหลัก (SF) 🌟
      html += `
        <div style="background:#fdf2e9; border:1px solid #f5b041; border-radius:8px; margin-bottom:30px; overflow:hidden;">
          <div onclick="toggleTree('sf-content-${sf.id}', this)" style="background:#fdebd0; padding:15px; border-bottom:1px solid #f5b041; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition: background 0.2s;" onmouseover="this.style.background='#fad7a1'" onmouseout="this.style.background='#fdebd0'">
            <div>
              <div style="font-size:1.2rem; font-weight:bold; color:#d35400; margin-bottom:8px;">
                <i class="fas fa-chevron-down toggle-icon" style="width:25px;"></i> <i class="fas fa-chess-rook"></i> แผนงาน: ${sf.name} ${sf.start ? `(ปี ${sf.start}-${sf.end})` : ''}
              </div>
              <div style="font-size:0.9rem; color:#e67e22; background:rgba(255,255,255,0.6); display:inline-block; padding:5px 12px; border-radius:15px; margin-left:30px;">
                งบประมาณรวม: <b>${sfBudget.toLocaleString()}</b> &nbsp;|&nbsp; 
                เบิกจ่ายแล้ว: <b>${sfSpent.toLocaleString()}</b> &nbsp;|&nbsp; 
                คงเหลือ: <b>${sfRemaining.toLocaleString()}</b> &nbsp;|&nbsp;
                กิจกรรมทั้งหมด: <b>${sfProjects.length}</b> โครงการ
              </div>
            </div>
          </div>
          <!-- ส่วนกล่องเก็บโครงการหลักที่จะถูกย่อ/ขยาย -->
          <div id="sf-content-${sf.id}" style="padding:20px; background:#fff; display:block;">
            ${mpHtml || '<div style="color:#95a5a6; font-size:0.9rem; font-style:italic;">ยังไม่มีโครงการหลักภายใต้แผนงานนี้ (กรุณาเพิ่มโครงการหลักและเชื่อมโยงกิจกรรม)</div>'}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error("Tree View Error:", err);
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#c0392b;">
      <i class="fas fa-exclamation-triangle fa-2x"></i><br><br>เกิดข้อผิดพลาดในการวาดโครงสร้างแผนงาน:<br>${err.message}
    </div>`;
  }
}

// ==========================================
// 🌟 ฟังก์ชันจัดการตาราง SF และ MP (อัปเดตให้ดึงและส่ง Description)
// ==========================================

function renderSfTable(data) {
  const tbody = document.getElementById('sf-tbody');
  if(!tbody) return;
  if(data.sf.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">ยังไม่มีข้อมูล</td></tr>'; return; }
  
  let html = '';
  data.sf.forEach(sf => {
    let safeName = encodeURIComponent(sf.name).replace(/'/g, "%27");
    let safeDesc = encodeURIComponent(sf.desc).replace(/'/g, "%27"); // 🌟 เตรียมคำอธิบายให้ Modal

    html += `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px; font-weight:bold; color:#8e44ad;">${sf.id}</td>
      <td style="padding:10px;">
        <div style="font-weight:bold; color:#2c3e50;">${sf.name}</div>
        <div style="font-size:0.8rem; color:#7f8c8d; margin-top:3px; max-height:45px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${sf.desc || "-"}</div>
      </td>
      <td style="padding:10px; text-align:center;">${sf.start} - ${sf.end}</td>
      <td style="padding:10px; text-align:center;">
        <button onclick="openSfModal('${sf.id}', '${safeName}', '${safeDesc}', '${sf.start}', '${sf.end}')" style="background:#f39c12; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i> แก้ไข</button>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

function renderMpTable(data) {
  const tbody = document.getElementById('mp-tbody');
  if(!tbody) return;
  
  const sfSelect = document.getElementById('mp-sf-ref');
  let sfOptions = '<option value="">-- เลือกแผนงาน --</option>';
  data.sf.forEach(s => { sfOptions += `<option value="${s.id}">[${s.id}] ${s.name}</option>`; });
  if(sfSelect) sfSelect.innerHTML = sfOptions;

  if(data.mp.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">ยังไม่มีข้อมูล</td></tr>'; return; }

  let html = '';
  data.mp.forEach(mp => {
    let sfObj = data.sf.find(s => s.id === mp.sfId);
    let sfNameDisplay = sfObj ? `[${sfObj.id}] ${sfObj.name}` : '<span style="color:red;">ไม่พบสังกัด</span>';
    
    let safeName = encodeURIComponent(mp.name).replace(/'/g, "%27");
    let safeDesc = encodeURIComponent(mp.desc).replace(/'/g, "%27"); // 🌟 เตรียมคำอธิบายให้ Modal

    html += `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px; font-weight:bold; color:#2980b9;">${mp.id}</td>
      <td style="padding:10px;">
        <div style="font-weight:bold; color:#2c3e50;">${mp.name}</div>
        <div style="font-size:0.8rem; color:#7f8c8d; margin-top:3px; max-height:45px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${mp.desc || "-"}</div>
      </td>
      <td style="padding:10px; color:#7f8c8d; font-size:0.85rem;">${sfNameDisplay}</td>
      <td style="padding:10px; text-align:center;">
        <button onclick="openMpModal('${mp.id}', '${safeName}', '${safeDesc}', '${mp.sfId}')" style="background:#f39c12; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i> แก้ไข</button>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

// 🌟 อัปเดตฟังก์ชันเปิด Modal ให้รับค่า Description ไปใส่ในช่อง 🌟
function openSfModal(id='', encodedName='', encodedDesc='', start='', end='') {
  document.getElementById('sfForm').reset();
  document.getElementById('sf-id').value = id;
  if(id !== '') {
    document.getElementById('sf-name').value = decodeURIComponent(encodedName);
    document.getElementById('sf-desc').value = decodeURIComponent(encodedDesc); // ดึงข้อความลงช่อง
    document.getElementById('sf-start').value = start;
    document.getElementById('sf-end').value = end;
  }
  document.getElementById('sfModal').style.display = 'flex';
}

function openMpModal(id='', encodedName='', encodedDesc='', sfIdRef='') {
  document.getElementById('mpForm').reset();
  document.getElementById('mp-id').value = id;
  if(id !== '') {
    document.getElementById('mp-name').value = decodeURIComponent(encodedName);
    document.getElementById('mp-desc').value = decodeURIComponent(encodedDesc); // ดึงข้อความลงช่อง
    document.getElementById('mp-sf-ref').value = sfIdRef;
  }
  document.getElementById('mpModal').style.display = 'flex';
}


function submitSfForm() {
  const form = document.getElementById('sfForm');
  if(!form.sfName.value || !form.startYear.value || !form.endYear.value) { alert("กรอกข้อมูลบังคับ (*) ให้ครบถ้วนครับ"); return; }
  
  const btn = document.getElementById('btn-submit-sf');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึก...'; btn.disabled = true;

  const data = { sfId: form.sfId.value, sfName: form.sfName.value, sfDesc: form.sfDesc.value, startYear: form.startYear.value, endYear: form.endYear.value };
  
  google.script.run.withSuccessHandler(res => {
    alert(res.message); document.getElementById('sfModal').style.display = 'none';
    btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล'; btn.disabled = false;
    loadStrategyStructure(); // โหลดข้อมูลใหม่ทั้งหน้า
  }).withFailureHandler(err => {
    alert("ผิดพลาด: " + err.message);
    btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล'; btn.disabled = false;
  }).saveStrategicFramework(data);
}

function openMpModal(id='', encodedName='', sfIdRef='') {
  document.getElementById('mpForm').reset();
  document.getElementById('mp-id').value = id;
  if(id !== '') {
    document.getElementById('mp-name').value = decodeURIComponent(encodedName);
    document.getElementById('mp-sf-ref').value = sfIdRef;
  }
  document.getElementById('mpModal').style.display = 'flex';
}

function submitMpForm() {
  const form = document.getElementById('mpForm');
  if(!form.sfIdRef.value || !form.mpName.value) { alert("กรอกข้อมูลบังคับ (*) ให้ครบถ้วนครับ"); return; }
  
  const btn = document.getElementById('btn-submit-mp');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึก...'; btn.disabled = true;

  const data = { mpId: form.mpId.value, mpName: form.mpName.value, mpDesc: form.mpDesc.value, sfIdRef: form.sfIdRef.value };
  
  google.script.run.withSuccessHandler(res => {
    alert(res.message); document.getElementById('mpModal').style.display = 'none';
    btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล'; btn.disabled = false;
    loadStrategyStructure(); // โหลดข้อมูลใหม่ทั้งหน้า
  }).withFailureHandler(err => {
    alert("ผิดพลาด: " + err.message);
    btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล'; btn.disabled = false;
  }).saveMasterPlan(data);
}
// ==========================================
  // 🌟 ตัวดักจับเมื่อเปิดหน้าโครงสร้างแผนงาน ให้โหลดข้อมูลทันที 🌟
  // ==========================================
  var observerStrategy = new MutationObserver((mutations) => {
    mutations.forEach((m) => { 
      if (m.target.style.display === 'block') { 
        loadStrategyStructure(); 
      } 
    });
  });
  var pageStrategyNode = document.getElementById('page-strategy');
  if (pageStrategyNode) {
      observerStrategy.observe(pageStrategyNode, { attributes: true, attributeFilter: ['style'] });
  }

  // ==========================================
  // 🌟 ฟังก์ชันโหลดข้อมูลโครงสร้าง (ดึง SF, MP, Projects3)
  // ==========================================
  function loadStrategyStructure() {
    // ระหว่างรอ ให้แสดงไอคอนโหลดทั้ง 4 แท็บ
    const sfTbody = document.getElementById('sf-tbody');
    const mpTbody = document.getElementById('mp-tbody');
    const mapTbody = document.getElementById('mapping-tbody');
    const treeCont = document.getElementById('tree-container');
    
    const loadingHtml = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#7f8c8d;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูลจากระบบ...</td></tr>';
    
    if (sfTbody) sfTbody.innerHTML = loadingHtml;
    if (mpTbody) mpTbody.innerHTML = loadingHtml;
    if (mapTbody) mapTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#7f8c8d;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูลจากระบบ...</td></tr>';
    if (treeCont) treeCont.innerHTML = '<div style="text-align:center; padding:50px; color:#7f8c8d;"><i class="fas fa-spinner fa-spin fa-3x"></i><br><br>กำลังประมวลผลโครงสร้างแผนงาน...</div>';

    google.script.run
      .withSuccessHandler(function(data) {
        globalStrategyData = data;
        renderSfTable(data);       // วาดตาราง แผนงาน
        renderMpTable(data);       // วาดตาราง โครงการหลัก
        renderMappingTable(data);  // วาดตาราง เชื่อมโยง
        renderTreeView(data);      // วาดแผนผัง Tree
      })
      .withFailureHandler(function(err) {
        if (sfTbody) sfTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e74c3c;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
      })
      .getStrategicStructureData();
  }
  // ==========================================
  // 🌟 ตัวดักจับเมื่อเปิดหน้า QA ให้โหลดข้อมูลทันที 🌟
  // ==========================================
  var observerQA = new MutationObserver((mutations) => {
    mutations.forEach((m) => { 
      if (m.target.style.display === 'block') { 
        loadQAStructure(); // เรียกฟังก์ชันโหลดข้อมูล QA
      } 
    });
  });
  var pageQaNode = document.getElementById('page-qa');
  if (pageQaNode) {
      observerQA.observe(pageQaNode, { attributes: true, attributeFilter: ['style'] });
  }
  // ==========================================
// 🌟 ฟังก์ชันจัดการตารางงานประกันคุณภาพ (QA Mapping) 🌟
// ==========================================
let globalQAData = null;
// ฟังก์ชันสลับแท็บภายในหน้า QA
function switchQaTab(tabId) {
  document.querySelectorAll('.qa-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('[id^="btn-qa-"]').forEach(b => {
    b.style.color = '#7f8c8d';
    b.style.borderBottom = '3px solid transparent';
  });
  
  document.getElementById(tabId).style.display = 'block';
  const btn = document.getElementById(tabId.replace('tab-', 'btn-'));
  if (btn) {
    let color = '#d35400'; // สีของแท็บ 1
    if (tabId === 'tab-qa-std') color = '#2980b9'; // สีของแท็บ 2
    if (tabId === 'tab-qa-summary') color = '#27ae60'; // สีของแท็บ 3
    btn.style.color = color;
    btn.style.borderBottom = `3px solid ${color}`;
  }
}
// ==========================================
// 🌟 ระบบ UX/UI หน้า QA (Split Pane + MIS Report 2 มุมมอง)
// ==========================================
let qaGlobalProjects = [];
let qaGlobalStandards = [];
let qaCurrentSelectedId = null;

function loadQAStructure() {
    let activeYear = typeof getDefaultYear === 'function' ? getDefaultYear() : ""; 
    
    // 🌟 เสกแถบสลับโหมดและพื้นที่แสดงรายงานสารสนเทศอัตโนมัติ (ไม่ต้องแก้ไฟล์ HTML)
    injectQAModeSwitcher();

    const listContainer = document.getElementById('qa-project-list');
    if (listContainer) {
        listContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#95a5a6;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</div>';
    }

    google.script.run
    .withSuccessHandler(function(res) {
        if (!res.success) {
            if (listContainer) listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#e74c3c;">เกิดข้อผิดพลาด: ${res.message}</div>`;
            return;
        }

        qaGlobalProjects = res.projects || [];
        qaGlobalStandards = res.qa || [];
        
        // อัปเดต Dropdown เลือกกลุ่มงาน
        let depts = [...new Set(qaGlobalProjects.map(p => p.deptName).filter(d => d))];
        let deptSelect = document.getElementById('qa-filter-dept');
        if(deptSelect) {
            deptSelect.innerHTML = '<option value="ALL">🏢 ทุกกลุ่มบริหารงาน</option>';
            depts.forEach(d => { deptSelect.innerHTML += `<option value="${d}">${d}</option>`; });
        }

        // วาด Checkbox มาตรฐาน QA เตรียมไว้ให้ฝั่งขวา
        let chkContainer = document.getElementById('qa-checkbox-container');
        if(chkContainer) {
            let chkHtml = '';
            qaGlobalStandards.forEach(std => {
                chkHtml += `
                <label style="display:flex; align-items:flex-start; padding:10px; border:1px solid #dcdde1; border-radius:6px; background:white; cursor:pointer; transition: 0.2s;">
                   <input type="checkbox" class="qa-std-chk" value="${std.id}" style="margin-right:10px; margin-top:4px;">
                   <span style="font-size:0.9rem; line-height:1.4;"><span style="font-weight:bold; color:#2980b9;">${std.id}</span><br>${std.name}</span>
                </label>`;
            });
            chkContainer.innerHTML = chkHtml;
        }

        renderQAList(); // วาดรายชื่อโครงการฝั่งซ้าย
        
        // 🌟 สั่งวาดตารางสารสนเทศ 2 มุมมองเตรียมไว้เลย!
        renderQASummaryReport({ qa: qaGlobalStandards, projects: qaGlobalProjects });
    })
    .withFailureHandler(function(err){
        console.error("QA Load Error:", err);
        if (listContainer) listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#e74c3c;">ระบบขัดข้อง: ${err.message}</div>`;
    })
    .fetchQADashboardData(activeYear);
}

// 🌟 ฟังก์ชันช่วยสร้างปุ่มสลับโหมดบนหน้าเว็บอัตโนมัติ
function injectQAModeSwitcher() {
    const pageQa = document.getElementById('page-qa');
    if (!pageQa || document.getElementById('qa-main-mode-bar')) return;

    // หาจุดแทรกปุ่ม (วางไว้ใต้กล่องหลอดความคืบหน้า)
    const progressText = document.getElementById('qa-progress-text');
    let progressBox = progressText ? progressText.closest('div[style*="background"]') : null;
    
    // หากล่อง Split Pane เดิมเพื่อเอาไว้ซ่อน/แสดงตอนสลับโหมด
    const listEl = document.getElementById('qa-project-list');
    let splitPaneBox = null;
    if (listEl) {
        let curr = listEl.parentElement;
        while (curr && curr !== pageQa) {
            if (window.getComputedStyle(curr).display === 'flex' || window.getComputedStyle(curr).display === 'grid') {
                splitPaneBox = curr;
            }
            curr = curr.parentElement;
        }
    }
    if (splitPaneBox) splitPaneBox.id = 'qa-split-pane-workspace';

    // สร้างแถบปุ่มสลับโหมด
    const switcherBar = document.createElement('div');
    switcherBar.id = 'qa-main-mode-bar';
    switcherBar.style.cssText = 'display:flex; gap:12px; margin: 15px 0; border-bottom: 2px solid #e0e6ed; padding-bottom: 12px;';
    switcherBar.innerHTML = `
        <button id="btn-mode-workspace" onclick="switchQAMainMode('workspace')" style="background:#8e44ad; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:1rem; box-shadow:0 3px 6px rgba(142,68,173,0.2); transition:0.2s;">
            <i class="fas fa-tasks"></i> 1. ระบบจับคู่มาตรฐาน (Mapping Workspace)
        </button>
        <button id="btn-mode-report" onclick="switchQAMainMode('report')" style="background:white; color:#555; border:1px solid #bdc3c7; padding:10px 20px; border-radius:8px; cursor:pointer; font-family:'Kanit'; font-weight:bold; font-size:1rem; transition:0.2s;">
            <i class="fas fa-chart-pie"></i> 2. รายงานสารสนเทศ QA (2 มุมมอง)
        </button>
    `;

    // สร้างกล่องเก็บรายงานสารสนเทศ
    const summaryContainer = document.createElement('div');
    summaryContainer.id = 'qa-summary-container';
    summaryContainer.style.display = 'none';

    if (splitPaneBox) {
        splitPaneBox.parentNode.insertBefore(switcherBar, splitPaneBox);
        splitPaneBox.parentNode.insertBefore(summaryContainer, splitPaneBox.nextSibling);
    } else if (progressBox) {
        progressBox.parentNode.insertBefore(switcherBar, progressBox.nextSibling);
        progressBox.parentNode.appendChild(summaryContainer);
    }
}

// 🌟 ฟังก์ชันสลับระหว่าง "หน้าจับคู่" กับ "หน้ารายงานสารสนเทศ"
function switchQAMainMode(mode) {
    const workspace = document.getElementById('qa-split-pane-workspace');
    const report = document.getElementById('qa-summary-container');
    const btnWork = document.getElementById('btn-mode-workspace');
    const btnRep = document.getElementById('btn-mode-report');

    if (mode === 'workspace') {
        if (workspace) workspace.style.display = 'flex';
        if (report) report.style.display = 'none';
        if (btnWork) { btnWork.style.background = '#8e44ad'; btnWork.style.color = 'white'; btnWork.style.border = 'none'; }
        if (btnRep) { btnRep.style.background = 'white'; btnRep.style.color = '#555'; btnRep.style.border = '1px solid #bdc3c7'; }
    } else {
        if (workspace) workspace.style.display = 'none';
        if (report) report.style.display = 'block';
        if (btnRep) { btnRep.style.background = '#2980b9'; btnRep.style.color = 'white'; btnRep.style.border = 'none'; }
        if (btnWork) { btnWork.style.background = 'white'; btnWork.style.color = '#555'; btnWork.style.border = '1px solid #bdc3c7'; }
        
        // อัปเดตตารางรายงานให้เป็นข้อมูลล่าสุดเสมอตอนกดเปิดดู
        renderQASummaryReport({ qa: qaGlobalStandards, projects: qaGlobalProjects });
    }
}

// ==========================================
// 🌟 วาดรายชื่อโครงการฝั่งซ้าย
// ==========================================
function renderQAList() {
    let statFilter = document.getElementById('qa-filter-status') ? document.getElementById('qa-filter-status').value : 'ALL';
    let deptFilter = document.getElementById('qa-filter-dept') ? document.getElementById('qa-filter-dept').value : 'ALL';
    
    let filtered = qaGlobalProjects.filter(p => {
        let isMapped = (p.qaIds && p.qaIds.trim() !== "");
        let passStat = (statFilter === 'ALL') || (statFilter === 'MAPPED' && isMapped) || (statFilter === 'UNMAPPED' && !isMapped);
        let passDept = (deptFilter === 'ALL') || (p.deptName === deptFilter);
        return passStat && passDept;
    });

    filtered.sort((a, b) => {
        let aMapped = (a.qaIds && a.qaIds.trim() !== "");
        let bMapped = (b.qaIds && b.qaIds.trim() !== "");
        if (aMapped === bMapped) return 0;
        return aMapped ? 1 : -1;
    });

    let mappedCount = qaGlobalProjects.filter(p => p.qaIds && p.qaIds.trim() !== "").length;
    let totalCount = qaGlobalProjects.length;
    let pct = totalCount === 0 ? 0 : Math.round((mappedCount / totalCount) * 100);
    
    if (document.getElementById('qa-progress-text')) document.getElementById('qa-progress-text').innerText = `${mappedCount} / ${totalCount} โครงการ (${pct}%)`;
    if (document.getElementById('qa-progress-bar')) document.getElementById('qa-progress-bar').style.width = pct + '%';

    let listHtml = '';
    filtered.forEach(p => {
        let isMapped = (p.qaIds && p.qaIds.trim() !== "");
        let icon = isMapped ? '<i class="fas fa-check-circle" style="color:#27ae60;"></i>' : '<i class="fas fa-exclamation-circle" style="color:#e74c3c;"></i>';
        let bg = p.id === qaCurrentSelectedId ? '#e8f4fd' : (isMapped ? '#f8f9fa' : 'white');
        let border = p.id === qaCurrentSelectedId ? 'border-left: 4px solid #3498db;' : 'border-left: 4px solid transparent;';
        let opacity = isMapped ? '0.6' : '1';
        
        listHtml += `
        <div onclick="selectQAProject('${p.id}')" style="background:${bg}; ${border} padding:12px; margin-bottom:8px; border-radius:4px; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition: background 0.2s; opacity: ${opacity};">
           <div style="font-weight:bold; color:#2c3e50; font-size:0.95rem; line-height:1.3; margin-bottom:5px;">${p.name}</div>
           <div style="font-size:0.85rem; color:#7f8c8d; display:flex; justify-content:space-between;">
              <span>${p.id}</span>
              <span>${icon}</span>
           </div>
        </div>`;
    });

    if(filtered.length === 0) listHtml = '<div style="text-align:center; padding:20px; color:#95a5a6;">ไม่พบข้อมูลโครงการ</div>';
    if (document.getElementById('qa-project-list')) document.getElementById('qa-project-list').innerHTML = listHtml;
}

// ==========================================
// 🌟 วาดหน้ารายงานสารสนเทศ (QA MIS Dashboard - 2 มุมมอง ไม่แสดงงบป้องกันเงินเฟ้อ)
// ==========================================
function renderQASummaryReport(data) {
  const container = document.getElementById('qa-summary-container');
  if(!container) return;

  let qaList = [...(data.qa || [])].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, {numeric: true}));
  let projList = [...(data.projects || [])].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, {numeric: true}));

  let coveredStandards = 0;

  // 🎯 มุมมองที่ 1: เรียงตามมาตรฐานและประเด็นพิจารณา (By Standard)
  let view1Html = `
    <div style="background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
      <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
        <thead>
          <tr style="background:#2980b9; color:white;">
            <th style="padding:14px; border:1px solid #d9e2ec; width:15%; text-align:center;">รหัสมาตรฐาน/ประเด็น</th>
            <th style="padding:14px; border:1px solid #d9e2ec; width:45%; text-align:left;">มาตรฐานการศึกษา / ประเด็นพิจารณา</th>
            <th style="padding:14px; border:1px solid #d9e2ec; width:40%; text-align:left;">โครงการ / กิจกรรมที่รองรับ</th>
          </tr>
        </thead>
        <tbody>
  `;

  qaList.forEach(q => {
    let matchedProjects = projList.filter(p => {
       if(!p.qaIds) return false;
       let savedIds = p.qaIds.split(',').map(s => s.trim());
       return savedIds.includes(q.id);
    });

    if (matchedProjects.length > 0) coveredStandards++;

    let projBullets = matchedProjects.length > 0
        ? matchedProjects.map((p, idx) => `
            <div style="padding:6px 0; ${idx < matchedProjects.length - 1 ? 'border-bottom:1px dashed #ecf0f1;' : ''} line-height:1.4;">
              <i class="fas fa-check-circle" style="color:#27ae60;"></i> 
              <span style="color:#8e44ad; font-weight:bold;">[${p.id}]</span> 
              <span style="color:#2c3e50; font-weight:500;">${p.name}</span>
              <span style="font-size:0.8rem; color:#7f8c8d; background:#f4f6f8; padding:2px 6px; border-radius:4px; margin-left:5px;">${p.deptName || ''}</span>
            </div>`).join('')
        : `<div style="color:#c0392b; font-weight:bold; background:#fdedec; padding:8px 12px; border-radius:6px; display:inline-block; font-size:0.85rem;">
             <i class="fas fa-exclamation-triangle"></i> ยังไม่มีโครงการรองรับประเด็นนี้
           </div>`;

    let dotCount = (String(q.id).match(/\./g) || []).length;
    let indent = '';
    if (dotCount === 1) indent = '<span style="margin-left:15px; color:#95a5a6;">├─</span> ';
    if (dotCount >= 2) indent = '<span style="margin-left:30px; color:#95a5a6;">└─</span> ';

    let rowBg = matchedProjects.length === 0 ? '#fffafa' : '#ffffff';

    view1Html += `
      <tr style="background:${rowBg}; border-bottom:1px solid #ecf0f1; vertical-align:top;">
        <td style="padding:12px; border:1px solid #ecf0f1; font-weight:bold; color:#2980b9; text-align:center;">
          ${q.id}
          <div style="font-size:0.75rem; color:#7f8c8d; font-weight:normal; margin-top:4px;">(${matchedProjects.length} โครงการ)</div>
        </td>
        <td style="padding:12px; border:1px solid #ecf0f1; font-weight:500; color:#2c3e50; line-height:1.5;">${indent}${q.name}</td>
        <td style="padding:12px; border:1px solid #ecf0f1;">${projBullets}</td>
      </tr>
    `;
  });
  view1Html += `</tbody></table></div>`;

  // 🎯 มุมมองที่ 2: เรียงตามโครงการ พร้อมรายละเอียดตัวบ่งชี้ (By Project)
  let view2Html = `
    <div style="background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
      <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
        <thead>
          <tr style="background:#27ae60; color:white;">
            <th style="padding:14px; border:1px solid #d9e2ec; width:15%; text-align:center;">รหัสโครงการ</th>
            <th style="padding:14px; border:1px solid #d9e2ec; width:35%; text-align:left;">ชื่อโครงการ / กลุ่มบริหาร</th>
            <th style="padding:14px; border:1px solid #d9e2ec; width:50%; text-align:left;">มาตรฐานและประเด็นพิจารณาที่ตอบสนอง (พร้อมรายละเอียด)</th>
          </tr>
        </thead>
        <tbody>
  `;

  projList.forEach(p => {
     let qaBullets = '';
     if (p.qaIds && p.qaIds.trim() !== '') {
        let ids = p.qaIds.split(',').map(s => s.trim()).filter(s => s !== '');
        let matchedQAs = ids.map(id => {
            let foundQa = qaList.find(q => String(q.id).trim() === id);
            return foundQa 
              ? `<div style="margin-bottom:8px; padding:8px 12px; background:#f4fbf7; border-left:4px solid #2ecc71; border-radius:4px; line-height:1.4;">
                   <span style="background:#27ae60; color:white; padding:2px 6px; border-radius:4px; font-size:0.8rem; font-weight:bold; margin-right:6px;">${foundQa.id}</span>
                   <span style="color:#2c3e50; font-weight:500;">${foundQa.name}</span>
                 </div>` 
              : `<div style="margin-bottom:8px; padding:8px 12px; background:#f4f6f8; border-left:4px solid #bdc3c7; border-radius:4px;">
                   <b style="color:#7f8c8d;">[${id}]</b> <span style="color:#95a5a6;">(ไม่พบคำอธิบายในฐานข้อมูล)</span>
                 </div>`;
        });
        qaBullets = matchedQAs.join('');
     } else {
        qaBullets = `<div style="color:#e74c3c; font-style:italic; padding:8px;"><i class="fas fa-exclamation-circle"></i> ยังไม่ได้ระบุมาตรฐานที่ตอบสนอง</div>`;
     }

     view2Html += `
      <tr style="border-bottom:1px solid #ecf0f1; vertical-align:top; background:white;">
        <td style="padding:12px; border:1px solid #ecf0f1; font-weight:bold; color:#8e44ad; text-align:center;">${p.id}</td>
        <td style="padding:12px; border:1px solid #ecf0f1;">
          <div style="font-weight:bold; color:#2c3e50; font-size:1rem; margin-bottom:4px;">${p.name}</div>
          <span style="background:#eaf2f8; color:#2980b9; padding:3px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">
            <i class="fas fa-building"></i> ${p.deptName || 'ไม่ระบุกลุ่มงาน'}
          </span>
        </td>
        <td style="padding:12px; border:1px solid #ecf0f1;">${qaBullets}</td>
      </tr>
     `;
  });
  view2Html += `</tbody></table></div>`;

  // 🎯 ประกอบร่าง Dashboard + ปุ่มสลับ 2 มุมมอง
  let totalStandards = qaList.length;
  let riskStandards = totalStandards - coveredStandards;
  
  container.innerHTML = `
    <!-- การ์ดสรุปความครอบคลุม -->
    <div style="display:flex; gap:15px; margin-bottom:20px; flex-wrap:wrap;">
       <div style="flex:1; min-width:200px; background:linear-gradient(135deg, #3498db, #2980b9); color:white; padding:18px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.08); text-align:center;">
          <div style="font-size:0.95rem; opacity:0.9; margin-bottom:5px;"><i class="fas fa-list-ol"></i> ประเด็นพิจารณาทั้งหมด</div>
          <div style="font-size:2rem; font-weight:bold;">${totalStandards} <span style="font-size:1rem; font-weight:normal;">ประเด็น</span></div>
       </div>
       <div style="flex:1; min-width:200px; background:linear-gradient(135deg, #2ecc71, #27ae60); color:white; padding:18px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.08); text-align:center;">
          <div style="font-size:0.95rem; opacity:0.9; margin-bottom:5px;"><i class="fas fa-check-circle"></i> มีโครงการรองรับแล้ว</div>
          <div style="font-size:2rem; font-weight:bold;">${coveredStandards} <span style="font-size:1rem; font-weight:normal;">ประเด็น</span></div>
       </div>
       <div style="flex:1; min-width:200px; background:linear-gradient(135deg, ${riskStandards > 0 ? '#e74c3c, #c0392b' : '#95a5a6, #7f8c8d'}); color:white; padding:18px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.08); text-align:center;">
          <div style="font-size:0.95rem; opacity:0.9; margin-bottom:5px;"><i class="fas fa-exclamation-triangle"></i> จุดเสี่ยง (ยังไม่มีโครงการรองรับ)</div>
          <div style="font-size:2rem; font-weight:bold;">${riskStandards} <span style="font-size:1rem; font-weight:normal;">ประเด็น</span></div>
       </div>
    </div>
    
    <!-- ปุ่มสลับ View 1 และ View 2 พร้อมปุ่ม Export -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#f8f9fa; padding:12px 15px; border-radius:8px; border:1px solid #e0e6ed; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button id="btn-qa-v1" onclick="document.getElementById('qa-view-1').style.display='block'; document.getElementById('qa-view-2').style.display='none'; this.style.background='#2980b9'; this.style.color='white'; document.getElementById('btn-qa-v2').style.background='white'; document.getElementById('btn-qa-v2').style.color='#555';" style="background:#2980b9; color:white; border:1px solid #2980b9; padding:8px 18px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; transition:0.2s;">
          <i class="fas fa-layer-group"></i> มุมมองที่ 1: เรียงตามมาตรฐาน/ประเด็นพิจารณา
        </button>
        
        <button id="btn-qa-v2" onclick="document.getElementById('qa-view-1').style.display='none'; document.getElementById('qa-view-2').style.display='block'; this.style.background='#27ae60'; this.style.color='white'; document.getElementById('btn-qa-v1').style.background='white'; document.getElementById('btn-qa-v1').style.color='#555';" style="background:white; color:#555; border:1px solid #bdc3c7; padding:8px 18px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; transition:0.2s;">
          <i class="fas fa-project-diagram"></i> มุมมองที่ 2: เรียงตามโครงการ (พร้อมคำอธิบายตัวบ่งชี้)
        </button>
      </div>

      <!-- 🌟 ปุ่มส่งออกรายงานสรุปตามมาตรฐาน -->
      <div style="display:flex; gap:8px;">
        <button onclick="exportQASummaryReport('print')" style="background:#8e44ad; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <i class="fas fa-print"></i> พิมพ์ / PDF (A4)
        </button>
        <button onclick="exportQASummaryReport('excel')" style="background:#1e8449; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <i class="fas fa-file-excel"></i> ส่งออก Excel
        </button>
      </div>
    </div>

    <!-- ตารางแสดงผล -->
    <div id="qa-view-1" style="display:block;">${view1Html}</div>
    <div id="qa-view-2" style="display:none;">${view2Html}</div>
  `;
}

// ----------------------------------------------------
// 🌟 แท็บ 1: วาดตาราง บันทึกแบบรายโครงการ
// ----------------------------------------------------
function renderQAMappingTable(data) {
  const tbody = document.getElementById('qa-mapping-tbody');
  if(!tbody) return;
  
  let qaList = data.qa.sort((a, b) => a.id.localeCompare(b.id));
  let qaOptions = '<option value="">-- ไม่ได้ระบุ --</option>';
  qaList.forEach(q => { 
    let indent = '';
    if (q.level == 2) indent = '&nbsp;&nbsp;&nbsp;├─ ';
    if (q.level == 3) indent = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ ';
    qaOptions += `<option value="${q.id}">[${q.id}] ${indent}${q.name}</option>`; 
  });

  if(data.projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#95a5a6;">ยังไม่มีโครงการที่ผ่านการอนุมัติในระบบ</td></tr>';
    return;
  }

  let html = '';
  data.projects.forEach(p => {
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px; color:#d35400; font-weight:bold;">${p.id}</td>
        <td style="padding:10px; font-weight:bold; color:#2c3e50;">${p.name}</td>
        <td style="padding:10px;">
          <select multiple class="qa-mapping-select" data-pid="${p.id}" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; height:120px;">
            ${qaOptions}
          </select>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  
  data.projects.forEach(p => {
    const sel = document.querySelector(`.qa-mapping-select[data-pid="${p.id}"]`);
    if(sel && p.qaIds) {
      let savedIds = p.qaIds.split(',').map(s => s.trim());
      for(let i=0; i<sel.options.length; i++) {
        if(savedIds.includes(sel.options[i].value)) sel.options[i].selected = true;
      }
    }
  });
}

function submitQAMapping() {
  const selects = document.querySelectorAll('.qa-mapping-select');
  let mappingData = {};
  
  selects.forEach(sel => { 
    let selectedValues = Array.from(sel.selectedOptions).map(opt => opt.value).filter(val => val !== "");
    mappingData[sel.getAttribute('data-pid')] = selectedValues.join(', '); 
  });

  const btn = document.getElementById('btn-save-qa-map');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;

  google.script.run
    .withSuccessHandler(function(res) {
      alert(res.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล QA'; btn.disabled = false;
      loadQAStructure(); // รีโหลดข้อมูลใหม่เพื่อให้แท็บอื่นอัปเดตตาม
    })
    .withFailureHandler(function(err) {
      alert("ผิดพลาด: " + err.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล QA'; btn.disabled = false;
    })
    .saveQAProjectMapping(mappingData);
}

// ----------------------------------------------------
// 🌟 แท็บ 2: วาดตาราง บันทึกแบบรายมาตรฐาน (ตัวชี้วัด -> โครงการ)
// ----------------------------------------------------
function renderQAByStdTable(data) {
  const tbody = document.getElementById('qa-std-mapping-tbody');
  if(!tbody) return;
  
  let projOptions = '<option value="">-- ไม่ได้ระบุ --</option>';
  data.projects.forEach(p => { 
    projOptions += `<option value="${p.id}">[${p.id}] ${p.name}</option>`; 
  });

  let qaList = data.qa.sort((a, b) => a.id.localeCompare(b.id));
  let html = '';
  
  qaList.forEach(q => {
    let indent = '';
    if (q.level == 2) indent = '&nbsp;&nbsp;&nbsp;├─ ';
    if (q.level == 3) indent = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ ';
    
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px; color:#2980b9; font-weight:bold;">${q.id}</td>
        <td style="padding:10px;">${indent}${q.name}</td>
        <td style="padding:10px;">
          <select multiple class="qa-std-select" data-qa="${q.id}" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit'; height:100px;">
            ${projOptions}
          </select>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;

  // นำข้อมูลที่เคยบันทึกไว้ มาติ๊กเลือกให้อัตโนมัติ
  data.qa.forEach(q => {
    const sel = document.querySelector(`.qa-std-select[data-qa="${q.id}"]`);
    if(sel) {
      data.projects.forEach(p => {
         if(p.qaIds) {
            let savedIds = p.qaIds.split(',').map(s => s.trim());
            if(savedIds.includes(q.id)) {
               for(let i=0; i<sel.options.length; i++) {
                 if(sel.options[i].value === p.id) sel.options[i].selected = true;
               }
            }
         }
      });
    }
  });
}

// 🌟 ตัวนี้คือความมหัศจรรย์: เราแปลงข้อมูลที่เลือกจากหน้าจอ กลับไปเป็นรูปแบบ ProjectID ก่อนเซฟ!
function submitQAMappingByStd() {
  if(!globalQAData) return;
  
  let projMap = {};
  // เคลียร์ค่า Projects ทุกตัวให้ว่างเปล่าก่อน
  globalQAData.projects.forEach(p => projMap[p.id] = []);

  // วนลูปอ่านค่าที่เลือกจาก Dropdown ของแต่ละมาตรฐาน
  const selects = document.querySelectorAll('.qa-std-select');
  selects.forEach(sel => {
    let qaId = sel.getAttribute('data-qa');
    Array.from(sel.selectedOptions).forEach(opt => {
      let pid = opt.value;
      if(pid && projMap[pid] !== undefined) {
         projMap[pid].push(qaId); // ยัด QA ID กลับเข้าไปใน Array ของ Project นั้นๆ
      }
    });
  });

  // แปลง Array กลับเป็น Comma-separated
  let finalMapping = {};
  for(let pid in projMap) {
     finalMapping[pid] = projMap[pid].join(', ');
  }

  const btn = document.getElementById('btn-save-qa-std');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;

  // ส่งไปเซฟด้วยฟังก์ชันหลังบ้านเดิมได้เลย!
  google.script.run
    .withSuccessHandler(function(res) {
      alert(res.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล QA'; btn.disabled = false;
      loadQAStructure(); // รีโหลดข้อมูล
    })
    .withFailureHandler(function(err) {
      alert("ผิดพลาด: " + err.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล QA'; btn.disabled = false;
    })
    .saveQAProjectMapping(finalMapping);
}


// ==========================================
// 🌟 สคริปต์ควบคุมหน้าตะกร้าบัญชีและแผนงาน
// ==========================================
let globalAssignProjects = [];

function initReconYearDropdown() {
   const shortYear = getDefaultYear(); // 🌟 ดึงปีจากตั้งค่าระบบ
   
   const select = document.getElementById('recon-year-filter');
   if(select && !select.hasAttribute('data-init')) {
       let html = '<option value="all">-- ทุกปีงบประมาณ --</option>';
       let baseYear = parseInt("25" + shortYear);
       for(let i = baseYear+1; i >= baseYear-3; i--) {
           let sy = String(i).substring(2);
           let selected = (sy === shortYear) ? 'selected' : '';
           html += `<option value="${sy}" ${selected}>ปีงบประมาณ 25${sy}</option>`;
       }
       select.innerHTML = html;
       select.setAttribute('data-init', 'true');
   }
}

// ==========================================
// 🌟 สลับแท็บในหน้าบัญชี (อัปเดตสีปุ่ม Audit Log)
// ==========================================
function switchReconTab(tabId) {
  // ซ่อนเนื้อหาแท็บทั้งหมด
  document.querySelectorAll('.recon-tab-content').forEach(t => t.style.display = 'none');
  
  // ล้างสีเส้นใต้ของทุกปุ่ม (เพิ่ม #btn-audit-log เข้าไปในกลุ่มนี้ด้วย)
  document.querySelectorAll('[id^="btn-recon-"], #btn-plan-assign, #btn-audit-log').forEach(b => {
    b.style.color = '#7f8c8d';
    b.style.borderBottom = '3px solid transparent';
  });
  
  // แสดงเนื้อหาแท็บที่เลือก
  document.getElementById(tabId).style.display = 'block';
  
  // ให้สีปุ่มที่ถูกเลือก
  const btn = document.getElementById(tabId.replace('tab-', 'btn-'));
  if (btn) {
    let color = '#27ae60'; // สีเขียวตั้งต้น
    if (tabId === 'tab-plan-assign') color = '#e67e22'; // สีส้ม สำหรับแผน
    if (tabId === 'tab-audit-log') color = '#e74c3c';   // 🌟 สีแดง สำหรับประวัติพิเศษ
    
    btn.style.color = color;
    btn.style.borderBottom = `3px solid ${color}`;
  }
}

// ==========================================
// 🌟 1. อัปเดตตัวโหลดข้อมูลให้ดึง "รอแนบบิล" มาด้วย และจัดเรียงลำดับ
// ==========================================
function loadReconInbox() {
  initReconYearDropdown();
  const year = document.getElementById('recon-year-filter').value;
  
  document.getElementById('tbody-recon-pending').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล...</td></tr>';
  document.getElementById('tbody-recon-history').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล...</td></tr>';
  document.getElementById('tbody-plan-assign').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล...</td></tr>';

  // ดึงรายชื่อโครงการเผื่อไว้สำหรับแท็บแผนงาน
  google.script.run.withSuccessHandler(projs => { globalAssignProjects = projs; }).getActiveApprovedProjects();

  google.script.run
    .withSuccessHandler(function(res) {
      
      // 🌟 1. ดึงมาทั้งคนที่ส่งบิลแล้ว(รอกระทบยอด) และคนที่ยังไม่ส่ง(รอแนบบิล)
      let pendingRecon = res.recon.filter(r => r.reconStatus === 'รอกระทบยอด' || r.reconStatus === 'รอแนบบิล');
      
      // 🌟 2. จัดเรียง: เอาคนที่ "รอกระทบยอด" (พร้อมให้บัญชีตรวจ) ขึ้นบนสุด
      pendingRecon.sort((a, b) => {
         if (a.reconStatus === 'รอกระทบยอด' && b.reconStatus !== 'รอกระทบยอด') return -1;
         if (a.reconStatus !== 'รอกระทบยอด' && b.reconStatus === 'รอกระทบยอด') return 1;
         return 0; // ถ้าระดับเดียวกันให้เรียงตามเวลาเดิม
      });

      let historyRecon = res.recon.filter(r => r.reconStatus !== 'รอกระทบยอด' && r.reconStatus !== 'รอแนบบิล');
      
      // 🌟 3. อัปเดต Badge (ให้แจ้งเตือนเฉพาะอันที่ "รอกระทบยอด" เพื่อไม่ให้กวนใจบัญชี)
      let readyToReconCount = pendingRecon.filter(r => r.reconStatus === 'รอกระทบยอด').length;
      
      const bRecon = document.getElementById('badge-recon-pending');
      const bPlan = document.getElementById('badge-plan-pending');
      if(bRecon) { bRecon.innerText = readyToReconCount; bRecon.style.display = readyToReconCount > 0 ? 'inline-block' : 'none'; }
      if(bPlan) { bPlan.innerText = res.expenses.length; bPlan.style.display = res.expenses.length > 0 ? 'inline-block' : 'none'; }

      renderReconPendingTable(pendingRecon);
      renderReconHistoryTable(historyRecon);
      renderPlanAssignTable(res.expenses);
    })
    .getAccountPlanInboxData(year);
}

// =========================================================================
// 🌟 วาดตารางรอกระทบยอด (ปรับชื่อโครงการให้เด่น)
// =========================================================================
function renderReconPendingTable(data) {
  const tbody = document.getElementById('tbody-recon-pending');
  if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#95a5a6;">ไม่มีรายการรอตรวจสอบ หรือรายการค้างส่งบิล</td></tr>'; return; }

  let html = '';
  data.forEach(r => {
    let cleanRequestedTotal = Number(String(r.total || "0").replace(/,/g, '')) || 0;
    let defaultActual = 0;
    let billsHtml = '';

    if (r.bills && r.bills.length > 0) {
       r.bills.forEach((b, idx) => {
           defaultActual += (Number(b.amount) || 0);
           billsHtml += `<a href="${b.url}" target="_blank" title="ใบที่ ${idx + 1}" style="display:inline-block; background:#3498db; color:white; border-radius:4px; padding:4px 8px; margin:2px; text-decoration:none; font-size:0.8rem; box-shadow:0 1px 3px rgba(0,0,0,0.1);"><i class="fas fa-file-invoice"></i> ใบที่ ${idx+1}</a>`;
       });
    } else {
       billsHtml = `<span style="color:#e74c3c; font-size:0.8rem;"><i class="fas fa-times-circle"></i> ไม่มีบิล</span>`;
    }

    let prefillActual = defaultActual > 0 ? defaultActual : cleanRequestedTotal;
    let actionHtml = '';
    let actualInputHtml = '';
    let sourceBadge = `<span style="background:#8e44ad; color:white; padding:4px 8px; border-radius:12px; font-size:0.8rem; white-space:nowrap;">${r.fundingSource}</span>`;

    // 🌟 แปลงรูปแบบวันที่ให้ดูง่ายขึ้น
    let displayDate = "-";
    if (r.timestamp) {
       let dt = new Date(r.timestamp);
       displayDate = !isNaN(dt.getTime()) ? dt.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : r.timestamp;
    }

    if (r.reconStatus === 'รอกระทบยอด') {
       actualInputHtml = `<input type="number" id="actual-amt-${r.reqId}" value="${prefillActual}" style="width:90px; padding:6px; text-align:right; border:2px solid #27ae60; border-radius:6px; font-family:'Kanit'; font-weight:bold; color:#2c3e50; font-size:1rem; outline:none; box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">`;
       actionHtml = `
         <div style="display:flex; gap:5px; justify-content:center;">
           <button onclick="inlineReconAction('${r.reqId}', ${cleanRequestedTotal}, 'approve')" style="background:#27ae60; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.9rem;" title="กระทบยอดปกติ: บิลถูกต้อง ตัดยอดเงินตามจริง (คืนเงินทอน/สมทบงบ)"><i class="fas fa-check"></i></button>
           <button onclick="inlineReconAction('${r.reqId}', ${cleanRequestedTotal}, 'change_source')" style="background:#f39c12; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.9rem;" title="เปลี่ยนแหล่งเงิน: คืนเงินแหล่งเดิม แล้วดึงงบกลางมาจ่ายชดเชยแทน"><i class="fas fa-sync-alt"></i></button>
           <button onclick="inlineReconAction('${r.reqId}', ${cleanRequestedTotal}, 'cancel_or_reject')" style="background:#e74c3c; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.9rem;" title="พบปัญหา: ตีกลับให้ส่งบิลใหม่ หรือ ยกเลิกบิลทิ้งเพื่อคืนเงิน"><i class="fas fa-times"></i></button>
         </div>
       `;
    } else {
       actualInputHtml = `<span style="color:#bdc3c7;">-</span>`;
       actionHtml = `<span style="color:#e74c3c; font-size:0.85rem; font-weight:bold; background:#fadbd8; padding:4px 8px; border-radius:4px;">ผู้เบิกยังไม่ส่งบิล</span>`;
    }

    html += `
      <tr style="border-bottom:1px solid #eee; background:#fff;">
        <td style="padding:12px;">
           <b style="color:#2c3e50; font-size:1.1rem; line-height:1.3; display:block; margin-bottom:4px;">${r.projectName}</b>
           <span style="font-size:0.8rem; color:#7f8c8d; background:#f4f6f8; padding:2px 6px; border-radius:4px;">รหัส: ${r.reqId}</span>
           <div style="font-size:0.8rem; color:#95a5a6; margin-top:4px;"><i class="far fa-calendar-alt"></i> ขอเบิกเมื่อ: ${displayDate}</div>
        </td>
        <td style="padding:12px; text-align:center;">${sourceBadge}</td>
        <td style="padding:12px; font-weight:500; color:#34495e; font-size:0.9rem;">${r.requesterName}</td>
        <td style="padding:12px; text-align:right; font-weight:bold; color:#e67e22; font-size:1rem;">${cleanRequestedTotal.toLocaleString()}</td>
        <td style="padding:12px; text-align:center;">${billsHtml}</td>
        <td style="padding:12px; text-align:right;">${actualInputHtml}</td>
        <td style="padding:12px; text-align:center;">${actionHtml}</td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

// =========================================================================
// 🌟 กดปุ่มจัดการจากตารางโดยตรง (ใช้ SweetAlert2 ยืนยัน)
// =========================================================================
function inlineReconAction(reqId, requestedTotal, actionType) {
  const actualAmountInput = document.getElementById(`actual-amt-${reqId}`);
  const actualAmount = actualAmountInput ? Number(actualAmountInput.value) : 0;

  // ❌ กรณีปุ่มสีแดง: ตีกลับ หรือ ลบยกเลิก
  if (actionType === 'cancel_or_reject') {
      Swal.fire({
        title: 'จัดการรายการที่มีปัญหา',
        html: `
          <div style="text-align:left; font-size:0.95rem; margin-bottom:15px; color:#2c3e50; font-weight:bold;">โปรดเลือกการดำเนินการที่ต้องการ:</div>
          <div style="text-align:left; margin-bottom:15px; background:#f9fbfc; padding:15px; border-radius:8px; border:1px solid #eee;">
            <label style="display:block; margin-bottom:15px; cursor:pointer;">
              <input type="radio" name="swal-reject-type" value="reject" checked style="transform:scale(1.3); margin-right:8px;"> 
              <b style="color:#e67e22; font-size:1.1rem;">ตีกลับให้แก้ไขบิล</b> 
              <div style="color:#7f8c8d; font-size:0.85rem; margin-top:5px; margin-left:25px;">📌 ใช้ในกรณี: <b>รูปบิลไม่ชัดเจน, ยอดไม่ตรง, เอกสารไม่สมบูรณ์</b><br>(รายการจะถูกส่งกลับไปให้ผู้เบิก ถ่ายรูปอัปโหลดบิลส่งมาใหม่)</div>
            </label>
            <hr style="border:0; border-top:1px dashed #ddd; margin:15px 0;">
            <label style="display:block; cursor:pointer;">
              <input type="radio" name="swal-reject-type" value="cancel" style="transform:scale(1.3); margin-right:8px;"> 
              <b style="color:#e74c3c; font-size:1.1rem;">ยกเลิกบิลทิ้ง (ปิดรายการ)</b> 
              <div style="color:#7f8c8d; font-size:0.85rem; margin-top:5px; margin-left:25px;">📌 ใช้ในกรณี: <b>ตั้งเบิกซ้ำซ้อน, ยกเลิกการซื้อของรายการนี้แล้ว</b><br>(ระบบจะลบคำขอนี้ทิ้ง และคืนเงินทั้งหมดกลับเข้าโครงการทันที)</div>
            </label>
          </div>
          <textarea id="swal-reject-reason" class="swal2-textarea" placeholder="ระบุเหตุผลที่ตีกลับ/ยกเลิก (บังคับกรอก)..." style="width:100%; margin:0; font-family:'Kanit'; font-size:0.95rem; box-sizing:border-box;"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e74c3c',
        customClass: { container: 'kanit-font' },
        preConfirm: () => {
          const type = document.querySelector('input[name="swal-reject-type"]:checked').value;
          const reason = document.getElementById('swal-reject-reason').value.trim();
          if (!reason) Swal.showValidationMessage('กรุณาระบุเหตุผลครับ');
          return { action: type, comment: reason };
        }
      }).then((result) => {
        if (result.isConfirmed) executeReconBackend(reqId, result.value.action, actualAmount, result.value.comment, 0, "");
      });
      return;
  }

  // 🔄 กรณีปุ่มสีส้ม: เปลี่ยนแหล่งงบ (แบบไม่มี Fallback)
  if (actionType === 'change_source') {
      const year = document.getElementById('recon-year-filter').value;
      Swal.fire({ title: 'กำลังโหลดแหล่งงบ...', didOpen: () => Swal.showLoading() });
      
      google.script.run
        .withSuccessHandler(res => {
          Swal.close();
          // ตรวจสอบว่ามีข้อมูลเงินงบกลางจริงๆ ถึงจะให้ทำต่อ
          if (res && res.summary && res.summary.length > 0) {
              let opt = '<option value="">-- เลือกแหล่งเงินใหม่ --</option>';
              res.summary.forEach(s => { 
                  opt += `<option value="${s.source}">${s.source} (คงเหลือ: ${s.balance.toLocaleString()} ฿)</option>`; 
              });
              
              Swal.fire({
                title: 'เปลี่ยนแหล่งงบ (กรณีพิเศษ)',
                html: `
                  <div style="font-size:0.9rem; color:#d35400; background:#fdf2e9; padding:8px; border-radius:4px; margin-bottom:15px; text-align:left;">ระบบจะคืนเงินเข้าแหล่งเดิม และดึงเงินจาก "งบอำนวยการกลาง (แหล่งใหม่)" ไปชดเชยแทน</div>
                  <select id="swal-new-source" class="swal2-select" style="width:100%; font-family:'Kanit'; margin:0 0 10px 0; font-size:1rem;">${opt}</select>
                  <textarea id="swal-change-reason" class="swal2-textarea" placeholder="สาเหตุที่ต้องเปลี่ยนแหล่ง..." style="width:100%; margin:0; font-family:'Kanit'; font-size:0.95rem;"></textarea>
                `,
                showCancelButton: true,
                confirmButtonText: 'ยืนยันปรับปรุงงบ',
                confirmButtonColor: '#f39c12',
                customClass: { container: 'kanit-font' },
                preConfirm: () => {
                  const src = document.getElementById('swal-new-source').value;
                  const rsn = document.getElementById('swal-change-reason').value.trim();
                  if (!src) Swal.showValidationMessage('กรุณาเลือกแหล่งงบใหม่');
                  if (!rsn) Swal.showValidationMessage('กรุณาระบุสาเหตุ');
                  return { newSource: src, comment: rsn };
                }
              }).then((res2) => {
                if(res2.isConfirmed) executeReconBackend(reqId, 'change_source', actualAmount, res2.value.comment, 0, res2.value.newSource);
              });
          } else {
              // 🌟 แจ้งเตือนถ้างบกลางว่างเปล่า
              Swal.fire({
                 icon: 'warning',
                 title: 'ไม่พบงบกลางในระบบ',
                 text: 'ไม่มียอดเงินใน "งบอำนวยการกลาง" ที่จะนำมาชดเชยได้ กรุณาให้งานแผนงานจัดสรรงบกลางเข้ามาก่อนทำรายการนี้ครับ',
                 customClass: { container: 'kanit-font' }
              });
          }
      })
      .withFailureHandler(err => {
          Swal.close();
          Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
      })
      .getCentralBudgetDashboard(year);
      return;
  }

  // ✅ กรณีปุ่มสีเขียว: อนุมัติกระทบยอดปกติ
  let topupAmount = 0;
  let confirmTitle = 'ยืนยันการกระทบยอด?';
  let confirmText = `ยอดใช้จ่ายจริงคือ <b>${actualAmount.toLocaleString()}</b> บาท ใช่หรือไม่?`;
  let btnColor = '#27ae60';
  let btnText = 'ใช่, กระทบยอดเลย';

  if (actualAmount > requestedTotal) {
      topupAmount = actualAmount - requestedTotal;
      confirmTitle = '⚠️ ยอดใช้จริงสูงกว่าที่ขอเบิก!';
      confirmText = `ยอดจ่ายจริงแพงกว่าที่ขอเบิกไว้ <br><br>ระบบจะดึง <b>"งบอำนวยการกลาง" มาสมทบส่วนต่าง ${topupAmount.toLocaleString()} บาท</b> ให้โครงการอัตโนมัติ`;
      btnColor = '#f39c12';
      btnText = 'ใช่, สมทบและกระทบยอด';
  } else if (actualAmount < requestedTotal) {
      let refundAmount = requestedTotal - actualAmount;
      confirmText += `<br><br><span style="color:#27ae60;"><i class="fas fa-coins"></i> ระบบจะคืนเงินทอน <b>${refundAmount.toLocaleString()} บาท</b> กลับเข้าโครงการอัตโนมัติ</span>`;
  }

  Swal.fire({
      title: confirmTitle,
      html: confirmText,
      icon: topupAmount > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: btnText,
      cancelButtonText: 'ยกเลิก',
      customClass: { container: 'kanit-font' }
  }).then((result) => {
      if (result.isConfirmed) executeReconBackend(reqId, 'approve', actualAmount, "กระทบยอดปกติสำเร็จ", topupAmount, "");
  });
}

function executeReconBackend(reqId, action, actualAmount, comment, topupAmount, newSource) {
    const tbody = document.getElementById('tbody-recon-pending');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color:#27ae60;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังปรับปรุงบัญชี...</td></tr>`;

    google.script.run
      .withSuccessHandler(function(res) {
          Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message, customClass: { container: 'kanit-font' } });
          loadReconInbox();
      })
      .withFailureHandler(function(err) {
          Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message, customClass: { container: 'kanit-font' } });
          loadReconInbox();
      })
      .processReconciliationDecision(reqId, action, actualAmount, comment, topupAmount, newSource);
}
// ==========================================
// 🌟 โหลดหน้า Audit Log 
// ==========================================
function loadAuditLog() {
  const tbody = document.getElementById('tbody-audit-log');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#c0392b;"><i class="fas fa-spinner fa-spin"></i> กำลังดึงประวัติ...</td></tr>';
  
  const year = document.getElementById('recon-year-filter').value;
  google.script.run.withSuccessHandler(logs => {
      if(logs.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#95a5a6;">ไม่มีประวัติกรณีพิเศษในปีงบประมาณนี้</td></tr>'; return; }
      
      let html = '';
      logs.forEach(L => {
         html += `
         <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px; color:#7f8c8d; font-size:0.9rem;">${L.date}</td>
            <td style="padding:10px;">${L.typeHtml}</td>
            <td style="padding:10px; color:#2c3e50;">${L.desc}</td>
            <td style="padding:10px; text-align:right; font-weight:bold; color:#e67e22;">${Number(L.amount).toLocaleString()}</td>
            <td style="padding:10px; text-align:center;">${L.user}</td>
         </tr>`;
      });
      tbody.innerHTML = html;
  }).getReconciliationAuditLog(year);
}
function renderReconHistoryTable(data) {
  const tbody = document.getElementById('tbody-recon-history');
  if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#95a5a6;">ไม่มีประวัติการทำรายการ</td></tr>'; return; }
  
  let html = '';
  data.forEach(r => {
    let badge = r.reconStatus.includes('กระทบยอดแล้ว') ? '<span style="color:#27ae60;"><i class="fas fa-check-circle"></i> กระทบยอดแล้ว</span>' : `<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> ${r.reconStatus}</span>`;
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px;"><b>${r.reqId}</b><br><span style="font-size:0.8rem; color:#7f8c8d;">${r.projectId}</span></td>
        <td style="padding:10px;">${r.requester}</td>
        <td style="padding:10px; text-align:right;">${r.total}</td>
        <td style="padding:10px; text-align:center;">${badge}</td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

function renderPlanAssignTable(data) {
  const tbody = document.getElementById('tbody-plan-assign');
  if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#95a5a6;">ไม่มีบิลรายจ่ายที่ค้างกำหนดโครงการ</td></tr>'; return; }
  
  let pOptions = '<option value="">-- เลือกโครงการเพื่อตัดยอด --</option>';
  globalAssignProjects.forEach(p => { pOptions += `<option value="${p.id}">[${p.id}] ${p.name}</option>`; });

  let html = '';
  data.forEach(ex => {
    html += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px;"><b style="color:#e67e22;">${ex.id}</b><br><span style="font-size:0.8rem; color:#7f8c8d;">${ex.date}</span></td>
        <td style="padding:10px;">${ex.desc}</td>
        <td style="padding:10px; text-align:right; font-weight:bold;">${ex.amount.toLocaleString()}</td>
        <td style="padding:10px;">
          <select class="plan-assign-select" data-expid="${ex.id}" data-date="${ex.date}" data-desc="${ex.desc}" data-amount="${ex.amount}" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-family:'Kanit';">
            ${pOptions}
          </select>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

function submitProjectAssignments() {
  const selects = document.querySelectorAll('.plan-assign-select');
  let assignments = [];
  
  selects.forEach(sel => {
    if(sel.value !== "") {
      assignments.push({
        expenseId: sel.getAttribute('data-expid'),
        projectId: sel.value,
        date: sel.getAttribute('data-date'),
        desc: sel.getAttribute('data-desc'),
        amount: Number(sel.getAttribute('data-amount'))
      });
    }
  });

  if(assignments.length === 0) { alert("กรุณาเลือกโครงการที่ต้องการผูกอย่างน้อย 1 รายการครับ"); return; }

  const btn = document.getElementById('btn-save-assign');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;

  google.script.run
    .withSuccessHandler(res => {
      alert(res.message);
      btn.innerHTML = '<i class="fas fa-save"></i> ยืนยันผูกโครงการตัดยอด'; btn.disabled = false;
      loadReconInbox(); // รีโหลดตะกร้า
    })
    .withFailureHandler(err => {
      alert("ผิดพลาด: " + err.message);
      btn.innerHTML = '<i class="fas fa-save"></i> ยืนยันผูกโครงการตัดยอด'; btn.disabled = false;
    })
    .assignProjectToExpenses(assignments);
}
// ===============================================
// 🌟 ฟังก์ชันซ่อน/โชว์ หัวข้อหมวดหมู่เมนู (Categories) 
// ===============================================
function updateCategoryVisibility() {
    
    // 💡 เช็คจาก style.display ตรงๆ เลย จะได้ไม่โดนหลอกตอนโหลดหน้าเว็บ
    const hasVisibleMenu = (menuIds) => {
        return menuIds.some(id => {
            const el = document.getElementById(id);
            // ถ้าระบบเจอ element และตัวมันไม่ได้ถูกเซ็ตว่า display: none ถือว่าโชว์อยู่
            return el && el.style.display !== 'none';
        });
    };

    // 1. หมวดอนุมัติ & ติดตาม (id="cat-approval")
    const catApproval = document.getElementById('cat-approval');
    if (catApproval) {
        catApproval.style.display = hasVisibleMenu([
            'menu-approve', 
            'menu-disb-approve', 
            'menu-allprojects', 
            'menu-amendment-docs', 
            'menu-all-disbursements'
        ]) ? 'block' : 'none';
    }

    // 2. หมวดการเงิน & พัสดุ (id="cat-finance")
    const catFinance = document.getElementById('cat-finance');
    if (catFinance) {
        catFinance.style.display = hasVisibleMenu([
            'menu-supply-docs', 
            'menu-reconciliation', 
            'menu-budget-admin'
        ]) ? 'block' : 'none';
    }

    // 3. หมวดแผนงาน & QA (id="cat-strategy")
    const catStrategy = document.getElementById('cat-strategy');
    if (catStrategy) {
        catStrategy.style.display = hasVisibleMenu([
            'menu-strategy', 
            'menu-qa', 
            'menu-planning-docs'
        ]) ? 'block' : 'none';
    }

    // 4. หมวดจัดการระบบ (id="cat-admin")
    const catAdmin = document.getElementById('cat-admin');
    if (catAdmin) {
        catAdmin.style.display = hasVisibleMenu([
            'menu-admin'
        ]) ? 'block' : 'none';
    }
}
// ==========================================
// 🌟 โหลดคิวงานสำหรับเจ้าของโครงการ (Co-Disbursement Inbox)
// ==========================================
function loadOwnerPendingApprovals() {
  const section = document.getElementById('owner-approval-section');
  const tbody = document.getElementById('owner-approval-tbody');
  if(!section || !tbody) return;

  google.script.run
    .withSuccessHandler(function(reqs) {
       if(reqs.length === 0) {
          section.style.display = 'none';
          return;
       }
       
       section.style.display = 'block';
       let html = '';
       reqs.forEach(r => {
          // ดึงรายการสิ่งของมาโชว์ให้เจ้าของโครงการดู
          let itemsText = r.items.map(it => `&bull; ${it.name} <span style="color:#7f8c8d;">(${it.qty} ${it.unit} x ${Number(it.price).toLocaleString()} บ.)</span>`).join('<br>');
          
          html += `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px; vertical-align:top;">
                <strong style="color:#2980b9; font-size:1.05rem;">${r.reqId}</strong><br>
                <span style="font-size:0.8rem; color:#7f8c8d;"><i class="far fa-clock"></i> ${r.timestamp}</span>
              </td>
              <td style="padding:12px; vertical-align:top;">
                <strong style="color:#34495e;"><i class="fas fa-user"></i> ${r.requesterEmail}</strong>
                <div style="font-size:0.85rem; color:#555; margin-top:8px; background:#f4f6f8; padding:8px; border-radius:4px;">${itemsText}</div>
              </td>
              <td style="padding:12px; text-align:right; font-weight:bold; color:#c0392b; font-size:1.1rem; vertical-align:top;">
                ${r.total.toLocaleString()} ฿
              </td>
              <td style="padding:12px; text-align:center; vertical-align:top;">
                <button onclick="processOwnerApproval('${r.reqId}', 'approve')" style="background:#27ae60; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-weight:bold; margin-bottom:5px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-check"></i> รับทราบ & ส่งต่อแผน</button>
                <button onclick="processOwnerApproval('${r.reqId}', 'reject')" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;"><i class="fas fa-times"></i> ตีกลับให้ผู้เบิกแก้ไข</button>
              </td>
            </tr>
          `;
       });
       tbody.innerHTML = html;
    })
    .getPendingOwnerApprovals();
}
// ==========================================
// 🌟 ระบบภาพรวมความก้าวหน้าการเบิกจ่าย (Admin Financial Progress)
// ==========================================
let globalFinancialProgressData = [];

// 1. โหลดข้อมูลจากหลังบ้าน
function loadFinancialProgressData() {
  const tbody = document.getElementById('fp-tbody');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #3498db;"></i><br>กำลังคำนวณข้อมูลการเงิน...</td></tr>';

  google.script.run
    .withSuccessHandler(function(data) {
       globalFinancialProgressData = data;
       renderFinancialProgressTable();
    })
    .withFailureHandler(function(err) {
       tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    })
    .getFinancialProgressSummary();
}

// 2. วาดตารางและคำนวณ Progress Bar
function renderFinancialProgressTable() {
  const tbody = document.getElementById('fp-tbody');
  const searchText = document.getElementById('fp-search-input').value.toLowerCase();
  const statusFilter = document.getElementById('fp-status-filter').value;
  
  let sumBudget = 0, sumSpent = 0, sumPending = 0, sumRemaining = 0;
  let html = '';

  let filteredData = globalFinancialProgressData.filter(p => {
      let matchSearch = p.id.toLowerCase().includes(searchText) || p.name.toLowerCase().includes(searchText) || p.owner.toLowerCase().includes(searchText);
      let matchStatus = true;
      let totalUsed = p.spent + p.pending;
      
      if(statusFilter === 'active') matchStatus = totalUsed > 0 && p.remaining > 0;
      else if(statusFilter === 'zero') matchStatus = totalUsed === 0;
      else if(statusFilter === 'full') matchStatus = p.remaining <= 0;

      return matchSearch && matchStatus;
  });

  if(filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #7f8c8d;">ไม่พบข้อมูลโครงการที่ตรงกับเงื่อนไข</td></tr>';
      document.getElementById('fp-sum-budget').innerText = "0";
      document.getElementById('fp-sum-spent').innerText = "0";
      document.getElementById('fp-sum-pending').innerText = "0";
      document.getElementById('fp-sum-remaining').innerText = "0";
      return;
  }

  filteredData.forEach(p => {
      sumBudget += p.budget;
      sumSpent += p.spent;
      sumPending += p.pending;
      sumRemaining += p.remaining;

      let percentUsed = p.budget > 0 ? ((p.spent + p.pending) / p.budget) * 100 : 0;
      if (percentUsed > 100) percentUsed = 100;
      
      let barColor = '#27ae60'; // ปกติสีเขียว
      if(percentUsed > 80) barColor = '#f39c12'; // เกิน 80% สีส้ม
      if(percentUsed >= 95) barColor = '#e74c3c'; // เกิน 95% หรือหมดแล้ว สีแดง

      html += `
        <tr style="border-bottom: 1px solid #ecf0f1; transition: 0.2s;" onmouseover="this.style.background='#fdfefe'" onmouseout="this.style.background='transparent'">
          <td style="padding: 12px; vertical-align: middle;">
             <strong style="color: #2980b9;">[${p.id}]</strong><br>
             <span style="color: #2c3e50; font-weight: 500;">${p.name}</span>
          </td>
          <td style="padding: 12px; color: #555; vertical-align: middle;"><i class="fas fa-user-circle"></i> ${p.owner}</td>
          <td style="padding: 12px; text-align: right; color: #34495e; font-weight: bold; vertical-align: middle;">${p.budget.toLocaleString()}</td>
          <td style="padding: 12px; text-align: right; color: #27ae60; vertical-align: middle;">${p.spent.toLocaleString()}</td>
          <td style="padding: 12px; text-align: right; color: #f39c12; vertical-align: middle;">${p.pending.toLocaleString()}</td>
          <td style="padding: 12px; text-align: right; color: ${p.remaining < 0 ? '#e74c3c' : '#8e44ad'}; font-weight: bold; font-size: 1.05rem; vertical-align: middle;">${p.remaining.toLocaleString()}</td>
          <td style="padding: 12px; vertical-align: middle;">
             <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #7f8c8d; margin-bottom: 2px;">
                <span>เบิกไปแล้ว</span><span>${percentUsed.toFixed(1)}%</span>
             </div>
             <div style="width: 100%; background: #ecf0f1; border-radius: 10px; height: 8px; overflow: hidden;">
                <div style="height: 100%; background: ${barColor}; width: ${percentUsed}%; border-radius: 10px;"></div>
             </div>
          </td>
        </tr>
      `;
  });

  tbody.innerHTML = html;

  // อัปเดตตัวเลขการ์ดสรุปภาพรวม (วิ่งตาม Filter ที่ค้นหาด้วย)
  document.getElementById('fp-sum-budget').innerText = sumBudget.toLocaleString();
  document.getElementById('fp-sum-spent').innerText = sumSpent.toLocaleString();
  document.getElementById('fp-sum-pending').innerText = sumPending.toLocaleString();
  document.getElementById('fp-sum-remaining').innerText = sumRemaining.toLocaleString();
}

function filterFinancialProgress() {
  renderFinancialProgressTable();
}

// 3. ฟังก์ชัน Export เป็นไฟล์ Excel
function exportFinancialProgressExcel() {
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head>
    <body>
      <table border="1">
        <tr><td colspan="7" style="font-size: 18px; font-weight: bold; text-align: center;">สรุปความก้าวหน้าการเบิกจ่ายโครงการ</td></tr>
        <tr style="background-color: #2c3e50; color: #ffffff; font-weight: bold;">
          <th>รหัสโครงการ</th>
          <th>ชื่อโครงการ</th>
          <th>เจ้าของโครงการ</th>
          <th>งบประมาณจัดสรร (บาท)</th>
          <th>เบิกจ่ายจริง (บาท)</th>
          <th>กันเงินรอเบิก (บาท)</th>
          <th>คงเหลือเบิกได้ (บาท)</th>
        </tr>`;

  globalFinancialProgressData.forEach(p => {
    tableHtml += `
        <tr>
          <td align="center">${p.id}</td>
          <td>${p.name}</td>
          <td>${p.owner}</td>
          <td align="right">${p.budget}</td>
          <td align="right">${p.spent}</td>
          <td align="right">${p.pending}</td>
          <td align="right">${p.remaining}</td>
        </tr>`;
  });

  tableHtml += `</table></body></html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `สรุปการเบิกจ่ายโครงการ.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 🌟 ตัวดักจับ Observer เมื่อเปิดหน้าให้โหลดข้อมูล
var observerFinancial = new MutationObserver((mutations) => {
  mutations.forEach((m) => { if (m.target.style.display === 'block') { loadFinancialProgressData(); } });
});
var pageFinancialNode = document.getElementById('page-financial-progress');
if (pageFinancialNode) observerFinancial.observe(pageFinancialNode, { attributes: true, attributeFilter: ['style'] });

// ==========================================
// 🌟 โหลดคิวงานสำหรับเจ้าของโครงการ (Co-Disbursement Inbox)
// ==========================================
function processOwnerApproval(reqId, action) {
   let comment = "";
   if(action === 'reject') {
      comment = prompt("กรุณาระบุเหตุผลที่ตีกลับคำขอเบิกนี้ (ผู้ขอเบิกจะเห็นข้อความนี้):");
      if(comment === null || comment.trim() === "") {
         alert("ต้องระบุเหตุผลเมื่อตีกลับคำขอครับ");
         return;
      }
   } else {
      if(!confirm("ยืนยันรับทราบ และอนุญาตให้ส่งคำขอนี้เข้าสู่งานแผนงาน ใช่หรือไม่?")) return;
   }

   const tbody = document.getElementById('owner-approval-tbody');
   tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#e67e22;"></i><br>กำลังประมวลผล...</td></tr>`;

   google.script.run
     .withSuccessHandler(function(res) {
        alert(res.message);
        if (typeof loadOwnerPendingApprovals === 'function') loadOwnerPendingApprovals(); 
     })
     .withFailureHandler(function(err) {
        alert("ผิดพลาด: " + err.message);
        if (typeof loadOwnerPendingApprovals === 'function') loadOwnerPendingApprovals();
     })
     .processOwnerDisbursementApproval(reqId, action, comment);
}

// 🌟 สร้าง Observer ดักจับตอนเปิดเมนูกระทบยอด ให้ทำงานอัตโนมัติ
var observerRecon = new MutationObserver((mutations) => {
  mutations.forEach((m) => { if (m.target.style.display === 'block') loadReconInbox(); });
});
var pageReconNode = document.getElementById('page-reconciliation'); 
if (pageReconNode) observerRecon.observe(pageReconNode, { attributes: true, attributeFilter: ['style'] });
// 🌟 สร้าง Observer ดักจับตอนเปิดเมนูกระทบยอด ให้ทำงานอัตโนมัติ
var observerRecon = new MutationObserver((mutations) => {
  mutations.forEach((m) => { if (m.target.style.display === 'block') loadReconInbox(); });
});
var pageReconNode = document.getElementById('page-reconciliation'); // *แก้ไข ID ให้ตรงกับแท็บหลักใน Index.html
if (pageReconNode) observerRecon.observe(pageReconNode, { attributes: true, attributeFilter: ['style'] });
// ==========================================
// 🌟 1. ระบบช่วยดึงข้อมูลอัจฉริยะ (Promisify)
// ==========================================
function fetchAPI(funcName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [funcName](...args);
  });
}

// 🌟 2. กล่องเก็บข้อมูลล่วงหน้า (Global Cache)
window.AppCache = {
   allProjects: null,
   // ในอนาคตสามารถเพิ่ม myProjects: null ไว้เก็บหน้าอื่นๆ ได้
};
// ==========================================
// 🌟 ฟังก์ชันเปิดหน้าต่างนำเข้าข้อมูล (Bulk Import)
// ==========================================
function openBulkImportModal() {
    const oldModal = document.getElementById('bulkImportModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'bulkImportModal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    modal.innerHTML = `
      <div style="background:white; width:90%; max-width:800px; border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,0.3); overflow:hidden; font-family:'Kanit', sans-serif;">
        <div style="background:#27ae60; color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;"><i class="fas fa-file-import"></i> นำเข้าข้อมูลพิจารณาโครงการ (Bulk Import)</h3>
          <button onclick="document.getElementById('bulkImportModal').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px;">
          <p style="color:#e67e22; font-weight:bold; margin-top:0;">วิธีใช้: ก๊อปปี้ข้อมูลแถวจากไฟล์ Excel (เฉพาะแถวข้อมูล ไม่เอาหัวตาราง) มาวางในกล่องด้านล่างนี้</p>
          <textarea id="bulk-paste-area" rows="10" placeholder="คลิกขวา -> Paste วางข้อมูลจาก Excel ที่นี่..." style="width:100%; padding:10px; border:2px dashed #bdc3c7; border-radius:6px; font-family:'Kanit'; white-space:pre; overflow-wrap:normal; box-sizing:border-box;"></textarea>
        </div>
        <div style="padding:15px 20px; background:#f4f6f8; display:flex; justify-content:space-between;">
          <button onclick="document.getElementById('bulkImportModal').remove()" style="background:#bbb; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">ยกเลิก</button>
          <button onclick="processBulkPastedData()" id="btn-process-bulk" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;"><i class="fas fa-magic"></i> ประมวลผลและส่งไลน์แจ้งเตือน</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
}

// 🌟 เพิ่มปุ่มนำเข้าไว้คู่กับปุ่ม Export ในหน้าจอ 🌟
document.addEventListener("DOMContentLoaded", function() {
    const checkExist = setInterval(function() {
       const section = document.getElementById('section-admin-screening');
       // หาปุ่ม Export เดิมที่เราเคยทำไว้
       const btnExport = document.getElementById('btn-export-doc-screening');
       if (section && btnExport && !document.getElementById('btn-bulk-import')) {
          
          const importBtn = `<button id="btn-bulk-import" onclick="openBulkImportModal()" style="margin-left:10px; margin-bottom:15px; background:#27ae60; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-upload"></i> นำเข้าข้อมูล (Bulk Import)</button>`;
          btnExport.insertAdjacentHTML('afterend', importBtn);
          
          clearInterval(checkExist);
       }
    }, 1000);
});
let centralBudgetStats = { sources: {}, grandTotal: 0 };

function openAddCentralBudgetModal() {
  const yearSelect = document.getElementById('budget-admin-year');
  const year = yearSelect ? yearSelect.value : new Date().getFullYear().toString().substring(2);
  
  document.getElementById('add-central-year').value = year;
  document.getElementById('addCentralBudgetForm').reset();
  document.getElementById('new-source-container').style.display = 'none';
  
  const sourceSelect = document.getElementById('add-central-source-select');
  sourceSelect.innerHTML = '<option value="">-- กำลังโหลดข้อมูลกองเงิน... --</option>';
  
  document.getElementById('addCentralBudgetModal').style.display = 'flex';
  
  // 🌟 ดึงข้อมูลจริงจากระบบมาเก็บไว้คำนวณ 🌟
  google.script.run
    .withSuccessHandler(function(data) {
        centralBudgetStats.sources = {};
        centralBudgetStats.grandTotal = 0;
        
        let options = '<option value="">-- เลือกกองเงิน --</option>';
        if (data && data.summary) {
            data.summary.forEach(item => {
                centralBudgetStats.sources[item.source] = item.balance; // จำยอดแต่ละกอง
                centralBudgetStats.grandTotal += item.balance;          // จำยอดรวมทุกกอง
                options += `<option value="${item.source}">${item.source} (เหลือ ${item.balance.toLocaleString()} บ.)</option>`;
            });
        }
        options += '<option value="new" style="color:#2980b9; font-weight:bold;">+ สร้างกองเงินใหม่...</option>';
        sourceSelect.innerHTML = options;
        updateCentralAllocationPreview(); // สั่งอัปเดตตัวเลขเป็น 0 ไว้ก่อน
    })
    .withFailureHandler(function(err) {
        sourceSelect.innerHTML = `<option value="">โหลดข้อมูลล้มเหลว: ${err.message}</option>`;
    })
    .getCentralBudgetDashboard(year); // ใช้ฟังก์ชันเดิมที่คุณครูมีอยู่แล้วได้เลย
}
function handleCentralSourceChange() {
  const sourceSelect = document.getElementById('add-central-source-select').value;
  const newSourceContainer = document.getElementById('new-source-container');
  // โชว์กล่องพิมพ์ชื่อใหม่ ถ้าเลือก "+ สร้างกองเงินใหม่"
  newSourceContainer.style.display = (sourceSelect === 'new') ? 'block' : 'none';
  updateCentralAllocationPreview();
}

function updateCentralAllocationPreview() {
  const sourceSelect = document.getElementById('add-central-source-select').value;
  const addAmount = Number(document.getElementById('add-central-amount').value) || 0;
  
  let currentBalance = 0;
  if (sourceSelect && sourceSelect !== 'new' && centralBudgetStats.sources[sourceSelect]) {
      currentBalance = centralBudgetStats.sources[sourceSelect];
  }

  let newBalance = currentBalance + addAmount;
  let newGrandTotal = centralBudgetStats.grandTotal + addAmount;

  document.getElementById('preview-current-balance').innerText = currentBalance.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
  document.getElementById('preview-add-amount').innerText = '+ ' + addAmount.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
  document.getElementById('preview-new-balance').innerText = newBalance.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
  document.getElementById('preview-grand-total').innerText = newGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
}
function submitAddCentralBudget() {
  const year = document.getElementById('add-central-year').value;
  let source = document.getElementById('add-central-source-select').value;
  if (source === 'new') source = document.getElementById('add-central-new-source').value.trim();
  
  const amount = Number(document.getElementById('add-central-amount').value);
  const remark = document.getElementById('add-central-remark').value.trim() || 'จัดสรรงบประมาณ (เพิ่มยอด)';

  if (!source || amount <= 0) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณาระบุกองเงิน และจำนวนเงิน (ต้องมากกว่า 0 บาท) ให้ถูกต้องครับ', confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } });
    return;
  }

  Swal.fire({
    title: 'ยืนยันการจัดสรรงบ?',
    text: `ต้องการนำเงินจำนวน ${amount.toLocaleString()} บาท เข้าบัญชี "${source}" ใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#27ae60',
    cancelButtonColor: '#bdc3c7',
    confirmButtonText: 'ใช่, จัดสรรเลย!',
    cancelButtonText: 'ยกเลิก',
    customClass: { container: 'kanit-font' }
  }).then((result) => {
    if (result.isConfirmed) {
      const btn = document.getElementById('btn-submit-add-central');
      btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

      google.script.run
        .withSuccessHandler(function(res) {
          Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: res.message, confirmButtonColor: '#27ae60', customClass: { container: 'kanit-font' } });
          document.getElementById('addCentralBudgetModal').style.display = 'none';
          btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการจัดสรร';
          loadBudgetAdminDashboard(); // โหลดหน้าจัดการงบกลางใหม่ให้อัปเดตทันที
        })
        .withFailureHandler(function(err) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#e74c3c', customClass: { container: 'kanit-font' } });
          btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการจัดสรร';
        })
        .allocateCentralBudget({ year: year, source: source, amount: amount, remark: remark });
    }
  });
}

// ==========================================
// 🌟 3. โหลดข้อมูลเริ่มต้นระบบ (อัปเกรดใหม่)
// ==========================================
window.onload = async function() {
  try {
    window.AppCache = window.AppCache || {};

    try {
       window.globalSettings = await fetchAPI('getSystemSettings');
       console.log("✅ โหลดการตั้งค่าสำเร็จ", window.globalSettings);
    } catch(e) {
       console.error("❌ โหลดตั้งค่าล้มเหลว (getSystemSettings):", e);
    }

    initYearDropdowns();
    loadConfigData();

   const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('uid')) {
       localStorage.setItem('nongPhaenDee_lineUid', urlParams.get('uid'));
    }

    let savedAuthKey = urlParams.get('uid')
                    || localStorage.getItem('sopon_preferred_email')
                    || localStorage.getItem('nongPhaenDee_lineUid')
                    || "";

    let userInfo;
    try {
        userInfo = await fetchAPI('getCurrentUserInfo', savedAuthKey);
        console.log("✅ โหลดข้อมูลผู้ใช้สำเร็จ:", userInfo);
    } catch(e) {
        console.error("❌ โหลดข้อมูลผู้ใช้ล้มเหลว (getCurrentUserInfo):", e);
        throw new Error("ระบบฐานข้อมูลผู้ใช้มีปัญหา");
    }
    
    if(!userInfo.isValid) {
      const loader = document.getElementById('loader-overlay');
      if (loader) loader.style.display = 'none';
      
      const unauthBox = document.getElementById('unauthorized-overlay');
      if (unauthBox) unauthBox.style.display = 'flex';
      
      const emailText = document.getElementById('unauthorized-email');
      if (emailText) emailText.innerText = `อีเมลของคุณ: ${userInfo.email}`;
      
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.style.display = 'none';
      
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.style.display = 'none';
      
      return;
    }

    document.getElementById('user-fullname-display').innerText = userInfo.fullName;
    window.userRole = String(userInfo.role).toLowerCase();
    
    // 🌟 1. ดักจับสิทธิ์ทั้งหมดรวมถึง QA
    const isAdmin = window.userRole.includes('admin') || window.userRole.includes('แผน');
    const isA1 = window.userRole.includes('approver1') || window.userRole.includes('a1');
    const isA2 = window.userRole.includes('approver2') || window.userRole.includes('a2');
    const isA3 = window.userRole.includes('approver3') || window.userRole.includes('a3');
    const isSupply = window.userRole.includes('supply') || window.userRole.includes('พัสดุ');
    const isFinance = window.userRole.includes('finance') || window.userRole.includes('การเงิน');
    const isAccount = window.userRole.includes('account') || window.userRole.includes('บัญชี');
    const isQa = window.userRole.includes('qa') || window.userRole.includes('ประกัน') || window.userRole.includes('qa_officer'); // 👈 เพิ่มการดักจับ QA

    // 🌟 2. อัปเดตข้อความแสดงสิทธิ์ด้านบนให้รองรับ QA
    let roleDisplay = window.userRole;
    if(isAdmin) roleDisplay = 'ผู้ดูแลระบบ (Admin/แผนงาน)';
    else if(isA1) roleDisplay = 'หัวหน้างาน/กลุ่มสาระ (A1)';
    else if(isA2) roleDisplay = 'รองผู้อำนวยการ (A2)';
    else if(isA3) roleDisplay = 'ผู้อำนวยการ (A3)';
    else if(isSupply) roleDisplay = 'เจ้าหน้าที่พัสดุ';
    else if(isFinance) roleDisplay = 'เจ้าหน้าที่การเงิน';
    else if(isAccount) roleDisplay = 'เจ้าหน้าที่บัญชี'; 
    else if(isQa) roleDisplay = 'งานประกันคุณภาพ (QA)'; // 👈 แสดงชื่อให้ตรงสิทธิ์
    else roleDisplay = 'ผู้ใช้งานทั่วไป';
    document.getElementById('user-role-display').innerText = "สิทธิ์: " + roleDisplay;

    // 🌟 ตั้งค่าข้อความสถานะหน้าพิจารณาเบิกจ่ายทันที (ไม่ต้องรอ "กำลังตรวจสอบสิทธิ์...")
    const isDisbApprover = isAdmin || isSupply || isFinance || isA2 || isA3;
    const disbRoleEl = document.getElementById('disb-approver-role-display');
    if (disbRoleEl) {
      let quickDisbRole = "ผู้ตรวจสอบ";
      if (isAdmin) quickDisbRole = "หัวหน้างานแผน (ด่าน 1)";
      else if (isSupply) quickDisbRole = "หัวหน้างานพัสดุ (ด่าน 2)";
      else if (isFinance) quickDisbRole = "หัวหน้ากลุ่มบริหารงานงบประมาณ (ด่าน 3)";
      else if (isA2) quickDisbRole = "รองผู้อำนวยการ (ด่าน 4)";
      else if (isA3) quickDisbRole = "ผู้อำนวยการ (ด่าน 5)";
      disbRoleEl.innerText = quickDisbRole;
    }

    // 🌟 โหลดข้อมูลล่วงหน้าขนานกันในรอบเดียว (งานพัสดุ + ตะกร้าพิจารณา ผง.2)
    const supplyPreloadPromise = isSupply
      ? fetchAPI('getSupplyDocsList').catch(err => {
          console.warn("⚠️ โหลดตะกร้าพัสดุล่วงหน้าไม่สำเร็จ:", err);
          return null;
        })
      : Promise.resolve(null);

    const disbApprovePreloadPromise = isDisbApprover
      ? fetchAPI('getDisbApproveInbox').catch(err => {
          console.warn("⚠️ โหลดตะกร้าพิจารณา ผง.2 ล่วงหน้าไม่สำเร็จ:", err);
          return null;
        })
      : Promise.resolve(null);

    const [perms, counts, preloadedSupplyRes, preloadedDisbApproveRes] = await Promise.all([
       fetchAPI('getMenuPermissions'),
       fetchAPI('getPendingTaskCounts'),
       supplyPreloadPromise,
       disbApprovePreloadPromise
    ]);

    window.AppCache = window.AppCache || {};

    if (preloadedSupplyRes && Array.isArray(preloadedSupplyRes.data)) {
       window.AppCache.supplyDocs = preloadedSupplyRes.data;
       if (typeof renderSupplyDocsDashboard === 'function') {
         renderSupplyDocsDashboard(preloadedSupplyRes.data);
       }
    }

    if (preloadedDisbApproveRes) {
       window.AppCache.disbApproveInbox = preloadedDisbApproveRes;
       if (typeof renderDisbApproveInbox === 'function') {
         renderDisbApproveInbox(preloadedDisbApproveRes);
       }
    }

    // 🌟 3. ผสมสิทธิ์แบบควบตำแหน่ง
    let activeRoles = [];
    let rawRoles = window.userRole.split(',').map(r => r.trim());

    rawRoles.forEach(r => {
        if (r.includes('admin') || r.includes('แผน')) activeRoles.push('admin');
        else if (r.includes('approver1') || r.includes('a1')) activeRoles.push('a1');
        else if (r.includes('approver2') || r.includes('a2')) activeRoles.push('a2');
        else if (r.includes('approver3') || r.includes('a3')) activeRoles.push('a3');
        else if (r.includes('supply') || r.includes('พัสดุ')) activeRoles.push('supply');
        else if (r.includes('finance') || r.includes('การเงิน')) activeRoles.push('finance');
        else if (r.includes('account') || r.includes('บัญชี')) activeRoles.push('account');
        else if (r.includes('qa') || r.includes('ประกัน') || r.includes('qa_officer')) activeRoles.push('qa');
    });
    
    if (activeRoles.length === 0) activeRoles.push('user');
    else activeRoles.push('user');

    // 🌟 4. เพิ่ม menu-planning-docs เข้าไปในระบบตรวจจับด้วย จะได้โดนซ่อนอย่างถูกต้อง
    const menuIds = ['menu-myprojects', 'menu-disbursement', 'menu-allprojects', 'menu-admin', 'menu-budget-admin', 'menu-approve', 'menu-disb-approve', 'menu-supply-docs', 'menu-reconciliation', 'menu-strategy', 'menu-qa', 'menu-planning-docs', 'menu-financial-progress', 'menu-amendment-docs', 'menu-all-disbursements'];
    
    menuIds.forEach(mId => {
       let shouldShow = false;
       activeRoles.forEach(role => { if (perms[role] && perms[role][mId] === true) shouldShow = true; });
       
       if (mId === 'menu-myprojects'|| mId === 'menu-disbursement' || mId === 'menu-amendment-docs') {
           shouldShow = true;
       }
       
       const el = document.getElementById(mId);
       if (el) el.style.display = shouldShow ? 'flex' : 'none';
    });

    // 🌟 5. ฝังระบบซ่อนหัวข้อแบบเป๊ะ 100% ป้องกันการดีเลย์ (ไม่ต้องเรียกฟังก์ชันแยกแล้ว)
    const hasVisibleMenu = (ids) => ids.some(id => document.getElementById(id) && document.getElementById(id).style.display !== 'none');
    
    const catApproval = document.getElementById('cat-approval');
    if (catApproval) catApproval.style.display = hasVisibleMenu(['menu-approve', 'menu-disb-approve', 'menu-allprojects', 'menu-amendment-docs', 'menu-all-disbursements']) ? 'block' : 'none';

    const catFinance = document.getElementById('cat-finance');
    if (catFinance) catFinance.style.display = hasVisibleMenu(['menu-supply-docs', 'menu-reconciliation', 'menu-budget-admin']) ? 'block' : 'none';

    const catStrategy = document.getElementById('cat-strategy');
    if (catStrategy) catStrategy.style.display = hasVisibleMenu(['menu-strategy', 'menu-qa', 'menu-planning-docs']) ? 'block' : 'none';

    const catAdmin = document.getElementById('cat-admin');
    if (catAdmin) catAdmin.style.display = hasVisibleMenu(['menu-admin']) ? 'block' : 'none';

    // ใส่ตัวเลข Badge แจ้งเตือน
    const setBadge = (id, count) => {
      const badge = document.getElementById(id);
      if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none'; 
      }
    };
    setBadge('badge-approve', counts.approve);
    setBadge('badge-disb', counts.disbApprove);
    setBadge('badge-supply', counts.supplyDocs);
    setBadge('badge-owner-disb', counts.ownerApprove);
    setBadge('badge-recon', (counts.recon || 0) + (counts.planningExpense || 0));

    // ด่านที่ 3: ปลดล็อกหน้าจอ
    if (document.getElementById('loader-overlay')) document.getElementById('loader-overlay').style.display = 'none';
    if (typeof loader !== 'undefined' && loader) loader.classList.add('hidden');
    if (typeof showPage === 'function') showPage('page-dashboard');

  } catch (error) {
      console.error("🚨 หน้าจอโหลดล้มเหลวอย่างหนัก:", error);
      Swal.fire({
          icon: 'error',
          title: 'หน้าจอโหลดล้มเหลว',
          text: 'พบปัญหา INTERNAL จากฝั่งเซิร์ฟเวอร์ (Google) กรุณารีเฟรชหน้าเว็บอีกครั้ง หรือตรวจสอบฟังก์ชัน getCurrentUserInfo ในหลังบ้านครับ',
          customClass: { container: 'kanit-font' }
      });
  }
};

// =========================================================================
// 🌟 ส่วนของบัญชี: บันทึกรายจ่ายตรง (แก้ Error reset form เป็นการล้างตารางแทน)
// =========================================================================
function openExpenseModal() {
  const tbody = document.getElementById('finance-expense-tbody');
  // ล้างข้อมูลตารางเดิมออกให้หมด
  if (tbody) tbody.innerHTML = '';
  
  // เพิ่มบรรทัดว่างให้ 1 บรรทัดเสมอเมื่อเปิดหน้าต่างขึ้นมา
  addFinanceRow();
  
  // แสดงหน้าต่าง Modal
  document.getElementById('expenseModal').style.display = 'flex';
}


function submitPendingExpense() {
  const date = document.getElementById('exp-date').value;
  const desc = document.getElementById('exp-desc').value;
  const amount = document.getElementById('exp-amount').value;

  if (!date || !desc || !amount) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
    return;
  }

  const btn = document.getElementById('btn-submit-exp');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; 
  btn.disabled = true;

  // จัดรูปแบบข้อมูลเป็น Array ส่งให้ฟังก์ชันหลังบ้านที่เราทำรอไว้แล้ว
  const expenseList = [{
    date: date,
    description: desc,
    amount: Number(amount)
  }];

  google.script.run
    .withSuccessHandler(res => {
      alert(res.message);
      document.getElementById('expenseModal').style.display = 'none';
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูลส่งแผนงาน'; 
      btn.disabled = false;
      loadReconInbox(); // โหลดตะกร้าใหม่ เพื่อให้แท็บ "แผนงาน" อัปเดตตัวเลข
      updateNavBadges(); // อัปเดตตัวเลขกระดิ่งแจ้งเตือน
    })
    .withFailureHandler(err => {
      alert("เกิดข้อผิดพลาด: " + err.message);
      btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูลส่งแผนงาน'; 
      btn.disabled = false;
    })
    .savePendingExpenses(expenseList);
}




// ==========================================
// 🌟 สคริปต์ควบคุม Modal กระทบยอด (บัญชี)
// ==========================================

function closeReconModal() {
  document.getElementById('reconModal').style.display = 'none';
}



function submitReconDecision(action) {
  const reqId = document.getElementById('recon-req-id').value;
  const actualAmt = document.getElementById('recon-actual-amount').value;
  const comment = document.getElementById('recon-comment').value;
  
  if (action === 'approve' && (!actualAmt || Number(actualAmt) < 0)) {
    alert("กรุณาระบุยอดเงินที่อนุมัติเบิกจ่ายจริงให้ถูกต้องครับ");
    return;
  }
  
  const btnApprove = document.getElementById('btn-recon-approve');
  const btnReject = document.getElementById('btn-recon-reject');
  btnApprove.disabled = true; btnReject.disabled = true;
  
  let btnLoading = action === 'approve' ? btnApprove : btnReject;
  let originalHtml = btnLoading.innerHTML;
  btnLoading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> รอสักครู่...';
  
  google.script.run
    .withSuccessHandler(function(res) {
      alert(res.message);
      closeReconModal();
      loadReconInbox();  // โหลดข้อมูลตารางใหม่
      updateNavBadges(); // อัปเดตตัวเลขแจ้งเตือนใหม่
      
      btnApprove.disabled = false; btnReject.disabled = false;
      btnLoading.innerHTML = originalHtml;
    })
    .withFailureHandler(function(err) {
      alert("ผิดพลาด: " + err.message);
      btnApprove.disabled = false; btnReject.disabled = false;
      btnLoading.innerHTML = originalHtml;
    })
    .processReconciliationDecision(reqId, action, Number(actualAmt), comment);
}
  

  // แอบแทรกคำสั่งดักให้โหลดตารางตอนแอดมินกดเปิดเมนูจัดการระบบ
  document.addEventListener("DOMContentLoaded", function() {
      const oldShowPageAdmin = showPage;
      showPage = function(pageId) {
          oldShowPageAdmin(pageId);
          if (pageId === 'page-admin') {
              loadSettings();
              loadMenuPermissions(); // โหลดตารางสิทธิ์
          }
      };
  });

// ==========================================
// 🌟 โหลดประวัติรวมงบกลางมาแสดงในตารางด้านล่าง
// ==========================================
function loadAllBudgetAdminHistory(year) {
  const tbody = document.getElementById('all-budget-history-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #8e44ad;"></i><br>กำลังโหลดประวัติทั้งหมด...</td></tr>';
  
  google.script.run
    .withSuccessHandler(function(history) {
      if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #e74c3c; padding: 30px;">ไม่พบประวัติการเคลื่อนไหวของงบอำนวยการกลาง</td></tr>';
        return;
      }
      
      let html = '';
      history.forEach(h => {
        let isIncome = h.amount > 0; 
        let amtColor = isIncome ? '#27ae60' : '#e74c3c'; 
        let amtSign = isIncome ? '+' : ''; 
        let rowBg = isIncome ? '#f4fdf7' : '#fff'; 
        let srcColor = '#8e44ad';
        
        html += `<tr style="border-bottom: 1px solid #eee; background: ${rowBg};">
                   <td style="padding: 12px; color: #7f8c8d; font-size: 0.85rem;">${h.date}</td>
                   <td style="padding: 12px; font-weight: bold; color: ${srcColor};"><i class="fas fa-coins" style="font-size:0.8rem;"></i> ${h.source}</td>
                   <td style="padding: 12px;"><span style="background: #eaf2f8; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${h.type}</span></td>
                   <td style="padding: 12px; color: #333; line-height: 1.4; font-size: 0.95rem;">${h.desc}</td>
                   <td style="padding: 12px; text-align: right; font-weight: bold; color: ${amtColor}; font-size: 1.05rem;">${amtSign}${h.amount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                   <td style="padding: 12px; text-align: right; font-weight: bold; color: #2c3e50;">${h.balance.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                 </tr>`;
      });
      tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; font-weight: bold; padding: 20px;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    })
    .getAllBudgetAdminHistory(year);
}
// ==========================================
// 🌟 ฟังก์ชันค้นหาและวาดตารางประวัติเบิกจ่ายทั้งหมด (มีตัวเลขครบ)
// ==========================================
function filterAllDisbursementsAdmin() {
   const tbody = document.getElementById('alldisb-admin-tbody');
   if (!tbody) return;

   const searchInput = document.getElementById('search-alldisb-admin');
   const searchTxt = searchInput ? String(searchInput.value || "").toLowerCase() : "";
   
   const statusFilterElem = document.getElementById('filter-alldisb-status');
   const statusFilter = statusFilterElem ? statusFilterElem.value : "all";

   if (!globalAllDisbAdminData || globalAllDisbAdminData.length === 0) {
       tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: #95a5a6; font-size:1.1rem;">ไม่มีข้อมูลการเบิกจ่ายในระบบ</td></tr>`;
       return;
   }

   let html = '';
   let count = 0;

   globalAllDisbAdminData.forEach(item => {
       let safeReqId = String(item.reqId || "").toLowerCase();
       let safeProj = String(item.projectName || "").toLowerCase();
       let safeReq = String(item.requester || "").toLowerCase();
       let safeStatus = String(item.status || "");
       let safeSup = String(item.supplyStatus || "-");
       let safeRec = String(item.reconStatus || "-");

       let matchSearch = searchTxt === "" || 
                         safeReqId.includes(searchTxt) || 
                         safeProj.includes(searchTxt) || 
                         safeReq.includes(searchTxt);
       
       let matchStatus = true;
       if (statusFilter === 'รอ') {
           matchStatus = safeStatus.includes('รอ');
       } else if (statusFilter === 'อนุมัติ') {
           matchStatus = safeStatus.includes('อนุมัติ') && !safeStatus.includes('ไม่อนุมัติ');
       } else if (statusFilter === 'ตีกลับ') {
           matchStatus = safeStatus.includes('ส่งกลับ') || safeStatus.includes('ไม่อนุมัติ');
       } else if (statusFilter === 'ค้าง') {
           let twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000); 
           matchStatus = safeStatus.includes('รอ') && (item.timeVal < twoDaysAgo);
       }

       if (matchSearch && matchStatus) {
           count++;
           
           let mainStatusColor = '#95a5a6';
           if (safeStatus.includes('อนุมัติ') && !safeStatus.includes('ไม่อนุมัติ')) mainStatusColor = '#27ae60';
           else if (safeStatus.includes('รอ')) mainStatusColor = '#f39c12';
           else if (safeStatus.includes('ตีกลับ') || safeStatus.includes('ไม่อนุมัติ')) mainStatusColor = '#e74c3c';

           let supColor = safeSup === 'จัดทำเอกสารแล้ว' ? '#27ae60' : (safeSup === 'รอจัดทำเอกสาร' ? '#f39c12' : '#95a5a6');
           let recColor = safeRec === 'กระทบยอดแล้ว' ? '#27ae60' : (safeRec === 'รอแนบบิล' ? '#e74c3c' : '#3498db');

           let itemsListHtml = '';
           if (item.items && item.items.length > 0) {
              itemsListHtml = `<details style="cursor:pointer; background:#fdfefe; border:1px solid #ecf0f1; border-radius:4px; padding:4px;">
                 <summary style="font-weight:bold; color:#2980b9; outline:none; user-select:none;"><i class="fas fa-box-open"></i> กางดู ${item.items.length} รายการ</summary>
                 <ul style="margin:5px 0 0 0; padding-left:15px; color:#555; list-style-type:square;">`;
              item.items.forEach(it => {
                 itemsListHtml += `<li>${it.name} <span style="font-size:0.75rem; color:#95a5a6;">(${it.qty} ${it.unit})</span></li>`;
              });
              itemsListHtml += `</ul></details>`;
           } else {
              itemsListHtml = '<span style="color:#e74c3c; font-size:0.8rem;">ไม่มีรายการ</span>';
           }

           let remainColor = item.remaining < 0 ? '#e74c3c' : '#27ae60';

           html += `<tr style="border-bottom: 1px solid #ecf0f1; transition: 0.2s; vertical-align:top;" onmouseover="this.style.background='#f9fbfc'" onmouseout="this.style.background='transparent'">
               <td style="padding: 12px;">
                  <div style="font-weight: bold; color: #8e44ad;">${item.reqId}</div>
                  <div style="color: #7f8c8d; font-size: 0.8rem; margin-top: 3px;"><i class="far fa-clock"></i> ${item.timestamp}</div>
               </td>
               <td style="padding: 12px;">
                  <div style="font-weight: 500; color: #2c3e50; line-height: 1.3; margin-bottom: 5px;">${item.projectName}</div>
                  <div style="font-size: 0.8rem; color: #95a5a6; margin-bottom: 2px;">[รหัส: ${item.projectId}]</div>
                  <div style="font-size: 0.85rem; color: #2980b9;"><i class="fas fa-user"></i> ${item.requester}</div>
               </td>
               <td style="padding: 12px;">
                  <span style="background: #f4f6f8; color: #34495e; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #bdc3c7; display: inline-block; line-height:1.2;">${item.source}</span>
               </td>
               <td style="padding: 12px; text-align: right; color: #34495e; font-weight:bold;">${Number(item.allocated).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; color: #7f8c8d;">${Number(item.usedBefore).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; font-weight: bold; color: #c0392b; font-size:1.05rem;">${Number(item.total).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; font-weight: bold; color: ${remainColor}; font-size:1.05rem;">${Number(item.remaining).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px;">${itemsListHtml}</td>
               <td style="padding: 12px; text-align: center;">
                  <div style="margin-bottom:3px;"><span style="background:${mainStatusColor}; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem; display:inline-block; line-height:1.3;">${safeStatus}</span></div>
                  <div style="font-size:0.75rem; color:${supColor}; margin-bottom:2px;"><i class="fas fa-box"></i> ${safeSup}</div>
                  <div style="font-size:0.75rem; color:${recColor};"><i class="fas fa-coins"></i> ${safeRec}</div>
               </td>
           </tr>`;
       }
   });

   if (count === 0) {
       html = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: #e74c3c; font-weight:bold; font-size:1.1rem;">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
   }
   tbody.innerHTML = html;
}
// ==========================================
// 🌟 ฟังก์ชันโหลดและกรองตารางประวัติเบิกจ่ายทั้งหมด (Admin) - อัปเดตดัก Error
// ==========================================
let globalAllDisbAdminData = [];

function loadAllDisbursementsAdmin() {
   const tbody = document.getElementById('alldisb-admin-tbody');
   const yearSelect = document.getElementById('alldisb-year-filter');
   
   // ถ้ากล่องไม่มีค่า ให้ถือว่าเป็น 'all' เพื่อดึงข้อมูลทั้งหมดมาก่อน
   let year = yearSelect ? yearSelect.value : 'all';
   if (!year || year.trim() === '') year = 'all'; 

   if(!tbody) return;

   tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color:#3498db;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังประมวลผลข้อมูลการเบิกจ่ายทั้งหมด...</td></tr>';

   google.script.run
     .withSuccessHandler(function(data) {
         try {
             globalAllDisbAdminData = data || [];
             filterAllDisbursementsAdmin(); 
         } catch(e) {
             console.error("Render Error:", e);
             tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #e74c3c; padding: 20px; font-weight:bold;">เกิดข้อผิดพลาดในการวาดตาราง: ${e.message}</td></tr>`;
         }
     })
     .withFailureHandler(function(err) {
         tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red; padding: 20px; font-weight:bold;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</td></tr>`;
     })
     .getAllDisbursementHistoryAdmin(year);
}
// ==========================================
// 🌟 ฟังก์ชันพิจารณารายงาน (สำหรับ Admin งานแผน)
// ==========================================
function loadPendingReportsAdmin() {
  const tbody = document.getElementById('admin-report-tbody');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#27ae60;"></i><br>กำลังค้นหารายงาน...</td></tr>';
  
  google.script.run
    .withSuccessHandler(function(reports) {
      if(reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color:#7f8c8d; padding: 30px;">เยี่ยมมาก! ไม่มีรายงานรอตรวจสอบ</td></tr>';
        return;
      }
      let html = '';
      reports.forEach(r => {
         let safeData = encodeURIComponent(JSON.stringify(r));
         html += `<tr style="border-bottom: 1px solid #ecf0f1; transition:0.2s;" onmouseover="this.style.background='#f9fbfc'" onmouseout="this.style.background='transparent'">
           <td style="padding: 12px; font-weight: bold; color: #27ae60;">${r.id}</td>
           <td style="padding: 12px; color: #2c3e50;">${r.name}</td>
           <td style="padding: 12px; color: #7f8c8d;"><i class="fas fa-user"></i> ${r.owner}</td>
           <td style="padding: 12px; text-align: center;"><span style="background:#f39c12; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">${r.reportStatus}</span></td>
           <td style="padding: 12px; text-align: center;">
             <button onclick="openReportReviewModal('${safeData}')" style="background:#27ae60; color:white; border:none; padding:6px 15px; border-radius:4px; cursor:pointer; font-family:'Kanit'; box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-search"></i> ตรวจสอบ</button>
           </td>
         </tr>`;
      });
      tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    })
    .getPendingReportsForAdmin();
}

function openReportReviewModal(encodedData) {
  const data = JSON.parse(decodeURIComponent(encodedData));
  
  // 🌟 สร้างปุ่มเปิดเอกสารรายงาน (Google Docs)
  let docLinkHtml = "";
  if (data.reportUrl && data.reportUrl !== "" && data.reportUrl !== "-") {
     docLinkHtml = `<a href="${data.reportUrl}" target="_blank" style="margin-left: 15px; background: #e8f4f8; color: #2980b9; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; border: 1px solid #3498db; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><i class="fas fa-file-word"></i> เปิดเอกสารรายงาน (Google Docs)</a>`;
  }
  
  document.getElementById('rev-rep-id').innerHTML = data.id + docLinkHtml; // 🌟 ใช้ innerHTML เพื่อให้ปุ่มโชว์ต่อท้ายรหัส
  document.getElementById('rev-rep-name').innerText = data.reportName || '-';
  document.getElementById('rev-rep-exec').innerText = data.operationalStatus || '-';
  document.getElementById('rev-rep-quan').innerText = data.quan || '-';
  document.getElementById('rev-rep-qual').innerText = data.qual || '-';
  document.getElementById('rev-rep-sum').innerText = data.summ || '-';
  document.getElementById('rev-rep-prob').innerText = data.prob || '-';
  document.getElementById('rev-rep-sugg').innerText = data.sugg || '-';
  document.getElementById('rev-rep-comment').value = '';
  document.getElementById('reportReviewModal').style.display = 'flex';
}

function submitReportReview(action) {
  const projectId = document.getElementById('rev-rep-id').innerText;
  const comment = document.getElementById('rev-rep-comment').value.trim();
  
  if(action === 'return' && !comment) {
    Swal.fire({icon: 'warning', title: 'โปรดระบุเหตุผล', text: 'กรุณาระบุสิ่งที่ต้องแก้ไข เพื่อให้คุณครูแก้ไขได้ตรงจุดครับ', customClass: {container: 'kanit-font'}});
    return;
  }
  
  let confirmTitle = action === 'approve' ? 'ยืนยันการอนุมัติรายงาน?' : 'ยืนยันการตีกลับ?';
  let confirmText = action === 'approve' ? 'คุณตรวจสอบแล้วพบว่ารายงานนี้สมบูรณ์ใช่หรือไม่?' : 'คุณต้องการส่งกลับให้ผู้รับผิดชอบแก้ไขใช่หรือไม่?';
  
  Swal.fire({
    title: confirmTitle,
    text: confirmText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: action === 'approve' ? '#27ae60' : '#e74c3c',
    cancelButtonColor: '#bdc3c7',
    confirmButtonText: 'ใช่, ดำเนินการ!',
    cancelButtonText: 'ยกเลิก',
    customClass: {container: 'kanit-font'}
  }).then((result) => {
    if (result.isConfirmed) {
      document.getElementById('reportReviewModal').style.display = 'none';
      Swal.fire({title: 'กำลังประมวลผล...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      
      google.script.run
        .withSuccessHandler(res => {
          Swal.fire({icon: 'success', title: 'สำเร็จ', text: res.message, customClass: {container: 'kanit-font'}});
          loadPendingReportsAdmin(); // โหลดตารางซ้ำ
        })
        .withFailureHandler(err => {
          Swal.fire({icon: 'error', title: 'ผิดพลาด', text: err.message, customClass: {container: 'kanit-font'}});
        })
        .processReportReview(projectId, action, comment, 'admin');
    }
  });
}
function adminRebuildPDF(projectId) {
    Swal.fire({
      title: 'สร้าง PDF ใหม่?',
      text: "ระบบจะแปลงไฟล์ Google Docs ล่าสุดเป็น PDF อีกครั้ง ใช้ในกรณีฟอนต์เพี้ยนหรือเอกสารไม่สมบูรณ์",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f39c12',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ใช่, สร้างใหม่เลย',
      customClass: { container: 'kanit-font' }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'กำลังสร้าง PDF...', text: 'อาจใช้เวลา 5-10 วินาที กรุณารอสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        google.script.run
          .withSuccessHandler(res => { Swal.fire({icon:'success', title:'สำเร็จ', text:res.message}); loadAllProjects(); })
          .withFailureHandler(err => { Swal.fire({icon:'error', title:'ผิดพลาด', text:err.message}); })
          .adminRebuildPDFBackend(projectId);
      }
    });
  }
// ==========================================
// 🌟 ระบบแผนภูมิระยะเวลาดำเนินโครงการ (Yearly Roadmap)
// ==========================================

function initCalendar() {
    // 1. ตั้งค่า Dropdown ปีงบประมาณ
    const d = new Date();
    let currentBuddhistYear = d.getFullYear() + 543;
    if (d.getMonth() >= 9) currentBuddhistYear += 1; 
    
    const yearSelect = document.getElementById('roadmap-year-filter');
    if (yearSelect && yearSelect.options.length === 0) {
        let opts = '';
        for (let y = currentBuddhistYear + 1; y >= currentBuddhistYear - 2; y--) {
            let isSelected = (y === currentBuddhistYear) ? 'selected' : '';
            opts += `<option value="${y}" ${isSelected}>ปีงบประมาณ 25${String(y).substring(2)}</option>`;
        }
        yearSelect.innerHTML = opts;
    }
    
    // 🌟 2. สั่งให้ไปดึงข้อมูลโครงการมาใหม่ทันที
    fetchAndRenderRoadmap();
}

// 🌟 ฟังก์ชันใหม่: ทำหน้าที่วิ่งไปขอข้อมูลจากหลังบ้าน
function fetchAndRenderRoadmap() {
    const tbody = document.getElementById('roadmap-tbody');
    if (!tbody) return;

    // โชว์หมุนๆ ระหว่างรอโหลด
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 40px; color: #3498db;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงข้อมูลโครงการจากฐานข้อมูล...</td></tr>';

    // วิ่งไปขอข้อมูล (ดึงแบบ 'all' เพื่อให้ครอบคลุมโครงการที่คาบเกี่ยวข้ามปี)
    google.script.run
        .withSuccessHandler(function(projects) {
            globalAllProjectsData = projects; 
            renderRoadmap(); // โหลดเสร็จแล้วสั่งวาดกราฟเลย
        })
        .withFailureHandler(function(err) {
            tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color: red;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
        })
        .getAllProjectsData('all');
}

// 🌟 ฟังก์ชันแปลงวันที่ภาษาไทย (เช่น "พฤศจิกายน 2569") ให้เป็น Date Object[cite: 12]
function parseThaiToDate(dateStr, isEndDate = false) {
    if (!dateStr || String(dateStr).trim() === '-' || String(dateStr).trim() === '') {
        return null;
    }
    let s = String(dateStr).trim();
    let year = null;
    let month = null; 
    
    // ดักจับภาษาไทย
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    let mIndex = -1;
    for (let i = 0; i < thaiMonths.length; i++) {
        if (s.includes(thaiMonths[i])) { mIndex = i; break; }
    }
    
    if (mIndex !== -1) {
        month = mIndex;
        let yearMatch = s.match(/\d{4}/);
        if (yearMatch) year = parseInt(yearMatch[0]);
    } else {
        // ดักจับรูปแบบ Date มาตรฐาน
        let d = new Date(s);
        if (!isNaN(d.getTime())) {
            year = d.getFullYear();
            month = d.getMonth();
        }
    }
    
    if (year !== null && month !== null) {
        if (year > 2400) year -= 543;
        
        let finalDate = isEndDate ? new Date(year, month + 1, 0, 23, 59, 59) : new Date(year, month, 1, 0, 0, 0);
        return finalDate;
    }
    
    console.warn(`⚠️ [LOGGER] ระบบแปลวันที่ไม่ได้: "${dateStr}"`);
    return null;
}

// 🌟 2. ฟังก์ชันวาดแผนผัง + Logger
function renderRoadmap() {
    console.log("===================================");
    console.log("🚀 [LOGGER-ROADMAP] เริ่มวาดปฏิทิน");
    
    const tbody = document.getElementById('roadmap-tbody');
    if (!tbody) return;

    if (!globalAllProjectsData || globalAllProjectsData.length === 0) {
        console.log("❌ [LOGGER-ROADMAP] ข้อมูลโครงการว่างเปล่า");
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 40px; color: #f39c12;"><i class="fas fa-exclamation-circle fa-2x"></i><br>ไม่พบข้อมูลโครงการในระบบ</td></tr>';
        return;
    }

    console.log(`📦 [LOGGER-ROADMAP] พบข้อมูลทั้งหมด: ${globalAllProjectsData.length} โครงการ`);
    
    // ลองแอบดูข้อมูลโครงการตัวแรกสุดว่ามีวันที่ติดมาไหม
    if(globalAllProjectsData.length > 0) {
        console.log("🔍 [LOGGER-ROADMAP] ตัวอย่างโครงการ [0]: ", globalAllProjectsData[0].name);
        console.log("👉 startDate (ดิบ):", globalAllProjectsData[0].startDate);
        console.log("👉 endDate (ดิบ):", globalAllProjectsData[0].endDate);
    }

    const selectedBuddhistYear = parseInt(document.getElementById('roadmap-year-filter').value);
    const endYearCE = selectedBuddhistYear - 543; 
    const startYearCE = endYearCE - 1;

    console.log(`🗓️ [LOGGER-ROADMAP] ปีงบประมาณที่เลือก: ${selectedBuddhistYear} (ต.ค. ${startYearCE} - ก.ย. ${endYearCE})`);

    const fyMonths = [
        { m: 9, y: startYearCE },  { m: 10, y: startYearCE }, { m: 11, y: startYearCE }, 
        { m: 0, y: endYearCE },    { m: 1, y: endYearCE },    { m: 2, y: endYearCE },    
        { m: 3, y: endYearCE },    { m: 4, y: endYearCE },    { m: 5, y: endYearCE },    
        { m: 6, y: endYearCE },    { m: 7, y: endYearCE },    { m: 8, y: endYearCE }     
    ];

    let html = '';
    let hasData = false;

    globalAllProjectsData.forEach((p, index) => {
        hasData = true;

        let pStart = parseThaiToDate(p.startDate, false);
        let pEnd = parseThaiToDate(p.endDate, true);
        let hasValidDates = pStart && pEnd;

        // ปริ้นท์เช็คเฉพาะ 5 โครงการแรกกันตาลาย
        if (index < 5) {
             console.log(`\n📌 [โครงการ] ${p.name}`);
             console.log(`   > วันเริ่ม: ${p.startDate} => แปลงเป็น JS: ${pStart}`);
             console.log(`   > วันจบ: ${p.endDate} => แปลงเป็น JS: ${pEnd}`);
             console.log(`   > validDates?: ${hasValidDates}`);
        }

        let barColor = '#3498db'; 
        let statusText = p.execStatus || p.status || 'ไม่มีข้อมูล';

        if (p.status === 'แบบร่าง' || p.status.includes('รอ')) {
            barColor = '#bdc3c7'; 
            statusText = p.status; 
        } else if (p.status.includes('ไม่อนุมัติ') || (p.execStatus && p.execStatus.includes('ยกเลิก')) || (p.execStatus && p.execStatus.includes('ไม่ได้ดำเนินการ'))) {
            barColor = '#e74c3c'; 
            statusText = (p.execStatus && (p.execStatus.includes('ยกเลิก') || p.execStatus.includes('ไม่ได้'))) ? p.execStatus : p.status;
        } else if (p.execStatus && p.execStatus.includes('เสร็จสิ้น')) {
            barColor = '#27ae60'; 
        } else if (p.execStatus && (p.execStatus.includes('รอเบิก') || p.execStatus.includes('รายงานผล'))) {
            barColor = '#f39c12'; 
        }

        let startDateStr = p.startDate || 'ไม่ได้ระบุ';
        let endDateStr = p.endDate || 'ไม่ได้ระบุ';

        let rowHtml = `
            <tr style="border-bottom: 1px solid #ecf0f1; transition: 0.2s;" onmouseover="this.style.background='#fcfdfe'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px; border: 1px solid #ecf0f1; border-left: 4px solid ${barColor};">
                    <div style="font-weight:bold; color:#2c3e50; font-size:0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;" title="${p.name}">${p.name}</div>
                    <div style="font-size:0.8rem; color:#7f8c8d; margin-top: 3px;">
                        <i class="fas fa-user-circle"></i> ${p.owner} <br>
                        <span style="color:${barColor}; font-weight:bold;"><i class="fas fa-circle" style="font-size:0.6rem;"></i> ${statusText}</span>
                    </div>
                </td>`;

        fyMonths.forEach(mo => {
            if (hasValidDates) {
                let monthStart = new Date(mo.y, mo.m, 1);
                let monthEnd = new Date(mo.y, mo.m + 1, 0, 23, 59, 59);
                
                let isOverlap = (pStart <= monthEnd) && (pEnd >= monthStart);

                if (isOverlap) {
                    rowHtml += `<td style="padding: 0; border: 1px solid #ecf0f1; vertical-align: middle;">
                        <div title="เริ่ม: ${startDateStr}\nสิ้นสุด: ${endDateStr}\nสถานะ: ${statusText}" style="height: 24px; background-color: ${barColor}; margin: 2px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.1); cursor: pointer; border-radius:2px;"></div>
                    </td>`;
                } else {
                    rowHtml += `<td style="padding: 0; border: 1px solid #ecf0f1; background-color: transparent;"></td>`;
                }
            } else {
                rowHtml += `<td style="padding: 0; border: 1px solid #ecf0f1; background-color: transparent;"></td>`;
            }
        });

        rowHtml += `</tr>`;
        html += rowHtml;
    });

    if (!hasData) {
        html = `<tr><td colspan="13" style="text-align:center; padding: 40px; color: #e74c3c; font-size: 1.1rem;"><i class="fas fa-folder-open fa-2x" style="color:#bdc3c7; margin-bottom:10px;"></i><br>ไม่มีโครงการในระบบ</td></tr>`;
    }

    tbody.innerHTML = html;
    console.log("✅ [LOGGER-ROADMAP] วาดตารางเสร็จสมบูรณ์");
    console.log("===================================");
}

// 🌟 ฟังก์ชันหาโครงการที่จัดในวันที่กำหนด (สำหรับ Calendar)
function getEventsForDate(year, month, day) {
    if (!globalAllProjectsData || globalAllProjectsData.length === 0) return '';
    
    let targetDate = new Date(year, month, day);
    targetDate.setHours(0,0,0,0);
    
    let eventsHtml = '';
    
    globalAllProjectsData.forEach(p => {
        let pStart = parseThaiToDate(p.startDate, false);
        let pEnd = parseThaiToDate(p.endDate, true);
        
        if (pStart && pEnd) {
            if (targetDate >= pStart && targetDate <= pEnd) {
                
                let bgColor = '#3498db'; 
                if (p.status === 'แบบร่าง' || p.status.includes('รอ')) bgColor = '#bdc3c7'; 
                else if (p.status.includes('ไม่อนุมัติ') || p.execStatus.includes('ยกเลิก') || p.execStatus.includes('ไม่ได้')) bgColor = '#e74c3c'; 
                else if (p.execStatus.includes('เสร็จสิ้น')) bgColor = '#27ae60'; 
                else if (p.execStatus.includes('รอเบิก') || p.execStatus.includes('รายงานผล')) bgColor = '#f39c12'; 
                
                let eventText = p.name;
                
                let isStartExact = (targetDate.getTime() === pStart.getTime());
                let isEndExact = (targetDate.getTime() === new Date(pEnd.getFullYear(), pEnd.getMonth(), pEnd.getDate(), 0,0,0).getTime());
                
                if (isStartExact) eventText = `🟢 เริ่ม: ${p.name}`;
                if (isEndExact) eventText = `🔴 จบ: ${p.name}`;

                let statusText = p.execStatus || p.status;
                eventsHtml += `<div style="background-color: ${bgColor}; color: white; font-size: 0.7rem; padding: 4px 6px; border-radius: 4px; margin-bottom:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" title="[${p.id}] ${p.name}\nผู้รับผิดชอบ: ${p.owner}\nสถานะ: ${statusText}">
                                 ${eventText}
                               </div>`;
            }
        }
    });
    
    return eventsHtml;
}




// ==========================================
// 🌟 ฟังก์ชันยืนยันและสั่งลบโครงการ (ฝั่งหน้าเว็บ)
// ==========================================
function deleteProject(projectId, projectName) {
    let decodedName = decodeURIComponent(projectName);
    Swal.fire({
      title: 'ยืนยันการลบโครงการ?',
      text: `คุณต้องการลบโครงการ "${decodedName}" ใช่หรือไม่? (ข้อมูลและไฟล์เอกสารจะถูกลบถาวร)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'กำลังลบข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        google.script.run
          .withSuccessHandler(function(res) {
            Swal.fire('สำเร็จ!', res.message, 'success').then(() => {
              loadMyProjects();
              if (typeof loadDashboardData === 'function') loadDashboardData();
            });
          })
          .withFailureHandler(function(err) {
            Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
          })
          .deleteProjectById(projectId);
      }
    });
  }
// ==========================================
    // 🌟 ฟังก์ชันออกจากระบบ (Logout)
    // ==========================================
    function logout() {
  Swal.fire({
    title: 'ออกจากระบบ?',
    text: "คุณต้องการออกจากระบบเพื่อสลับบัญชีใช่หรือไม่?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#bdc3c7',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    customClass: { container: 'Prompt-font' }
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('appToken');
      localStorage.removeItem('sopon_preferred_email');
      localStorage.removeItem('sopon_mobile_auth');
      localStorage.removeItem('nongPhaenDee_lineUid');

      if (window.google && window.google.accounts && window.google.accounts.id) {
        google.accounts.id.disableAutoSelect();
      }
      window.location.href = window.location.pathname;
    }
  });
}
    // ==========================================
// 🌟 ฟังก์ชันเปิดหน้าต่างตาราง AI วิเคราะห์เอกสารเชื่อมโยงกลยุทธ์ & QA
// ==========================================
let currentAIMappingData = [];
  let fullMappingChoices = {};

  function startAIDocMappingAnalysis() {
    Swal.fire({
      title: 'หุ่นยนต์ AI กำลังเปิดอ่านไฟล์เอกสาร...',
      html: 'ระบบกำลังดึง <b>วัตถุประสงค์และเป้าหมาย</b> จากไฟล์ Google Docs ของทุกโครงการ<br>เพื่อวิเคราะห์จับคู่กลยุทธ์และมาตรฐาน QA (ใช้เวลาประมาณ 15-30 วินาที)',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    google.script.run
      .withSuccessHandler(function(res) {
        Swal.close();
        renderAIMappingModal(res);
      })
      .withFailureHandler(function(err) {
        Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
      })
      .analyzeProjectsWithAIForMapping();
  }

function renderAIMappingModal(data) {
    currentAIMappingData = data.projects;
    fullMappingChoices = data;
    const oldModal = document.getElementById('aiMappingModal');
    if (oldModal) oldModal.remove();

    const buildMpOptions = (selectedId) => {
      let opts = `<option value="">-- ไม่ระบุ --</option>`;
      (data.mpChoices || []).forEach(m => {
        let sf = (data.sfChoices || []).find(s => s.id === m.sfId);
        let sfLabel = sf ? `[${sf.id}] ` : '';
        let isSel = (m.id === selectedId) ? 'selected' : '';
        opts += `<option value="${m.id}" ${isSel}>${sfLabel}${m.id}: ${m.name}</option>`;
      });
      return opts;
    };

    let rowsHtml = '';
    data.projects.forEach((p, idx) => {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding:10px; font-weight:bold; color:#2c3e50; white-space:nowrap;">${p.id}</td>
          <td style="padding:10px;">
            <div style="font-weight:bold; color:#8e44ad;">${p.name}</div>
            <div style="font-size:0.8rem; color:#7f8c8d;">👤 ${p.owner}</div>
          </td>
          <td style="padding:10px; font-size:0.85rem; color:#34495e; max-width:280px;">
            <b>🎯 วัตถุประสงค์ที่ดึงได้:</b> ${p.extractedObj}<br>
            <span style="color:#16a085;"><b>💡 สรุปจาก AI:</b> ${p.aiSummary}</span>
          </td>
          <td style="padding:10px;">
            <select id="ai-mp-${idx}" style="width:100%; padding:6px; border:1px solid #bdc3c7; border-radius:4px; font-family:'Kanit'; font-size:0.85rem;">
              ${buildMpOptions(p.suggestedMpId)}
            </select>
          </td>
          <td style="padding:10px;">
            <input type="text" id="ai-qa-${idx}" value="${p.suggestedQaIds}" placeholder="เช่น 1.1, 2.1" style="width:100%; padding:6px; border:1px solid #bdc3c7; border-radius:4px; font-family:'Kanit'; font-size:0.85rem; box-sizing:border-box;">
          </td>
          <td style="padding:10px; font-size:0.8rem; color:#555; background:#fcf8e3;">
            <i class="fas fa-lightbulb" style="color:#f39c12;"></i> ${p.aiReason}
          </td>
        </tr>
      `;
    });

    const modal = document.createElement('div');
    modal.id = 'aiMappingModal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; display:flex; justify-content:center; align-items:center;";
    
    modal.innerHTML = `
      <div style="background:white; width:95%; max-width:1300px; height:88vh; border-radius:10px; display:flex; flex-direction:column; overflow:hidden; font-family:'Kanit', sans-serif;">
        <div style="background:linear-gradient(135deg, #8e44ad, #2980b9); color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;"><i class="fas fa-magic"></i> ตารางผลวิเคราะห์เอกสาร Google Docs เชื่อมโยงกลยุทธ์และมาตรฐาน QA</h3>
          <button onclick="document.getElementById('aiMappingModal').remove()" style="background:none; border:none; color:white; font-size:1.6rem; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:15px 20px; overflow-y:auto; flex:1;">
          <table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
              <tr style="background:#34495e; color:white; font-size:0.9rem;">
                <th style="padding:10px; width:90px;">รหัส</th>
                <th style="padding:10px; width:200px;">ชื่อโครงการ</th>
                <th style="padding:10px; width:280px;">ข้อมูลที่ดึงจากไฟล์ Docs</th>
                <th style="padding:10px; width:240px;">กลยุทธ์ / โครงการหลัก (AI เลือกให้)</th>
                <th style="padding:10px; width:140px;">รหัสมาตรฐาน QA</th>
                <th style="padding:10px;">เหตุผลวิเคราะห์โดย AI</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div style="padding:15px 20px; background:#f4f6f8; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #ddd;">
          <div style="display:flex; gap:10px;">
            <button onclick="exportAIMappingTableToExcel()" style="background:#2980b9; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold;">
              <i class="fas fa-file-excel"></i> ส่งออก Excel
            </button>
            <button onclick="exportAIMappingTableToPDF()" style="background:#e74c3c; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold;">
              <i class="fas fa-file-pdf"></i> ส่งออก PDF (แนบแผนปฏิบัติการ)
            </button>
          </div>
          <div>
            <button onclick="document.getElementById('aiMappingModal').remove()" style="background:#95a5a6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-family:'Kanit'; margin-right:10px;">ยกเลิก</button>
            <button onclick="confirmSaveAIMapping()" style="background:#27ae60; color:white; border:none; padding:10px 25px; border-radius:6px; cursor:pointer; font-family:'Kanit'; font-weight:bold;">
              <i class="fas fa-save"></i> บันทึกการจับคู่ทั้งหมดลงฐานข้อมูล
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

function confirmSaveAIMapping() {
    let payload = currentAIMappingData.map((p, idx) => ({
      id: p.id,
      mpId: document.getElementById(`ai-mp-${idx}`).value.trim(),
      qaIds: document.getElementById(`ai-qa-${idx}`).value.trim()
    }));

    Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    google.script.run
      .withSuccessHandler(function(res) {
        document.getElementById('aiMappingModal').remove();
        Swal.fire('สำเร็จ!', res.message, 'success');
        if (typeof loadQAStructure === 'function') loadQAStructure();
        if (typeof loadStrategyStructure === 'function') loadStrategyStructure();
      })
      .withFailureHandler(function(err) {
        Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
      })
      .saveBatchAIMapping(payload);
  }

function exportAIMappingTableToExcel() {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">
      <tr style="background:#34495e; color:white; font-weight:bold;">
        <th>รหัสโครงการ</th><th>ชื่อโครงการ</th><th>ผู้รับผิดชอบ</th><th>วัตถุประสงค์ (จากไฟล์ Docs)</th><th>สรุปใจความสำคัญ</th><th>รหัสโครงการหลัก (MP)</th><th>รหัสมาตรฐาน QA</th><th>เหตุผลวิเคราะห์โดย AI</th>
      </tr>`;
    currentAIMappingData.forEach((p, idx) => {
      let mpVal = document.getElementById(`ai-mp-${idx}`).value;
      let qaVal = document.getElementById(`ai-qa-${idx}`).value;
      html += `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.owner}</td><td>${p.extractedObj}</td><td>${p.aiSummary}</td><td>${mpVal}</td><td>${qaVal}</td><td>${p.aiReason}</td></tr>`;
    });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ตารางเชื่อมโยงกลยุทธ์และQA_${new Date().getTime()}.xls`;
    a.click();
  }
// ==========================================
// 🌟 ฟังก์ชันส่งออกตารางเชื่อมโยงกลยุทธ์และ QA เป็น PDF (สำหรับแนบเล่มแผนปฏิบัติการ)
// ==========================================
function exportAIMappingTableToPDF() {
    if (!currentAIMappingData || currentAIMappingData.length === 0) return;
    let rowsHtml = '';
    currentAIMappingData.forEach((p, idx) => {
      let mpId = document.getElementById(`ai-mp-${idx}`).value.trim();
      let qaIds = document.getElementById(`ai-qa-${idx}`).value.trim();
      let mpObj = (fullMappingChoices.mpChoices || []).find(m => m.id === mpId);
      let sfObj = mpObj ? (fullMappingChoices.sfChoices || []).find(s => s.id === mpObj.sfId) : null;
      let strategyFullText = mpObj ? `${sfObj ? `<b>${sfObj.name}</b><br>` : ''}${mpObj.id}: ${mpObj.name}` : '-';

      rowsHtml += `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-weight:bold; white-space:nowrap;">${p.id}</td>
        <td><b>${p.name}</b><br><span style="font-size:12pt; color:#444;">ผู้รับผิดชอบ: ${p.owner}</span></td>
        <td>${p.extractedObj}</td>
        <td>${strategyFullText}</td>
        <td style="text-align:center; font-weight:bold;">${qaIds || '-'}</td>
      </tr>`;
    });

    const printWindow = window.open('', '_blank', 'width=1200,height=850');
    const pdfHtml = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ตารางความเชื่อมโยงแผนปฏิบัติการ</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 12mm 15mm; }
        body { font-family: 'Sarabun', sans-serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        th, td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; font-size: 12.5pt; }
        th { background-color: #f0f3f5 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: 700; }
        .no-print-bar { background: #2c3e50; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        @media print { .no-print-bar { display: none !important; } }
      </style></head><body>
      <div class="no-print-bar">
        <div>💡 เลือก Destination เป็น <b>Save as PDF</b> และตั้งค่า Layout เป็น <b>Landscape (แนวนอน)</b></div>
        <button onclick="window.print()" style="background:#e74c3c; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">🖨️ บันทึกเป็น PDF</button>
      </div>
      <h2 style="text-align:center; font-size:16pt; margin:0 0 15px 0;">ตารางวิเคราะห์ความเชื่อมโยงโครงการตามแผนปฏิบัติการประจำปี กับยุทธศาสตร์และมาตรฐานการศึกษา</h2>
      <table><thead><tr>
        <th style="width:5%;">ลำดับ</th><th style="width:10%;">รหัสโครงการ</th><th style="width:22%;">ชื่อโครงการ / ผู้รับผิดชอบ</th>
        <th style="width:28%;">วัตถุประสงค์หลัก</th><th style="width:23%;">ความสอดคล้องด้านกลยุทธ์</th><th style="width:12%;">มาตรฐาน QA</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <scr` + `ipt>window.onload = function() { setTimeout(function() { window.print(); }, 800); };</scr` + `ipt>
      </body></html>`;
    printWindow.document.open();
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
  }
// ==============================================================
// 🌟 เปลี่ยนปุ่ม "สร้างตารางสรุปแผนปฏิบัติการ" ให้โหลดเป็นไฟล์ Excel แท็บครบชุด
// ==============================================================
function openExecutiveSummaryReport() {
    const selectElem = document.getElementById('all-year-filter') || document.getElementById('myprojects-year-filter');
    let targetYear = selectElem ? selectElem.value : "";
    
    // ถ้าปีเป็น ALL หรือว่างเปล่า ให้หาค่าปีปัจจุบัน
    if (!targetYear || targetYear === 'all' || targetYear === 'ALL') {
        let d = new Date(); let curr = d.getFullYear() + 543;
        if (d.getMonth() >= 9) curr += 1;
        targetYear = String(curr).substring(2);
    }

    Swal.fire({
      title: 'กำลังสร้างไฟล์ Excel แผนปฏิบัติการ...',
      text: 'ระบบกำลังดึงข้อมูลทุกโครงการและแบ่งไตรมาส',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
      customClass: { container: 'kanit-font' }
    });

    const ensureXLSXStyleLoaded = (callback) => {
        if (window.isXlsxStyleLoaded === true) {
            callback();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => { window.isXlsxStyleLoaded = true; callback(); };
            script.onerror = () => { Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดระบบสร้าง Excel ได้', 'error'); };
            document.head.appendChild(script);
        }
    };

    // 🌟 1. ดึงข้อมูลรายโครงการทั้งหมด (เพื่อทำแท็บที่ 1 จัดเรียงทุกโครงการ)
    google.script.run
      .withSuccessHandler(function(projDataList) {
          
          // 🌟 2. ดึงข้อมูล Dashboard (เพื่อให้ยอดไตรมาสแม่นยำ)
          google.script.run
            .withSuccessHandler(function(dashData) {
                ensureXLSXStyleLoaded(() => {
                   try {
                     const wb = XLSX.utils.book_new();
                     const fontName = "TH Sarabun New";
                     const borderThin = { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } };
                     
                     const sTitle = { font: { name: fontName, sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
                     const sHead1 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
                     const sHead2 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "27AE60" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
                     const sLeft = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "left", vertical: "top", wrapText: true }, border: borderThin };
                     const sCenter = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "center", vertical: "top", wrapText: true }, border: borderThin };
                     const sMoney = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "right", vertical: "top" }, numFmt: "#,##0.00", border: borderThin };
                     const sSumText = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "D5F5E3" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
                     const sSumMoney = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "D5F5E3" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00", border: borderThin };

                     // ===============================================
                     // 🌟 แท็บ 1: บทสรุปผู้บริหาร (จัดเรียงทุกโครงการ)
                     // ===============================================
                     let r1 = []; let m1 = [];
                     r1.push([{ v: `รายงานสรุปแผนปฏิบัติการและผลการดำเนินงานระดับโครงการ ปีงบประมาณ 25${targetYear}`, s: sTitle }, ...Array(16).fill("")]);
                     r1.push([{ v: `ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}`, s: { font: { name: fontName, sz: 14 }, alignment: { horizontal: "left" } } }, ...Array(16).fill("")]);
                     r1.push(Array(17).fill(""));
                     m1.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } });

                     let h1 = ["ยุทธศาสตร์/แผนงาน (SF)", "โครงการหลัก (MP)", "รหัสกิจกรรม", "ชื่อโครงการ/กิจกรรม", "ผู้รับผิดชอบ", "แหล่งงบประมาณ", "งบตั้งต้น (บาท)", "เบิกจ่ายจริง (บาท)", "คงเหลือ (บาท)", "สถานะอนุมัติโครงการ", "สถานะการทำงาน", "สถานะการรายงาน", "ผลเชิงปริมาณ", "ผลเชิงคุณภาพ", "สรุปผลสัมฤทธิ์", "ปัญหาและอุปสรรค", "ข้อเสนอแนะ"];
                     r1.push(h1.map((h, i) => ({ v: h, s: i >= 12 ? sHead2 : sHead1 })));

                     let t1Bud = 0, t1Spent = 0;
                     projDataList.forEach(p => {
                         if(p.status.includes('ไม่อนุมัติ')) return; // กรองปัดตกทิ้ง
                         
                         let sfDisplay = (p.sfId && p.sfId !== "ไม่ได้ระบุ SF" && p.sfId !== "-") ? `[${p.sfId}] ${p.sfName}` : (p.sfId || "-");
                         let mpDisplay = (p.mpId && p.mpId !== "ไม่ได้ระบุ MP" && p.mpId !== "-") ? `[${p.mpId}] ${p.mpName}` : (p.mpId || "-");
                         let bSrc = p.fundingDetails && p.fundingDetails.length > 0 ? p.fundingDetails.map(f => f.source).join(', ') : "ไม่ระบุ";

                         t1Bud += p.budget; t1Spent += p.spent;

                         r1.push([
                             {v: sfDisplay, s: sLeft}, {v: mpDisplay, s: sLeft}, {v: p.id, s: sCenter}, {v: p.name, s: sLeft},
                             {v: p.owner, s: sLeft}, {v: bSrc, s: sLeft}, {v: p.budget, t: 'n', s: sMoney},
                             {v: p.spent, t: 'n', s: sMoney}, {v: p.remaining, t: 'n', s: sMoney}, {v: p.status, s: sCenter},
                             {v: p.execStatus === '-' ? 'ยังไม่ระบุ' : p.execStatus, s: sCenter},
                             {v: p.reportStatus === '-' ? 'ยังไม่รายงาน' : p.reportStatus, s: sCenter},
                             {v: p.quan || "-", s: sLeft}, {v: p.qual || "-", s: sLeft}, {v: p.summ || "-", s: sLeft},
                             {v: p.prob || "-", s: sLeft}, {v: p.sugg || "-", s: sLeft}
                         ]);
                     });

                     r1.push([
                         {v: "รวมทั้งสิ้น", s: sSumText}, "", "", "", "", "", 
                         {v: t1Bud, t: 'n', s: sSumMoney}, {v: t1Spent, t: 'n', s: sSumMoney}, {v: t1Bud - t1Spent, t: 'n', s: sSumMoney}, 
                         "", "", "", "", "", "", "", ""
                     ]);
                     m1.push({ s: { r: r1.length - 1, c: 0 }, e: { r: r1.length - 1, c: 5 } });

                     const ws1 = XLSX.utils.aoa_to_sheet(r1);
                     ws1['!merges'] = m1;
                     ws1['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 25 }];
                     XLSX.utils.book_append_sheet(wb, ws1, "1.บทสรุปผู้บริหาร");

                     // ===============================================
                     // 🌟 แท็บ 2: แผนการใช้จ่ายงบประมาณ (Cash Flow)
                     // ===============================================
                     let cRows = []; let cMerges = [];
                     let py = parseInt(targetYear, 10);
                     let prevY = py - 1;
                     
                     const sCFHead = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "9B59B6" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderThin };
                     const sCFMoney = { font: { name: fontName, sz: 14 }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0", border: borderThin };
                     const sCFNumText = { font: { name: fontName, sz: 14, bold: true }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
                     const sCFFoot = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderThin };
                     const sCFFootMoney = { font: { name: fontName, sz: 14, bold: true }, fill: { fgColor: { rgb: "E8DAEF" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0", border: borderThin };

                     cRows.push([{ v: `แผนการใช้จ่ายงบประมาณ (เฉพาะโครงการพัฒนาคุณภาพการศึกษา) - ปีงบประมาณ 25${py}`, s: sTitle }, ...Array(6).fill("")]);
                     cMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); cRows.push([]);

                     cRows.push([
                         { v: "ที่", s: sCFHead }, { v: "แหล่งงบประมาณ", s: sCFHead }, { v: "งบประมาณ\nที่ได้รับจัดสรร", s: sCFHead }, 
                         { v: "แผนการใช้จ่ายงบประมาณ", s: sCFHead }, "", "", ""
                     ]);
                     cMerges.push({ s: { r: 2, c: 0 }, e: { r: 3, c: 0 } });
                     cMerges.push({ s: { r: 2, c: 1 }, e: { r: 3, c: 1 } });
                     cMerges.push({ s: { r: 2, c: 2 }, e: { r: 3, c: 2 } });
                     cMerges.push({ s: { r: 2, c: 3 }, e: { r: 2, c: 6 } });

                     cRows.push([
                         "", "", "", 
                         { v: `ไตรมาส 1\n(ต.ค.-ธ.ค.${prevY})`, s: sCFHead }, { v: `ไตรมาส 2\n(ม.ค.-มี.ค.${py})`, s: sCFHead },
                         { v: `ไตรมาส 3\n(เม.ย.-มิ.ย.${py})`, s: sCFHead }, { v: `ไตรมาส 4\n(ก.ค.-ก.ย.${py})`, s: sCFHead }
                     ]);

                     const fundsList = [
                         { name: "อุดหนุนรายหัว", kws: ["รายหัว"] },
                         { name: "กิจกรรมพัฒนาผู้เรียน", kws: ["พัฒนาผู้เรียน", "กิจกรรม"] },
                         { name: "รายได้สถานศึกษา", kws: ["รายได้"] },
                         { name: `รายได้สถานศึกษา (ผ้าป่า ${py})`, kws: ["ผ้าป่า"] },
                         { name: "ลูกเสือ", kws: ["ลูกเสือ"] }
                     ];

                     let totalReceived = 0; let totalQ1 = 0; let totalQ2 = 0; let totalQ3 = 0; let totalQ4 = 0;

                     fundsList.forEach((f, idx) => {
                         let q1 = 0; let q2 = 0; let q3 = 0; let q4 = 0;
                         
                         projDataList.forEach(p => {
                             // 🛑 กรองเฉพาะ K=1 (งบพัฒนาคุณภาพ)
                             let isK1 = p.projectType ? (!p.projectType.includes("บริหาร") && !p.projectType.includes("ประจำ") && !p.projectType.includes("ทั่วไป") && !p.projectType.includes("2")) : true;
                             if (!isK1 || !p.status.includes("อนุมัติ") || p.status.includes("ไม่อนุมัติ")) return; 

                             let qRaw = String(p.quarter || "1");
                             let isAllYear = (qRaw.includes("5") || qRaw.includes("ตลอด") || qRaw.includes("ทั้งปี"));
                             let qNum = parseInt(qRaw) || 1;
                             
                             if (p.fundingDetails && p.fundingDetails.length > 0) {
                                 p.fundingDetails.forEach(fd => {
                                     let sName = String(fd.source || "").trim();
                                     let amt = Number(fd.budget) || 0;
                                     if (amt <= 0) return;

                                     let matchedFund = fundsList.find(kwObj => kwObj.kws.some(kw => sName.includes(kw)));
                                     if (!matchedFund) matchedFund = fundsList[2]; 

                                     if (matchedFund.name === f.name) {
                                         if (isAllYear) {
                                             let split = amt / 4;
                                             q1 += split; q2 += split; q3 += split; q4 += split;
                                         } else {
                                             if(qNum===1) q1+=amt; else if(qNum===2) q2+=amt; else if(qNum===3) q3+=amt; else q4+=amt;
                                         }
                                     }
                                 });
                             }
                         });

                         let rowPlanTotal = q1 + q2 + q3 + q4;
                         totalReceived += rowPlanTotal;
                         totalQ1 += q1; totalQ2 += q2; totalQ3 += q3; totalQ4 += q4;

                         cRows.push([
                             {v: idx+1, t: 'n', s: sCFNumText}, {v: f.name, s: sLeft},
                             {v: rowPlanTotal, t: 'n', s: { ...sCFMoney, numFmt: "#,##0" }},
                             {v: q1, t: 'n', s: { ...sCFMoney, numFmt: "#,##0" }}, {v: q2, t: 'n', s: { ...sCFMoney, numFmt: "#,##0" }},
                             {v: q3, t: 'n', s: { ...sCFMoney, numFmt: "#,##0" }}, {v: q4, t: 'n', s: { ...sCFMoney, numFmt: "#,##0" }}
                         ]);
                     });

                     cRows.push([
                         { v: "รวม", s: sCFFoot }, "", { v: totalReceived, t: 'n', s: sCFFootMoney },
                         { v: totalQ1, t: 'n', s: sCFFootMoney }, { v: totalQ2, t: 'n', s: sCFFootMoney },
                         { v: totalQ3, t: 'n', s: sCFFootMoney }, { v: totalQ4, t: 'n', s: sCFFootMoney }
                     ]);
                     cMerges.push({ s: { r: cRows.length - 1, c: 0 }, e: { r: cRows.length - 1, c: 1 } });

                     let pQ1 = totalReceived > 0 ? Math.round((totalQ1 / totalReceived) * 100) : 0;
                     let pQ2 = totalReceived > 0 ? Math.round((totalQ2 / totalReceived) * 100) : 0;
                     let pQ3 = totalReceived > 0 ? Math.round((totalQ3 / totalReceived) * 100) : 0;
                     let pQ4 = totalReceived > 0 ? Math.round((totalQ4 / totalReceived) * 100) : 0;

                     cRows.push([
                         { v: "ร้อยละ", s: sCFFoot }, "", { v: 100, t: 'n', s: sCFFoot },
                         { v: pQ1, t: 'n', s: sCFFoot }, { v: pQ2, t: 'n', s: sCFFoot },
                         { v: pQ3, t: 'n', s: sCFFoot }, { v: pQ4, t: 'n', s: sCFFoot }
                     ]);
                     cMerges.push({ s: { r: cRows.length - 1, c: 0 }, e: { r: cRows.length - 1, c: 1 } });

                     const ws4 = XLSX.utils.aoa_to_sheet(cRows);
                     ws4['!merges'] = cMerges; 
                     ws4['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
                     XLSX.utils.book_append_sheet(wb, ws4, "2.แผนการใช้จ่ายงบประมาณ");

                     // 🌟 ดาวน์โหลดไฟล์ Excel ออกมา! 🌟
                     XLSX.writeFile(wb, `รายงานสรุปแผนปฏิบัติการ_ปี25${targetYear}_${new Date().getTime()}.xlsx`);
                     Swal.close();

                   } catch (err) {
                     Swal.fire('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', err.message, 'error');
                   }
                });
            })
            .withFailureHandler(err => Swal.fire('ผิดพลาดในการดึงข้อมูลไตรมาส', err.message, 'error'))
            .getDashboardData(targetYear);
      })
      .withFailureHandler(err => Swal.fire('ผิดพลาดในการดึงข้อมูลโครงการ', err.message, 'error'))
      .getAllProjectsData(targetYear);
}

// ==============================================================
// 🌟 ฟังก์ชันสร้างหน้าต่างรายงานสรุปผู้บริหาร (Executive Summary) 
// [อัปเดต: มีเส้นขอบตาราง 100% + แบ่งระดับ แผนงาน>โครงการหลัก>ย่อย]
// ==============================================================
function generateCombinedReportWindow(data) {
    const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtPct = (n) => Number(n || 0).toFixed(2) + '%';

    // --- 1. ตารางที่ 1: สรุปรายจ่ายตามกลยุทธ์ ---
    let t1DevBody = data.table1Dev.map((r, i) => `<tr>
      <td style="text-align:center; border: 1px solid #000; padding: 6px;">${i + 1}</td>
      <td style="border: 1px solid #000; padding: 6px;">${r.name}</td>
      <td style="text-align:center; border: 1px solid #000; padding: 6px;">${r.count}</td>
      <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fmtMoney(r.budget)}</td>
      <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fmtPct(r.percent)}</td>
    </tr>`).join('');

    // --- 2. ฟังก์ชันสร้าง HTML ตาราง 4 กลุ่มบริหาร × แหล่งเงิน ---
    let sourceHeaders = data.fundingSources.map(s => `<th style="border: 1px solid #000; padding: 6px; background-color: #e8ecef;">${s}<br>(บาท)</th>`).join('');
    const renderDeptTableHtml = (title, tableObj, totalCount, totalBudget) => {
      let bodyHtml = tableObj.rows.map((r, i) => {
        let srcCells = data.fundingSources.map(s => `<td style="text-align:right; border: 1px solid #000; padding: 6px;">${fmtMoney(r.sourceAmts[s])}</td>`).join('');
        return `<tr>
          <td style="text-align:center; border: 1px solid #000; padding: 6px;">${i + 1}</td>
          <td style="border: 1px solid #000; padding: 6px;">${r.deptName}</td>
          <td style="text-align:center; border: 1px solid #000; padding: 6px;">${r.count}</td>
          ${srcCells}
          <td style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">${fmtMoney(r.totalBudget)}</td>
          <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fmtPct(r.percent)}</td>
        </tr>`;
      }).join('');

      let sumCells = data.fundingSources.map(s => `<td style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">${fmtMoney(tableObj.totalBySource[s])}</td>`).join('');
      let pctCells = data.fundingSources.map(s => {
        let pct = totalBudget > 0 ? (tableObj.totalBySource[s] / totalBudget) * 100 : 0;
        return `<td style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">${fmtPct(pct)}</td>`;
      }).join('');

      return `
        <h3 style="margin-top: 25px; color: #1f618d;">${title}</h3>
        <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="width:5%; border: 1px solid #000; padding: 6px; background-color: #e8ecef;">ที่</th>
              <th style="border: 1px solid #000; padding: 6px; background-color: #e8ecef;">กลุ่มบริหารงาน</th>
              <th style="width:10%; border: 1px solid #000; padding: 6px; background-color: #e8ecef;">จำนวนโครงการ</th>
              ${sourceHeaders}
              <th style="border: 1px solid #000; padding: 6px; background-color: #e8ecef;">รวมงบประมาณ (บาท)</th>
              <th style="border: 1px solid #000; padding: 6px; background-color: #e8ecef;">ร้อยละ (%)</th>
            </tr>
          </thead>
          <tbody>
            ${bodyHtml}
            <tr class="total-row" style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="2" style="text-align:center; border: 1px solid #000; padding: 6px;">รวมทั้งสิ้น</td>
              <td style="text-align:center; border: 1px solid #000; padding: 6px;">${totalCount}</td>
              ${sumCells}
              <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fmtMoney(totalBudget)}</td>
              <td style="text-align:right; border: 1px solid #000; padding: 6px;">${totalBudget > 0 ? '100.00%' : '0.00%'}</td>
            </tr>
            <tr class="total-row" style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="3" style="text-align:center; border: 1px solid #000; padding: 6px;">คิดเป็นร้อยละตามแหล่งงบประมาณ (%)</td>
              ${pctCells}
              <td colspan="2" style="text-align:right; border: 1px solid #000; padding: 6px;">${totalBudget > 0 ? '100.00%' : '0.00%'}</td>
            </tr>
          </tbody>
        </table>
      `;
    };

    const t2DevHtml = renderDeptTableHtml(`ตารางที่ 2.1 สรุปงบประมาณรายจ่ายจำแนกตามกลุ่มบริหารงานและแหล่งงบประมาณ (เฉพาะงบพัฒนาคุณภาพการศึกษา)`, data.table2Dev, data.devCount, data.devTotalBudget);
    const t2RoutineHtml = renderDeptTableHtml(`ตารางที่ 2.2 สรุปงบประมาณรายจ่ายจำแนกตามกลุ่มบริหารงานและแหล่งงบประมาณ (เฉพาะงบบริหารจัดการ / รายจ่ายประจำ)`, data.table2Routine, data.routineCount, data.routineTotalBudget);
    const t2AllHtml = renderDeptTableHtml(`ตารางที่ 2.3 สรุปภาพรวมงบประมาณรายจ่ายทั้งหมดของสถานศึกษา (งบพัฒนาคุณภาพ + งบบริหารจัดการ)`, data.table2All, data.grandTotalCount, data.grandTotalBudget);


    // ==============================================================
    // 🌟 3. ระบบวาดตารางส่วนที่ 3 (แผนงาน) และ 5 (กลุ่มงาน) (เพิ่มขอบตาราง)
    // ==============================================================
    const buildProjectTable = (title, groups, groupKey, subGroupKey) => {
        if (!groups || groups.length === 0) return "";
        let tHtml = `
        <div class="page-break"></div>
        <h2 style="margin-top:30px;">${title}</h2>
        <table border="1" style="width:100%; border-collapse: collapse; margin-top:15px; font-size:14pt;">
            <thead>
                <tr style="background-color: #8e44ad !important; -webkit-print-color-adjust: exact; color: white; text-align: center;">
                    <th style="border: 1px solid #000; padding: 10px; width: 5%; color: white;">ที่</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 35%; color: white;">งาน/โครงการ/กิจกรรม</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 12%; color: white;">แหล่งงบประมาณ</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 12%; color: white;">งบประมาณ</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 12%; color: white;">รวมทั้งสิ้น</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 12%; color: white;">ผู้รับผิดชอบ</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 12%; color: white;">ระยะเวลาดำเนินงาน</th>
                </tr>
            </thead>
            <tbody>`;

        groups.forEach((g, gIdx) => {
            let mainGroupText = groupKey === 'strategyName' ? `แผนงาน: ${g[groupKey]}` : g[groupKey];
            tHtml += `<tr style="background-color: #f1e0f5 !important; -webkit-print-color-adjust: exact; font-weight: bold;">
                        <td colspan="7" style="border: 1px solid #000; padding: 8px 10px; font-size: 15pt; color: #4a235a;">${mainGroupText}</td>
                      </tr>`;
            
            // 🌟 🌟 🌟 จัดกลุ่ม แผนงาน > โครงการหลัก > กิจกรรม (สำหรับส่วนที่ 3) 🌟 🌟 🌟
            if (groupKey === 'strategyName') {
                let mpMap = {};
                (g.projects || []).forEach(p => {
                    // ดึงชื่อโครงการหลัก ถ้าไม่มีจะแสดงรหัสแทน
                    let mpName = p.mpName || p.masterPlanName || p.mpId || 'ไม่ระบุโครงการหลัก (รออัปเดตข้อมูล)';
                    if (!mpMap[mpName]) mpMap[mpName] = [];
                    mpMap[mpName].push(p);
                });

                for (let mpName in mpMap) {
                    tHtml += `<tr style="background-color: #fdf2e9 !important; -webkit-print-color-adjust: exact; font-weight: bold;">
                                <td style="text-align:center; padding: 8px; border: 1px solid #000;"></td>
                                <td colspan="6" style="padding: 8px; border: 1px solid #000; color: #d35400;">โครงการหลัก: ${mpName}</td>
                              </tr>`;
                    let pCounter = 1;
                    mpMap[mpName].forEach(p => {
                        let sources = [], amounts = [], budget = 0;
                        if (p.fundBreakdown) {
                            sources = Object.keys(p.fundBreakdown);
                            amounts = sources.map(s => p.fundBreakdown[s]);
                            budget = p.budget || p.total || 0;
                        } else if (p.sources && p.amounts) {
                            sources = p.sources;
                            amounts = p.amounts;
                            budget = p.total || p.budget || 0;
                        }
                        let srcHtml = sources.map(s => s.replace('เงิน','')).join('<br>');
                        let amtHtml = amounts.map(a => Number(a).toLocaleString()).join('<br>');
                        tHtml += `<tr>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${pCounter++}</td>
                            <td style="border: 1px solid #000; padding:8px;">${p.name}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${srcHtml}</td>
                            <td style="text-align:right; border: 1px solid #000; padding:8px;">${amtHtml}</td>
                            <td style="text-align:right; border: 1px solid #000; padding:8px; font-weight:bold;">${Number(budget).toLocaleString()}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.ownerName || p.owner || '-'}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.period || '-'}</td>
                        </tr>`;
                    });
                }
            } 
            // 🌟 สำหรับส่วนที่ 5 (กลุ่มงาน > งาน > โครงการย่อย)
            else if (subGroupKey && g[subGroupKey]) {
                let secCounter = 1;
                g[subGroupKey].forEach(sec => {
                    tHtml += `<tr style="background-color: #fcf4ff !important; -webkit-print-color-adjust: exact; font-weight: bold;">
                                <td style="text-align:center; padding: 8px; border: 1px solid #000;">(${secCounter})</td>
                                <td colspan="6" style="padding: 8px; border: 1px solid #000; color: #8e44ad;">งาน: ${sec.secName}</td>
                              </tr>`;
                    let pCounter = 1;
                    sec.projects.forEach(p => {
                        let srcHtml = p.sources.map(s => s.replace('เงิน','')).join('<br>');
                        let amtHtml = p.amounts.map(a => Number(a).toLocaleString()).join('<br>');
                        tHtml += `<tr>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${pCounter++}</td>
                            <td style="border: 1px solid #000; padding:8px;">${p.name}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${srcHtml}</td>
                            <td style="text-align:right; border: 1px solid #000; padding:8px;">${amtHtml}</td>
                            <td style="text-align:right; border: 1px solid #000; padding:8px; font-weight:bold;">${Number(p.total).toLocaleString()}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.owner || '-'}</td>
                            <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.period || '-'}</td>
                        </tr>`;
                    });
                    secCounter++;
                });
            } 
            // 🌟 กรณีอื่นๆ
            else {
                let pCounter = 1;
                g.projects.forEach(p => {
                    let sources = Object.keys(p.fundBreakdown || {});
                    let srcHtml = sources.map(s => s.replace('เงิน','')).join('<br>');
                    let amtHtml = sources.map(s => Number(p.fundBreakdown[s]).toLocaleString()).join('<br>');
                    tHtml += `<tr>
                        <td style="text-align:center; border: 1px solid #000; padding:8px;">${pCounter++}</td>
                        <td style="border: 1px solid #000; padding:8px;">${p.name}</td>
                        <td style="text-align:center; border: 1px solid #000; padding:8px;">${srcHtml}</td>
                        <td style="text-align:right; border: 1px solid #000; padding:8px;">${amtHtml}</td>
                        <td style="text-align:right; border: 1px solid #000; padding:8px; font-weight:bold;">${Number(p.budget).toLocaleString()}</td>
                        <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.ownerName || '-'}</td>
                        <td style="text-align:center; border: 1px solid #000; padding:8px;">${p.period || '-'}</td>
                    </tr>`;
                });
            }
        });
        tHtml += `</tbody></table>`;
        return tHtml;
    };


    // ==============================================================
    // 🌟 4. ระบบวาดตารางส่วนที่ 4 (QA) แบบใหม่ (ตัดงบประมาณออก ป้องกันยอดซ้ำซ้อน)
    // ==============================================================
    const buildQATablePart4 = (title, groups) => {
        if (!groups || groups.length === 0) return "";
        let tHtml = `
        <div class="page-break"></div>
        <h2 style="margin-top:30px;">${title}</h2>
        <table border="1" style="width:100%; border-collapse: collapse; margin-top:15px; font-size:14pt;">
            <thead>
                <tr style="background-color: #27ae60 !important; -webkit-print-color-adjust: exact; color: white; text-align: center;">
                    <th style="border: 1px solid #000; padding: 10px; width: 40%; color: white;">มาตรฐานการศึกษา / ประเด็นพิจารณา</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 10%; color: white;">จำนวนโครงการ</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 50%; color: white;">โครงการ / กิจกรรมที่ตอบสนอง</th>
                </tr>
            </thead>
            <tbody>`;

        groups.forEach((g) => {
            let projListStr = "";
            if (g.projects && g.projects.length > 0) {
                projListStr = g.projects.map((p, i) => `<div style="margin-bottom:6px; text-align:left; line-height:1.4;">${i + 1}. <b>[${p.id || '-'}]</b> ${p.name} <br><span style="font-size:12pt; color:#555;">(ผู้รับผิดชอบ: ${p.ownerName || '-'})</span></div>`).join('');
            } else {
                projListStr = `<div style="text-align:center; color:#c0392b; font-style:italic;">- ไม่มีโครงการรองรับ -</div>`;
            }

            tHtml += `
            <tr style="vertical-align:top;">
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; background-color: #f9fbfc !important; -webkit-print-color-adjust: exact;">${g.qaName || g.name}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 10px; font-weight: bold;">${g.projects ? g.projects.length : 0}</td>
                <td style="border: 1px solid #000; padding: 10px;">${projListStr}</td>
            </tr>`;
        });
        
        tHtml += `</tbody></table>`;
        return tHtml;
    };

    // --- ประกอบร่าง HTML รวม ---
    let extHtmlPart3 = buildProjectTable(`ส่วนที่ 3 สรุปโครงการจำแนกตามกลยุทธ์/แผนงาน ประจำปีงบประมาณ ${data.fiscalYear}`, data.table3Data, 'strategyName');
    let extHtmlPart4 = buildQATablePart4(`ส่วนที่ 4 สรุปความสอดคล้องของโครงการจำแนกตามมาตรฐานการศึกษา ประจำปีงบประมาณ ${data.fiscalYear}`, data.table4Data);
    let extHtmlPart5 = buildProjectTable(`ส่วนที่ 5 สรุปโครงการจำแนกตามกลุ่มบริหารงานและงาน ประจำปีงบประมาณ ${data.fiscalYear}`, data.table5Data, 'deptName', 'sections');

    const reportWin = window.open('', '_blank', 'width=1250,height=900');
    const fullHtml = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>บทสรุปผู้บริหาร แผนปฏิบัติการประจำปี ${data.fiscalYear}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 12mm 15mm; }
        body { font-family: 'Sarabun', sans-serif; font-size: 13pt; color: #000; margin: 0; padding: 20px; }
        h2 { text-align: center; font-size: 16pt; margin: 10px 0 15px 0; }
        h3 { font-size: 14pt; margin: 18px 0 8px 0; color: #1f618d; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 5px 8px; font-size: 12pt; vertical-align: middle; }
        th { background-color: #e8ecef !important; -webkit-print-color-adjust: exact; font-weight: bold; text-align: center; }
        .total-row { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        .page-break { page-break-before: always; }
        .toolbar { background: #2c3e50; color: #fff; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn { border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: 'Sarabun'; font-weight: bold; font-size: 14px; color: white; margin-left: 8px; }
        @media print { body { padding: 0; } .toolbar { display: none !important; } }
      </style></head><body>
      <div class="toolbar">
        <div>📊 <b>บทสรุปผู้บริหาร (Executive Summary) แผนปฏิบัติการประจำปี ${data.fiscalYear}</b></div>
        <div>
          <button class="btn" style="background:#27ae60;" onclick="exportAllToExcel()">📥 ดาวน์โหลดเป็น Excel (.xls)</button>
          <button class="btn" style="background:#e74c3c;" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
        </div>
      </div>

      <div id="export-content">
        <!-- ส่วนที่ 1: สรุปตามกลยุทธ์ -->
        <h2>ส่วนที่ 1: ตารางสรุปงบประมาณรายจ่ายจำแนกตามกลยุทธ์ของสถานศึกษา ประจำปีงบประมาณ ${data.fiscalYear}</h2>
        <h3>1.1 งบพัฒนาคุณภาพการศึกษา (คำนวณสัดส่วนร้อยละตามกลยุทธ์ของสถานศึกษา)</h3>
        <table border="1" style="border-collapse: collapse;">
          <thead><tr><th style="width:7%; border: 1px solid #000;">ที่</th><th style="border: 1px solid #000;">กลยุทธ์ของสถานศึกษา (งบพัฒนาคุณภาพ)</th><th style="width:15%; border: 1px solid #000;">จำนวนโครงการ</th><th style="width:20%; border: 1px solid #000;">งบประมาณ (บาท)</th><th style="width:15%; border: 1px solid #000;">คิดเป็นร้อยละ (%)</th></tr></thead>
          <tbody>
            ${t1DevBody}
            <tr class="total-row"><td colspan="2" style="text-align:center; border: 1px solid #000; padding:6px;">รวมงบพัฒนาคุณภาพการศึกษา</td><td style="text-align:center; border: 1px solid #000; padding:6px;">${data.devCount}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtMoney(data.devTotalBudget)}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">100.00%</td></tr>
          </tbody>
        </table>

        <h3>1.2 สรุปสัดส่วนงบประมาณภาพรวมของสถานศึกษา (งบพัฒนาคุณภาพ และ งบบริหารจัดการ/รายจ่ายประจำ)</h3>
        <table border="1" style="border-collapse: collapse;">
          <thead><tr><th style="width:7%; border: 1px solid #000;">ที่</th><th style="border: 1px solid #000;">ประเภทงบประมาณของสถานศึกษา</th><th style="width:15%; border: 1px solid #000;">จำนวนโครงการ</th><th style="width:20%; border: 1px solid #000;">งบประมาณ (บาท)</th><th style="width:15%; border: 1px solid #000;">สัดส่วนภาพรวม (%)</th></tr></thead>
          <tbody>
            <tr><td style="text-align:center; border: 1px solid #000; padding:6px;">1</td><td style="border: 1px solid #000; padding:6px;">งบพัฒนาคุณภาพการศึกษา (โครงการตามกลยุทธ์)</td><td style="text-align:center; border: 1px solid #000; padding:6px;">${data.devCount}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtMoney(data.devTotalBudget)}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtPct(data.grandTotalBudget > 0 ? (data.devTotalBudget / data.grandTotalBudget) * 100 : 0)}</td></tr>
            <tr><td style="text-align:center; border: 1px solid #000; padding:6px;">2</td><td style="border: 1px solid #000; padding:6px;">งบบริหารจัดการ / รายจ่ายประจำและสาธารณูปโภค</td><td style="text-align:center; border: 1px solid #000; padding:6px;">${data.routineCount}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtMoney(data.routineTotalBudget)}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtPct(data.grandTotalBudget > 0 ? (data.routineTotalBudget / data.grandTotalBudget) * 100 : 0)}</td></tr>
            <tr class="total-row"><td colspan="2" style="text-align:center; border: 1px solid #000; padding:6px;">รวมงบประมาณรายจ่ายทั้งสิ้น</td><td style="text-align:center; border: 1px solid #000; padding:6px;">${data.grandTotalCount}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">${fmtMoney(data.grandTotalBudget)}</td><td style="text-align:right; border: 1px solid #000; padding:6px;">100.00%</td></tr>
          </tbody>
        </table>

        <!-- ส่วนที่ 2 -->
        <div class="page-break"></div>
        <h2>ส่วนที่ 2: ตารางสรุปงบประมาณรายจ่ายจำแนกตาม 4 กลุ่มบริหารงานและแหล่งงบประมาณ ประจำปีงบประมาณ ${data.fiscalYear}</h2>
        ${t2DevHtml}
        ${t2RoutineHtml}
        ${t2AllHtml}

        <!-- 🌟 ส่วนที่ 3, 4, 5 (รูปแบบใหม่ A4) -->
        ${extHtmlPart3}
        ${extHtmlPart4}
        ${extHtmlPart5}

      </div>

      <scr` + `ipt>
        function exportAllToExcel() {
          const content = document.getElementById('export-content').innerHTML;
          const excelHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>' + content + '</body></html>';
          const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'บทสรุปผู้บริหาร_แผนปฏิบัติการ_ปี${data.fiscalYear}.xls';
          a.click();
        }
      </scr` + `ipt>
      </body></html>`;
    
    reportWin.document.open();
    reportWin.document.write(fullHtml);
    reportWin.document.close();
}


function executePrintDisbursement(data) {
    let printWindow = window.open('', '_blank', 'width=850,height=900');
    
    let itemsHtml = '';
    let sumTotal = 0;
    if (data.items && data.items.length > 0) {
        data.items.forEach((it, index) => {
            let lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
            sumTotal += lineTotal;
            itemsHtml += `<tr>
            <td style="border:1px solid #000; padding:6px; text-align:center;">${index+1}</td>
            <td style="border:1px solid #000; padding:6px;">${it.name}</td>
            <td style="border:1px solid #000; padding:6px; text-align:center;">${it.qty}</td>
            <td style="border:1px solid #000; padding:6px; text-align:center;">${it.unit}</td>
            <td style="border:1px solid #000; padding:6px; text-align:right;">${Number(it.price).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
            <td style="border:1px solid #000; padding:6px; text-align:right;">${lineTotal.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
            </tr>`;
        });
    }

    let allocated = Number(data.budgetReceived) || 0;
    let reqAmount = Number(data.total) || sumTotal;
    let usedBefore = Number(data.totalUsedInBudget) || 0; 
    let remainingBefore = allocated - usedBefore;
    let remainingAfter = remainingBefore - reqAmount;

    let projectSection = data.projectSection || ".......................................................";
    let actionType = data.actionType || "จัดซื้อ/จัดจ้าง";
    let itemCat = data.itemCategory || "วัสดุ/ครุภัณฑ์";
    let objective = data.objective || ".......................................................";
    let fundingSource = data.fundingSource || ".......................................................";

    let docHtml = `
    <html>
    <head>
        <title>แบบ ผง. 2 - ${data.reqId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <style>
        body { font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif; padding: 20px 40px; color: #000; font-size: 16pt; line-height: 1.2; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .indent { text-indent: 40px; }
        table { width: 100%; border-collapse: collapse; font-size: 14pt; margin-top: 10px; }
        .full-box { border: 1px solid #000; padding: 10px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div style="position:absolute; top:20px; right:40px; font-weight:bold; font-size:14pt;">แบบ ผง. 2</div>
        <h2 class="center" style="font-size: 22pt; margin-bottom: 5px;">บันทึกข้อความ</h2>
        
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <div><b>ส่วนราชการ</b> โรงเรียนโสภณศิริราษฎร์</div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <div><b>ที่</b> .....................................................</div>
            <div><b>วันที่</b> ${data.timestamp || '..............................'}</div>
        </div>
        <div style="margin-bottom: 5px;"><b>เรื่อง</b> ขออนุมัติงบประมาณตามแผนปฏิบัติการ</div>
        <div style="margin-bottom: 15px;"><b>เรียน</b> ผู้อำนวยการโรงเรียนโสภณศิริราษฎร์</div>
        
        <div class="indent" style="text-align: justify; margin-bottom: 10px;">
            ด้วย <b>${projectSection}</b> มีความประสงค์ขอดำเนินการ <b>${actionType} ${itemCat}</b> เพื่อ <b>${objective}</b> ตามโครงการ <b>${data.projectName}</b> 
            ซึ่งได้รับจัดสรรงบประมาณตามแผนปฏิบัติการ และมีความจำเป็นเร่งด่วน จึงขออนุมัติงบประมาณ จำนวน <b>${reqAmount.toLocaleString('en-US', {minimumFractionDigits:2})}</b> บาท 
            <b>(${ThaiBahtText(reqAmount)})</b> รายละเอียดรายการดังแนบ
        </div>
        
        <div class="indent" style="margin-bottom: 20px;">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>
        
        <div style="text-align: right; margin-bottom: 20px;">
            (ลงชื่อ) .................................................... ผู้ขออนุมัติ<br>
            ( ${data.requesterName} )<br>
        </div>

        <!-- ตารางลายเซ็น 2 คอลัมน์ -->
        <table style="border: none; margin: 0; padding: 0;">
        <tr>
            <td style="width: 50%; border: 1px solid #000; padding: 10px; vertical-align: top;">
                <b>ความเห็นหัวหน้างานแผนงานโรงเรียน</b><br>
                [ / ] มีในแผนปฏิบัติการ &nbsp;&nbsp; [  ] ไม่มีในแผนปฏิบัติการ<br>
                [  ] ขออนุมัติใช้งบอำนวยการ<br><br>
                <b>แหล่งงบประมาณ:</b> ${fundingSource}<br><br>
                <table style="border:none; font-size:13pt; line-height:1;">
                <tr><td>งบประมาณทั้งสิ้น</td><td style="text-align:right;">${allocated.toLocaleString('en-US', {minimumFractionDigits:2})} บาท</td></tr>
                <tr><td>อนุมัติไปแล้ว</td><td style="text-align:right;">${usedBefore.toLocaleString('en-US', {minimumFractionDigits:2})} บาท</td></tr>
                <tr><td>ขออนุมัติครั้งนี้</td><td style="text-align:right; font-weight:bold;">${reqAmount.toLocaleString('en-US', {minimumFractionDigits:2})} บาท</td></tr>
                <tr><td>คงเหลือ</td><td style="text-align:right;">${remainingAfter.toLocaleString('en-US', {minimumFractionDigits:2})} บาท</td></tr>
                </table>
                <br>
                <div class="center">
                ลงชื่อ ....................................................<br>
                ( นายรัตนปกรณ์ ธนันทา )<br>
                ....... / ....... / .......
                </div>
            </td>
            
            <td style="width: 50%; padding: 0; vertical-align: top;">
                <div style="border: 1px solid #000; border-left: none; padding: 10px; height: 100%;">
                <b>ความเห็นหัวหน้ากลุ่มบริหารงานงบประมาณ</b><br>
                [ / ] เห็นควรให้ดำเนินการ<br>
                [  ] ไม่เห็นควรให้ดำเนินการ เพราะ ..........................<br><br>
                <div class="center">
                    ลงชื่อ ....................................................<br>
                    ( น.ส.วรัญชลี นรินทร์ )<br>
                    ....... / ....... / .......
                </div>
                </div>
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; border-top: none; padding: 10px; vertical-align: top;">
                <b>ความเห็นหัวหน้างานพัสดุ</b><br>
                [ / ] เห็นควรให้ดำเนินการได้ตามระเบียบ<br>
                [  ] ไม่เห็นควรให้ดำเนินการ เพราะ ..........................<br><br>
                <div class="center">
                ลงชื่อ ....................................................<br>
                ( นางสาวพนาวรรณ อุดมโภชน์ )<br>
                ....... / ....... / .......
                </div>
            </td>
            <td style="border: 1px solid #000; border-top: none; border-left: none; padding: 10px; vertical-align: top;">
                <b>ความเห็นรองผู้อำนวยการโรงเรียน</b><br>
                [ / ] เห็นควรอนุมัติ<br>
                [  ] ไม่เห็นควรอนุมัติ เพราะ ..........................<br><br>
                <div class="center">
                ลงชื่อ ....................................................<br>
                ( นายธนวันต์ เข็มทอง )<br>
                ....... / ....... / .......
                </div>
            </td>
        </tr>
        </table>

        <div class="full-box">
            <b>ความเห็นผู้อำนวยการโรงเรียน</b><br>
            [ / ] อนุมัติ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [  ] ไม่อนุมัติ เพราะ .....................................................................................<br><br>
            <div class="center" style="margin-top: 10px;">
            ลงชื่อ ....................................................<br>
            ( นางปิยนุช โรจนกุล )<br>
            ผู้อำนวยการโรงเรียนโสภณศิริราษฎร์<br>
            ....... / ....... / .......
            </div>
        </div>

        <div style="page-break-before: always;"></div>
        <h3 class="center bold" style="margin-bottom:15px; margin-top:20px;">รายละเอียดแนบท้ายรายงานขออนุมัติจัดซื้อ/จัดจ้าง</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13pt;">
        <thead>
            <tr style="background:#f0f0f0;">
            <th style="border:1px solid #000; padding:6px; width:8%;">ที่</th>
            <th style="border:1px solid #000; padding:6px; width:38%;">รายการ</th>
            <th style="border:1px solid #000; padding:6px; width:12%;">จำนวนหน่วย</th>
            <th style="border:1px solid #000; padding:6px; width:12%;">หน่วยนับ</th>
            <th style="border:1px solid #000; padding:6px; width:15%;">ราคามาตรฐาน<br>หรือราคากลาง</th>
            <th style="border:1px solid #000; padding:6px; width:15%;">จำนวนเงินที่<br>ขอซื้อ/จ้าง</th>
            </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
            <tr>
            <td colspan="5" style="border:1px solid #000; padding:8px; text-align:right; font-weight:bold;">
                ( ${ThaiBahtText(reqAmount)} ) รวมเป็นเงินทั้งสิ้น
            </td>
            <td style="border:1px solid #000; padding:8px; text-align:right; font-weight:bold;">${reqAmount.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
            </tr>
        </tfoot>
        </table>

        <div style="margin-top: 20px;">
        <p style="margin: 0 0 5px 0; font-weight: bold;">โดยเสนอรายชื่อกรรมการตรวจรับพัสดุ ดังนี้</p>
        <p style="margin: 5px 0 5px 30px;">1. ${data.comm1 || "....................................................... "} ประธานกรรมการ</p>
        <p style="margin: 5px 0 5px 30px;">2. ${data.comm2 || "....................................................... "} กรรมการ</p>
        <p style="margin: 5px 0 5px 30px;">3. ${data.comm3 || "....................................................... "} กรรมการ</p>
        </div>
        
        <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
        };
        <\/script>
    </body>
    </html>
    `;
    
    printWindow.document.write(docHtml);
    printWindow.document.close();
}
// ==========================================
// 🌟 โหลดข้อมูลทะเบียนใบขอเบิกที่อนุมัติแล้ว (พัสดุ/การเงิน)
// ==========================================
function loadApprovedDisbursements() {
    const tbody = document.getElementById('approved-disb-tbody');
    const section = document.getElementById('section-approved-disbursements');
    if (!tbody || !section) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>';
    
    // ดึงปีงบประมาณที่เลือกไว้จาก Dropdown
    const selectedYear = document.getElementById('fiscal-year-select') ? document.getElementById('fiscal-year-select').value : 'all';

    google.script.run
    .withSuccessHandler(function(res) {
        if (!res.success) {
            // ถ้าไม่มีสิทธิ์ดู ให้ซ่อนกล่องนี้ไปเลย
            section.style.display = 'none';
            return;
        }

        // มีสิทธิ์ดู ให้แสดงกล่อง
        section.style.display = 'block';

        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d; padding: 20px;">ไม่มีรายการขอเบิกจ่ายที่อนุมัติแล้ว</td></tr>';
            return;
        }

        let html = '';
        res.data.forEach(item => {
            html += `
            <tr style="border-bottom: 1px solid #ecf0f1;">
                <td style="padding: 12px; color: #2980b9; font-weight: bold;">${item.reqId}</td>
                <td style="padding: 12px;"><b>[${item.projectId}]</b><br>${item.projectName}</td>
                <td style="padding: 12px;">${item.requester}</td>
                <td style="padding: 12px; text-align: right; color: #d35400; font-weight: bold;">${Number(item.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td style="padding: 12px; text-align: center; font-size: 0.9rem;">${item.timestamp}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="printDisbursementDocument('${item.reqId}')" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;" title="พิมพ์เอกสาร ผง.2">
                        <i class="fas fa-print"></i> พิมพ์ ผง.2
                    </button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    })
    .withFailureHandler(function(err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">โหลดข้อมูลล้มเหลว: ${err.message}</td></tr>`;
    })
    .getApprovedDisbursements(selectedYear);
}


// ==========================================
// 🌟 สคริปต์ควบคุมแชท น้องแผนดี
// ==========================================
function togglePhaenDeeChat() {
  const box = document.getElementById('phaendee-chat-box');
  const btn = document.getElementById('phaendee-btn');
  if (box.style.display === 'none') {
    box.style.display = 'flex';
    btn.style.transform = 'scale(0.9)';
  } else {
    box.style.display = 'none';
    btn.style.transform = 'scale(1)';
  }
}

function sendToPhaenDee() {
  const input = document.getElementById('phaendee-input');
  const message = input.value.trim();
  if (!message) return;

  const msgContainer = document.getElementById('phaendee-messages');
  const phaenDeeImgUrl = "https://raw.githubusercontent.com/rthanantha-beep/school-assets/refs/heads/main/chathead.png";
  
  // 1. วาดข้อความฝั่งผู้ใช้ (คุณครู)
  msgContainer.innerHTML += `
    <div style="align-self:flex-end; background:#8e44ad; color:white; padding:10px 15px; border-radius:15px 15px 0 15px; max-width:80%; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
      ${message}
    </div>
  `;
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;
  
  // 2. วาดไอคอน Loading
  const typingId = "typing-" + Date.now();
  msgContainer.innerHTML += `
    <div id="${typingId}" style="display:flex; gap:10px; align-items:flex-end; align-self:flex-start;">
      <img src="${phaenDeeImgUrl}" style="width:40px; height:40px; object-fit:contain; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
      <div style="background:white; border:1px solid #e0e6ed; color:#7f8c8d; padding:10px 15px; border-radius:15px 15px 15px 0; font-size:0.85rem; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <i class="fas fa-spinner fa-spin"></i> น้องแผนดีกำลังคิด...
      </div>
    </div>
  `;
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // 3. ส่งข้อมูลไปหา AI หลังบ้าน
  google.script.run
    .withSuccessHandler(res => {
      const typingEl = document.getElementById(typingId);
      if(typingEl) typingEl.remove();
      
      let formattedReply = res.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      
      msgContainer.innerHTML += `
        <div style="display:flex; gap:10px; align-items:flex-end; align-self:flex-start;">
          <img src="${phaenDeeImgUrl}" style="width:40px; height:40px; object-fit:contain; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
          <div style="background:white; border:1px solid #e0e6ed; color:#2c3e50; padding:12px 15px; border-radius:15px 15px 15px 0; max-width:85%; line-height:1.5; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            ${formattedReply}
          </div>
        </div>
      `;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    })
    .withFailureHandler(err => {
      const typingEl = document.getElementById(typingId);
      if(typingEl) typingEl.remove();
      msgContainer.innerHTML += `<div style="align-self:flex-start; background:#fadbd8; color:#c0392b; padding:10px; border-radius:15px; font-size:0.85rem;">ระบบขัดข้อง: ${err.message}</div>`;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    })
    .chatWithNongPhaenDee(message);
}
// ==========================================
// 🌟 ฟังก์ชันดาวน์โหลด Excel สำหรับให้ AI จับคู่ (AI Mapping)
// ==========================================
function exportAIMappingExcel() {
    Swal.fire({
        title: 'กำลังสกัดข้อมูลจากเอกสาร...',
        text: 'ระบบกำลังเปิดอ่านไฟล์โครงการทั้งหมด อาจใช้เวลา 1-2 นาที โปรดรอสักครู่',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        customClass: { container: 'kanit-font' }
    });

    const ensureXLSXStyleLoaded = (callback) => {
        if (window.isXlsxStyleLoaded === true) {
            callback();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => { window.isXlsxStyleLoaded = true; callback(); };
            document.head.appendChild(script);
        }
    };

    let activeYear = typeof getDefaultYear === 'function' ? getDefaultYear() : "70";

    google.script.run
      .withSuccessHandler(function(data) {
          ensureXLSXStyleLoaded(() => {
              Swal.close();
              buildAIMappingWorkbook(data);
          });
      })
      .withFailureHandler(function(err) {
          Swal.close();
          Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      })
      .extractDataForAIMapping(activeYear);
}

function buildAIMappingWorkbook(data) {
    const wb = XLSX.utils.book_new();
    const fontName = "TH Sarabun New";
    
    const styleHeader = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "8E44AD" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleHeader2 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2980B9" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleHeader3 = { font: { name: fontName, sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "27AE60" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleCell = { font: { name: fontName, sz: 13 }, alignment: { vertical: "top", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    
    // ---- แท็บ 1: โครงการ ----
    let projRows = [
        [{ v: "รหัสโครงการ", s: styleHeader }, { v: "ชื่อโครงการ", s: styleHeader }, { v: "วัตถุประสงค์", s: styleHeader }, { v: "เป้าหมาย (คุณภาพ)", s: styleHeader }, { v: "เป้าหมาย (ปริมาณ)", s: styleHeader }]
    ];
    data.projects.forEach(p => {
        projRows.push([
            { v: p.id, s: { ...styleCell, alignment: { horizontal: "center", vertical: "top" } } },
            { v: p.name, s: styleCell },
            { v: p.objective, s: styleCell },
            { v: p.qualGoal, s: styleCell },
            { v: p.quanGoal, s: styleCell }
        ]);
    });
    const wsProj = XLSX.utils.aoa_to_sheet(projRows);
    wsProj['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsProj, "ข้อมูลโครงการ");

    // ---- แท็บ 2: โครงการหลัก (Master Plans) ----
    let mpRows = [
        [{ v: "รหัสโครงการหลัก (MP)", s: styleHeader2 }, { v: "ชื่อโครงการหลัก", s: styleHeader2 }, { v: "คำอธิบาย/รายละเอียด", s: styleHeader2 }]
    ];
    data.masterPlans.forEach(mp => {
        mpRows.push([
            { v: mp.id, s: { ...styleCell, alignment: { horizontal: "center", vertical: "top" } } },
            { v: mp.name, s: styleCell },
            { v: mp.desc, s: styleCell }
        ]);
    });
    const wsMp = XLSX.utils.aoa_to_sheet(mpRows);
    wsMp['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsMp, "โครงการหลัก (Master Plans)");

    // 🌟 ---- แท็บ 3: มาตรฐาน QA ----
    let qaRows = [
        [{ v: "รหัสตัวชี้วัด QA", s: styleHeader3 }, { v: "ชื่อตัวชี้วัด/มาตรฐานการศึกษา", s: styleHeader3 }]
    ];
    data.qaStandards.forEach(qa => {
        qaRows.push([
            { v: qa.id, s: { ...styleCell, alignment: { horizontal: "center", vertical: "top" } } },
            { v: qa.name, s: styleCell }
        ]);
    });
    const wsQa = XLSX.utils.aoa_to_sheet(qaRows);
    wsQa['!cols'] = [{ wch: 20 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsQa, "มาตรฐาน QA");

    XLSX.writeFile(wb, `ข้อมูลสำหรับ_AI_จับคู่โครงการและQA_${new Date().getTime()}.xlsx`);
}



function selectQAProject(pid) {
    qaCurrentSelectedId = pid;
    renderQAList(); // รีเฟรชฝั่งซ้ายเพื่อทำแถบสี
    
    let p = qaGlobalProjects.find(x => x.id === pid);
    if(!p) return;

    // ซ่อนกล่อง "รอเลือกโครงการ..." และแสดงคอลัมน์ กลาง+ขวา
    document.getElementById('qa-empty-doc').style.display = 'none';
    document.getElementById('qa-empty-std').style.display = 'none';
    document.getElementById('qa-detail-doc').style.display = 'flex';
    document.getElementById('qa-detail-std').style.display = 'flex';
    
    // ใส่ข้อมูลในคอลัมน์กลาง
    document.getElementById('qa-dt-id').innerText = p.id;
    document.getElementById('qa-dt-name').innerText = p.name;
    document.getElementById('qa-dt-dept').innerText = p.deptName || 'ไม่ระบุ';
    document.getElementById('qa-dt-docid').value = p.docId || ''; 

    // ดึงข้อมูล Checkbox ในคอลัมน์ขวา
    let chks = document.querySelectorAll('.qa-std-chk');
    let savedQA = (p.qaIds || "").split(',').map(x => x.trim());
    chks.forEach(chk => { chk.checked = savedQA.includes(chk.value); });

    // สั่งหุ่นยนต์ดึงข้อมูลเอกสารมาโชว์ที่คอลัมน์กลาง
    fetchDocSnippetForQA();
}

function fetchDocSnippetForQA() {
    let docId = document.getElementById('qa-dt-docid').value;
    let contentBox = document.getElementById('qa-doc-content');
    
    if(!docId) { 
        contentBox.innerHTML = '<span style="color:#e74c3c;"><i class="fas fa-exclamation-circle"></i> โครงการนี้ยังไม่มีไฟล์เอกสารอ้างอิงในระบบ</span>'; 
        return; 
    }

    contentBox.innerHTML = '<div style="color:#3498db; font-weight:bold;"><i class="fas fa-spinner fa-spin"></i> กำลังอ่านเอกสารเพื่อดึงข้อมูลที่มา วัตถุประสงค์ และเป้าหมาย...</div>';

    google.script.run
    .withSuccessHandler(function(text) {
        contentBox.innerHTML = text ? text : '<em style="color:#7f8c8d;">ไม่พบข้อมูลหัวข้อที่มา หรือเป้าหมายในเอกสาร</em>';
    })
    .withFailureHandler(function(err) {
        contentBox.innerHTML = `<span style="color:red;"><i class="fas fa-exclamation-triangle"></i> เกิดข้อผิดพลาดในการดึงเอกสาร: ${err.message}</span>`;
    })
    .getProjectDocSnippet(docId); 
}

function saveQAMapping() {
    let pid = document.getElementById('qa-dt-id').innerText;
    let chks = document.querySelectorAll('.qa-std-chk:checked');
    let selectedQA = Array.from(chks).map(c => c.value).join(', ');

    let btn = document.getElementById('btn-save-qa');
    let oldBtn = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    // สมมติว่ามีฟังก์ชันบันทึกข้อมูลอยู่แล้ว (อัปเดตลงคอลัมน์ QAStandardIDs ในชีต Projects)
    google.script.run
    .withSuccessHandler(function(res) {
        btn.innerHTML = oldBtn; btn.disabled = false;
        if(res.success) {
            Swal.fire({icon:'success', title:'บันทึกสำเร็จ', timer:1500, showConfirmButton:false});
            // อัปเดตข้อมูลใน RAM ฝั่งหน้าบ้าน
            let pIndex = qaGlobalProjects.findIndex(x => x.id === pid);
            if(pIndex > -1) qaGlobalProjects[pIndex].qaIds = selectedQA;
            renderQAList();
        } else {
            Swal.fire('เกิดข้อผิดพลาด', res.message, 'error');
        }
    })
    .withFailureHandler(function(err){
        btn.innerHTML = oldBtn; btn.disabled = false;
        Swal.fire('ระบบขัดข้อง', err.message, 'error');
    })
    .saveQAStandardMapping(pid, selectedQA);
}
// ==========================================
// 🌟 ฟังก์ชันส่งออกรายงาน QA แบบ Matrix (ไม่แสดงรหัสโครงการ ไม่แยกงานย่อย)
// ==========================================
function exportQASummaryReport(mode = 'excel') {
  if (!qaGlobalProjects || qaGlobalProjects.length === 0) {
    alert("ไม่พบข้อมูลโครงการ กรุณารอให้หน้าเว็บโหลดข้อมูลสักครู่ครับ");
    return;
  }

  const activeYear = typeof getDefaultYear === 'function' ? getDefaultYear() : "70";
  
  // เรียงโครงการตาม ProjectID เพื่อจัดกลุ่ม "กลุ่มบริหารงาน"
  const projList = [...qaGlobalProjects].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

  // ชุดรหัสตัวชี้วัดตามหัวตารางในภาพ (21 คอลัมน์)
  const qaKeys = [
    '1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5', '1.1.6', 
    '1.2.1', '1.2.2', '1.2.3', '1.2.4', 
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', 
    '3.1', '3.2', '3.3', '3.4', '3.5'
  ];

  // 🌟 สร้างตัวแปรอาร์เรย์สำหรับเก็บยอดรวมของแต่ละมาตรฐาน (เริ่มต้นที่ 0 ทุกช่อง)
  let qaCounts = new Array(qaKeys.length).fill(0);

  let rowsHtml = '';
  let currentDept = null;
  let runningNum = 1;

  projList.forEach(p => {
    // แยกรหัสโครงการ e.g. "70-01-05-01" -> 01=Dept (กลุ่มงาน)
    let parts = String(p.id).split('-');
    let deptCode = parts.length >= 2 ? parts[1] : '';
    let deptName = p.deptName || `กลุ่มบริหารงานรหัส ${deptCode}`;

    // 1. วาดแถวคั่น "กลุ่มบริหารงาน"
    if (currentDept !== deptCode) {
        rowsHtml += `
          <tr style="background-color: #d4e6f1; font-weight: bold;">
            <td colspan="23" style="text-align: left; padding: 6px 10px; font-size: 14pt;">กลุ่มบริหารงาน: ${deptName}</td>
          </tr>
        `;
        currentDept = deptCode;
    }

    // 2. วาดแถว "โครงการ" พร้อมติ๊กเครื่องหมายถูก (✓)
    let pQaIds = p.qaIds ? p.qaIds.split(',').map(s => s.trim()) : [];
    
    let checkCells = qaKeys.map((key, index) => {
        let isMatch = pQaIds.includes(key);
        if (isMatch) {
            // 🌟 ถ้าระบบเจอว่าโครงการนี้ตอบสนองมาตรฐานข้อไหน ให้บวก 1 เข้าไปในตะกร้านับยอดรวม
            qaCounts[index]++;
            return `<td style="text-align: center; vertical-align: middle;"><span style="color:#27ae60; font-size:16pt;">&#10003;</span></td>`;
        }
        return `<td style="text-align: center; vertical-align: middle;"></td>`;
    }).join('');

    rowsHtml += `
      <tr>
        <td style="text-align: center; vertical-align: middle;">${runningNum++}</td>
        <td style="text-align: left; vertical-align: middle; padding: 4px 8px;">${p.name}</td>
        ${checkCells}
      </tr>
    `;
  });

  // 🌟 3. วาดแถวสรุปรวม (Summary Row) นำไปต่อท้ายตาราง 🌟
  let summaryCells = qaCounts.map(count => {
    let displayCount = count > 0 ? count : '-';
    // ถ้าช่องไหนเป็น 0 จะโชว์ขีด (-) ถ้ามีตัวเลขจะโชว์เลขสีแดงเข้ม
    return `<td style="text-align: center; vertical-align: middle; font-weight: bold; color: #c0392b; font-size: 14pt;">${displayCount}</td>`;
  }).join('');

  rowsHtml += `
    <tr style="background-color: #fdf2e9; border-top: 2px solid #2c3e50;">
      <td colspan="2" style="text-align: right; padding: 6px 15px; font-weight: bold; font-size: 14pt; color: #2c3e50;">รวมจำนวนโครงการที่ตอบสนอง (โครงการ)</td>
      ${summaryCells}
    </tr>
  `;

  // ==========================================
  // ประกอบร่าง HTML โครงสร้างตาราง
  // ==========================================
  const reportHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>ตารางวิเคราะห์ความสอดคล้องตามมาตรฐาน QA</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'TH SarabunPSK', 'TH Sarabun New', sans-serif; font-size: 14pt; }
        th, td { border: 1px solid #000000; padding: 4px; }
        th { background-color: #9b59b6; color: white; text-align: center; font-weight: bold; vertical-align: middle; }
      </style>
    </head>
    <body>
      <h2 style="text-align: center; font-size: 18pt;">ตารางวิเคราะห์ความสอดคล้องของโครงการ/กิจกรรม กับมาตรฐานการศึกษาของสถานศึกษา</h2>
      <h3 style="text-align: center; font-size: 16pt;">ประจำปีงบประมาณ พ.ศ. 25${activeYear}</h3>
      <table>
        <thead>
          <tr>
            <th rowspan="3" style="width: 4%;">ที่</th>
            <th rowspan="3" style="width: 32%;">งาน/โครงการ/กิจกรรม</th>
            <th colspan="10">มฐ. 1</th>
            <th colspan="6">มฐ. 2</th>
            <th colspan="5">มฐ. 3</th>
          </tr>
          <tr>
            <th colspan="6">1.1</th>
            <th colspan="4">1.2</th>
            <th rowspan="2" style="width: 3%;">2.1</th>
            <th rowspan="2" style="width: 3%;">2.2</th>
            <th rowspan="2" style="width: 3%;">2.3</th>
            <th rowspan="2" style="width: 3%;">2.4</th>
            <th rowspan="2" style="width: 3%;">2.5</th>
            <th rowspan="2" style="width: 3%;">2.6</th>
            <th rowspan="2" style="width: 3%;">3.1</th>
            <th rowspan="2" style="width: 3%;">3.2</th>
            <th rowspan="2" style="width: 3%;">3.3</th>
            <th rowspan="2" style="width: 3%;">3.4</th>
            <th rowspan="2" style="width: 3%;">3.5</th>
          </tr>
          <tr>
            <th style="width: 3%;">1</th><th style="width: 3%;">2</th><th style="width: 3%;">3</th>
            <th style="width: 3%;">4</th><th style="width: 3%;">5</th><th style="width: 3%;">6</th>
            <th style="width: 3%;">1</th><th style="width: 3%;">2</th><th style="width: 3%;">3</th><th style="width: 3%;">4</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // บันทึกไฟล์ Excel
  const blob = new Blob(['\ufeff', reportHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QA_Mapping_Matrix_ปี25${activeYear}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// ==========================================
// 🌟 ฟังก์ชันสร้างตารางส่วนที่ 4 (QA) สำหรับเล่มรายงานสรุปแผนปฏิบัติการ
// ==========================================
function buildPart4QATableHtml(qaStandards, allProjects) {
  const sortedQA = [...(qaStandards || [])].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  const sortedProj = [...(allProjects || [])].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

  let tbody = '';
  sortedQA.forEach(q => {
    const matched = sortedProj.filter(p => {
      if (!p.qaIds) return false;
      return String(p.qaIds).split(',').map(s => s.trim()).includes(String(q.id).trim());
    });

    const dotCount = (String(q.id).match(/\./g) || []).length;
    let indent = '';
    let rowBg = dotCount === 0 ? 'background:#f2f4f4; font-weight:bold;' : '';
    if (dotCount === 1) indent = '&nbsp;&nbsp;&nbsp;├─ ';
    if (dotCount >= 2) indent = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ ';

    const projListStr = matched.length > 0
      ? matched.map((p, i) => `<div style="margin-bottom:3px;">${i + 1}. <b>[${p.id}]</b> ${p.name}</div>`).join('')
      : `<span style="color:#c0392b; font-style:italic;">- ไม่มีโครงการรองรับ -</span>`;

    tbody += `
      <tr style="${rowBg}">
        <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:bold; vertical-align:top;">${q.id}</td>
        <td style="border:1px solid #000; padding:6px; vertical-align:top;">${indent}${q.name}</td>
        <td style="border:1px solid #000; padding:6px; text-align:center; vertical-align:top;">${matched.length}</td>
        <td style="border:1px solid #000; padding:6px; vertical-align:top;">${projListStr}</td>
      </tr>`;
  });

  return `
    <div style="page-break-before: always;"></div>
    <h3 style="text-align:center; margin-bottom:10px; font-size:16pt; font-weight:bold;">
      ส่วนที่ 4 ความสอดคล้องของโครงการ/กิจกรรม ตามมาตรฐานการศึกษาของสถานศึกษา
    </h3>
    <table style="width:100%; border-collapse:collapse; font-size:14pt;">
      <thead>
        <tr style="background:#e8ecef;">
          <th style="border:1px solid #000; padding:8px; width:12%; text-align:center;">รหัส</th>
          <th style="border:1px solid #000; padding:8px; width:38%; text-align:center;">มาตรฐานการศึกษา / ประเด็นพิจารณา</th>
          <th style="border:1px solid #000; padding:8px; width:10%; text-align:center;">จำนวน<br>(โครงการ)</th>
          <th style="border:1px solid #000; padding:8px; width:40%; text-align:center;">โครงการ / กิจกรรมที่ตอบสนอง</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>`;
}
function executeReminders() {
   Swal.fire({
      title: 'เลือกด่านที่ต้องการทวงงาน',
      html: `
        <div style="text-align: left; font-size: 1.05rem; padding: 10px; font-family: 'Kanit';">
            <p style="color: #7f8c8d; font-size: 0.95rem; margin-top: 0; line-height: 1.4;">
                ระบุแผนก/บุคคล ที่ต้องการให้ระบบสแกนงานที่ค้างอยู่ แล้วมัดรวมสรุปยอดส่งไปแจ้งเตือนใน LINE ครับ
            </p>
            <div style="background: #fdf2e9; border: 1px solid #f5b041; padding: 15px; border-radius: 8px;">
                <label style="display: block; margin-bottom: 8px; cursor: pointer; color: #2c3e50;">
                    <input type="checkbox" id="rem-a1" value="a1" style="transform: scale(1.3); margin-right: 10px;" checked> <b>หัวหน้างาน / กลุ่มสาระ (A1)</b>
                </label>
                <label style="display: block; margin-bottom: 8px; cursor: pointer; color: #2c3e50;">
                    <input type="checkbox" id="rem-a2" value="a2" style="transform: scale(1.3); margin-right: 10px;" checked> <b>รองผู้อำนวยการ (A2)</b>
                </label>
                <label style="display: block; margin-bottom: 8px; cursor: pointer; color: #2c3e50;">
                    <input type="checkbox" id="rem-a3" value="a3" style="transform: scale(1.3); margin-right: 10px;" checked> <b>ผู้อำนวยการ (A3)</b>
                </label>
                <hr style="border: 0; border-top: 1px dashed #e67e22; margin: 12px 0;">
                <label style="display: block; margin-bottom: 8px; cursor: pointer; color: #2c3e50;">
                    <input type="checkbox" id="rem-supply" value="supply" style="transform: scale(1.3); margin-right: 10px;"> <b>งานพัสดุ</b>
                </label>
                <label style="display: block; margin-bottom: 0; cursor: pointer; color: #2c3e50;">
                    <input type="checkbox" id="rem-finance" value="finance" style="transform: scale(1.3); margin-right: 10px;"> <b>งานการเงิน</b>
                </label>
            </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ส่งแจ้งเตือน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e67e22',
      customClass: { container: 'kanit-font' },
      preConfirm: () => {
          let selected = [];
          if (document.getElementById('rem-a1').checked) selected.push('a1');
          if (document.getElementById('rem-a2').checked) selected.push('a2');
          if (document.getElementById('rem-a3').checked) selected.push('a3');
          if (document.getElementById('rem-supply').checked) selected.push('supply');
          if (document.getElementById('rem-finance').checked) selected.push('finance');
          
          if (selected.length === 0) {
              Swal.showValidationMessage('กรุณาติ๊กเลือกอย่างน้อย 1 ตำแหน่งครับ');
          }
          return selected;
      }
   }).then((result) => {
      if (result.isConfirmed) {
          const roles = result.value;
          Swal.fire({ title: 'กำลังประมวลผลงานค้าง...', text: 'รอสักครู่ ระบบกำลังทยอยส่งข้อความครับ', allowOutsideClick: false, didOpen: () => Swal.showLoading(), customClass: { container: 'kanit-font' } });
          
          google.script.run
            .withSuccessHandler(res => Swal.fire({ title: 'สำเร็จ', html: res.message.replace(/\n/g, '<br>'), icon: 'success', customClass: { container: 'kanit-font' } }))
            .withFailureHandler(err => Swal.fire({ title: 'ผิดพลาด', text: err.message, icon: 'error', customClass: { container: 'kanit-font' } }))
            .triggerTargetedReminders(roles); // 🌟 เรียกใช้ฟังก์ชันใหม่
      }
   });
}
// ==========================================
// 🌟 เพิ่มฟังก์ชันที่ขาดหายไป สำหรับหน้า "จัดการระบบ" (Admin Settings)
// ==========================================

// ฟังก์ชันจำลองสำหรับระบบสิทธิ์ (RBAC) เพื่อให้หน้าตารางไม่ Error
function loadMenuPermissions() {
    const table = document.getElementById('menu-permissions-table');
    if(table) {
        table.innerHTML = '<tr><td style="padding: 20px; text-align: center; color: #7f8c8d;"><i class="fas fa-tools fa-2x"></i><br>ระบบจัดการสิทธิ์เมนูกำลังอยู่ระหว่างการพัฒนา</td></tr>';
    }
}




// ฟังก์ชันสำหรับเปิดปีงบประมาณใหม่ (Danger Zone)
function triggerNewFiscalYear() {
  Swal.fire({
    title: 'ยืนยันการปิดยอดและเปิดปีงบประมาณใหม่?',
    text: "ระบบจะเก็บข้อมูลปัจจุบันเป็นประวัติ (Archive) และล้างกระดานสร้างชีตใหม่ทั้งหมด การกระทำนี้ไม่สามารถย้อนกลับได้!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#bdc3c7',
    confirmButtonText: 'ใช่, เปิดปีงบประมาณใหม่!',
    cancelButtonText: 'ยกเลิก',
    customClass: { container: 'kanit-font' }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังเตรียมการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      let targetYear = prompt("กรุณาระบุปีงบประมาณใหม่ (ตัวเลข 2 หลัก เช่น 71):");
      if (!targetYear || targetYear.trim().length !== 2) {
          Swal.fire('ยกเลิก', 'ข้อมูลปีงบประมาณไม่ถูกต้อง ยกเลิกการทำรายการครับ', 'info');
          return;
      }
      
      Swal.fire({ title: 'กำลังประมวลผลข้อมูลหลังบ้าน...', text: 'อาจใช้เวลาสักครู่ ห้ามปิดหน้าต่างนี้', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      google.script.run
        .withSuccessHandler(res => {
            Swal.fire('สำเร็จ!', res.message, 'success').then(() => location.reload());
        })
        .withFailureHandler(err => {
            Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
        })
        .initializeNewFiscalYear(targetYear.trim());
    }
  });
}

// ==========================================
// 🌟 ฟังก์ชันพิมพ์เอกสาร (ผง.2 ตัวใหม่สมบูรณ์ - แก้ชื่อ & คอมเมนต์ & VAT)
// ==========================================


 // ==========================================
  // 🌟 ฟังก์ชันจัดการตารางสิทธิ์เมนู (RBAC) 
  // ==========================================
  const menuNamesDict = {
    'menu-myprojects': 'โครงการของฉัน',
    'menu-disbursement': 'การเบิกจ่ายของฉัน',
    'menu-allprojects': 'โครงการทั้งหมด',
    'menu-admin': 'จัดการระบบ (Admin)',
    'menu-budget-admin': 'จัดการงบกลาง',
    'menu-approve': 'พิจารณาโครงการ',
    'menu-disb-approve': 'พิจารณาเบิกจ่าย (ผง.2)',
    'menu-supply-docs': 'ตะกร้างานพัสดุ',
    'menu-reconciliation': 'กระทบยอดเคลียร์บิล',
    'menu-strategy': 'โครงสร้างแผนงาน',
    'menu-qa': 'งานประกันคุณภาพ (QA)',
    'menu-financial-progress': 'ภาพรวมการเบิกจ่าย',
    'menu-amendment-docs': 'ทะเบียนคำร้องปรับเปลี่ยนรายละเอียดโครงการ (ผง.3)',
    'menu-all-disbursements': 'ประวัติเบิกจ่ายทั้งหมด'
  };
  // ==========================================
  // ⚙️ ฟังก์ชันหน้าจัดการระบบ (Admin Settings & Menu Permissions)
  // ==========================================
  const MENU_CONFIG_LIST = [
    { id: 'menu-myprojects', label: 'โครงการของฉัน' },
    { id: 'menu-disbursement', label: 'การเบิกจ่ายของฉัน' },
    { id: 'menu-approve', label: 'พิจารณาโครงการ' },
    { id: 'menu-disb-approve', label: 'พิจารณาเบิกจ่าย (ผง.2)' },
    { id: 'menu-allprojects', label: 'โครงการทั้งหมด' },
    { id: 'menu-amendment-docs', label: 'ทะเบียนคำร้อง (ผง.3)' },
    { id: 'menu-all-disbursements', label: 'ประวัติเบิกจ่ายทั้งหมด' },
    { id: 'menu-supply-docs', label: 'ตะกร้าใบขออนุมัติเบิกจ่าย' },
    { id: 'menu-reconciliation', label: 'กระทบยอดเคลียร์บิล' },
    { id: 'menu-budget-admin', label: 'จัดการงบกลาง' },
    { id: 'menu-strategy', label: 'โครงสร้างแผนงาน' },
    { id: 'menu-qa', label: 'งานประกันคุณภาพ' },
    { id: 'menu-admin', label: 'จัดการระบบ (Admin)' }
  ];

  function loadMenuPermissions() {
    const table = document.getElementById('menu-permissions-table');
    if (!table) return;
    table.innerHTML = '<tr><td style="padding:20px; text-align:center; color:#8e44ad;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังโหลดตารางสิทธิ์เมนู...</td></tr>';

    google.script.run
      .withSuccessHandler(function(perms) {
        let thead = '<thead><tr style="background:#34495e; color:white;"><th style="padding:10px; border:1px solid #ccc; min-width:150px;">ตำแหน่ง (Role)</th>';
        MENU_CONFIG_LIST.forEach(m => {
          thead += `<th style="padding:8px; border:1px solid #ccc; text-align:center; font-size:0.75rem;">${m.label}</th>`;
        });
        thead += '</tr></thead>';

        let tbody = '<tbody>';
        for (let role in perms) {
          tbody += `<tr style="border-bottom:1px solid #eee;">
                      <td style="padding:10px; border:1px solid #ccc; font-weight:bold; color:#2c3e50;">${perms[role].roleName || role}</td>`;
          MENU_CONFIG_LIST.forEach(m => {
            let checked = perms[role][m.id] ? 'checked' : '';
            tbody += `<td style="padding:8px; border:1px solid #ccc; text-align:center;">
                        <input type="checkbox" class="perm-checkbox" data-role="${role}" data-menu="${m.id}" ${checked} style="transform:scale(1.2); cursor:pointer;">
                      </td>`;
          });
          tbody += '</tr>';
        }
        tbody += '</tbody>';
        table.innerHTML = thead + tbody;
      })
      .withFailureHandler(function(err) {
        table.innerHTML = `<tr><td style="padding:20px; text-align:center; color:red;">โหลดตารางสิทธิ์ไม่สำเร็จ: ${err.message}</td></tr>`;
      })
      .getMenuPermissions();
  }

  

  function triggerNewFiscalYear() {
    Swal.fire({
      title: 'เปิดปีงบประมาณใหม่',
      text: 'กรุณาระบุปีงบประมาณใหม่ (ตัวเลข 2 หลัก เช่น 70):',
      input: 'number',
      inputAttributes: { min: 65, max: 99 },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'ยืนยันการเปิดปีงบใหม่',
      cancelButtonText: 'ยกเลิก',
      customClass: { container: 'kanit-font' }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({ title: 'กำลังสำรองข้อมูลและสร้างชีตปีงบใหม่...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        google.script.run
          .withSuccessHandler(function(res) {
            Swal.fire('สำเร็จ!', res.message, 'success').then(() => loadSettings());
          })
          .withFailureHandler(function(err) {
            Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
          })
          .initializeNewFiscalYear(String(result.value).trim());
      }
    });
  }
 

  function loadMenuPermissionsTable() {
    const table = document.getElementById('menu-permissions-table');
    if (!table) return;
    table.innerHTML = '<tr><td style="padding:20px; text-align:center; color:#8e44ad;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังโหลดตารางสิทธิ์เมนู...</td></tr>';

    google.script.run
      .withSuccessHandler(function(perms) {
        const menuKeys = Object.keys(menuNamesDict);
        let thead = '<thead><tr style="background:#34495e; color:white;"><th style="padding:10px; border:1px solid #ccc; min-width:150px;">ตำแหน่ง (Role)</th>';
        menuKeys.forEach(mKey => {
          thead += `<th style="padding:8px; border:1px solid #ccc; text-align:center; font-size:0.75rem;">${menuNamesDict[mKey]}</th>`;
        });
        thead += '</tr></thead>';

        let tbody = '<tbody>';
        for (let role in perms) {
          tbody += `<tr style="border-bottom:1px solid #eee;">
                      <td style="padding:10px; border:1px solid #ccc; font-weight:bold; color:#2c3e50; white-space:nowrap;">${perms[role].roleName || role}</td>`;
          menuKeys.forEach(mKey => {
            let isChecked = perms[role][mKey] ? 'checked' : '';
            tbody += `<td style="padding:8px; border:1px solid #ccc; text-align:center;">
                        <input type="checkbox" class="perm-checkbox" data-role="${role}" data-menu="${mKey}" ${isChecked} style="transform:scale(1.2); cursor:pointer;">
                      </td>`;
          });
          tbody += '</tr>';
        }
        tbody += '</tbody>';
        table.innerHTML = thead + tbody;
      })
      .withFailureHandler(function(err) {
        table.innerHTML = `<tr><td style="padding:20px; text-align:center; color:red;">โหลดตารางสิทธิ์ไม่สำเร็จ: ${err.message}</td></tr>`;
      })
      .getMenuPermissions();
  }

  function submitMenuPermissions() {
    if(!confirm("ยืนยันการบันทึกการตั้งค่าสิทธิ์การเข้าถึงเมนู ใช่หรือไม่?")) return;
    const btn = document.getElementById('btn-save-menu-perms');
    if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true; }

    const checkboxes = document.querySelectorAll('.perm-checkbox');
    let newPerms = {};
    checkboxes.forEach(cb => {
       let role = cb.getAttribute('data-role');
       let menu = cb.getAttribute('data-menu');
       if(!newPerms[role]) newPerms[role] = {};
       newPerms[role][menu] = cb.checked;
    });

    google.script.run
      .withSuccessHandler(function(res) {
         alert(res.message);
         if(btn) { btn.innerHTML = '<i class="fas fa-save"></i> บันทึกสิทธิ์เมนู'; btn.disabled = false; }
      })
      .withFailureHandler(function(err) {
         alert("ผิดพลาด: " + err.message);
         if(btn) { btn.innerHTML = '<i class="fas fa-save"></i> บันทึกสิทธิ์เมนู'; btn.disabled = false; }
      })
      .saveMenuPermissions(newPerms);
  }

  // แอบแทรกคำสั่งดักให้โหลดตารางตอนแอดมินกดเปิดเมนูจัดการระบบ
  document.addEventListener("DOMContentLoaded", function() {
      if (typeof showPage !== 'undefined') {
          const oldShowPageAdmin = showPage;
          showPage = function(pageId) {
              oldShowPageAdmin(pageId);
              if (pageId === 'page-admin') {
                  if (typeof loadSettings === 'function') loadSettings();
                  loadMenuPermissionsTable(); 
              }
          };
      }
  });

  // ==========================================
  // 🌟 3. ระบบแสดงผลและอัปเดตหน้าตะกร้าพัสดุ (ผง.2)
  // ==========================================
  function loadSupplyDocuments() {
    const pendTbody = document.getElementById('supply-docs-pending-tbody');
    const compTbody = document.getElementById('supply-docs-completed-tbody');
    if(!pendTbody || !compTbody) return;

    pendTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color:#e67e22;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงข้อมูล...</td></tr>';
    compTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color:#27ae60;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>กำลังดึงข้อมูล...</td></tr>';

    const selectedYear = typeof getDefaultYear === 'function' ? getDefaultYear() : '';

    google.script.run
      .withSuccessHandler(function(res) {
          if (!res.success) { 
              let errorMsg = `<tr><td colspan="6" style="text-align: center; color: #e74c3c; padding: 20px;"><i class="fas fa-exclamation-triangle"></i> ${res.message || 'ไม่มีสิทธิ์เข้าถึง หรือไม่พบข้อมูล'}</td></tr>`;
              pendTbody.innerHTML = errorMsg; compTbody.innerHTML = errorMsg; return; 
          }

          let pendHtml = '', compHtml = '';
          const fmt = (num) => Number(num || 0).toLocaleString('en-US', {minimumFractionDigits: 2});

          res.data.forEach(item => {
              let badge = item.supplyDocStatus === 'รอจัดทำเอกสาร' ? `<span style="background:#f39c12; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">รอจัดทำ</span>` : 
                          item.supplyDocStatus === 'จัดทำเรียบร้อย' ? `<span style="background:#2ecc71; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">จัดทำเรียบร้อย</span>` : 
                          `<span style="background:#e74c3c; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">ยกเลิกรายการ</span>`;

              let actionBtns = `
                  <div style="display:flex; flex-direction:column; gap:5px;">
                      <!-- หมายเหตุ: หากฟังก์ชันพิมพ์ใบปะหน้ายังไม่มี ให้เชื่อมต่อกับฟังก์ชันพิมพ์เดิมของคุณ -->
                      <button type="button" onclick="alert('ระบบกำลังเตรียมไฟล์เอกสาร โปรดรอสักครู่...');" style="background:#3498db; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; font-size:0.8rem;"><i class="fas fa-print"></i> พิมพ์ ผง.2</button>
                      ${item.supplyDocStatus === 'รอจัดทำเอกสาร' 
                        ? `<button type="button" onclick="updateSupplyDocStatus('${item.reqId}', 'จัดทำเรียบร้อย')" style="background:#27ae60; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; font-size:0.8rem;"><i class="fas fa-check"></i> เสร็จสิ้น</button>` 
                        : `<button type="button" onclick="updateSupplyDocStatus('${item.reqId}', 'รอจัดทำเอกสาร')" style="background:#f39c12; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; font-size:0.8rem;"><i class="fas fa-undo"></i> ย้ายกลับ</button>`
                      }
                  </div>`;

              let rowHtml = `
              <tr style="border-bottom: 1px solid #ecf0f1;">
                  <td style="padding: 12px; font-size: 0.9rem;">${item.timestamp}</td>
                  <td style="padding: 12px;"><b>[${item.reqId}]</b><br><span style="color:#2980b9;">${item.projectName}</span><br><small style="color:#7f8c8d;"><i class="fas fa-user"></i> ${item.requester}</small></td>
                  <td style="padding: 12px; font-size: 0.9rem;">${item.actionType} ${item.itemCategory} เพื่อ ${item.objective}</td>
                  <td style="padding: 12px; text-align: right; color: #c0392b; font-weight: bold;">${fmt(item.amount)}</td>
                  <td style="padding: 12px; text-align: center;">${badge}</td>
                  <td style="padding: 12px; text-align: center;">${actionBtns}</td>
              </tr>`;

              if (item.supplyDocStatus === 'รอจัดทำเอกสาร') pendHtml += rowHtml;
              else compHtml += rowHtml;
          });

          pendTbody.innerHTML = pendHtml || '<tr><td colspan="6" style="text-align: center; color: #7f8c8d; padding: 20px;">ไม่มีรายการรอจัดทำเอกสาร</td></tr>';
          compTbody.innerHTML = compHtml || '<tr><td colspan="6" style="text-align: center; color: #7f8c8d; padding: 20px;">ไม่มีรายการที่จัดทำเสร็จสิ้น</td></tr>';
      })
      .withFailureHandler(function(err) {
          let errorMsg = `<tr><td colspan="6" style="text-align: center; color: #e74c3c; padding: 20px;"><i class="fas fa-times-circle"></i> เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
          pendTbody.innerHTML = errorMsg;
          compTbody.innerHTML = errorMsg;
      })
      .getSupplyDocumentsData(selectedYear);
  }

  function updateSupplyDocStatus(reqId, newStatus) {
      if (!confirm(`ยืนยันการเปลี่ยนสถานะเอกสารเป็น "${newStatus}" ใช่หรือไม่?`)) return;
      Swal.fire({ title: 'กำลังอัปเดตข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      google.script.run
      .withSuccessHandler(function(res) {
          Swal.close();
          if(res.success) {
              Swal.fire({icon: 'success', title: 'สำเร็จ', text: 'เปลี่ยนสถานะเรียบร้อย', timer: 1500, showConfirmButton: false});
              loadSupplyDocuments();
          } else {
              Swal.fire({icon: 'error', title: 'ผิดพลาด', text: res.message});
          }
      })
      .setSupplyDocStatus(reqId, newStatus);
  }


// ==========================================
// 1. ระบบจัดการหน้าต่างและเมนู (Navigation)
// ==========================================
function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.style.display = 'none');

    const targetPage = document.getElementById(pageId);
    if(targetPage) {
        targetPage.style.display = 'block';
    }

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    const activeMenu = document.querySelector(`.menu-item[onclick*="showPage('${pageId}')"]`);
    if(activeMenu) activeMenu.classList.add('active');

    if (typeof updateNavBadges === 'function') updateNavBadges();
    
    if (pageId === 'page-myprojects') loadMyProjects();
    else if (pageId === 'page-dashboard') loadDashboardData();
    else if (pageId === 'page-admin') { 
        loadSettings(); 
        if (typeof loadMenuPermissions === 'function') loadMenuPermissions(); 
    }
    else if (pageId === 'page-allprojects') loadAllProjects();
    else if (pageId === 'page-disbursement') loadDisbursementDashboardData(); 
    else if (pageId === 'page-budget-admin') loadBudgetAdminDashboard();
    else if (pageId === 'page-disb-approve') loadDisbApproveInbox(); 
    else if (pageId === 'page-supply-docs') loadSupplyDocsDashboard(); 
    else if (pageId === 'page-reconciliation') loadReconciliationDashboard();
    else if (pageId === 'page-amendment-docs') loadAmendmentDocs(); 
    else if (pageId === 'page-all-disbursements') loadAllDisbursementsAdmin(); 
    else if (pageId === 'page-approve') {
      document.getElementById('section-admin-screening') ? document.getElementById('section-admin-screening').style.display = 'none' : null;
      document.getElementById('section-a1-approval') ? document.getElementById('section-a1-approval').style.display = 'none' : null;
      document.getElementById('section-a2-approval') ? document.getElementById('section-a2-approval').style.display = 'none' : null;
      document.getElementById('section-a3-approval') ? document.getElementById('section-a3-approval').style.display = 'none' : null;
      
      if (window.userRole.includes('admin') || window.userRole.includes('แผน')) {
        const secAdmin = document.getElementById('section-admin-screening');
        if(secAdmin) secAdmin.style.display = 'block';
        loadPendingApprovals();
        loadPendingAmendments();
      }
      if (window.userRole.includes('approver1') || window.userRole.includes('a1') || window.userRole.includes('approver 1')) {
        const secA1 = document.getElementById('section-a1-approval');
        if(secA1) secA1.style.display = 'block';
        loadA1Approvals();
      }
      if (window.userRole.includes('approver2') || window.userRole.includes('a2') || window.userRole.includes('approver 2')) {
        const secA2 = document.getElementById('section-a2-approval');
        if(secA2) secA2.style.display = 'block';
        loadA2Approvals();
      }
      if (window.userRole.includes('approver3') || window.userRole.includes('a3') || window.userRole.includes('approver 3')) {
        const secA3 = document.getElementById('section-a3-approval');
        if(secA3) secA3.style.display = 'block';
        loadA3Approvals();
        if(typeof loadA3Amendments === 'function') loadA3Amendments();
      }
    }
}

function loadSettings() {
    const btn = document.getElementById('btn-save-settings');
    if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

    google.script.run
      .withSuccessHandler(function(settings) {
        if (settings['ActiveProjectYear']) document.getElementById('input-active-project').value = settings['ActiveProjectYear'];
        if (settings['ActiveReportYear']) document.getElementById('input-active-report').value = settings['ActiveReportYear'];
        if (settings['TemplateProject']) document.getElementById('input-template-project').value = settings['TemplateProject'];
        if (settings['TemplateReport']) document.getElementById('input-template-report').value = settings['TemplateReport'];
        
        if (btn) { btn.innerHTML = '<i class="fas fa-save"></i> <span>บันทึกการตั้งค่า</span>'; btn.disabled = false; }
      })
      .withFailureHandler(function(err) { alert("โหลดการตั้งค่าล้มเหลว: " + err.message); })
      .getSystemSettings();
}
// ==========================================
// 🌟 ฟังก์ชันเปิดหน้าต่างตรวจรายงานผล (ใช้ SweetAlert2)
// ==========================================
function openReportReviewModal(reportId) {
    Swal.fire({
        title: '<span style="color:#e67e22;"><i class="fas fa-file-signature"></i> พิจารณารายงานผลโครงการ</span>',
        html: `
            <div style="font-size:0.9rem; color:#7f8c8d; margin-bottom:15px;">รหัสรายงาน: ${reportId}</div>
            <div style="text-align:left; font-weight:bold; color:#2c3e50; font-size:0.95rem; margin-bottom:5px;">ข้อเสนอแนะ/ความเห็น (บังคับกรอกกรณีตีกลับ):</div>
            <textarea id="swal-report-comment" class="swal2-textarea" style="margin:0; width:100%; font-family:'Kanit'; font-size:0.95rem; height:80px;" placeholder="พิมพ์ข้อเสนอแนะเพื่อประทับลงในเอกสาร หรือเหตุผลการตีกลับ..."></textarea>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="fas fa-check"></i> รับทราบ / อนุมัติ',
        denyButtonText: '<i class="fas fa-undo"></i> ตีกลับแก้ไข',
        cancelButtonText: 'ปิดหน้าต่าง',
        confirmButtonColor: '#27ae60',
        denyButtonColor: '#e74c3c',
        cancelButtonColor: '#bdc3c7',
        customClass: { container: 'kanit-font' },
        preConfirm: () => {
            return { action: 'approve', comment: document.getElementById('swal-report-comment').value.trim() };
        },
        preDeny: () => {
            const comment = document.getElementById('swal-report-comment').value.trim();
            if (!comment) {
                Swal.showValidationMessage('กรุณาระบุข้อเสนอแนะ หรือเหตุผลสำหรับการตีกลับด้วยครับ!');
                return false;
            }
            return { action: 'return', comment: comment };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            executeReportApprovalDecision(reportId, result.value.action, result.value.comment);
        } else if (result.isDenied) {
            executeReportApprovalDecision(reportId, result.value.action, result.value.comment);
        }
    });
}

// ==========================================
// 🌟 ฟังก์ชันส่งคำสั่งประทับลายเซ็นไปหลังบ้าน
// ==========================================
function executeReportApprovalDecision(reportId, action, comment) {
    let loadingText = action === 'approve' ? 'ระบบกำลังบันทึกข้อมูลและประทับลายเซ็นลง Google Docs<br>กรุณารอสักครู่...' : 'ระบบกำลังส่งกลับให้เจ้าของแก้ไข...';
    
    Swal.fire({ 
        title: 'กำลังประมวลผล...', 
        html: loadingText, 
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading(),
        customClass: { container: 'kanit-font' }
    });

    google.script.run
        .withSuccessHandler(res => {
            if (res.success) {
                Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: res.message, customClass: { container: 'kanit-font' } }).then(() => {
                    // โหลดตารางใหม่เพื่อให้ข้อมูลที่อนุมัติแล้วหายไปจากตะกร้า
                    if(typeof loadPendingApprovals === 'function') loadPendingApprovals();
                    if(typeof loadA2Approvals === 'function') loadA2Approvals();
                    if(typeof loadA3Approvals === 'function') loadA3Approvals();
                });
            } else {
                Swal.fire('ผิดพลาด', res.message, 'error');
            }
        })
        .withFailureHandler(err => Swal.fire('ผิดพลาด', err.message, 'error'))
        .processReportApproval({ reqId: reportId, action: action, comment: comment }); // ส่ง object ไปให้ backend
}
// ==========================================
// 🌟 ระบบ Popup แนบบิล (Clearance) ด้วย SweetAlert2
// ==========================================
function openBillPopup(reqId, projectName, totalAmount, itemsJsonStr) {
   let parsedItems = [];
   try { parsedItems = JSON.parse(decodeURIComponent(itemsJsonStr)); } catch(e) { parsedItems = []; }
   
   // 🌟 กรองเอาเฉพาะ "สินค้าจริง" ไม่เอา VAT/Shipping มาโชว์ให้ติ๊ก
   let realItems = parsedItems.filter(it => it.name !== '#SYS_VAT#' && it.name !== '#SYS_SHIPPING#');
   
   let itemsHtml = '';
   if (realItems.length === 0) {
       itemsHtml = `<div style="color:#e74c3c; font-size:0.85rem; margin-bottom:15px;">ไม่พบรายการย่อย กรุณาระบุในหมายเหตุแทนครับ</div>`;
   } else {
       itemsHtml = `
         <div style="text-align:left; margin-bottom:15px; max-height:150px; overflow-y:auto; border:1px solid #ecf0f1; padding:10px; border-radius:8px; background:#fdfefe;">
           <div style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">
             <input type="checkbox" id="selectAllItems" onchange="toggleSelectAll(this)" style="transform: scale(1.2); margin-right:8px;"> 
             <label for="selectAllItems" style="font-weight:bold; cursor:pointer; color:#2980b9; font-size:0.9rem;">เลือกทั้งหมด</label>
           </div>
       `;
       realItems.forEach((item, idx) => {
          itemsHtml += `
            <div style="margin-bottom:5px;">
              <input type="checkbox" class="item-checkbox" value="${item.name}" id="item_${idx}" style="transform: scale(1.2); margin-right:8px;">
              <label for="item_${idx}" style="cursor:pointer; font-size:0.85rem; color:#2c3e50;"> ${item.name}</label>
            </div>
          `;
       });
       itemsHtml += `</div>`;
   }

   Swal.fire({
      title: 'แนบบิลเบิกจ่าย',
      html: `
        <div style="font-size:1rem; color:#8e44ad; font-weight:bold; margin-bottom:5px; line-height:1.3;">${projectName}</div>
        <div style="font-size:0.85rem; color:#7f8c8d; margin-bottom:15px;">รหัสคำขอ: ${reqId}</div>
        
        <div style="text-align:left; font-weight:bold; margin-bottom:5px; color:#2c3e50; font-size:0.95rem;">1. เลือกรายการ:</div>
        ${itemsHtml}
        
        <div style="text-align:left; font-weight:bold; margin-bottom:5px; color:#2c3e50; font-size:0.95rem;">2. ยอดตามบิลรวมทั้งหมด (บาท):</div>
        <input type="number" id="actualAmount" class="swal2-input" placeholder="ขอไว้: ${totalAmount.toLocaleString()}" style="width:100%; max-width:100%; margin:0 0 15px 0; box-sizing:border-box;">
        
        <div style="text-align:left; font-weight:bold; margin-bottom:5px; color:#2c3e50; font-size:0.95rem;">3. อัปโหลดรูปบิล (เลือกได้หลายใบ):</div>
        <input type="file" id="billFileInput" accept="image/*,.pdf" multiple style="width:100%; padding:10px; border:1px dashed #bdc3c7; border-radius:8px; background:#fdfefe; box-sizing:border-box; font-family:'Kanit';">
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกบิล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#27ae60',
      customClass: { container: 'kanit-font' },
      preConfirm: () => {
         const selectedItems = Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.value).join(', ');
         const actualAmt = document.getElementById('actualAmount').value;
         const fileInput = document.getElementById('billFileInput');
         
         if (realItems.length > 0 && !selectedItems) { Swal.showValidationMessage('กรุณาเลือกรายการอย่างน้อย 1 รายการ'); return false; }
         if (!actualAmt) { Swal.showValidationMessage('กรุณาระบุยอดเงินตามบิลจริง'); return false; }
         if (!fileInput.files.length) { Swal.showValidationMessage('กรุณาอัปโหลดรูปบิลอย่างน้อย 1 ใบ'); return false; }
         
         let filePromises = Array.from(fileInput.files).map(file => {
             return new Promise((resolve) => {
                 const reader = new FileReader();
                 reader.onload = e => {
                     const splitBase = e.target.result.split(',');
                     resolve({ base64: splitBase[1], mimeType: splitBase[0].split(';')[0].replace('data:', ''), name: file.name });
                 };
                 reader.readAsDataURL(file);
             });
         });
         return Promise.all(filePromises).then(filesBase64 => {
             return { items: selectedItems || "ไม่ได้ระบุ", amount: actualAmt, files: filesBase64 };
         });
      }
   }).then((result) => {
      if (result.isConfirmed) {
          const files = result.value.files;
          Swal.fire({ title: 'กำลังบันทึก...', text: `กำลังอัปโหลดเอกสาร ${files.length} ไฟล์`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          
          const billsData = files.map((f, index) => ({
              file: f,
              actualAmount: index === 0 ? result.value.amount : 0, 
              matchedItems: result.value.items
          }));
             
          google.script.run
            .withSuccessHandler(res => {
                if(res.success) {
                    Swal.fire('สำเร็จ', res.message, 'success').then(() => {
                        loadDisbursementDashboardData(); // รีโหลดข้อมูลตารางใหม่
                    });
                } else {
                    Swal.fire('ผิดพลาด', res.message, 'error');
                }
            })
            .withFailureHandler(err => Swal.fire('ผิดพลาด', err.message, 'error'))
            .saveDisbursementBills(reqId, billsData); 
      }
   });
}

function toggleSelectAll(selectAllCheckbox) {
    document.querySelectorAll('.item-checkbox').forEach(cb => { cb.checked = selectAllCheckbox.checked; });
}
function printDisbursementDocument(reqId) {
    let clientUid = new URLSearchParams(window.location.search).get('uid') || localStorage.getItem('nongPhaenDee_lineUid') || "";
    let printWindow = window.open('', '_blank', 'width=900,height=1000');

    if (!printWindow) {
        Swal.fire({
            icon: 'warning',
            title: 'ถูกบล็อกป๊อปอัป (Pop-up)',
            text: 'เบราว์เซอร์ของคุณบล็อกหน้าต่างใหม่ กรุณากดอนุญาต (Allow pop-ups) ที่มุมขวาบนของช่อง URL ก่อนครับ',
            customClass: { container: 'kanit-font' }
        });
        return;
    }

    printWindow.document.write('<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px; color: #333;"><h2>⏳ ระบบกำลังดึงข้อมูล จัดหน้ากระดาษและลายเซ็น...<br>กรุณารอสักครู่ครับ</h2></body></html>');

    // ดึงข้อมูลแหล่งงบรายบรรทัดที่โหลดไว้ในตะกร้าพัสดุ (ใช้เสริมกรณีฝั่ง Server ยังไม่ได้ส่งมา)
    const cachedReq = (typeof globalSupplyDocsData !== 'undefined') ? globalSupplyDocsData.find(d => d.reqId === reqId) : null;
    const cachedSourceByName = {};
    if (cachedReq && cachedReq.items) {
        cachedReq.items.forEach(it => {
            if (it.name && it.fundingSource) cachedSourceByName[it.name] = it.fundingSource;
        });
    }

    // ฟังก์ชันแปลงชื่อแหล่งงบเป็นชื่อเล่นสั้นๆ
    const getFundingNickname = (src) => {
        const s = String(src || "").trim();
        if (!s || s === '-' || s === 'ไม่ระบุแหล่งงบ') return '';
        if (s.includes('พัฒนาผู้เรียน')) return 'กิจกรรม';
        if (s.includes('รายหัว')) return 'รายหัว';
        if (s.includes('รายได้')) return 'รายได้';
        if (s.includes('ลูกเสือ')) return 'ลูกเสือ';
        return s;
    };

    google.script.run
        .withSuccessHandler(function(data) {
            let itemsHtml = '';
            let sumTotal = 0;
            let vatAmt = 0;
            let shipAmt = 0;
            let realItems = [];

            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(it => {
                    if (it.name === '#SYS_VAT#') vatAmt = Number(it.price) || 0;
                    else if (it.name === '#SYS_SHIPPING#') shipAmt = Number(it.price) || 0;
                    else realItems.push(it);
                });
            }

            const fCur = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const singleFallbackSrc = (data.source && !String(data.source).includes(','))
                ? String(data.source).split('=')[0].trim()
                : "";

            if (realItems.length > 0) {
                realItems.forEach((it, idx) => {
                    let lineTotal = Number(it.qty) * Number(it.price);
                    sumTotal += lineTotal;

                    let rawSrc = it.fundingSource || cachedSourceByName[it.name] || singleFallbackSrc;
                    let nick = getFundingNickname(rawSrc);
                    let displayName = nick ? `${it.name} (${nick})` : it.name;

                    itemsHtml += `
                   <tr>
                       <td style="text-align:center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
                       <td style="border: 1px solid #000; padding: 6px;">${displayName}</td>
                       <td style="text-align:center; border: 1px solid #000; padding: 6px;">${it.qty}</td>
                       <td style="text-align:center; border: 1px solid #000; padding: 6px;">${it.unit}</td>
                       <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fCur(it.price)}</td>
                       <td style="text-align:right; border: 1px solid #000; padding: 6px;">${fCur(lineTotal)}</td>
                   </tr>`;
                });
            } else {
                itemsHtml = '<tr><td colspan="6" style="text-align:center; border: 1px solid #000; padding: 6px;">ไม่มีรายการสิ่งของ</td></tr>';
            }

            if (vatAmt > 0) {
                itemsHtml += `<tr><td colspan="5" style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">ภาษีมูลค่าเพิ่ม (VAT)</td><td style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">${fCur(vatAmt)}</td></tr>`;
            }
            if (shipAmt > 0) {
                itemsHtml += `<tr><td colspan="5" style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">ค่าจัดส่ง</td><td style="text-align:right; font-weight:bold; border: 1px solid #000; padding: 6px;">${fCur(shipAmt)}</td></tr>`;
            }

            let isTopup = data.centralTopup > 0;
            let projDeduct = isTopup ? (data.requestAmount - data.centralTopup) : data.requestAmount;
            let remainAfter = data.allocated - data.usedBefore - projDeduct;

            const extractCleanComment = (obj) => {
                if (!obj || !obj.cmt || obj.cmt === "-") return "-";
                let cleanCmt = String(obj.cmt)
                    .replace(/^\(.*?\):\s*/, '')
                    .replace(/\[บันทึกความเห็นจากงานแผนงาน\]\s*/g, '')
                    .replace(/\[ความเห็นงานพัสดุ\]\s*/g, '')
                    .replace(/\[ความเห็นงานการเงิน\]\s*/g, '')
                    .replace(/\[ความเห็นรองผู้อำนวยการ\]\s*/g, '')
                    .replace(/\[คำสั่งผู้อำนวยการ\]\s*/g, '')
                    .trim();
                return cleanCmt || "-";
            };

            let cAdmin = extractCleanComment(data.admin);
            let cSupply = extractCleanComment(data.supply);
            let cFin = extractCleanComment(data.finance);
            let cA2 = extractCleanComment(data.a2);
            let cA3 = extractCleanComment(data.a3);

            let docHtml = `
         <html>
         <head>
           <title>แบบ ผง. 2 - ${data.reqId}</title>
           <style>
             @font-face {
               font-family: 'TH Sarabun New';
               src: url('https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@7/fonts/ThSarabunNew/ThSarabunNew.woff2') format('woff2');
               font-weight: normal;
               font-style: normal;
             }
             @font-face {
               font-family: 'TH Sarabun New';
               src: url('https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@7/fonts/ThSarabunNew/ThSarabunNew_Bold.woff2') format('woff2');
               font-weight: bold;
               font-style: normal;
             }
             @page { size: A4; margin: 20mm; }
             body { font-family: 'TH Sarabun New', sans-serif; font-size: 16pt; line-height: 1.2; color: #000; margin: 0; padding: 0; }
             .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; }
             .indent { text-indent: 40px; }
             table { width: 100%; border-collapse: collapse; margin-top: 10px; color: #000; }
             .bordered-td { border: 1px solid #000; padding: 4px 8px; font-size: 15pt; }
             .step-box { border: 1px solid #000; border-radius: 8px; margin-bottom: 8px; display: flex; page-break-inside: avoid; background-color: #fff; }
             .step-left { width: 65%; border-right: 1px dashed #000; padding: 10px 15px; }
             .step-right { width: 35%; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding: 10px; }
             .step-title { font-weight: bold; font-size: 16pt; margin-bottom: 5px; color: #000; }
             .sig-img { max-height: 45px; margin-bottom: 2px; }
             .budget-table { width: 100%; font-size: 15pt; margin-top: 10px; color: #000; }
             .budget-table td { padding: 2px 5px; border: 1px dotted #000; }
             .comment-text { color: #000; font-size: 15pt; min-height: 25px; white-space: pre-wrap; }
           </style>
         </head>
         <body>
           <div style="position:absolute; top:0px; right:0px; font-weight:bold; font-size: 15pt;">แบบ ผง. 2</div>
           <h3 class="center bold" style="margin-bottom: 10px; margin-top: 0; font-size: 22pt;">บันทึกข้อความ</h3>
           
           <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
             <div><b>ส่วนราชการ:</b> โรงเรียนโสภณศิริราษฎร์</div>
           </div>
           <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
             <div><b>ที่:</b> ..........................................................................</div>
             <div><b>วันที่:</b> ${data.dateStr}</div>
           </div>
           <div style="margin-bottom: 5px;"><b>เรื่อง:</b> ขออนุมัติเบิกจ่ายงบประมาณและแต่งตั้งคณะกรรมการตรวจรับพัสดุ</div>
           <div style="margin-bottom: 15px;"><b>เรียน:</b> ผู้อำนวยการโรงเรียนโสภณศิริราษฎร์</div>
           
           <div class="indent" style="text-align:justify; margin-bottom: 15px;">
             ด้วย <b>${data.section || 'กลุ่มงาน...................'}</b> มีความประสงค์ขอดำเนินการ <b>${data.actionType} ${data.category}</b> เพื่อ <b>${data.objective}</b> 
             ตามโครงการ <b>${data.projectName}</b> ซึ่งได้รับจัดสรรงบประมาณตามแผนปฏิบัติการ (แหล่งงบประมาณ: ${data.source}) 
             จึงขออนุมัติงบประมาณ จำนวน <b>${fCur(data.requestAmount)} บาท (${ThaiBahtText(data.requestAmount)})</b>
             ดังรายละเอียดแนบท้าย
           </div>

           <!-- บล็อกที่ 1: ผู้ขออนุมัติ -->
           <div class="step-box">
             <div class="step-left">
               <div class="step-title">1. ผู้ขออนุมัติ</div>
               <div class="comment-text">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>
             </div>
             <div class="step-right">
               ${data.requesterSig ? `<img src="${data.requesterSig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( ${data.requesterName} )<br>ผู้รับผิดชอบโครงการ
             </div>
           </div>

           <!-- บล็อกที่ 2: งานแผนงาน -->
           <div class="step-box">
             <div class="step-left">
               <div class="step-title">2. ความเห็นหัวหน้างานแผนงาน</div>
               <div class="comment-text"><b>ความเห็น:</b><br>${cAdmin !== '-' ? cAdmin : "ตรวจสอบโครงการและงบประมาณเรียบร้อยแล้ว"}</div>
               <table class="budget-table">
                  <tr><td style="width:55%;">งบประมาณที่ได้รับจัดสรร</td><td class="right">${fCur(data.allocated)}</td><td class="center" style="width:15%;">บาท</td></tr>
                  <tr><td>เบิกจ่ายไปแล้ว</td><td class="right">${fCur(data.usedBefore)}</td><td class="center">บาท</td></tr>
                  <tr><td class="bold">ขอเบิกจ่ายครั้งนี้</td><td class="right bold">${fCur(projDeduct)}</td><td class="center">บาท</td></tr>
                  ${isTopup ? `<tr><td>สมทบจากงบอำนวยการกลาง</td><td class="right">${fCur(data.centralTopup)}</td><td class="center">บาท</td></tr>` : ''}
                  <tr><td class="bold">คงเหลือ</td><td class="right bold">${fCur(remainAfter)}</td><td class="center">บาท</td></tr>
               </table>
             </div>
             <div class="step-right">
               ${(data.admin && data.admin.sig) ? `<img src="${data.admin.sig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( นายรัตนปกรณ์ ธนันทา )<br>หัวหน้างานแผนงาน
             </div>
           </div>

           <!-- บล็อกที่ 3: งานพัสดุ -->
           <div class="step-box">
             <div class="step-left">
               <div class="step-title">3. ความเห็นหัวหน้างานพัสดุ</div>
               <div class="comment-text"><b>ความเห็น:</b><br>${cSupply !== '-' ? cSupply : "................................................................................"}</div>
             </div>
             <div class="step-right">
               ${(data.supply && data.supply.sig) ? `<img src="${data.supply.sig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( น.ส.พนาวรรณ อุดมโภชน์ )<br>เจ้าหน้าที่พัสดุ
             </div>
           </div>

           <!-- บล็อกที่ 4: งานงบประมาณ -->
           <div class="step-box">
             <div class="step-left">
               <div class="step-title">4. ความเห็นบริหารงบประมาณ</div>
               <div class="comment-text"><b>ความเห็น:</b><br>${cFin !== '-' ? cFin : "................................................................................"}</div>
             </div>
             <div class="step-right">
               ${(data.finance && data.finance.sig) ? `<img src="${data.finance.sig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( น.ส.วรัญชลี นรินทร์ )<br>หัวหน้ากลุ่มบริหารงานงบประมาณ
             </div>
           </div>

           <!-- บล็อกที่ 5: รองผู้อำนวยการ -->
           <div class="step-box">
             <div class="step-left">
               <div class="step-title">5. ความเห็นรองผู้อำนวยการโรงเรียน</div>
               <div class="comment-text"><b>ความเห็น:</b><br>${cA2 !== '-' ? cA2 : "................................................................................"}</div>
             </div>
             <div class="step-right">
               ${(data.a2 && data.a2.sig) ? `<img src="${data.a2.sig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( นายธนวันต์ เข็มทอง )<br>รองผู้อำนวยการโรงเรียน
             </div>
           </div>

           <!-- บล็อกที่ 6: ผู้อำนวยการ -->
           <div class="step-box" style="border: 2px solid #000; background-color: #fff;">
             <div class="step-left">
               <div class="step-title">6. คำสั่งผู้อำนวยการโรงเรียน</div>
               <div class="comment-text"><b>ความเห็น/คำสั่ง:</b><br>${cA3 !== '-' ? cA3 : "......................................................................................"}</div>
             </div>
             <div class="step-right">
               ${(data.a3 && data.a3.sig) ? `<img src="${data.a3.sig}" class="sig-img">` : `<div style="height:45px;"></div>`}
               ( นางปิยนุช โรจนกุล )<br>ผู้อำนวยการโรงเรียนโสภณศิริราษฎร์
             </div>
           </div>

           <div style="page-break-before: always;"></div>
           
           <h3 class="center bold" style="margin-bottom:10px; margin-top:20px; font-size: 17pt;">รายละเอียดแนบท้ายรายงานขออนุมัติจัดซื้อ/จัดจ้าง</h3>
           <table>
             <thead style="background:#fff;">
               <tr>
                 <th class="bordered-td" style="width:8%;">ที่</th>
                 <th class="bordered-td" style="width:38%;">รายการ</th>
                 <th class="bordered-td" style="width:12%;">จำนวน</th>
                 <th class="bordered-td" style="width:12%;">หน่วย</th>
                 <th class="bordered-td" style="width:15%;">ราคา/หน่วย</th>
                 <th class="bordered-td" style="width:15%;">รวมเงิน (บาท)</th>
               </tr>
             </thead>
             <tbody>${itemsHtml}</tbody>
             <tfoot>
               <tr>
                 <td colspan="5" class="right bold bordered-td">( ${ThaiBahtText(data.requestAmount)} ) รวมทั้งสิ้น</td>
                 <td class="right bold bordered-td">${fCur(data.requestAmount)}</td>
               </tr>
             </tfoot>
           </table>

           <div style="margin-top: 20px; font-size: 16pt;">
             <b>เสนอรายชื่อกรรมการตรวจรับพัสดุ ดังนี้:</b><br>
             <div style="padding-left: 30px; margin-top: 5px;">
                1. ${data.comm1 || "....................................................... "} &nbsp;&nbsp; ประธานกรรมการ<br>
                2. ${data.comm2 || "....................................................... "} &nbsp;&nbsp; กรรมการ<br>
                3. ${data.comm3 || "....................................................... "} &nbsp;&nbsp; กรรมการ
             </div>
           </div>

           <div style="margin-top: 30px; font-size: 12pt; color: #000; text-align: right;">
             <i>* เอกสารฉบับนี้จัดทำจากระบบงานแผนงานออนไลน์ (รหัสอ้างอิง: ${data.reqId})</i>
           </div>
           
           <script>
               window.onload = function() { 
                   setTimeout(function() { window.print(); }, 1000); 
               };
           <\/script>
         </body>
         </html>
       `;

            printWindow.document.open();
            printWindow.document.write(docHtml);
            printWindow.document.close();
        })
        .withFailureHandler(function(err) {
            printWindow.close();
            Swal.fire('ผิดพลาด', err.message, 'error');
        })
        .getDisbursementPrintData(reqId, clientUid);
}
// ==========================================
// 🌟 ฟังก์ชันเปิด/ปิด ตารางรายการพัสดุ (แนวนอนเต็มจอ)
// ==========================================
function toggleDisbApproveCard(reqId) {
    const detailRow = document.getElementById(`disb-app-detail-${reqId}`);
    if (detailRow) {
        detailRow.style.display = detailRow.style.display === 'none' ? 'table-row' : 'none';
    }
}
// ==========================================
// 🌟 โหลดหน้า "เบิกจ่ายของฉัน" (เปลี่ยนมาใช้เวอร์ชันตารางปกติที่เสถียรที่สุด)
// ==========================================
function loadDisbursementDashboardData() {
  const container = document.getElementById('disbursement-container');
  if (!container) return;
  
  const selectElem = document.getElementById('mydisb-year-filter');
  const selectedYear = selectElem ? selectElem.value : "";

  // ซ่อนกล่องส้มไว้ก่อนระหว่างโหลด
  const ownerSec = document.getElementById('owner-approval-section');
  if (ownerSec) ownerSec.style.display = 'none';

  if (window.AppCache && window.AppCache.disbProjects && window.AppCache.disbHistory) {
      renderDisbursementDashboard(window.AppCache.disbProjects, window.AppCache.disbHistory);
  } else {
      container.innerHTML = `<div style="text-align: center; padding: 50px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>กำลังโหลดประวัติการเบิกจ่าย...</p></div>`;
  }

  google.script.run
    .withSuccessHandler(function(projectsData) {
       window.AppCache = window.AppCache || {};
       window.AppCache.disbProjects = projectsData; 
       
       google.script.run
         .withSuccessHandler(function(historyData) {
            window.AppCache.disbHistory = historyData;
            window.globalDisbursementsData = historyData; 
            renderDisbursementDashboard(projectsData, historyData); 
            
            // 🌟 พระเอกอยู่ตรงนี้: สั่งไปดึงงานที่รออนุมัติมาโชว์
            if (typeof renderOwnerApprovals === 'function') {
                google.script.run
                  .withSuccessHandler(renderOwnerApprovals)
                  .getOwnerPendingApprovals(selectedYear);
            }
         })
         .getMyDisbursements(selectedYear); 
    })
    .withFailureHandler(function(err) {
       container.innerHTML = `<div style="text-align:center; color:red;">เกิดข้อผิดพลาด: ${err.message}</div>`;
    })
    .getDisbursementProjectSummary(selectedYear); 
}
// ==========================================
// 🌟 1. ฟังก์ชันโหลดแบบฟอร์ม Excel (Export Template)
// ==========================================
function downloadDisbTemplate() {
  // สร้างโครงสร้างข้อมูลพร้อมตัวอย่าง
  const ws_data = [
    ["ลำดับ", "ชื่อรายการ", "จำนวน", "หน่วยนับ", "ราคา/หน่วย"],
    [1, "กระดาษ A4 (ตัวอย่าง แทนที่ข้อความนี้ได้เลย)", 5, "รีม", 120],
    [2, "ปากกาน้ำเงิน (ตัวอย่าง แทนที่ข้อความนี้ได้เลย)", 10, "ด้าม", 5]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // ปรับความกว้างคอลัมน์ให้สวยงาม
  ws['!cols'] = [{wch: 8}, {wch: 40}, {wch: 10}, {wch: 15}, {wch: 15}];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายการจัดซื้อ");
  
  // สั่งดาวน์โหลด
  XLSX.writeFile(wb, "แบบฟอร์มรายการจัดซื้อจัดจ้าง_ผง2.xlsx");
}

// ==========================================
// 🌟 2. ฟังก์ชันนำเข้าข้อมูลจาก Excel (Import)
// ==========================================
function handleImportDisbExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  Swal.fire({ title: 'กำลังอ่านไฟล์ Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), customClass: { container: 'kanit-font' } });

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // แปลงข้อมูลเป็น Array (header: 1 หมายถึงอ่านเป็นบรรทัดๆ โดยเริ่มที่แถว 1)
      const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
      
      if (json.length <= 1) {
          Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลรายการในไฟล์ Excel ครับ', 'error');
          document.getElementById('import-excel-file').value = '';
          return;
      }

      // ล้างตารางเดิมให้เกลี้ยงก่อนเอาของใหม่ใส่
      const tbody = document.getElementById('disb-items-tbody');
      tbody.innerHTML = ''; 
      
      let importCount = 0;

      // วนลูปอ่านข้อมูลตั้งแต่แถวที่ 2 เป็นต้นไป (ข้ามหัวตาราง)
      for (let i = 1; i < json.length; i++) {
         const row = json[i];
         
         // ดักจับแถวว่าง (เช็คว่ามีชื่อรายการไหม ในคอลัมน์ที่ 2 หรือ index 1)
         if (row && row[1]) {
            const itemName = String(row[1]).replace(/(\(ตัวอย่าง ไม่ต้องลบแถวที่ 1-2\))/g, '').trim(); // ลบคำว่าตัวอย่างทิ้งถ้าครูเผลอไม่แก้
            const qty = Number(row[2]) || 0;
            const unit = row[3] ? String(row[3]).trim() : '';
            const price = Number(row[4]) || 0;

            if (itemName !== "") {
                // 1. จำลองการกดปุ่ม "เพิ่ม 1 แถว"
                addDisbursementItemRow();
                
                // 2. ดึงแถวล่าสุดที่เพิ่งสร้างขึ้นมา
                const lastRow = tbody.lastElementChild;
                
                // 3. หยอดข้อมูลลงในช่อง Input
                lastRow.querySelector('.item-name').value = itemName;
                lastRow.querySelector('.item-qty').value = qty;
                lastRow.querySelector('.item-unit').value = unit;
                lastRow.querySelector('.item-price').value = price;
                
                importCount++;
            }
         }
      }

      // สั่งคำนวณยอดเงินรวมใหม่ทั้งหมดทันที
      calculateDisbursementTotal();
      
      // เคลียร์ค่าไฟล์ เผื่อครูกดอัปโหลดไฟล์เดิมซ้ำจะได้ทำงานได้
      document.getElementById('import-excel-file').value = ''; 
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: `นำเข้าข้อมูลเรียบร้อยจำนวน ${importCount} รายการ`, customClass: { container: 'kanit-font' }});

    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'รูปแบบไฟล์ไม่ถูกต้อง หรืออ่านไฟล์ไม่ได้ครับ: ' + error.message, 'error');
      document.getElementById('import-excel-file').value = '';
    }
  };
  
  reader.readAsArrayBuffer(file);
}
// ==========================================
// 🌟 ฟังก์ชันสร้าง Progress Bar สถานะเอกสาร (ผง.2)
// ==========================================
function generateStatusStepper(status) {
    let step = 0;
    let isRejected = status.includes('ส่งกลับ') || status.includes('ไม่อนุมัติ') || status.includes('ไม่ผ่าน');

    // 🌟 แก้บัค: ดักจับคำว่า "รอเจ้าของโครงการ" ไม่ให้ไปตีกับคำว่า "อนุมัติ"
    if (status.includes('รอแนบบิล') || status.includes('รอกระทบยอด') || status.includes('กระทบยอดแล้ว') || (status.includes('อนุมัติ') && !status.includes('รอเจ้าของ') && !isRejected)) { 
        step = 6; isRejected = false; 
    }
    else if (status.includes('รอ ผอ.') || (status.includes('ผอ.') && !status.includes('รอง'))) step = 5;
    else if (status.includes('รอรอง ผอ.') || status.includes('รอง ผอ.')) step = 4;
    else if (status.includes('รอการเงิน') || status.includes('การเงิน')) step = 3;
    else if (status.includes('รอพัสดุ') || status.includes('พัสดุ')) step = 2;
    else if (status.includes('รอเจ้าของ')) step = 0; // เพิ่งเริ่ม ยังไม่ถึงด่านแผนงาน (step 1)
    else step = 1;

    const stepsData = [
        { id: 1, label: 'แผน', icon: 'fas fa-sitemap' },
        { id: 2, label: 'พัสดุ', icon: 'fas fa-boxes' },
        { id: 3, label: 'การเงิน', icon: 'fas fa-coins' },
        { id: 4, label: 'รองฯ', icon: 'fas fa-user-tie' },
        { id: 5, label: 'ผอ.', icon: 'fas fa-user-shield' }
    ];

    // 3. เริ่มวาด HTML
    let html = `<div style="display:flex; justify-content:space-between; position:relative; margin: 15px 0 10px 0; max-width: 100%; overflow-x: auto; padding-bottom: 5px;">`;
    
    // เส้นพื้นหลังสีเทา (ยาวสุด)
    html += `<div style="position:absolute; top:18px; left:10%; right:10%; height:4px; background:#ecf0f1; z-index:1; border-radius:2px;"></div>`;

    // เส้นสีวิ่งตามความคืบหน้า
    let progressWidth = step > 0 ? ((Math.min(step, 5) - 1) / 4) * 80 : 0;
    if (step === 6) progressWidth = 80; // เต็มหลอด
    let lineColor = isRejected ? '#e74c3c' : '#27ae60'; // ถ้าโดนตีกลับเส้นจะเป็นสีแดง
    
    html += `<div style="position:absolute; top:18px; left:10%; width:${progressWidth}%; height:4px; background:${lineColor}; z-index:1; transition: 0.5s ease; border-radius:2px;"></div>`;

    // 4. วาด Avatar แต่ละด่าน
    stepsData.forEach((s) => {
        let bgColor = '#fff', borderColor = '#d9e2ec', iconColor = '#bdc3c7', labelColor = '#95a5a6';
        let displayIcon = s.icon;
        let shadow = 'none';

        if (step === 6) {
            // กรณีจบปิ๊ง (อนุมัติหมดแล้ว) -> เป็นสีเขียวติ๊กถูกทั้งหมด
            bgColor = '#27ae60'; borderColor = '#27ae60'; iconColor = '#fff'; labelColor = '#27ae60';
            displayIcon = s.id === 5 ? 'fas fa-check-double' : 'fas fa-check';
        } 
        else if (s.id < step) {
            // ด่านที่ผ่านไปแล้ว -> สีเขียวติ๊กถูก
            bgColor = '#27ae60'; borderColor = '#27ae60'; iconColor = '#fff'; labelColor = '#27ae60';
            displayIcon = 'fas fa-check';
        } 
        else if (s.id === step) {
            // ด่านปัจจุบันที่กำลังรออยู่
            if (isRejected) {
                // โดนตีกลับ -> สีแดง กากบาท
                bgColor = '#e74c3c'; borderColor = '#e74c3c'; iconColor = '#fff'; labelColor = '#e74c3c';
                displayIcon = 'fas fa-times';
                shadow = '0 0 8px rgba(231, 76, 60, 0.4)';
            } else {
                // รอตรวจปกติ -> สีฟ้า กระพริบเบาๆ (Pulse)
                bgColor = '#eaf2f8'; borderColor = '#3498db'; iconColor = '#3498db'; labelColor = '#3498db';
                shadow = '0 0 10px rgba(52, 152, 219, 0.3)';
            }
        }

        html += `
        <div style="position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; flex:1; min-width:55px;">
            <div style="width:40px; height:40px; border-radius:50%; background:${bgColor}; border:3px solid ${borderColor}; display:flex; justify-content:center; align-items:center; color:${iconColor}; font-size:16px; box-shadow: ${shadow}; transition:0.3s; background-clip: padding-box;">
                <i class="${displayIcon}"></i>
            </div>
            <div style="font-size:0.75rem; font-weight:bold; color:${labelColor}; margin-top:6px; text-align:center; font-family:'Kanit'; line-height:1.1; word-break: keep-all;">${s.label}</div>
        </div>`;
    });

    html += `</div>`;
    return html;
}
// ==========================================
// 🌟 ฟังก์ชันเช็คเอกสารค้างเกินกำหนด (SLA Tracking)
// ==========================================
let html = '';
   let count = 0;

   // ==========================================
   // 🌟 ฟังก์ชันย่อย: เช็คเอกสารค้างเกินกำหนด (SLA)
   // ==========================================
   function checkOverdue(dateString, currentStatus) {
       const finishedStatuses = ['อนุมัติ', 'เสร็จสิ้น', 'กระทบยอดแล้ว', 'ไม่อนุมัติ', 'ตีกลับ', 'ส่งกลับแก้ไข', 'แบบร่าง'];
       const isFinished = finishedStatuses.some(s => currentStatus.includes(s));
       if (isFinished) return { isOverdue: false, badgeHtml: '' };

       try {
           let submitDate;
           if (dateString.includes('T') || dateString.includes('-')) {
               submitDate = new Date(dateString);
           } else {
               let parts = dateString.split(' ');
               let dmy = parts[0].split('/');
               let time = parts[1] || '00:00:00';
               submitDate = new Date(`${dmy[2]}-${dmy[1]}-${dmy[0]}T${time}`); 
           }
           
           let diffDays = Math.floor((new Date() - submitDate) / (1000 * 60 * 60 * 24));
           if (diffDays >= 2) {
               return {
                   isOverdue: true,
                   badgeHtml: `<div style="background:#e74c3c; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold; display:inline-block; margin-top:6px; animation: pulse-alert 1.5s infinite; box-shadow: 0 2px 4px rgba(231,76,60,0.3);"><i class="fas fa-exclamation-triangle"></i> ค้างมา ${diffDays} วัน</div>`
               };
           }
       } catch (e) { console.error("Parse date error:", e); }
       
       return { isOverdue: false, badgeHtml: '' };
   }

   globalAllDisbAdminData.forEach(item => {
       let safeReqId = String(item.reqId || "").toLowerCase();
       let safeProj = String(item.projectName || "").toLowerCase();
       let safeReq = String(item.requester || "").toLowerCase();
       let safeStatus = String(item.status || "");
       let safeSup = String(item.supplyStatus || "-");
       let safeRec = String(item.reconStatus || "-");

       // 🌟 เช็คว่าเอกสารค้างหรือไม่
       let overdueCheck = checkOverdue(item.timestamp, safeStatus);

       let matchSearch = searchTxt === "" || safeReqId.includes(searchTxt) || safeProj.includes(searchTxt) || safeReq.includes(searchTxt);
       
       let matchStatus = true;
       if (statusFilter === 'รอ') matchStatus = safeStatus.includes('รอ');
       else if (statusFilter === 'อนุมัติ') matchStatus = safeStatus.includes('อนุมัติ') && !safeStatus.includes('ไม่อนุมัติ');
       else if (statusFilter === 'ตีกลับ') matchStatus = safeStatus.includes('ส่งกลับ') || safeStatus.includes('ไม่อนุมัติ');
       // 🌟 กรองเฉพาะรายการที่ค้างเกิน 2 วัน
       else if (statusFilter === 'ค้าง') matchStatus = overdueCheck.isOverdue;

       if (matchSearch && matchStatus) {
           count++;
           
           let mainStatusColor = '#95a5a6';
           if (safeStatus.includes('อนุมัติ') && !safeStatus.includes('ไม่อนุมัติ')) mainStatusColor = '#27ae60';
           else if (safeStatus.includes('รอ')) mainStatusColor = '#f39c12';
           else if (safeStatus.includes('ตีกลับ') || safeStatus.includes('ไม่อนุมัติ')) mainStatusColor = '#e74c3c';

           let supColor = safeSup === 'จัดทำเอกสารแล้ว' ? '#27ae60' : (safeSup === 'รอจัดทำเอกสาร' ? '#f39c12' : '#95a5a6');
           let recColor = safeRec === 'กระทบยอดแล้ว' ? '#27ae60' : (safeRec === 'รอแนบบิล' ? '#e74c3c' : '#3498db');

           let itemsListHtml = '';
           if (item.items && item.items.length > 0) {
              itemsListHtml = `<details style="cursor:pointer; background:#fdfefe; border:1px solid #ecf0f1; border-radius:4px; padding:4px;">
                 <summary style="font-weight:bold; color:#2980b9; outline:none; user-select:none;"><i class="fas fa-box-open"></i> กางดู ${item.items.length} รายการ</summary>
                 <ul style="margin:5px 0 0 0; padding-left:15px; color:#555; list-style-type:square;">`;
              item.items.forEach(it => { itemsListHtml += `<li>${it.name} <span style="font-size:0.75rem; color:#95a5a6;">(${it.qty} ${it.unit})</span></li>`; });
              itemsListHtml += `</ul></details>`;
           } else {
              itemsListHtml = '<span style="color:#e74c3c; font-size:0.8rem;">ไม่มีรายการ</span>';
           }

           let remainColor = item.remaining < 0 ? '#e74c3c' : '#27ae60';

           // 🌟 ถ้าค้าง ให้เปลี่ยนสีพื้นหลังของแถวนั้นเป็นสีแดงอ่อน
           let rowStyle = overdueCheck.isOverdue 
              ? `background: #fdf2e9; border-left: 4px solid #e74c3c; transition: 0.2s; vertical-align:top;`
              : `border-bottom: 1px solid #ecf0f1; transition: 0.2s; vertical-align:top;`;

           html += `<tr style="${rowStyle}" onmouseover="this.style.background='#f9fbfc'" onmouseout="this.style.background='${overdueCheck.isOverdue ? '#fdf2e9' : 'transparent'}'">
               <td style="padding: 12px;">
                  <div style="font-weight: bold; color: #8e44ad;">${item.reqId}</div>
                  <div style="color: #7f8c8d; font-size: 0.8rem; margin-top: 3px;"><i class="far fa-clock"></i> ${item.timestamp}</div>
               </td>
               <td style="padding: 12px;">
                  <div style="font-weight: 500; color: #2c3e50; line-height: 1.3; margin-bottom: 5px;">${item.projectName}</div>
                  <div style="font-size: 0.8rem; color: #95a5a6; margin-bottom: 2px;">[รหัส: ${item.projectId}]</div>
                  <div style="font-size: 0.85rem; color: #2980b9;"><i class="fas fa-user"></i> ${item.requester}</div>
               </td>
               <td style="padding: 12px;">
                  <span style="background: #f4f6f8; color: #34495e; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #bdc3c7; display: inline-block; line-height:1.2;">${item.source}</span>
               </td>
               <td style="padding: 12px; text-align: right; color: #34495e; font-weight:bold;">${Number(item.allocated).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; color: #7f8c8d;">${Number(item.usedBefore).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; font-weight: bold; color: #c0392b; font-size:1.05rem;">${Number(item.total).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px; text-align: right; font-weight: bold; color: ${remainColor}; font-size:1.05rem;">${Number(item.remaining).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
               <td style="padding: 12px;">${itemsListHtml}</td>
               <td style="padding: 12px; text-align: center;">
                  <div style="margin-bottom:3px;"><span style="background:${mainStatusColor}; color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem; display:inline-block; line-height:1.3;">${safeStatus}</span></div>
                  <!-- 🌟 แปะป้ายกระพริบเตือนถ้าค้าง -->
                  ${overdueCheck.badgeHtml}
                  <div style="font-size:0.75rem; color:${supColor}; margin-top:5px; margin-bottom:2px;"><i class="fas fa-box"></i> ${safeSup}</div>
                  <div style="font-size:0.75rem; color:${recColor};"><i class="fas fa-coins"></i> ${safeRec}</div>
               </td>
           </tr>`;
       }
   });
// 🌟 1. ฟังก์ชันจัดการตารางพัสดุใน Modal (เพิ่มแถว และคำนวณเงิน)
function addGenItemRow(name = "", qty = 1, unit = "", price = 0) {
    const tbody = document.getElementById('gen-items-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding:4px; border:1px solid #bdc3c7;"><input type="text" class="gen-item-name" value="${name}" style="width:100%; padding:6px; border:1px solid #ccc; font-family:'Kanit'; box-sizing:border-box;"></td>
        <td style="padding:4px; border:1px solid #bdc3c7;"><input type="number" class="gen-item-qty" value="${qty}" style="width:100%; padding:6px; border:1px solid #ccc; font-family:'Kanit'; box-sizing:border-box;" onchange="calcGenTotal()"></td>
        <td style="padding:4px; border:1px solid #bdc3c7;"><input type="text" class="gen-item-unit" value="${unit}" style="width:100%; padding:6px; border:1px solid #ccc; font-family:'Kanit'; box-sizing:border-box;"></td>
        <td style="padding:4px; border:1px solid #bdc3c7;"><input type="number" class="gen-item-price" value="${price}" style="width:100%; padding:6px; border:1px solid #ccc; font-family:'Kanit'; box-sizing:border-box;" onchange="calcGenTotal()"></td>
        <td style="padding:4px; border:1px solid #bdc3c7; text-align:center;"><button type="button" onclick="this.closest('tr').remove(); calcGenTotal();" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    calcGenTotal();
}

function calcGenTotal() {
    let total = 0;
    const qtys = document.querySelectorAll('.gen-item-qty');
    const prices = document.querySelectorAll('.gen-item-price');
    for(let i=0; i<qtys.length; i++) { total += (Number(qtys[i].value) * Number(prices[i].value)); }
    const vat = Number(document.getElementById('gen-vat-amount').value) || 0;
    document.getElementById('gen-grand-total').value = total + vat;
}

// 🌟 2. เปิด Modal (ดึงประวัติมาแสดง และดึงรายการของต้นฉบับมาแปะ)
function getSupplyAccountGroup(src) {
  const s = String(src || "").trim();
  if (!s || s === '-' || s === 'ไม่ระบุแหล่งงบ') return "";
  if (s.includes('รายหัว')) return 'เงินอุดหนุนรายหัว';
  if (s.includes('พัฒนาผู้เรียน')) return 'เงินค่ากิจกรรมพัฒนาผู้เรียน';
  if (s.includes('รายได้')) return 'เงินรายได้สถานศึกษา';
  if (s.includes('ลูกเสือ')) return 'เงินบำรุงลูกเสือ';
  return s.replace(/^อำนวยการ-/, '').trim();
}

function openSupplyDocModal(reqId, actionType) {
  document.getElementById('gen-req-id').value = reqId;
  document.getElementById('gen-action-type').value = actionType || "จัดซื้อ";

  document.getElementById('gen-vendor').value = "";
  document.getElementById('gen-items-tbody').innerHTML = '';
  document.getElementById('gen-rec-reg-no').value = "";
  document.getElementById('gen-contract-no').value = "";
  document.getElementById('gen-book-no').value = "";
  document.getElementById('gen-bill-no').value = "";
  document.getElementById('gen-payer').value = "";

  Swal.fire({ title: 'กำลังดึงข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  google.script.run.withSuccessHandler(vendors => {
    const dataList = document.getElementById('vendor-options');
    if (dataList) {
      dataList.innerHTML = '';
      vendors.forEach(v => {
        let option = document.createElement('option');
        option.value = v;
        dataList.appendChild(option);
      });
    }
  }).getVendorList();

  const cachedReq = (typeof globalSupplyDocsData !== 'undefined') ? globalSupplyDocsData.find(d => d.reqId === reqId) : null;
  const sourceByName = {};
  if (cachedReq && cachedReq.items) {
    cachedReq.items.forEach(it => {
      if (it.name && it.fundingSource) sourceByName[it.name] = it.fundingSource;
    });
  }

  google.script.run
    .withSuccessHandler(data => {
      Swal.close();

      let today = new Date();
      let dReceipt = today.toISOString().split('T')[0];
      let dReq = new Date(today);
      dReq.setDate(dReq.getDate() - 7);
      let dReqStr = dReq.toISOString().split('T')[0];

      if (data && data.history) {
        document.getElementById('gen-req-date').value = data.history.reqDate || dReqStr;
        document.getElementById('gen-rec-reg-no').value = data.history.recRegNo || "";
        document.getElementById('gen-vendor').value = data.history.vendor || "";
        document.getElementById('gen-contract-type').value = data.history.contractType || "ตกลง";
        document.getElementById('gen-contract-no').value = data.history.contractNo || "";
        document.getElementById('gen-contract-date').value = data.history.contractDate || dReqStr;
        document.getElementById('gen-delivery-date').value = data.history.deliveryDate || dReceipt;
        document.getElementById('gen-receipt-date').value = data.history.dueDate || dReceipt;
        document.getElementById('gen-receipt-type').value = data.history.receiptType || "ใบเสร็จรับเงิน";
        document.getElementById('gen-book-no').value = data.history.bookNo || "";
        document.getElementById('gen-bill-no').value = data.history.billNo || "";
        document.getElementById('gen-pay-method').value = data.history.payMethod || "สำรองจ่าย";
        document.getElementById('gen-payer').value = data.history.payer || "";
        document.getElementById('gen-pay-date').value = data.history.payDate || dReceipt;
      } else {
        document.getElementById('gen-req-date').value = dReqStr;
        document.getElementById('gen-contract-date').value = dReqStr;
        document.getElementById('gen-delivery-date').value = dReceipt;
        document.getElementById('gen-receipt-date').value = dReceipt;
        document.getElementById('gen-pay-date').value = dReceipt;
      }

      // 1. ดึงรายการพัสดุ (เรียงลำดับ: ประวัติที่เคยแก้ -> ชีต Disbursement_Items -> ข้อมูลหน้าเว็บ)
      let itemsToLoad = [];
      if (data && data.history && data.history.items && data.history.items.length > 0) {
        itemsToLoad = data.history.items;
      } else if (data && data.original && data.original.items && data.original.items.length > 0) {
        itemsToLoad = data.original.items.filter(it => it.name !== '#SYS_VAT#' && it.name !== '#SYS_SHIPPING#');
      } else if (cachedReq && cachedReq.items && cachedReq.items.length > 0) {
        itemsToLoad = cachedReq.items.filter(it => it.name !== '#SYS_VAT#' && it.name !== '#SYS_SHIPPING#');
      }

      // 2. จัดกลุ่มบัญชีงบประมาณ
      window.currentGenItemsWithSource = itemsToLoad.map(it => {
        let rawSrc = it.fundingSource || sourceByName[it.name] || "";
        return {
          ...it,
          fundingSource: rawSrc,
          accountGroup: getSupplyAccountGroup(rawSrc)
        };
      });

      const uniqueGroups = [...new Set(window.currentGenItemsWithSource.map(it => it.accountGroup).filter(g => g))];
      const itemsTable = document.getElementById('gen-items-tbody')?.closest('table');
      let filterBox = document.getElementById('gen-source-filter-box');
      if (!filterBox && itemsTable) {
        filterBox = document.createElement('div');
        filterBox.id = 'gen-source-filter-box';
        filterBox.style.cssText = 'margin-bottom:10px; padding:10px; background:#fef9e7; border:1px solid #f7dc6f; border-radius:6px;';
        itemsTable.parentNode.insertBefore(filterBox, itemsTable);
      }

      if (filterBox) {
        if (uniqueGroups.length > 1) {
          let opts = `<option value="ALL">-- แสดงทุกรายการ (รวมทุกบัญชี) --</option>` +
            uniqueGroups.map(g => `<option value="${g}">เฉพาะบัญชี: ${g}</option>`).join('');
          filterBox.innerHTML = `
            <label style="display:block; font-size:0.85rem; font-weight:bold; color:#b7950b; margin-bottom:4px;">
              📌 คำขอนี้มีหลายบัญชีงบประมาณ — เลือกบัญชีที่ต้องการดึงรายการไปสร้างเอกสารชุดนี้:
            </label>
            <select id="gen-source-filter" onchange="filterGenItemsBySource()" style="width:100%; padding:6px 10px; border:1px solid #f1c40f; border-radius:4px; font-family:'Kanit'; font-weight:bold;">
              ${opts}
            </select>`;
          filterBox.style.display = 'block';
        } else {
          filterBox.style.display = 'none';
        }
      }

      // 3. วาดแถวรายการพัสดุลงตาราง
      if (window.currentGenItemsWithSource.length > 0) {
        window.currentGenItemsWithSource.forEach(it => addGenItemRow(it.name, it.qty, it.unit, it.price));
      } else {
        addGenItemRow();
      }

      // 4. ดึงค่า VAT (เรียงลำดับ: ประวัติที่เคยแก้ -> ชีต Disbursement_Items -> ข้อมูลหน้าเว็บ)
      let originalVat = 0;
      if (cachedReq && cachedReq.items) {
        const vatItem = cachedReq.items.find(it => it.name === '#SYS_VAT#');
        if (vatItem) originalVat = Number(vatItem.price) || 0;
      }

      document.getElementById('gen-vat-amount').value =
        (data && data.history && data.history.vat !== undefined)
          ? data.history.vat
          : ((data && data.original && data.original.vat) ? data.original.vat : originalVat);

      // 5. คำนวณยอดเงินรวมทั้งสิ้นให้ตรงกับรายการในตาราง + VAT
      if (data && data.history && data.history.grandTotal) {
        document.getElementById('gen-grand-total').value = data.history.grandTotal;
      } else {
        calcGenTotal();
      }

      document.getElementById('supplyDocModal').style.display = 'flex';
    })
    .withFailureHandler(() => {
      Swal.close();
      Swal.fire('ข้อผิดพลาด', 'ดึงข้อมูลไม่สำเร็จ', 'error');
      document.getElementById('supplyDocModal').style.display = 'flex';
    })
    .getProcurementDataWithOriginal(reqId);
}
function filterGenItemsBySource() {
  const selectedGroup = document.getElementById('gen-source-filter')?.value || 'ALL';
  const tbody = document.getElementById('gen-items-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = (window.currentGenItemsWithSource || []).filter(it =>
    selectedGroup === 'ALL' || it.accountGroup === selectedGroup
  );

  let sum = 0;
  if (filtered.length > 0) {
    filtered.forEach(it => {
      addGenItemRow(it.name, it.qty, it.unit, it.price);
      sum += (Number(it.qty) || 0) * (Number(it.price) || 0);
    });
  } else {
    addGenItemRow();
  }

  const vat = Number(document.getElementById('gen-vat-amount')?.value) || 0;
  document.getElementById('gen-grand-total').value = Number((sum + vat).toFixed(2));
}
// สั่งสร้างเอกสาร
function executeGenerateWord() {
  const btn = document.getElementById('btn-generate-word');

  // กวาดรายการพัสดุจากตาราง
  const itemNames = document.querySelectorAll('.gen-item-name');
  const itemQtys = document.querySelectorAll('.gen-item-qty');
  const itemUnits = document.querySelectorAll('.gen-item-unit');
  const itemPrices = document.querySelectorAll('.gen-item-price');
  let itemsList = [];
  for (let i = 0; i < itemNames.length; i++) {
    if (itemNames[i].value.trim() !== '') {
      itemsList.push({
        name: itemNames[i].value.trim(),
        qty: Number(itemQtys[i].value) || 0,
        unit: itemUnits[i].value.trim(),
        price: Number(itemPrices[i].value) || 0
      });
    }
  }

  if (itemsList.length === 0) {
    Swal.fire('ข้อผิดพลาด', 'กรุณาระบุพัสดุอย่างน้อย 1 รายการ', 'warning');
    return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังผสานเอกสาร...';
  btn.disabled = true;

  const reqId = document.getElementById('gen-req-id').value;
  const cachedReq = (typeof globalSupplyDocsData !== 'undefined')
    ? globalSupplyDocsData.find(d => d.reqId === reqId)
    : null;

  // ถ้ามีการเลือกกรองเฉพาะบัญชีงบประมาณ ให้ใช้ชื่อบัญชีนั้นลงในเอกสาร Word
  const selectedSourceEl = document.getElementById('gen-source-filter');
  let finalFundingSource = (cachedReq && cachedReq.fundingSource && cachedReq.fundingSource !== '-')
    ? cachedReq.fundingSource
    : "งบประมาณที่ได้รับจัดสรร";
  if (selectedSourceEl && selectedSourceEl.value && selectedSourceEl.value !== 'ALL') {
    finalFundingSource = selectedSourceEl.value;
  }

  const payload = {
    reqId: reqId,
    actionType: document.getElementById('gen-action-type').value,
    reqDate: document.getElementById('gen-req-date').value,
    recRegNo: document.getElementById('gen-rec-reg-no').value || "-",

    vendor: document.getElementById('gen-vendor').value || "...........................................",
    contractType: document.getElementById('gen-contract-type').value,
    contractNo: document.getElementById('gen-contract-no').value || "-",
    contractDate: document.getElementById('gen-contract-date').value,

    deliveryDate: document.getElementById('gen-delivery-date').value,
    receiptDate: document.getElementById('gen-receipt-date').value,

    receiptType: document.getElementById('gen-receipt-type').value,
    bookNo: document.getElementById('gen-book-no').value || "-",
    billNo: document.getElementById('gen-bill-no').value || "-",

    payMethod: document.getElementById('gen-pay-method').value,
    payer: document.getElementById('gen-payer').value || "...........................................",
    payDate: document.getElementById('gen-pay-date').value,

    grandTotal: Number(document.getElementById('gen-grand-total').value) || 0,
    vatAmount: Number(document.getElementById('gen-vat-amount').value) || 0,
    items: itemsList,

    // แนบข้อมูลจริงของคำขอเบิกไปให้ Code.gs ใช้แทนข้อมูลจำลอง
    requester: cachedReq ? (cachedReq.requesterName || "-") : "-",
    section: cachedReq ? (cachedReq.projectSection || "-") : "-",
    projectName: cachedReq ? (cachedReq.projectName || "-") : "-",
    fundingSource: finalFundingSource,
    objective: cachedReq ? (cachedReq.objective || "การดำเนินงานของโครงการ") : "-",
    comm1: cachedReq ? (cachedReq.comm1 || "-") : "-",
    comm2: cachedReq ? (cachedReq.comm2 || "-") : "-",
    comm3: cachedReq ? (cachedReq.comm3 || "-") : "-"
  };

  google.script.run
    .withSuccessHandler(url => {
      btn.innerHTML = '<i class="fas fa-magic"></i> สร้างเอกสาร Word';
      btn.disabled = false;
      document.getElementById('supplyDocModal').style.display = 'none';
      Swal.fire('สำเร็จ!', 'ดาวน์โหลดไฟล์เรียบร้อย', 'success');
      window.location.href = url;
    })
    .withFailureHandler(err => {
      Swal.fire('ผิดพลาด', err.message, 'error');
      btn.innerHTML = '<i class="fas fa-magic"></i> สร้างเอกสาร Word';
      btn.disabled = false;
    })
    .generateProcurementWord(payload);
}
// 🌟 1. ฟังก์ชันวาดตารางตะกร้างานเจ้าของโครงการ
function renderOwnerApprovals(approvals) {
    const section = document.getElementById('owner-approval-section');
    const tbody = document.getElementById('owner-approval-tbody');
    if (!section || !tbody) return;
    
    if (!approvals || approvals.length === 0) {
        section.style.display = 'none'; 
        return;
    }
    
    section.style.display = 'block'; 
    let html = '';
    approvals.forEach(a => {
        // 🌟 สร้างปุ่มดูเอกสารแนบ (ถ้าผู้ขอเบิกแนบมา)
        let attachHtml = a.docUrl ? `<div style="margin-top:8px;"><a href="${a.docUrl}" target="_blank" style="display:inline-block; background:#eaf2f8; color:#2980b9; padding:4px 8px; border-radius:4px; text-decoration:none; font-size:0.8rem; border:1px solid #d9e2ec;"><i class="fas fa-paperclip"></i> เปิดดูเอกสารแนบ</a></div>` : '';
        
        // 🌟 สร้างปุ่มเปิดดูใบ ผง.2 เต็มรูปแบบ
        let printBtnHtml = `<button onclick="printDisbursementDocument('${a.reqId}')" style="background:#f39c12; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-size:0.85rem; width:100%; margin-bottom: 5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"><i class="fas fa-file-pdf"></i> ดูใบ ผง.2 เพื่อตรวจสอบ</button>`;
        
        html += `
        <tr style="border-bottom: 1px dashed #ecf0f1; background:#fffdf5;">
            <td style="padding: 15px; width: 25%;">
                <div style="font-weight:bold; color:#2980b9;">${a.reqId}</div>
                <div style="font-size:0.8rem; color:#7f8c8d;">${a.timestamp}</div>
                <div style="font-size:0.85rem; color:#8e44ad; font-weight:bold; margin-top:5px;"><i class="fas fa-folder"></i> ${a.projectName}</div>
            </td>
            <td style="padding: 15px; width: 40%;">
                <div style="font-weight:bold; color:#2c3e50;"><i class="fas fa-user-circle"></i> ผู้ขอเบิก: <span style="color:#d35400;">${a.requester}</span></div>
                <div style="font-size:0.85rem; color:#555; margin-top:5px;"><i class="fas fa-info-circle"></i> <b>รายการ:</b> ${a.detail}</div>
                ${attachHtml}
            </td>
            <td style="padding: 15px; text-align: right; width: 15%;">
                <span style="font-weight:bold; color:#c0392b; font-size:1.15rem;">${a.total.toLocaleString()}</span> บ.
            </td>
            <td style="padding: 15px; text-align: center; width: 20%;">
                <div style="display:flex; flex-direction:column; width:100%;">
                    ${printBtnHtml}
                    <div style="display:flex; gap:5px; justify-content:center; width:100%;">
                        <button onclick="actionProjectOwnerApproval('${a.reqId}', 'approve')" style="flex:1; background:#27ae60; color:white; border:none; padding:6px 5px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-size:0.85rem; box-shadow:0 2px 4px rgba(39,174,96,0.3);"><i class="fas fa-check-circle"></i> อนุมัติ</button>
                        <button onclick="actionProjectOwnerApproval('${a.reqId}', 'return')" style="flex:1; background:#fff; color:#e74c3c; border:1px solid #e74c3c; padding:6px 5px; border-radius:4px; cursor:pointer; font-family:'Kanit'; font-size:0.85rem; transition:0.2s;"><i class="fas fa-undo"></i> ตีกลับ</button>
                    </div>
                </div>
            </td>
        </tr>
        `;
    });
    tbody.innerHTML = html;
}

// 🌟 2. ฟังก์ชันจับจังหวะกดปุ่มอนุมัติ/ตีกลับ
function actionProjectOwnerApproval(reqId, action) {
    let title = action === 'approve' ? '<span style="color:#27ae60;"><i class="fas fa-check-circle"></i> ยืนยันอนุมัติเบิกจ่าย?</span>' : '<span style="color:#e74c3c;"><i class="fas fa-undo"></i> ตีกลับให้แก้ไข?</span>';
    let confirmText = action === 'approve' ? 'อนุมัติรายการนี้' : 'ยืนยันการตีกลับ';
    let btnColor = action === 'approve' ? '#27ae60' : '#e74c3c';
    
    Swal.fire({
        title: title,
        html: `
            <div style="text-align:left; font-size:0.95rem; margin-bottom:10px; color:#2c3e50;">รหัสคำขอ: <b>${reqId}</b></div>
            <textarea id="owner-comment" class="swal2-textarea" style="font-family:'Kanit'; font-size:0.95rem; margin:0; width:100%; box-sizing:border-box;" placeholder="พิมพ์ข้อความ/เหตุผลเพิ่มเติม ${action==='return' ? '(บังคับ)' : '(ถ้ามี)'}..."></textarea>
        `,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        cancelButtonColor: '#bdc3c7',
        confirmButtonText: confirmText,
        cancelButtonText: 'ยกเลิก',
        customClass: { container: 'kanit-font' },
        preConfirm: () => {
            const comment = document.getElementById('owner-comment').value.trim();
            if (action === 'return' && !comment) {
                Swal.showValidationMessage('กรุณาระบุเหตุผลที่ตีกลับให้ชัดเจนด้วยครับ');
                return false;
            }
            return comment;
        }
    }).then(result => {
        if(result.isConfirmed) {
            Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            google.script.run
                .withSuccessHandler(res => {
                    Swal.fire('สำเร็จ', res.message, 'success').then(() => {
                        loadDisbursementDashboardData(); // รีเฟรชหน้าเว็บใหม่
                    });
                })
                .withFailureHandler(err => Swal.fire('ผิดพลาด', err.message, 'error'))
                .processDisbursementReview({ reqId: reqId, action: action, comment: result.value });
        }
    });
}
// ==========================================
// 🌟 ฟังก์ชันแปลงไฟล์หลายไฟล์ให้อยู่ในรูปแบบที่ส่งไป Google Drive ได้
// ==========================================
function getMultipleFilesBase64(files) {
    return Promise.all(Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                resolve({
                    name: file.name,
                    mimeType: file.type,
                    base64: e.target.result.split(',')[1]
                });
            };
            reader.onerror = err => reject(err);
            reader.readAsDataURL(file);
        });
    }));
}
// =========================================================================
// ระบบสร้างรายงานผลการดำเนินงานรอบ 6 เดือน (พร้อมวางในเล่มรายงาน)
// =========================================================================
function openSixMonthReportModal(periodMode = '6M') {
  const yearSelect = document.getElementById('all-year-filter');
  let selectedYr = yearSelect ? String(yearSelect.value || '').trim() : '';
  if (!selectedYr || selectedYr.toLowerCase() === 'all') {
    selectedYr = (typeof currentFiscalYear !== 'undefined' && currentFiscalYear)
      ? String(currentFiscalYear).replace(/^25/, '')
      : '70';
  }
  const yr = selectedYr.replace(/^25/, '');

  Swal.fire({
    title: 'กำลังประมวลผลรายงานรอบ 6 เดือน...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  google.script.run
    .withSuccessHandler(res => {
      const s = res.summary;
      const dev = res.devSummary || { count: 0, completed: 0, inProgress: 0, notStarted: 0, allocated: 0, spent: 0, remaining: 0, percent: 0 };
      const adm = res.adminSummary || { count: 0, completed: 0, inProgress: 0, notStarted: 0, allocated: 0, spent: 0, remaining: 0, percent: 0 };
      const fmt = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const pctOf = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

      // =====================================================
      // 2.1 ตารางสรุปแยกประเภทงบประมาณ (พัฒนาคุณภาพ vs บริหารจัดการ)
      // =====================================================
      const budgetTypeRows = (res.budgetTypes || []).map((bt, idx) => `
        <tr>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:6px;">${bt.label}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${bt.count}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${bt.completed}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${bt.inProgress}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${bt.notStarted}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(bt.allocated)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(bt.spent)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(bt.remaining)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${bt.percent.toFixed(2)}%</td>
        </tr>
      `).join('');

      // =====================================================
      // 2.2 ตารางสรุปแยกตาม 4 กลุ่มบริหารงาน
      // =====================================================
      const deptRows = (res.departments || []).map((d, idx) => `
        <tr>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:6px;">${d.deptName}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${d.count}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${d.completed}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${d.inProgress}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${d.notStarted}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(d.allocated)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(d.spent)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(d.remaining)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${d.percent.toFixed(2)}%</td>
        </tr>
      `).join('');

      // =====================================================
      // 2.3 ตารางสรุปสถานะการเบิกจ่ายแยกตามแหล่งงบประมาณ
      // =====================================================
      const fundList = res.fundingSources || [];
      const fundAllocTotal = fundList.reduce((acc, f) => acc + f.allocated, 0);
      const fundSpentTotal = fundList.reduce((acc, f) => acc + f.spent, 0);
      const fundRemTotal = fundAllocTotal - fundSpentTotal;
      const fundPctTotal = fundAllocTotal > 0 ? ((fundSpentTotal / fundAllocTotal) * 100).toFixed(2) : '0.00';

      const fundRows = fundList.length > 0
        ? fundList.map((f, idx) => `
          <tr>
            <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:6px;">${f.source}</td>
            <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(f.allocated)}</td>
            <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(f.spent)}</td>
            <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(f.remaining)}</td>
            <td style="border:1px solid #000; padding:6px; text-align:center;">${f.percent.toFixed(2)}%</td>
          </tr>
        `).join('')
        : `<tr><td colspan="6" style="border:1px solid #000; padding:8px; text-align:center;">ไม่พบข้อมูลแหล่งงบประมาณ</td></tr>`;

      const centralNote = s.centralSpent > 0
        ? `<p style="font-size:14.5pt; margin:4px 0 14px 0; color:#333;"><i>หมายเหตุ: ไม่รวมการเบิกจ่ายสมทบจากงบอำนวยการกลาง จำนวน ${fmt(s.centralSpent)} บาท</i></p>`
        : '';

      // =====================================================
      // ฟังก์ชันสร้างตารางรายโครงการแยกตาม กลุ่มบริหารงาน -> ชื่องานย่อย (Section)
      // ใช้เหมือนกันทั้งส่วนที่ 3 (งบพัฒนาคุณภาพ) และส่วนที่ 4 (งบบริหารจัดการ)
      // =====================================================
      const buildProjectGroupTables = (projList, categoryLabel) => {
        if (!projList || projList.length === 0) {
          return `<p style="margin:6px 0 14px 1.5em; color:#555;">ไม่มีโครงการที่ได้รับอนุมัติในหมวด${categoryLabel}</p>`;
        }

        const activeDepts = (res.departments || []).filter(dept =>
          projList.some(p => p.deptNum === dept.deptNum)
        );

        let groupHtml = activeDepts.map((dept, dIdx) => {
          const deptProjs = projList.filter(p => p.deptNum === dept.deptNum);
          const deptAlloc = deptProjs.reduce((sum, p) => sum + p.allocated, 0);
          const deptSpent = deptProjs.reduce((sum, p) => sum + p.spent, 0);
          const deptRem = deptAlloc - deptSpent;
          const deptPct = deptAlloc > 0 ? ((deptSpent / deptAlloc) * 100).toFixed(2) : '0.00';

          let currentSecKey = null;
          let projSeq = 0;
          let rowsHtml = '';

          deptProjs.forEach(p => {
            const secKey = `${p.secNum}||${p.secName}`;
            if (secKey !== currentSecKey) {
              currentSecKey = secKey;
              rowsHtml += `
                <tr style="background-color:#eef4fb; font-weight:bold;">
                  <td colspan="8" style="border:1px solid #000; padding:6px 8px;">${p.secName}</td>
                </tr>
              `;
            }
            projSeq++;
            rowsHtml += `
              <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${projSeq}</td>
                <td style="border:1px solid #000; padding:5px;">${p.name}</td>
                <td style="border:1px solid #000; padding:5px;">${p.owner}</td>
                <td style="border:1px solid #000; padding:5px; text-align:right;">${fmt(p.allocated)}</td>
                <td style="border:1px solid #000; padding:5px; text-align:right;">${fmt(p.spent)}</td>
                <td style="border:1px solid #000; padding:5px; text-align:right;">${fmt(p.remaining)}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${p.status}</td>
                <td style="border:1px solid #000; padding:5px;">${p.note}</td>
              </tr>
            `;
          });

          return `
            <p style="font-weight:bold; font-size:16pt; margin:14px 0 6px 0;">${dIdx + 1}. ${dept.deptName}</p>
            <table style="width:100%; border-collapse:collapse; font-size:14.5pt; margin-bottom:14px;">
              <thead>
                <tr style="background-color:#e9ecef; font-weight:bold; text-align:center;">
                  <th style="border:1px solid #000; padding:5px; width:5%;">ที่</th>
                  <th style="border:1px solid #000; padding:5px; width:24%;">ชื่อโครงการ</th>
                  <th style="border:1px solid #000; padding:5px; width:14%;">ผู้รับผิดชอบ</th>
                  <th style="border:1px solid #000; padding:5px; width:10%;">งบจัดสรร</th>
                  <th style="border:1px solid #000; padding:5px; width:10%;">เบิกจ่าย</th>
                  <th style="border:1px solid #000; padding:5px; width:10%;">คงเหลือ</th>
                  <th style="border:1px solid #000; padding:5px; width:11%;">สถานะ</th>
                  <th style="border:1px solid #000; padding:5px; width:16%;">ผลการดำเนินงาน / หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="background-color:#f8f9fa; font-weight:bold;">
                  <td colspan="3" style="border:1px solid #000; padding:6px; text-align:center;">รวม${dept.deptName} (${deptProjs.length} โครงการ)</td>
                  <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(deptAlloc)}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(deptSpent)}</td>
                  <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(deptRem)}</td>
                  <td colspan="2" style="border:1px solid #000; padding:6px; text-align:center;">เบิกจ่ายร้อยละ ${deptPct}</td>
                </tr>
              </tbody>
            </table>
          `;
        }).join('');

        return groupHtml;
      };

      const devSectionHtml = buildProjectGroupTables(res.devProjects || [], 'งบพัฒนาคุณภาพการศึกษา');
      const adminSectionHtml = buildProjectGroupTables(res.adminProjects || [], 'งบบริหารจัดการ');

      const reportHtml = `
        <div id="six-month-report-content" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size:16pt; line-height:1.45; color:#000; text-align:left; background:#fff; padding:20px;">
          <div style="text-align:center; font-weight:bold; font-size:18pt; margin-bottom:12px;">
            รายงานผลการดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${s.fyFull}<br>
            ${s.periodLabel}
          </div>

          <p style="font-weight:bold; margin:12px 0 6px 0;">1. บทสรุปภาพรวมผลการดำเนินงาน</p>
          <p style="text-indent:2.5em; text-align:justify; margin:0 0 8px 0;">
            <strong>1.1 งบพัฒนาคุณภาพการศึกษา</strong> มีโครงการที่ได้รับอนุมัติจำนวน <strong>${dev.count} โครงการ</strong> 
            จำแนกเป็นโครงการที่ดำเนินการและส่งรายงานผลแล้วเสร็จจำนวน <strong>${dev.completed} โครงการ</strong> (ร้อยละ ${pctOf(dev.completed, dev.count)}) 
            อยู่ระหว่างดำเนินการจำนวน <strong>${dev.inProgress} โครงการ</strong> (ร้อยละ ${pctOf(dev.inProgress, dev.count)}) 
            และยังไม่เริ่มดำเนินการจำนวน <strong>${dev.notStarted} โครงการ</strong> (ร้อยละ ${pctOf(dev.notStarted, dev.count)}) 
            โดยได้รับจัดสรรงบประมาณทั้งสิ้น <strong>${fmt(dev.allocated)} บาท</strong> 
            เบิกจ่ายไปแล้วเป็นเงิน <strong>${fmt(dev.spent)} บาท</strong> (คิดเป็นร้อยละ <strong>${dev.percent.toFixed(2)}</strong>) 
            และคงเหลืองบประมาณเป็นเงิน <strong>${fmt(dev.remaining)} บาท</strong>
          </p>
          <p style="text-indent:2.5em; text-align:justify; margin:0 0 8px 0;">
            <strong>1.2 งบบริหารจัดการ</strong> มีโครงการและรายการที่ได้รับอนุมัติจำนวน <strong>${adm.count} โครงการ</strong> 
            จำแนกเป็นโครงการที่ดำเนินการและส่งรายงานผลแล้วเสร็จจำนวน <strong>${adm.completed} โครงการ</strong> (ร้อยละ ${pctOf(adm.completed, adm.count)}) 
            อยู่ระหว่างดำเนินการจำนวน <strong>${adm.inProgress} โครงการ</strong> (ร้อยละ ${pctOf(adm.inProgress, adm.count)}) 
            และยังไม่เริ่มดำเนินการจำนวน <strong>${adm.notStarted} โครงการ</strong> (ร้อยละ ${pctOf(adm.notStarted, adm.count)}) 
            โดยได้รับจัดสรรงบประมาณทั้งสิ้น <strong>${fmt(adm.allocated)} บาท</strong> 
            เบิกจ่ายไปแล้วเป็นเงิน <strong>${fmt(adm.spent)} บาท</strong> (คิดเป็นร้อยละ <strong>${adm.percent.toFixed(2)}</strong>) 
            และคงเหลืองบประมาณเป็นเงิน <strong>${fmt(adm.remaining)} บาท</strong>
          </p>
          <p style="text-indent:2.5em; text-align:justify; margin:0 0 14px 0;">
            <strong>1.3 สรุปภาพรวมทั้งโรงเรียน</strong> โรงเรียนโสภณศิริราษฎร์มีโครงการที่ได้รับอนุมัติตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${s.fyFull} 
            รวมทั้งสิ้นจำนวน <strong>${s.totalProjects} โครงการ</strong> 
            ดำเนินการและรายงานผลแล้วเสร็จจำนวน <strong>${s.completedCount} โครงการ</strong> (ร้อยละ ${pctOf(s.completedCount, s.totalProjects)}) 
            อยู่ระหว่างดำเนินการจำนวน <strong>${s.inProgressCount} โครงการ</strong> (ร้อยละ ${pctOf(s.inProgressCount, s.totalProjects)}) 
            และยังไม่เริ่มดำเนินการจำนวน <strong>${s.notStartedCount} โครงการ</strong> (ร้อยละ ${pctOf(s.notStartedCount, s.totalProjects)}) 
            ได้รับจัดสรรงบประมาณรวมทั้งสิ้น <strong>${fmt(s.totalAllocated)} บาท</strong> 
            มีผลการเบิกจ่ายสะสมเป็นเงิน <strong>${fmt(s.totalSpent)} บาท</strong> (คิดเป็นร้อยละ <strong>${s.spentPercent.toFixed(2)}</strong> ของงบประมาณที่ได้รับจัดสรร) 
            และคงเหลืองบประมาณสำหรับดำเนินงานต่อไปเป็นเงิน <strong>${fmt(s.totalRemaining)} บาท</strong>
          </p>

          <p style="font-weight:bold; margin:14px 0 6px 0;">2. สรุปผลการดำเนินงานและผลการใช้จ่ายงบประมาณ</p>

          <p style="font-weight:bold; margin:8px 0 6px 0;">2.1 ตารางสรุปผลการดำเนินงานและผลการใช้จ่ายงบประมาณ จำแนกตามประเภทงบประมาณ</p>
          <table style="width:100%; border-collapse:collapse; font-size:15pt; margin-bottom:14px;">
            <thead>
              <tr style="background-color:#e9ecef; font-weight:bold; text-align:center;">
                <th style="border:1px solid #000; padding:6px;">ที่</th>
                <th style="border:1px solid #000; padding:6px;">ประเภทงบประมาณ</th>
                <th style="border:1px solid #000; padding:6px;">รวม (โครงการ)</th>
                <th style="border:1px solid #000; padding:6px;">แล้วเสร็จ (รายงานแล้ว)</th>
                <th style="border:1px solid #000; padding:6px;">อยู่ระหว่างดำเนินการ</th>
                <th style="border:1px solid #000; padding:6px;">ยังไม่เริ่ม</th>
                <th style="border:1px solid #000; padding:6px;">งบจัดสรร (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">เบิกจ่าย (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">คงเหลือ (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">ร้อยละเบิกจ่าย</th>
              </tr>
            </thead>
            <tbody>
              ${budgetTypeRows}
              <tr style="background-color:#f8f9fa; font-weight:bold;">
                <td colspan="2" style="border:1px solid #000; padding:6px; text-align:center;">รวมทั้งสิ้น</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.totalProjects}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.completedCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.inProgressCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.notStartedCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalAllocated)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalSpent)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalRemaining)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.spentPercent.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>

          <p style="font-weight:bold; margin:12px 0 6px 0;">2.2 ตารางสรุปผลการดำเนินงานและผลการใช้จ่ายงบประมาณ จำแนกตามกลุ่มบริหารงาน</p>
          <table style="width:100%; border-collapse:collapse; font-size:15pt; margin-bottom:14px;">
            <thead>
              <tr style="background-color:#e9ecef; font-weight:bold; text-align:center;">
                <th style="border:1px solid #000; padding:6px;">ที่</th>
                <th style="border:1px solid #000; padding:6px;">กลุ่มบริหารงาน</th>
                <th style="border:1px solid #000; padding:6px;">รวม (โครงการ)</th>
                <th style="border:1px solid #000; padding:6px;">แล้วเสร็จ (รายงานแล้ว)</th>
                <th style="border:1px solid #000; padding:6px;">อยู่ระหว่างดำเนินการ</th>
                <th style="border:1px solid #000; padding:6px;">ยังไม่เริ่ม</th>
                <th style="border:1px solid #000; padding:6px;">งบจัดสรร (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">เบิกจ่าย (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">คงเหลือ (บาท)</th>
                <th style="border:1px solid #000; padding:6px;">ร้อยละเบิกจ่าย</th>
              </tr>
            </thead>
            <tbody>
              ${deptRows}
              <tr style="background-color:#f8f9fa; font-weight:bold;">
                <td colspan="2" style="border:1px solid #000; padding:6px; text-align:center;">รวมทั้งสิ้น</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.totalProjects}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.completedCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.inProgressCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.notStartedCount}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalAllocated)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalSpent)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(s.totalRemaining)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${s.spentPercent.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>

          <p style="font-weight:bold; margin:12px 0 6px 0;">2.3 ตารางสรุปสถานะการเบิกจ่ายงบประมาณ จำแนกตามแหล่งงบประมาณ</p>
          <table style="width:100%; border-collapse:collapse; font-size:15pt; margin-bottom:6px;">
            <thead>
              <tr style="background-color:#e9ecef; font-weight:bold; text-align:center;">
                <th style="border:1px solid #000; padding:6px; width:7%;">ที่</th>
                <th style="border:1px solid #000; padding:6px; width:35%;">แหล่งงบประมาณ</th>
                <th style="border:1px solid #000; padding:6px; width:15%;">งบจัดสรร (บาท)</th>
                <th style="border:1px solid #000; padding:6px; width:15%;">เบิกจ่ายแล้ว (บาท)</th>
                <th style="border:1px solid #000; padding:6px; width:15%;">คงเหลือ (บาท)</th>
                <th style="border:1px solid #000; padding:6px; width:13%;">ร้อยละเบิกจ่าย</th>
              </tr>
            </thead>
            <tbody>
              ${fundRows}
              <tr style="background-color:#f8f9fa; font-weight:bold;">
                <td colspan="2" style="border:1px solid #000; padding:6px; text-align:center;">รวมทั้งสิ้น</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(fundAllocTotal)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(fundSpentTotal)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:right;">${fmt(fundRemTotal)}</td>
                <td style="border:1px solid #000; padding:6px; text-align:center;">${fundPctTotal}%</td>
              </tr>
            </tbody>
          </table>
          ${centralNote}

          <p style="font-weight:bold; margin:16px 0 4px 0;">3. รายละเอียดผลการดำเนินงานและผลการใช้จ่ายงบประมาณรายโครงการ (งบพัฒนาคุณภาพการศึกษา)</p>
          ${devSectionHtml}

          <p style="font-weight:bold; margin:18px 0 4px 0;">4. รายละเอียดผลการดำเนินงานและผลการใช้จ่ายงบประมาณรายโครงการ (งบบริหารจัดการ)</p>
          ${adminSectionHtml}
        </div>
      `;

      Swal.fire({
        title: `<span style="font-family:'Kanit'; font-size:1.15rem;">ตัวอย่างรายงานผลการดำเนินงาน (ปีงบประมาณ ${s.fyFull})</span>`,
        width: '94%',
        html: `
          <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px; background:#f1f5f9; border-radius:8px; font-family:'Kanit';">
            <div>
              <label style="font-size:0.9rem; font-weight:bold; margin-right:6px;">ช่วงข้อมูล:</label>
              <select onchange="openSixMonthReportModal(this.value)" style="padding:5px 10px; border-radius:6px; border:1px solid #cbd5e1; font-family:'Kanit';">
                <option value="6M" ${periodMode === '6M' ? 'selected' : ''}>รอบ 6 เดือน (1 ต.ค. – 31 มี.ค.)</option>
                <option value="ALL" ${periodMode === 'ALL' ? 'selected' : ''}>ข้อมูลสะสมถึงปัจจุบัน</option>
              </select>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" onclick="copySixMonthReportToClipboard()" style="background:#2980b9; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-family:'Kanit'; cursor:pointer;">
                <i class="fas fa-copy"></i> คัดลอกทั้งหมด (วางใน Word ได้เลย)
              </button>
              <button type="button" onclick="downloadSixMonthReportDoc('${s.fyFull}')" style="background:#27ae60; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-family:'Kanit'; cursor:pointer;">
                <i class="fas fa-file-word"></i> ดาวน์โหลดไฟล์ Word (.doc)
              </button>
            </div>
          </div>
          <div style="max-height:68vh; overflow-y:auto; border:1px solid #cbd5e1; border-radius:6px; box-shadow:inset 0 0 6px rgba(0,0,0,0.06);">
            ${reportHtml}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'ปิดหน้าต่าง',
        confirmButtonColor: '#64748b'
      });
    })
    .withFailureHandler(err => {
      Swal.fire('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถดึงข้อมูลรายงานได้', 'error');
    })
    .getSixMonthReportData(yr, periodMode);
}
// คัดลอกเนื้อหาพร้อมตารางลง Clipboard เพื่อไป Ctrl+V ใน Word
function copySixMonthReportToClipboard() {
  const el = document.getElementById('six-month-report-content');
  if (!el) return;

  const range = document.createRange();
  range.selectNode(el);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    document.execCommand('copy');
    selection.removeAllRanges();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'คัดลอกรายงานเรียบร้อย! นำไปกด Ctrl+V ใน Word ได้เลยครับ',
      showConfirmButton: false,
      timer: 3000
    });
  } catch (e) {
    alert('คัดลอกไม่สำเร็จ กรุณากดปุ่มดาวน์โหลดไฟล์ Word แทนครับ');
  }
}

// ดาวน์โหลดเป็นไฟล์ .doc เปิดแก้ไขต่อใน Word ได้ทันที
function downloadSixMonthReportDoc(fyFull) {
  const el = document.getElementById('six-month-report-content');
  if (!el) return;

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4 portrait; margin: 2cm 2cm 2cm 2.5cm; }
        body { font-family: 'TH Sarabun New', 'Sarabun', sans-serif; font-size: 16pt; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000000; padding: 5px; vertical-align: top; }
      </style>
    </head>
    <body>${el.innerHTML}</body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายงานผลรอบ6เดือน_ปีงบประมาณ_${fyFull}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
