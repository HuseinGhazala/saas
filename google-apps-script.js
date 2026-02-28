// إعدادات الصفحات
const SHEET_SETTINGS = "Settings";
const SHEET_USER_DATA = "UserData";
const SHEET_WINS = "Wins ";

/**
 * دالة الإعداد الأولي
 * قم بتشغيلها مرة واحدة لإنشاء الصفحات
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEET_SETTINGS);
    settingsSheet.appendRow(["Settings_JSON", "Last_Updated"]);
  }

  let userSheet = ss.getSheetByName(SHEET_USER_DATA);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_USER_DATA);
    userSheet.appendRow(["Timestamp", "Name", "Email", "Phone"]);
  }

  let winsSheet = ss.getSheetByName(SHEET_WINS);
  if (!winsSheet) {
    winsSheet = ss.insertSheet(SHEET_WINS);
    winsSheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Prize", "Coupon Code"]);
  }
  
  Logger.log("✅ تم إنشاء جlيع الصفحات بنجاح!");
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("📥 Request received");
    
    // 1. استخراج المعاملات (Parameters) بذكاء
    let params = e.parameter || {};


    
    // إذا لم نجد بيانات في parameter، نحاول قراءتها من postData (مهم جداً لـ fetch no-cors)
    if ((!params || Object.keys(params).length === 0) && e.postData && e.postData.contents) {
      try {
        const content = e.postData.contents;
        // محاولة تحليل المحتوى إذا كان JSON أو URL encoded
        if (content.startsWith('{')) {
           const jsonParams = JSON.parse(content);
           params = { ...params, ...jsonParams };
        } else {
           // تحليل x-www-form-urlencoded يدوياً إذا لزم الأمر
           const parts = content.split('&');
           parts.forEach(part => {
             const [key, value] = part.split('=');
             if (key && value) {
               params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
             }
           });
        }
      } catch (err) {
        Logger.log("⚠️ Error parsing postData: " + err.toString());
      }
    }

    Logger.log("📋 Params: " + JSON.stringify(params));

    const action = params.action;
    let result = { success: false, message: "No action specified" };

    if (action === "getSettings") {
      result = getSettings(ss);
    } 
    else if (action === "saveSettings") {
      Logger.log("⚙️ Saving settings...");
      result = saveSettings(ss, params.settings);
    } 
    else if (action === "saveWin") { 
      Logger.log("🏆 Saving win: " + params.prize);
      result = saveWinData(ss, params);
    } 
    // الافتراضي: إذا كان هناك اسم ورقم هاتف، نعتبره تسجيل مستخدم حتى لو لم يرسل action
    else if (action === "saveUserData" || (params.name && params.phone)) { 
      Logger.log("👤 Saving user data: " + params.name);
      result = saveUserData(ss, params);
    } else {
      Logger.log("❓ Unknown action or empty data: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("❌ FATAL ERROR: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Helper Functions ---

function getSettings(ss) {
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return { success: false, message: "No settings sheet" };
  const data = sheet.getRange("A2").getValue();
  if (data && data !== "") return { success: true, settings: JSON.parse(data) };
  return { success: false, message: "No settings found" };
}

function saveSettings(ss, settingsJson) {
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) sheet = ss.insertSheet(SHEET_SETTINGS);
  sheet.getRange("A2").setValue(settingsJson);
  sheet.getRange("B2").setValue(new Date()); 
  return { success: true };
}

function saveUserData(ss, params) {
  let sheet = ss.getSheetByName(SHEET_USER_DATA);
  if (!sheet) sheet = ss.insertSheet(SHEET_USER_DATA);
  
  const timestamp = params.timestamp ? new Date(params.timestamp) : new Date();
  
  sheet.appendRow([
    timestamp,
    params.name || "",
    params.email || "",
    params.phone || ""
  ]);
  return { success: true };
}

function saveWinData(ss, params) {
  let sheet = ss.getSheetByName(SHEET_WINS);
  if (!sheet) sheet = ss.insertSheet(SHEET_WINS);
  
  const timestamp = params.timestamp ? new Date(params.timestamp) : new Date();
  
  sheet.appendRow([
    timestamp,
    params.name || "",
    params.email || "",
    params.phone || "",
    params.prize || "",
    params.couponCode || ""
  ]);
  return { success: true };
}