#!/usr/bin/env node

/**
 * Google Spreadsheet Auto Report Row Manager
 * 
 * 最終行のデータを基に、次の期間の行を自動追加
 * - daily_report: 最終行の翌日を追加
 * - monthly_report: 最終行の翌月を追加（毎月1日実行時）
 * - annual_report: 最終行の翌年を追加（毎年1月1日実行時）
 */

const { google } = require('googleapis');
const path = require('path');

// 設定
const SPREADSHEET_ID = '1Auu97EDFzflnr_3AVdjv-OByy1t1fkZfcnJEBMiJcRc';
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'google-credentials.json');

/**
 * 数式内の行番号を更新
 */
function updateFormulaRowNumbers(formula, oldRow, newRow) {
  if (!formula) return formula;
  const pattern = new RegExp(`\\$([A-Z]+)${oldRow}(?![0-9])`, 'g');
  return formula.replace(pattern, `$$$1${newRow}`);
}

/**
 * daily_reportに次の日を追加
 */
async function addDailyRow(sheets) {
  try {
    const sheetName = 'daily_report';
    
    // 最終行のデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values || [];
    const lastRow = rows.length;
    const newRow = lastRow + 1;
    
    // 最終行の日付を取得
    const lastDateStr = rows[lastRow - 1][0];
    console.log(`📅 daily_report: 最終行の日付 = ${lastDateStr}`);
    
    // 次の日を計算（タイムゾーンを考慮）
    const [y, m, d] = lastDateStr.split('/').map(Number);
    const lastDate = new Date(y, m - 1, d);
    lastDate.setDate(lastDate.getDate() + 1);
    const nextYear = lastDate.getFullYear();
    const nextMonth = String(lastDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(lastDate.getDate()).padStart(2, '0');
    const nextDateStr = `${nextYear}/${nextMonth}/${nextDay}`;
    
    console.log(`📝 daily_report: 次の日付 = ${nextDateStr} → 行${newRow}に追加`);

    // 最終行のセルデータを取得
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!${lastRow}:${lastRow}`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat))))',
    });

    const lastRowData = formulaResponse.data.sheets[0].data[0].rowData[0].values;

    // 新しい行のデータを作成
    const newRowData = lastRowData.map((cell, index) => {
      if (index === 0) {
        // A列（日付）
        const epoch = new Date(1899, 11, 30);
        const serialValue = (lastDate - epoch) / (1000 * 60 * 60 * 24);
        
        return { 
          userEnteredValue: { numberValue: serialValue },
          userEnteredFormat: { 
            numberFormat: { type: 'DATE', pattern: 'yyyy/MM/dd' },
            horizontalAlignment: 'CENTER'
          }
        };
      } else {
        // その他の列は数式の行番号を更新
        const newCell = { userEnteredFormat: cell.userEnteredFormat };
        
        if (cell.userEnteredValue?.formulaValue) {
          const updatedFormula = updateFormulaRowNumbers(
            cell.userEnteredValue.formulaValue,
            lastRow,
            newRow
          );
          newCell.userEnteredValue = { formulaValue: updatedFormula };
        } else if (cell.userEnteredValue) {
          newCell.userEnteredValue = cell.userEnteredValue;
        }
        
        return newCell;
      }
    });

    // 行を追加
    const sheetId = await getSheetId(sheets, sheetName);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            appendCells: {
              sheetId: sheetId,
              rows: [{ values: newRowData }],
              fields: 'userEnteredValue,userEnteredFormat',
            },
          },
        ],
      },
    });

    console.log(`✅ daily_report: ${nextDateStr}の行を追加しました\n`);
    return true;
  } catch (error) {
    console.error('❌ daily_reportエラー:', error.message);
    return false;
  }
}

/**
 * monthly_reportに次の月を追加
 */
async function addMonthlyRow(sheets) {
  try {
    const sheetName = 'monthly_report';
    
    // 最終行を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:B`,
    });

    const rows = response.data.values || [];
    const lastRow = rows.length;
    const newRow = lastRow + 1;
    
    // 最終行の年月を取得
    const lastYear = parseInt(rows[lastRow - 1][0]);
    const lastMonth = parseInt(rows[lastRow - 1][1]);
    
    console.log(`📅 monthly_report: 最終行 = ${lastYear}年${String(lastMonth).padStart(2, '0')}月`);
    
    // 次の月を計算
    let nextYear = lastYear;
    let nextMonth = lastMonth + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    
    console.log(`📝 monthly_report: 次の月 = ${nextYear}年${String(nextMonth).padStart(2, '0')}月 → 行${newRow}に追加`);

    // 最終行のセルデータを取得
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!${lastRow}:${lastRow}`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat))))',
    });

    const lastRowData = formulaResponse.data.sheets[0].data[0].rowData[0].values;

    // 新しい行のデータを作成（全て数式をコピー）
    const newRowData = lastRowData.map((cell) => {
      const newCell = { userEnteredFormat: cell.userEnteredFormat };
      
      if (cell.userEnteredValue?.formulaValue) {
        const updatedFormula = updateFormulaRowNumbers(
          cell.userEnteredValue.formulaValue,
          lastRow,
          newRow
        );
        newCell.userEnteredValue = { formulaValue: updatedFormula };
      } else if (cell.userEnteredValue) {
        newCell.userEnteredValue = cell.userEnteredValue;
      }
      
      return newCell;
    });

    // 行を追加
    const sheetId = await getSheetId(sheets, sheetName);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            appendCells: {
              sheetId: sheetId,
              rows: [{ values: newRowData }],
              fields: 'userEnteredValue,userEnteredFormat',
            },
          },
        ],
      },
    });

    console.log(`✅ monthly_report: ${nextYear}年${String(nextMonth).padStart(2, '0')}月の行を追加しました\n`);
    return true;
  } catch (error) {
    console.error('❌ monthly_reportエラー:', error.message);
    return false;
  }
}

/**
 * annual_reportに次の年を追加
 */
async function addAnnualRow(sheets) {
  try {
    const sheetName = 'annual_report';
    
    // 最終行を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values || [];
    const lastRow = rows.length;
    const newRow = lastRow + 1;
    
    // 最終行の年を取得
    const lastYearStr = String(rows[lastRow - 1][0]).replace('年', '');
    const lastYear = parseInt(lastYearStr);
    const nextYear = lastYear + 1;
    
    console.log(`📅 annual_report: 最終行 = ${lastYear}年`);
    console.log(`📝 annual_report: 次の年 = ${nextYear}年 → 行${newRow}に追加`);

    // 最終行のセルデータを取得
    const formulaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${sheetName}!${lastRow}:${lastRow}`],
      fields: 'sheets(data(rowData(values(userEnteredValue,userEnteredFormat))))',
    });

    const lastRowData = formulaResponse.data.sheets[0].data[0].rowData[0].values;

    // 新しい行のデータを作成（全て数式をコピー）
    const newRowData = lastRowData.map((cell) => {
      const newCell = { userEnteredFormat: cell.userEnteredFormat };
      
      if (cell.userEnteredValue?.formulaValue) {
        const updatedFormula = updateFormulaRowNumbers(
          cell.userEnteredValue.formulaValue,
          lastRow,
          newRow
        );
        newCell.userEnteredValue = { formulaValue: updatedFormula };
      } else if (cell.userEnteredValue) {
        newCell.userEnteredValue = cell.userEnteredValue;
      }
      
      return newCell;
    });

    // 行を追加
    const sheetId = await getSheetId(sheets, sheetName);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            appendCells: {
              sheetId: sheetId,
              rows: [{ values: newRowData }],
              fields: 'userEnteredValue,userEnteredFormat',
            },
          },
        ],
      },
    });

    console.log(`✅ annual_report: ${nextYear}年の行を追加しました\n`);
    return true;
  } catch (error) {
    console.error('❌ annual_reportエラー:', error.message);
    return false;
  }
}

/**
 * シートIDを取得
 */
async function getSheetId(sheets, sheetName) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets(properties(sheetId,title))',
  });

  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}

/**
 * メイン処理
 */
async function main(targetDate) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const [year, month, day] = targetDate.split('/').map(Number);
    
    console.log(`\n🕐 実行日時: ${targetDate}\n`);

    // 1. 毎日：daily_report
    console.log('=== daily_report ===');
    await addDailyRow(sheets);

    // 2. 毎月1日：monthly_report
    if (day === 1) {
      console.log('=== monthly_report（月初処理）===');
      await addMonthlyRow(sheets);
    }

    // 3. 毎年1月1日：annual_report
    if (month === 1 && day === 1) {
      console.log('=== annual_report（年初処理）===');
      await addAnnualRow(sheets);
    }

    console.log('✨ 全処理完了\n');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 実行
const targetDate = process.argv[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '/');
const formattedDate = targetDate.replace(/-/g, '/');

main(formattedDate);
