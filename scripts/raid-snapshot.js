/* Shared by Node.js and Google Apps Script (V8). No network or credentials. */
"use strict";

function raidText(value) {
  return value == null ? "" : String(value).trim();
}

function raidDungeonName(title) {
  return raidText(title).replace(/^\[/, "").replace(/\]$/, "")
    .split(/\s+본\d+|[:：]/)[0].trim();
}

/** Read labelled rows, never fixed row offsets or a maximum raid count.
 * Column indexes are zero-based; H is a separator, not a player slot.
 */
function buildRaidSnapshot(raidRows, characterRows, options) {
  options = options || {};
  const labelColumn = options.labelColumn == null ? 1 : options.labelColumn;
  const partyColumns = options.partyColumns || [[2, 3, 4, 5, 6], [8, 9, 10, 11, 12]];
  if (!Array.isArray(raidRows) || !Array.isArray(characterRows)) {
    throw new Error("공대표와 캐릭터DB의 행 배열이 필요합니다.");
  }
  if (!partyColumns.length || partyColumns.some(columns => !Array.isArray(columns) || !columns.length)) {
    throw new Error("파티별 슬롯 열을 지정하세요.");
  }
  const columns = [].concat.apply([], partyColumns);
  if (columns.some(column => !Number.isInteger(column) || column < 0 || column === labelColumn) ||
      new Set(columns).size !== columns.length) {
    throw new Error("슬롯 열은 중복되지 않는 열 번호여야 합니다.");
  }

  const header = (characterRows[0] || []).map(raidText);
  const index = {};
  ["닉네임", "서버", "전투력", "직업", "갱신시각", "캐릭터 오너"].forEach(name => {
    index[name] = header.indexOf(name);
    if (index[name] < 0) throw new Error("캐릭터DB 헤더 누락: " + name);
  });
  const characters = Object.create(null);
  characterRows.slice(1).forEach(row => {
    const name = raidText(row[index["닉네임"]]);
    if (!name) return;
    if (Object.prototype.hasOwnProperty.call(characters, name)) {
      throw new Error("캐릭터DB 닉네임 중복: " + name);
    }
    const rawPower = row[index["전투력"]];
    const combatPower = Number(raidText(rawPower).replace(/,/g, ""));
    if (!Number.isFinite(combatPower) || combatPower < 0) {
      throw new Error("전투력은 원본 숫자 값이어야 합니다: " + name);
    }
    const updated = row[index["갱신시각"]];
    characters[name] = {
      server: raidText(row[index["서버"]]),
      combatPower,
      job: raidText(row[index["직업"]]),
      updatedAt: updated instanceof Date ? updated.toISOString() : raidText(updated),
      owner: raidText(row[index["캐릭터 오너"]])
    };
  });
  if (!Object.keys(characters).length) throw new Error("캐릭터DB가 비어 있습니다.");

  const previous = options.previousSnapshot || {};
  const dungeons = [];
  const dungeonNames = new Set();
  let dungeon = null;
  let raidNumbers = new Set();
  raidRows.forEach((row, rowIndex) => {
    const label = raidText(row[labelColumn]);
    const raidMatch = /^\[\s*(\d+)\s*공대\s*\]$/.exec(label);
    if (raidMatch) {
      if (!dungeon) throw new Error((rowIndex + 1) + "행: 던전 제목 없는 공대입니다.");
      const number = Number(raidMatch[1]);
      if (number < 1 || raidNumbers.has(number)) {
        throw new Error((rowIndex + 1) + "행: 공대 번호 중복 또는 오류: " + label);
      }
      raidNumbers.add(number);
      dungeon.raids.push({
        label,
        parties: partyColumns.map((columns, partyIndex) => ({
          partyNumber: partyIndex + 1,
          slots: columns.map(column => ({
            slot: "",
            name: raidText(row[column]) || null,
            emphasis: false
          }))
        }))
      });
    } else if (/^\[.+\]$/.test(label)) {
      if (/공대/.test(label)) throw new Error((rowIndex + 1) + "행: 공대 번호를 확인하세요: " + label);
      const name = raidDungeonName(label);
      if (!name || dungeonNames.has(name)) throw new Error("던전 제목 중복 또는 오류: " + label);
      dungeonNames.add(name);
      const old = (previous.dungeons || []).find(item => raidDungeonName(item.title) === name);
      dungeon = {
        id: old ? old.id : "dungeon-" + encodeURIComponent(name),
        title: label,
        partySize: Math.max.apply(null, partyColumns.map(columns => columns.length)),
        partyCount: partyColumns.length,
        raids: []
      };
      dungeons.push(dungeon);
      raidNumbers = new Set();
    }
    // Blank rows and unbracketed notes do not end a dungeon.
  });
  if (!dungeons.length || !dungeons.some(item => item.raids.length)) {
    throw new Error("던전 제목과 [n공대] 행을 찾지 못했습니다. 기존 JSON을 유지하세요.");
  }
  return {
    version: 1,
    generatedAt: options.generatedAt || new Date().toISOString(),
    characters,
    dungeons
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildRaidSnapshot };
}
