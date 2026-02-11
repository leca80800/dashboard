#!/usr/bin/env node

/**
 * Google Spreadsheet Daily Row Creator
 * 
 * daily_reportシートに新しい日付の行を自動追加
 * 最終行の数式をコピーして行番号を更新
 */

const { google } = require('googleapis');
const path = require('path');

// 設定
const SPREADSHEET_ID = '1Auu97EDFzflnr_3AVdjv-OByy1t1fkZfcnJEBMiJcRc';
const SHEET_NAME = 'daily_report';

// Google認証設定
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'google-credentials.json');

/**
 * 数式内の行番号を更新
 * 例: $A190 -> $A191
 */
function updateFormulaRowNumbers(formula, oldRow, newRow) {
  if (!formula) return formula;
  
  // $A190 のようなパターンを $A191 に置換
  const pattern = new RegExp(`\\$([A-Z]+)${oldRow}(?![0-9])`, 'g');
  return formula.replace(pattern, `$$$1${newRow}`);
}

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
    const newRow = lastRow + 1;
    
    console.log(`最終行: ${lastRow} → 新しい行: ${newRow}`);

    // 2. 最終行の数式とフォーマットを取得
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${SHEET_NAME}!${lastRow}:${lastRow}`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat))))',
    });

    const lastRowData = formulaResponse.data.sheets[0].data[0].rowData[0].values;

    // 3. 新しい行のデータを作成
    const newRowData = lastRowData.map((cell, index) => {
      if (index === 0) {
        // A列（日付）は新しい日付に
        const dateParts = targetDate.split('/');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // 月は0-indexed
        const day = parseInt(dateParts[2]);
        const dateValue = new Date(year, month, day);
        
        // Google Sheetsの日付シリアル値に変換
        const epoch = new Date(1899, 11, 30);
        const serialDate = (dateValue - epoch) / (1000 * 60 * 60 * 24);
        
        return { 
          userEnteredValue: { numberValue: serialDate },
          userEnteredFormat: { 
            numberFormat: { type: 'DATE', pattern: 'yyyy/MM/dd' },
            horizontalAlignment: 'CENTER'
          }
        };
      } else {
        // 他の列は数式の行番号を更新してコピー
        const newCell = { userEnteredFormat: cell.userEnteredFormat };
        
        if (cell.userEnteredValue?.formulaValue) {
          // 数式がある場合、行番号を更新
          const updatedFormula = updateFormulaRowNumbers(
            cell.userEnteredValue.formulaValue,
            lastRow,
            newRow
          );
          newCell.userEnteredValue = { formulaValue: updatedFormula };
        } else if (cell.userEnteredValue) {
          // 数式がない場合はそのままコピー
          newCell.userEnteredValue = cell.userEnteredValue;
        }
        
        return newCell;
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
              rows: [{ values: newRowData }],
              fields: 'userEnteredValue,userEnteredFormat',
            },
          },
        ],
      },
    });

    console.log(`✅ ${targetDate}の行を追加しました（行${newRow}）`);
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error(error.stack);
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
