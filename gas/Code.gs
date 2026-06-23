// ============================================================
// 幾隻貓團購 0701 - Google Apps Script
// 試算表欄位：時間戳記 | 姓名 | a01~a26 | b01~b02 | c01 | 訂購摘要 | 總金額 | 備註及回覆
// ============================================================

const PRODUCT_LIST = [
  { id: 'a01', name: '六色海藻', price: 329 },
  { id: 'a02', name: '海帶芽湯（青蔥）', price: 230 },
  { id: 'a03', name: '海帶芽湯（蔬菜）', price: 230 },
  { id: 'a04', name: '昆布鹽', price: 220 },
  { id: 'a05', name: '椎茸昆布鹽', price: 220 },
  { id: 'a06', name: '焙煎胡麻醬', price: 160 },
  { id: 'a07', name: '胡麻和風醬', price: 160 },
  { id: 'a08', name: '柚子和風醬', price: 160 },
  { id: 'a09', name: '昆布佃煮海苔醬', price: 160 },
  { id: 'a10', name: '昆布椎茸高湯包', price: 360 },
  { id: 'a11', name: '番茄昆布高湯包', price: 360 },
  { id: 'a12', name: '藻安！海藻隨身包', price: 360 },
  { id: 'a13', name: '焙煎胡麻隨身包', price: 130 },
  { id: 'a14', name: '胡麻和風隨身包', price: 130 },
  { id: 'a15', name: '柚子和風隨身包', price: 130 },
  { id: 'a16', name: '晰穀三色藜麥', price: 112 },
  { id: 'a17', name: '晰穀鷹嘴豆/埃及豆(雪蓮子)', price: 93 },
  { id: 'a18', name: '晰穀奇亞籽', price: 167 },
  { id: 'a19', name: '美人配方盒裝', price: 210 },
  { id: 'a20', name: '養生配方盒裝', price: 210 },
  { id: 'a21', name: '活力配方盒裝', price: 210 },
  { id: 'a22', name: '經典配方盒裝', price: 210 },
  { id: 'a23', name: '經典配方 家庭號', price: 289 },
  { id: 'a24', name: '美人配方 家庭號', price: 289 },
  { id: 'a25', name: '養生配方 家庭號', price: 289 },
  { id: 'a26', name: '活力配方 家庭號', price: 289 },
  { id: 'b02', name: '日本青森純榨蘋果汁（單瓶）', price: 210 },
  { id: 'c01', name: 'WONDER 超輕量製冷手持高速扇 WH-FU37', price: 499 },
];

// ---- 取得或建立試算表 ----
function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');

  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // ID 失效，重建
    }
  }

  // 建立新試算表
  const ss = SpreadsheetApp.create('幾隻貓團購 0701 訂單');
  ssId = ss.getId();
  props.setProperty('SPREADSHEET_ID', ssId);
  Logger.log('新試算表已建立，ID: ' + ssId);
  Logger.log('試算表網址: ' + ss.getUrl());

  setupHeaders(ss);
  return ss;
}

// ---- 建立標題列 ----
function setupHeaders(ss) {
  const sheet = ss.getActiveSheet();
  sheet.setName('訂單');

  // 欄位標題
  const headers = ['時間戳記', '姓名'];
  PRODUCT_LIST.forEach(p => headers.push(p.name + '\n$' + p.price));
  headers.push('訂購摘要');
  headers.push('總金額（元）');
  headers.push('備註及回覆');

  const headerRow = sheet.getRange(1, 1, 1, headers.length);
  headerRow.setValues([headers]);

  // 樣式
  headerRow.setBackground('#1a5c2a');
  headerRow.setFontColor('#ffffff');
  headerRow.setFontWeight('bold');
  headerRow.setHorizontalAlignment('center');
  headerRow.setVerticalAlignment('middle');
  headerRow.setWrap(true);

  // 列高
  sheet.setRowHeight(1, 48);

  // 欄寬設定
  sheet.setColumnWidth(1, 155);  // 時間戳記
  sheet.setColumnWidth(2, 75);   // 姓名
  for (let i = 3; i <= 2 + PRODUCT_LIST.length; i++) {
    sheet.setColumnWidth(i, 78); // 各商品
  }
  const summaryCol = 3 + PRODUCT_LIST.length;
  const totalCol   = summaryCol + 1;
  const noteCol    = totalCol + 1;
  sheet.setColumnWidth(summaryCol, 220); // 訂購摘要
  sheet.setColumnWidth(totalCol, 90);    // 總金額
  sheet.setColumnWidth(noteCol, 160);    // 備註及回覆

  // 凍結第1列 + 前2欄
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
}

// ---- doPost：接收訂單 ----
function doPost(e) {
  try {
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getActiveSheet();
    const params = e.parameter;

    const name    = params.name    || '';
    const summary = params.summary || '';
    const total   = parseInt(params.total) || 0;
    const note    = params.note    || '';

    // 時間戳記
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');

    // 各商品數量
    const qtyValues = PRODUCT_LIST.map(p => {
      const v = params[p.id];
      return (v !== undefined && v !== '' && parseInt(v) > 0) ? parseInt(v) : '';
    });

    // 備註及回覆欄（GAS自動產生）
    const orderedItems = PRODUCT_LIST.filter(p => {
      const v = params[p.id];
      return v !== undefined && v !== '' && parseInt(v) > 0;
    });
    let replyText = `${name}你好，你所訂購的產品如下：`;
    replyText += orderedItems.map(p => `${p.name} ${parseInt(params[p.id])}份 單價${p.price}元`).join('、');
    replyText += `、總金額：${total}元`;
    if (note) replyText += `\n備註：${note}`;

    // 組合整列資料
    const rowData = [timestamp, name, ...qtyValues, summary, total, replyText];
    const lastRow = Math.max(sheet.getLastRow(), 1) + 1;

    sheet.appendRow(rowData);

    // 取得剛寫入的列
    const newRow = sheet.getLastRow();
    const totalCols = 2 + PRODUCT_LIST.length + 3; // 時間+姓名+商品+摘要+金額+備註

    // 交替底色（從第2列開始算，偶數列=米綠，奇數列=白）
    const dataRowIndex = newRow - 1; // 第1列是標題，所以資料從第2列，index從1算
    const bgColor = (dataRowIndex % 2 === 0) ? '#e8f5ea' : '#ffffff';
    sheet.getRange(newRow, 1, 1, totalCols).setBackground(bgColor);

    // 數量欄水平置中（第3欄到第 2+PRODUCT_LIST.length 欄）
    sheet.getRange(newRow, 3, 1, PRODUCT_LIST.length).setHorizontalAlignment('center');

    // 訂購摘要欄 wrap
    const summaryCol = 3 + PRODUCT_LIST.length;
    sheet.getRange(newRow, summaryCol).setWrap(true);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- doGet：測試用 ----
function doGet(e) {
  const ss = getOrCreateSpreadsheet();
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', url: ss.getUrl() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- 查詢試算表網址 ----
function getSpreadsheetUrl() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('試算表網址: ' + ss.getUrl());
  return ss.getUrl();
}

// ---- 手動初始化（首次執行呼叫此函數）----
function initialize() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('初始化完成！試算表網址: ' + ss.getUrl());
}
