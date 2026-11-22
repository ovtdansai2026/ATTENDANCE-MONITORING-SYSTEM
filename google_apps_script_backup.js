/**
 * ==============================================================================
 * ระบบคลังภาพถ่ายและสำรองข้อมูลถาวร - วิทยาลัยการอาชีพด่านซ้าย (High-Performance V4)
 * Google Apps Script Web App สำหรับรับรูปภาพและข้อมูลเข้า Google Drive โดยตรง
 * 
 * 🚀 คุณสมบัติ V4:
 * 1. ระบบ Direct-Indexed Folder Access: วาร์ปตรงเข้าโฟลเดอร์ประจำวันใน 0.05 วินาที
 * 2. Pre-create Daily Folder: เตรียมโฟลเดอร์ล่วงหน้าก่อนเข้าแถว ไม่ต้องค้นหาซ้ำซาก
 * 3. LockService Concurrency Protection: ป้องกัน Race Condition เมื่อครูกดส่งรูปพร้อมกัน
 * 4. ตัด Egress ของ Supabase เป็น 0 MB อย่างถาวร
 * ==============================================================================
 * 
 * 📋 วิธีการติดตั้ง / อัปเดตใน Google Apps Script:
 * 1. เปิดเว็บ https://script.google.com/home
 * 2. เปิดโครงการเดิมของ วก.ด่านซ้าย
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้วนำโค้ดในไฟล์นี้ทั้งหมดไปวางแทนที่
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> เลือก "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. ประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: คลังภาพถ่าย วกด่านซ้าย V4 (Direct Access)
 *    - ดำเนินการในฐานะ: ฉัน (อีเมลของคุณ)
 *    - ใครมีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <--- สำคัญมาก
 * 6. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก Web App URL เดิมใช้งานได้ทันทีครับ!
 * 
 * ⏰ แนะนำ: ตั้งเวลาเตรียมโฟลเดอร์อัตโนมัติ (Trigger)
 * - เมนูซ้าย "ทริกเกอร์" (รูปนาฬิกา) -> กด "+ เพิ่มทริกเกอร์"
 * - เลือกฟังก์ชัน: prepareDailyFolder
 * - เหตุการณ์: ตามเวลา -> ตัวจับเวลาตามวัน -> ช่วงเวลา 06:00 ถึง 07:00 น.
 * ==============================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";
  if (action === "prepare_today" || action === "prepare_daily_folder") {
    var res = prepareDailyFolder();
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "ระบบคลังภาพถ่าย Google Drive วก.ด่านซ้าย V4 (High-Performance Ready)",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

/**
 * ⚡ ฟังก์ชันเตรียมโฟลเดอร์ล่วงหน้า (Pre-create Daily Folder):
 * สามารถตั้งเวลาอัตโนมัติ (Trigger) ให้รันทุกวันเวลา 06:00 หรือ 07:00 น.
 * หรือจะถูกเรียกอัตโนมัติเมื่อครูคนแรกของวันส่งรูป
 */
function prepareDailyFolder(checkDate, academicYear, semester) {
  checkDate = checkDate || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  academicYear = academicYear || "2569";
  semester = semester || "2";

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // ล็อกคิวกันชนกัน 15 วินาที

    var props = PropertiesService.getScriptProperties();
    var cacheKey = "DAILY_FOLDER_ID_" + checkDate;
    var cachedId = props.getProperty(cacheKey);

    if (cachedId) {
      try {
        var existing = DriveApp.getFolderById(cachedId);
        return { success: true, folderId: cachedId, folderName: existing.getName(), cached: true };
      } catch (_) {}
    }

    var rootFolderName = "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    var assemblyRootFolder = getOrCreateFolder(rootFolder, "3_หลักฐานเข้าแถวหน้าเสาธง");
    var termFolderName = "ปีการศึกษา_" + academicYear + "_ภาคเรียนที่_" + semester;
    var termFolder = getOrCreateFolder(assemblyRootFolder, termFolderName);

    var dParts = checkDate.split('-');
    var thaiYear = parseInt(dParts[0], 10) + 543;
    var thaiDateStr = (dParts[2] || '01') + "-" + (dParts[1] || '01') + "-" + thaiYear;
    var dailyFolderName = "วันที่_" + thaiDateStr;
    var dailyFolder = getOrCreateFolder(termFolder, dailyFolderName);

    var folderId = dailyFolder.getId();
    props.setProperty(cacheKey, folderId);

    return {
      success: true,
      folderId: folderId,
      folderName: dailyFolderName,
      folderUrl: dailyFolder.getUrl(),
      created_at: new Date().toISOString()
    };
  } finally {
    lock.releaseLock();
  }
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

    // ถ้าสั่งให้เตรียมโฟลเดอร์ล่วงหน้า
    if (payload.action === 'prepare_daily_folder' || payload.action === 'prepare_today') {
      var prepRes = prepareDailyFolder(checkDate, academicYear, semester);
      return ContentService.createTextOutput(JSON.stringify(prepRes)).setMimeType(ContentService.MimeType.JSON);
    }

    // วันที่ พ.ศ. ไทย
    var dParts = checkDate.split('-');
    var thaiYear = parseInt(dParts[0], 10) + 543;
    var thaiDateStr = (dParts[2] || '01') + "-" + (dParts[1] || '01') + "-" + thaiYear;

    // ถ้าเป็นการทดสอบเชื่อมต่อ (Test Ping)
    if (isTestPing) {
      var rootFolders = DriveApp.getFoldersByName("วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม");
      var rootUrl = rootFolders.hasNext() ? rootFolders.next().getUrl() : "";
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "เชื่อมต่อ Google Drive สำเร็จ",
        folder_url: rootUrl,
        tested_at: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------------------------
    // 📸 หมวดพิเศษ: รับอัปโหลดรูปเดี่ยว (High-Speed Direct-Indexed Upload)
    // --------------------------------------------------------------------------
    if (payload.action === 'upload_single_photo' || payload.action === 'upload_photo' || (payload.imageBase64 && !Array.isArray(payload.sessions))) {
      var rawImg = payload.imageBase64 || "";
      if (rawImg.indexOf('data:image') === 0) {
        var pParts = rawImg.split(',');
        var b64Data = pParts[1];
        var mime = (pParts[0].indexOf('png') >= 0) ? MimeType.PNG : MimeType.JPEG;
        var ext = (mime === MimeType.PNG) ? ".png" : ".jpg";

        var targetCategory = payload.category || payload.targetCategory || "";
        var checkinMode = payload.checkinMode || "";
        var targetFolder = null;
        var pFileName = thaiDateStr + ext;

        // แยกโฟลเดอร์ตามประเภท
        if (targetCategory === 'student' || targetCategory === 'students') {
          var rootF = getOrCreateFolder(DriveApp.getRootFolder(), "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม");
          targetFolder = getOrCreateFolder(rootF, "1_รูปถ่ายนักเรียน");
          pFileName = "student_" + (payload.studentId || payload.id || "unknown") + ext;
        } else if (targetCategory === 'teacher' || targetCategory === 'teachers') {
          var rootF = getOrCreateFolder(DriveApp.getRootFolder(), "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม");
          targetFolder = getOrCreateFolder(rootF, "2_รูปถ่ายครูที่ปรึกษา");
          var cleanTchName = (payload.teacherName || payload.name || "teacher").replace(/\s+/g, "_").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = "teacher_" + cleanTchName + ext;
        } else if (targetCategory === 'central' || checkinMode === 'central' || String(payload.classLevel || '').indexOf('central') >= 0) {
          var rootF = getOrCreateFolder(DriveApp.getRootFolder(), "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม");
          var centralRootFolder = getOrCreateFolder(rootF, "4_หลักฐานกิจกรรมกลาง");
          var actTitle = (payload.activityTitle || payload.name || "กิจกรรมกลาง").replace(/[/\\?%*:|"<>]/g, "_");
          targetFolder = getOrCreateFolder(centralRootFolder, actTitle);
          var cleanDept = (payload.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = thaiDateStr + "_[" + actTitle + "]_" + cleanDept + ext;
        } else if (targetCategory === 'club' || checkinMode === 'club' || String(payload.classLevel || '').indexOf('club') >= 0) {
          var rootF = getOrCreateFolder(DriveApp.getRootFolder(), "วก.ด่านซ้าย_คลังภาพถ่ายระบบกิจกรรม");
          var clubRootFolder = getOrCreateFolder(rootF, "5_หลักฐานกิจกรรมชมรมวิชาชีพ");
          var sessNo = payload.sessionNo || (String(payload.classLevel || '').match(/#club_(\d+)/)?.[1]) || "1";
          targetFolder = getOrCreateFolder(clubRootFolder, "ชมรมวิชาชีพ_ครั้งที่_" + sessNo);
          var cleanDept = (payload.department || "แผนก").replace(/[/\\?%*:|"<>]/g, "_");
          pFileName = thaiDateStr + "_[ชมรมครั้งที่" + sessNo + "]_" + cleanDept + ext;
        } else {
          // 🚀 หน้าเสาธงปกติ (90% ของการใช้งานประจำวัน):
          // ใช้ Direct-Indexed Access ด้วยรหัส Folder ID ที่เตรียมไว้ล่วงหน้า (0.05 วินาที)
          var props = PropertiesService.getScriptProperties();
          var cacheKey = "DAILY_FOLDER_ID_" + checkDate;
          var cachedFolderId = props.getProperty(cacheKey);

          if (cachedFolderId) {
            try {
              targetFolder = DriveApp.getFolderById(cachedFolderId);
            } catch (_) {
              targetFolder = null;
            }
          }

          // ถ้ายังไม่มี (เช่น วันแรกที่ยังไม่ได้ตั้งทริกเกอร์): สร้างผ่าน prepareDailyFolder แบบล็อกคิว
          if (!targetFolder) {
            var prep = prepareDailyFolder(checkDate, academicYear, semester);
            targetFolder = DriveApp.getFolderById(prep.folderId);
          }

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
    var prepObj = prepareDailyFolder(checkDate, academicYear, semester);
    var dFolder = DriveApp.getFolderById(prepObj.folderId);
    var jsonFileName = "database_backup_" + thaiDateStr + ".json";
    dFolder.createFile(jsonFileName, JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "บันทึกข้อมูลและภาพถ่ายขึ้น Google Drive เรียบร้อยแล้ว",
      date: thaiDateStr,
      folder_url: dFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
