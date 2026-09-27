/** Add this file and raid-snapshot.js to the existing Apps Script project.
 * Keep the existing uploader/trigger and replace only its snapshot builder
 * with buildRaidSnapshotFromSheets(). This file does not create triggers.
 */
function buildRaidSnapshotFromSheets() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("RAID_SPREADSHEET_ID");
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("RAID_SPREADSHEET_ID 스크립트 속성을 설정하세요.");

  const raidSheet = spreadsheet.getSheetByName(
    properties.getProperty("RAID_SHEET_NAME") || "고정공대시트"
  );
  const characterSheet = spreadsheet.getSheetByName(
    properties.getProperty("RAID_CHARACTER_SHEET_NAME") || "캐릭터DB"
  );
  if (!raidSheet || !characterSheet) throw new Error("공대표 또는 캐릭터DB 탭을 찾을 수 없습니다.");

  // getValues preserves numeric power and Date values (not displayed 966.9K).
  // Read through the last used row, including added raids and moved dungeons.
  return buildRaidSnapshot(
    raidSheet.getDataRange().getValues(),
    characterSheet.getDataRange().getValues()
  );
}
