/**
 * ==============================================================================
 * ระบบคลังภาพถ่ายและสำรองข้อมูลถาวร - วิทยาลัยการอาชีพด่านซ้าย
 * Google Apps Script Web App สำหรับรับรูปภาพและข้อมูลเข้า Google Drive โดยตรง
 * ตัด Egress ของ Supabase เป็น 0 MB อย่างถาวร
 * ==============================================================================
 * 
 * 📋 วิธีการติดตั้ง / อัปเดตใน Google Apps Script:
 * 1. เปิดเว็บ https://script.google.com/home
 * 2. เปิดโครงการเดิม (หรือสร้างใหม่)
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้วนำโค้ดในไฟล์นี้ทั้งหมดไปวางแทนที่
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> เลือก "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. ประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: คลังภาพถ่าย วกด่านซ้าย V3
 *    - ดำเนินการในฐานะ: ฉัน (อีเมลของคุณ)
 *    - ใครมีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <--- สำคัญมาก
 * 6. กด "ทำให้ใช้งานได้" (Deploy)
 * 7. คัดลอก "URL ของเว็บแอป" (ที่ขึ้นต้นด้วย https://script.google.com/macros/s/.../exec)
 *    แล้วนำมาส่งในแชทนี้ได้เลยครับ!
 * ==============================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "ระบบคลังภาพถ่ายและสำรองข้อมูล Google Drive วก.ด่านซ้าย พร้อมใช้งาน (Ready)",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
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
    var checkDate = payload.date || payload.checkDate || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    var academicYear = payload.academic_year || payload.academicYear || "2569";
    var semester = payload.semester || "2";
    var targetEmails = payload.target_emails || [];
    var isTestPing = Boolean(payload.is_test_ping);

    // 1. โฟลเดอร์หลักใน Google Drive
    var rootFolderName = "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    // 2. โฟลเดอร์แยกหมวดหมู่ทั้ง 5 หมวด
    var studentFolder = getOrCreateFolder(rootFolder, "1_รูปถ่ายนักเรียน");
    var teacherFolder = getOrCreateFolder(rootFolder, "2_รูปถ่ายครูที่ปรึกษา");
    var assemblyRootFolder = getOrCreateFolder(rootFolder, "3_หลักฐานเข้าแถวหน้าเสาธง");
    var centralRootFolder = getOrCreateFolder(rootFolder, "4_หลักฐานกิจกรรมกลาง");
    var clubRootFolder = getOrCreateFolder(rootFolder, "5_หลักฐานกิจกรรมชมรมวิชาชีพ");

    // โฟลเดอร์ตามปีการศึกษาและเทอมสำหรับหน้าเสาธง
    var termFolderName = "ปีการศึกษา_" + academicYear + "_ภาคเรียนที่_" + semester;
    var termFolder = getOrCreateFolder(assemblyRootFolder, termFolderName);

    // วันที่ พ.ศ. ไทย
    var dParts = checkDate.split('-');
    var thaiYear = parseInt(dParts[0], 10) + 543;
    var thaiDateStr = (dParts[2] || '01') + "-" + (dParts[1] || '01') + "-" + thaiYear;

    // ถ้าเป็นการทดสอบเชื่อมต่อ (Test Ping)
    if (isTestPing) {
      if (targetEmails && targetEmails.length > 0) {
        var emailList = Array.isArray(targetEmails) ? targetEmails.join(",") : String(targetEmails);
        MailApp.sendEmail(
          emailList,
          "🧪 [ทดสอบสำเร็จ] เชื่อมต่อระบบคลังภาพถ่าย Google Drive วก.ด่านซ้าย",
          "เรียน ผู้ดูแลระบบ\n\nการเชื่อมต่อระหว่างระบบแดชบอร์ด วก.ด่านซ้าย กับ Google Drive ทำงานถูกต้องสมบูรณ์แล้ว!\n\n" +
          "• โฟลเดอร์จัดเก็บ: " + rootFolderName + "\n" +
          "• วันที่ทดสอบ: " + new Date().toLocaleString('th-TH')
        );
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "เชื่อมต่อ Google Drive สำเร็จ",
        folder_url: rootFolder.getUrl(),
        tested_at: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------------------------
    // 📸 หมวดพิเศษ: รับอัปโหลดรูปเดี่ยว (Single Photo Upload / Migration)
    // --------------------------------------------------------------------------
    if (payload.action === 'upload_single_photo' || payload.action === 'upload_photo' || (payload.imageBase64 && !Array.isArray(payload.sessions))) {
      var rawImg = payload.imageBase64 || "";
      if (rawImg.indexOf('data:image') === 0) {
        var pParts = rawImg.split(',');
        var b64Data = pParts[1];
        var mime = (pParts[0].indexOf('png') >= 0) ? MimeType.PNG : MimeType.JPEG;
        var ext = (mime === MimeType.PNG) ? ".png" : ".jpg";

        var targetFolder = termFolder;
        var pFileName = thaiDateStr + ".jpg";

        var targetCategory = payload.category || payload.targetCategory || "";
        var checkinMode = payload.checkinMode || "";

        // จัดโฟลเดอร์ตามประเภท
        if (targetCategory === 'student' || targetCategory === 'students') {
          targetFolder = studentFolder;
          pFileName = "student_" + (payload.studentId || payload.id || "unknown") + ext;
        } else if (targetCategory === 'teacher' || targetCategory === 'teachers') {
          targetFolder = teacherFolder;
          var cleanTchName = (payload.teacherName || payload.name || "teacher").replace(/\s+/g, "_").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = "teacher_" + cleanTchName + ext;
        } else if (targetCategory === 'central' || checkinMode === 'central' || String(payload.classLevel || '').indexOf('central') >= 0) {
          var actTitle = (payload.activityTitle || payload.name || "กิจกรรมกลาง").replace(/[/\\?%*:|"<>]/g, "_");
          var actFolder = getOrCreateFolder(centralRootFolder, actTitle);
          targetFolder = actFolder;
          var cleanDept = (payload.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = thaiDateStr + "_[" + actTitle + "]_" + cleanDept + ext;
        } else if (targetCategory === 'club' || checkinMode === 'club' || String(payload.classLevel || '').indexOf('club') >= 0) {
          var sessNo = payload.sessionNo || (String(payload.classLevel || '').match(/#club_(\d+)/)?.[1]) || "1";
          var clubFolder = getOrCreateFolder(clubRootFolder, "ชมรมวิชาชีพ_ครั้งที่_" + sessNo);
          targetFolder = clubFolder;
          var cleanDept = (payload.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = thaiDateStr + "_[ชมรมครั้งที่" + sessNo + "]_" + cleanDept + ext;
        } else {
          // หน้าเสาธงปกติ
          var dailyFolderName = "วันที่_" + thaiDateStr;
          var dailyFolder = getOrCreateFolder(termFolder, dailyFolderName);
          targetFolder = dailyFolder;
          var cleanDept = (payload.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
          var cleanLvl = (payload.classLevel || "ห้อง").replace(/[/\\?%*:|"<>]/g, "_");
          var cleanTch = (payload.teacherName || "ครู").replace(/\s+/g, "_").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = thaiDateStr + "_" + cleanDept + "_" + cleanLvl + "_" + cleanTch + ext;
        }

        var decodedBytes = Utilities.base64Decode(b64Data);
        var pBlob = Utilities.newBlob(decodedBytes, mime, pFileName);
        var createdFile = targetFolder.createFile(pBlob);
        try {
          createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (_) {}

        var pFileId = createdFile.getId();
        var cdnUrl = "https://lh3.googleusercontent.com/d/" + pFileId;
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          fileId: pFileId,
          fileUrl: cdnUrl,
          directUrl: cdnUrl,
          driveUrl: createdFile.getUrl(),
          fileName: pFileName
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --------------------------------------------------------------------------
    // 📦 หมวดสำรองฐานข้อมูลฉบับเต็มประจำวัน (Daily JSON Backup)
    // --------------------------------------------------------------------------
    var dailyFolderName = "วันที่_" + thaiDateStr;
    var dailyFolder = getOrCreateFolder(termFolder, dailyFolderName);
    var jsonFileName = "database_backup_" + thaiDateStr + ".json";
    dailyFolder.createFile(jsonFileName, JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "บันทึกข้อมูลและภาพถ่ายขึ้น Google Drive เรียบร้อยแล้ว",
      date: thaiDateStr,
      folder_url: dailyFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
