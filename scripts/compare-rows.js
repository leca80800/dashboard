const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Auu97EDFzflnr_3AVdjv-OByy1t1fkZfcnJEBMiJcRc';
const SHEET_NAME = 'daily_report';
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'google-credentials.json');

async function compareRows() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 行173と行191のセル情報を取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${SHEET_NAME}!173:173`, `${SHEET_NAME}!191:191`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat,effectiveValue,formattedValue))))',
    });

    const row173 = response.data.sheets[0].data[0].rowData[0].values;
    const row191 = response.data.sheets[0].data[1].rowData[0].values;

    console.log('=== 行173（成功例：手動作成）===');
    console.log('A列（日付）:');
    console.log(JSON.stringify(row173[0], null, 2));
    
    console.log('\n=== 行191（失敗例：スクリプト作成）===');
    console.log('A列（日付）:');
    console.log(JSON.stringify(row191[0], null, 2));

    console.log('\n=== B列（P/L）も比較 ===');
    console.log('行173 B列:');
    console.log(JSON.stringify(row173[1], null, 2));
    console.log('\n行191 B列:');
    console.log(JSON.stringify(row191[1], null, 2));

  } catch (error) {
    console.error('エラー:', error.message);
  }
}

compareRows();
