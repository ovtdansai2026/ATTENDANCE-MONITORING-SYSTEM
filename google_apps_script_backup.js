/**
 * ==============================================================================
 * ระบบสำรองข้อมูลการเข้าแถวและกิจกรรมกลาง - วิทยาลัยการอาชีพด่านซ้าย
 * Google Apps Script Web App สำหรับรับข้อมูลสำรองขึ้น Google Drive อัตโนมัติ
 * และส่งอีเมลแจ้งเตือนไปยัง 2 บัญชีอีเมลราชการ/แอดมิน
 * ==============================================================================
 * 
 * 📋 วิธีการติดตั้งใช้งาน (ทำครั้งเดียวใน 1 นาที):
 * 1. เปิดเว็บ https://script.google.com/home
 * 2. กดปุ่ม "+ โครงการใหม่" (New project)
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้วนำโค้ดในไฟล์นี้ทั้งหมดไปวาง
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) มุมขวาบน -> เลือก "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. กดไอคอนรูปเฟือง (⚙️) ข้างประเภท -> เลือก "เว็บแอป" (Web app)
 *    - คำอธิบาย: สำรองข้อมูลเข้าแถว วกด่านซ้าย
 *    - ดำเนินการในฐานะ: ฉัน (อีเมลของคุณ)
 *    - ใครมีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <--- สำคัญมาก เพื่อให้ระบบส่งข้อมูลมาได้
 * 6. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> กดยอมรับสิทธิ์ (Authorize access)
 * 7. คัดลอก "URL ของเว็บแอป" (Web App URL) ที่ขึ้นต้นด้วย https://script.google.com/macros/s/...
 * 8. นำ URL นั้นมาวางในหน้า "พื้นที่จัดเก็บ & สำรองข้อมูล" ในระบบแดชบอร์ดเข้าแถว
 * ==============================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "ระบบสำรองข้อมูล Google Drive วิทยาลัยการอาชีพด่านซ้าย พร้อมใช้งาน (Ready)",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "ไม่พบข้อมูลที่ส่งมา (Empty payload)"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var checkDate = payload.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    var academicYear = payload.academic_year || "2569";
    var semester = payload.semester || "2";
    var targetEmails = payload.target_emails || [];
    var isTestPing = Boolean(payload.is_test_ping);

    // 1. ตรวจสอบหรือสร้างโฟลเดอร์หลักใน Google Drive
    var rootFolderName = "วก.ด่านซ้าย_สำรองข้อมูลเข้าแถวราชการ";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    // 2. ตรวจสอบหรือสร้างโฟลเดอร์ตามปีการศึกษาและเทอม เช่น "ปีการศึกษา_2569_ภาคเรียนที่_2"
    var termFolderName = "ปีการศึกษา_" + academicYear + "_ภาคเรียนที่_" + semester;
    var termFolders = rootFolder.getFoldersByName(termFolderName);
    var termFolder = termFolders.hasNext() ? termFolders.next() : rootFolder.createFolder(termFolderName);

    // 3. แปลงวันที่เป็น พ.ศ. ไทย เช่น วันที่ 04-11-2569
    var dParts = checkDate.split('-');
    var thaiYear = parseInt(dParts[0], 10) + 543;
    var thaiDateStr = (dParts[2] || '01') + "-" + (dParts[1] || '01') + "-" + thaiYear;

    // ถ้าเป็นการทดสอบเชื่อมต่อ (Test Ping)
    if (isTestPing) {
      if (targetEmails && targetEmails.length > 0) {
        var emailList = Array.isArray(targetEmails) ? targetEmails.join(",") : String(targetEmails);
        MailApp.sendEmail(
          emailList,
          "🧪 [ทดสอบสำเร็จ] เชื่อมต่อระบบสำรองข้อมูล Google Drive วก.ด่านซ้าย",
          "เรียน ผู้ดูแลระบบ\n\nการเชื่อมต่อระหว่างระบบติดตามการเข้าแถว วก.ด่านซ้าย กับ Google Drive ทำงานถูกต้องสมบูรณ์แล้ว!\n\n" +
          "• บัญชีที่รับข้อมูล: " + emailList + "\n" +
          "• โฟลเดอร์จัดเก็บ: " + rootFolderName + "\n" +
          "• วันที่ทดสอบ: " + new Date().toLocaleString('th-TH') + "\n\n" +
          "เมื่อมีการเช็คชื่อเสร็จสิ้นในแต่ละวัน ระบบจะจัดส่งไฟล์สำรองและภาพถ่ายหลักฐานมาเก็บที่โฟลเดอร์นี้อัตโนมัติครับ"
        );
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "เชื่อมต่อ Google Drive สำเร็จ",
        folder_url: rootFolder.getUrl(),
        tested_at: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // สร้างโฟลเดอร์ประจำวัน เช่น "วันที่_04-11-2569"
    var dailyFolderName = "วันที่_" + thaiDateStr;
    var dailyFolders = termFolder.getFoldersByName(dailyFolderName);
    var dailyFolder = dailyFolders.hasNext() ? dailyFolders.next() : termFolder.createFolder(dailyFolderName);

    // 4. บันทึกไฟล์ฐานข้อมูลฉบับเต็มประจำวัน (JSON)
    var jsonFileName = "database_backup_" + thaiDateStr + ".json";
    dailyFolder.createFile(jsonFileName, JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);

    // 5. สกัดภาพถ่ายหลักฐานหน้าเสาธงทั้งหมดออกมาเป็นไฟล์ .jpg จริง
    var photoCount = 0;
    if (Array.isArray(payload.sessions)) {
      payload.sessions.forEach(function(s) {
        if (s.evidence_photo_url && s.evidence_photo_url.indexOf('data:image') === 0) {
          var parts = s.evidence_photo_url.split(',');
          if (parts.length === 2) {
            var base64Data = parts[1];
            var cleanDept = (s.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
            var cleanLvl = (s.class_level || "").replace(/[/\\?%*:|"<>]/g, "_");
            var cleanTeacher = (s.teacher_name || "").replace(/\s+/g, "_").replace(/[/\\?%*:|"<>]/g, "_");
            var photoName = thaiDateStr + "_" + cleanDept + "_" + cleanLvl + "_" + cleanTeacher + ".jpg";

            var decoded = Utilities.base64Decode(base64Data);
            var blob = Utilities.newBlob(decoded, MimeType.JPEG, photoName);
            dailyFolder.createFile(blob);
            photoCount++;
          }
        }
      });
    }

    // 6. ตรวจสอบพื้นที่จัดเก็บ Google Drive และคำนวณโควตา
    var usedBytes = DriveApp.getStorageUsed();
    var limitBytes = DriveApp.getStorageLimit();
    var usedMb = (usedBytes / (1024 * 1024)).toFixed(1);
    var limitMb = limitBytes > 0 ? (limitBytes / (1024 * 1024)).toFixed(1) : "ไม่จำกัด";
    var usedPct = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

    var quotaAlertText = "";
    if (usedPct >= 85) {
      quotaAlertText = "\n⚠️ [แจ้งเตือนด่วน] พื้นที่ Google Drive ใช้ไปแล้ว " + usedPct + "% (" + usedMb + " MB จาก " + limitMb + " MB) ใกล้เต็มแล้ว! กรุณาตรวจสอบหรือเคลียร์พื้นที่ไฟล์ที่ไม่จำเป็น เพื่อไม่ให้การสำรองข้อมูลหยุดชะงัก\n";
    }

    // 7. ส่งอีเมลแจ้งเตือนรายงานผลไปยัง 2 บัญชีอีเมล
    if (targetEmails && targetEmails.length > 0) {
      var emailList = Array.isArray(targetEmails) ? targetEmails.join(",") : String(targetEmails);
      var emailSubject = (usedPct >= 85 ? "⚠️ [Drive ใกล้เต็ม] " : "✅ ") + "สำรองข้อมูลเข้าแถวประจำวันที่ " + thaiDateStr + " สำเร็จ (วก.ด่านซ้าย)";
      var emailBody = "เรียน ผู้ดูแลระบบและงานพัฒนากิจกรรมนักเรียนนักศึกษา\n\n" +
        "ระบบติดตามการเข้าแถว วทยาลัยการอาชีพด่านซ้าย ได้สำรองข้อมูลประจำวันขึ้น Google Drive เรียบร้อยแล้ว:\n\n" +
        "• ประจำวันที่: " + thaiDateStr + " (ปีการศึกษา " + academicYear + " เทอม " + semester + ")\n" +
        "• โฟลเดอร์ใน Drive: " + rootFolderName + " > " + termFolderName + " > " + dailyFolderName + "\n" +
        "• ไฟล์ข้อมูลฐานข้อมูล: " + jsonFileName + "\n" +
        "• สกัดภาพถ่ายหลักฐาน: " + photoCount + " ไฟล์ (.jpg)\n" +
        "• สถิตินักเรียน: มา " + (payload.present_count || 0) + " คน | ขาด " + (payload.absent_count || 0) + " คน | ลา " + (payload.leave_count || 0) + " คน\n" +
        "• สถานะพื้นที่ Google Drive: ใช้ไป " + usedPct + "% (" + usedMb + " MB / " + limitMb + " MB)\n" +
        quotaAlertText + "\n" +
        "ลิงก์เปิดโฟลเดอร์ Google Drive: " + dailyFolder.getUrl() + "\n\n" +
        "--------------------------------------------------\n" +
        "ข้อมูลนี้จัดเก็บเป็นหลักฐานทางราชการถาวร สามารถอ้างอิงย้อนหลังได้ตลอดเวลา\n" +
        "วิทยาลัยการอาชีพด่านซ้าย";

      MailApp.sendEmail(emailList, emailSubject, emailBody);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "สำรองข้อมูลและภาพถ่ายขึ้น Google Drive เรียบร้อยแล้ว",
      date: thaiDateStr,
      photos_count: photoCount,
      folder_url: dailyFolder.getUrl(),
      drive_used_pct: usedPct,
      quota_warning: usedPct >= 85
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("ระบบสำรองข้อมูล Google Drive - วิทยาลัยการอาชีพด่านซ้าย พร้อมใช้งาน (Ready)");
}
