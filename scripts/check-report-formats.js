const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1Auu97EDFzflnr_3AVdjv-OByy1t1fkZfcnJEBMiJcRc';
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'google-credentials.json');

async function checkFormats() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // monthly_reportの最終行
  console.log('=== monthly_report ===');
  const monthlyResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: ['monthly_report!16:16'],
    fields: 'sheets(data(rowData(values(userEnteredValue,effectiveValue,formattedValue))))',
  });
  const monthlyRow = monthlyResponse.data.sheets[0].data[0].rowData[0].values;
  console.log('A列（year）:', JSON.stringify(monthlyRow[0], null, 2));
  console.log('B列（month）:', JSON.stringify(monthlyRow[1], null, 2));

  // annual_reportの最終行
  console.log('\n=== annual_report ===');
  const annualResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: ['annual_report!5:5'],
    fields: 'sheets(data(rowData(values(userEnteredValue,effectiveValue,formattedValue))))',
  });
  const annualRow = annualResponse.data.sheets[0].data[0].rowData[0].values;
  console.log('A列（year）:', JSON.stringify(annualRow[0], null, 2));
}

checkFormats();
