#!/usr/bin/env node

/**
 * Google Spreadsheet Daily Row Creator
 * 
 * daily_reportシートに新しい日付の行を自動追加
 * 最終行の数式をコピーして日付だけ更新
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 設定
const SPREADSHEET_ID = '1Auu97EDFzflnr_3AVdjv-OByy1t1fkZfcnJEBMiJcRc';
const SHEET_NAME = 'daily_report';
const DATE_COLUMN = 'A'; // 日付列

// Google認証設定（OAuth2またはサービスアカウント）
// ここではサービスアカウントを想定
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'google-credentials.json');

async function addDailyRow(targetDate) {
  try {
    // 認証
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 最終行を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    const lastRow = rows.length;
    
    console.log(`最終行: ${lastRow}`);

    // 2. 最終行の数式を取得
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${SHEET_NAME}!${lastRow}:${lastRow}`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat))))',
    });

    const lastRowData = formulaResponse.data.sheets[0].data[0].rowData[0].values;

    // 3. 新しい行を追加（日付のみ変更、他は数式コピー）
    const newRow = lastRowData.map((cell, index) => {
      if (index === 0) {
        // A列（日付）は新しい日付に
        return { userEnteredValue: { stringValue: targetDate } };
      } else {
        // 他の列は数式をそのままコピー
        return { userEnteredValue: cell.userEnteredValue };
      }
    });

    // 4. 行を追加
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            appendCells: {
              sheetId: await getSheetId(sheets, SHEET_NAME),
              rows: [{ values: newRow }],
              fields: 'userEnteredValue',
            },
          },
        ],
      },
    });

    console.log(`✅ ${targetDate}の行を追加しました`);
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
}

async function getSheetId(sheets, sheetName) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets(properties(sheetId,title))',
  });

  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}

// 実行
const targetDate = process.argv[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '/');
const formattedDate = targetDate.replace(/-/g, '/');

console.log(`日付行を追加: ${formattedDate}`);
addDailyRow(formattedDate);
