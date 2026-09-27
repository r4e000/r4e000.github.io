const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { buildRaidSnapshot } = require('../scripts/raid-snapshot.js');

const header = ['닉네임', '서버', '전투력', '직업', '갱신시각', '캐릭터 오너'];
const db = [header, ['테스트', '서버', 950000, '수호성', new Date('2026-09-27T00:00:00Z'), '오너']];
const title = name => ['', '[' + name + ': 일정]'];
const raid = number => ['', '[' + number + '공대]', '테스트', '', '', '', '', '구분선', '테스트'];

test('reads 6 and 12 raids, shifted headers, gaps and new dungeons', () => {
  for (const count of [6, 12]) {
    const rows = [[], ['', '안내'], title('루드라')];
    for (let i = 1; i <= count; i++) rows.push(raid(i), []);
    rows.push(title('새 던전'), raid(1), title('침식'), raid(1));
    const result = buildRaidSnapshot(rows, db);
    assert.deepEqual(result.dungeons.map(d => d.raids.length), [count, 1, 1]);
    assert.equal(result.dungeons[0].raids.at(-1).label, '[' + count + '공대]');
    assert.deepEqual(result.dungeons[0].raids[0].parties.map(p => p.slots.length), [5, 5]);
    assert.equal(result.dungeons[0].raids[0].parties[1].slots[0].name, '테스트');
    assert.equal(result.characters['테스트'].updatedAt, '2026-09-27T00:00:00.000Z');
  }
});

test('keeps empty raids and sheet order without manufacturing missing numbers', () => {
  const result = buildRaidSnapshot([title('침식'), ['', '[6공대]'], raid(2)], db);
  assert.deepEqual(result.dungeons[0].raids.map(r => r.label), ['[6공대]', '[2공대]']);
  assert.ok(result.dungeons[0].raids[0].parties.every(p => p.slots.every(s => s.name === null)));
});

test('preserves legacy emphasis, configured dungeon IDs and missing dates', () => {
  const row = raid(1);
  row[2] = '*테스트*';
  const characterRows = [header, ['테스트', '서버', 950000, '수호성', '', '오너']];
  const result = buildRaidSnapshot([title('루드라'), row], characterRows, {
    dungeonIds: {'루드라': 'rudra-main1-sub4'}
  });
  assert.equal(result.dungeons[0].id, 'rudra-main1-sub4');
  assert.deepEqual(result.dungeons[0].raids[0].parties[0].slots[0], {
    slot: '', name: '테스트', emphasis: true
  });
  assert.equal(result.characters['테스트'].updatedAt, null);
  assert.equal(result.characters['테스트'].owner, '오너');
});

test('supports reordered DB headers, explicit extra parties and stable IDs', () => {
  const reordered = db.map(row => row.slice().reverse());
  const result = buildRaidSnapshot([title('루드라'), raid(1)], reordered, {
    partyColumns: [[2, 3], [8, 9], [14, 15]],
    previousSnapshot: { dungeons: [{ id: 'existing-id', title: '[루드라 본1부4: 이전]' }] }
  });
  assert.equal(result.dungeons[0].id, 'existing-id');
  assert.equal(result.dungeons[0].partyCount, 3);
  assert.equal(result.dungeons[0].raids[0].parties[2].slots.length, 2);
  assert.equal(result.characters['테스트'].combatPower, 950000);
});

test('rejects invalid input instead of silently overwriting the last good snapshot', () => {
  assert.throws(() => buildRaidSnapshot([], db), /찾지 못/);
  assert.throws(() => buildRaidSnapshot([raid(1)], db), /제목 없는/);
  assert.throws(() => buildRaidSnapshot([title('루드라'), raid(1), raid(1)], db), /중복/);
  assert.throws(() => buildRaidSnapshot([title('루드라'), ['', '[육공대]']], db), /번호/);
  assert.throws(() => buildRaidSnapshot([title('루드라'), raid(1)], [['닉네임']]), /헤더/);
  assert.throws(() => buildRaidSnapshot([title('루드라'), raid(1)], [...db, db[1]]), /닉네임 중복/);
  assert.throws(() => buildRaidSnapshot([title('루드라'), raid(1)], db, {partyColumns: [[2], [2]]}), /슬롯 열/);
});

test('Apps Script adapter reads the entire used range and delegates to the shared parser', () => {
  const calls = [];
  const rows = [title('루드라'), ...Array.from({length: 12}, (_, i) => raid(i + 1))];
  const context = {
    PropertiesService: {getScriptProperties: () => ({getProperty: () => null})},
    SpreadsheetApp: {getActiveSpreadsheet: () => ({getSheetByName: name => ({
      getDataRange: () => ({getValues: () => { calls.push(name); return name === '캐릭터DB' ? db : rows; }})
    })})},
    buildRaidSnapshot
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../scripts/raid-snapshot-apps-script.gs'), 'utf8'), context);
  assert.equal(context.buildRaidSnapshotFromSheets().dungeons[0].raids.length, 12);
  assert.deepEqual(calls, ['고정공대시트', '캐릭터DB']);
});

test('production renderer displays all 6 and 12 raids without a fixed limit', async () => {
  class Element {
    constructor() {
      this.children = []; this.dataset = {}; this.style = {}; this.value = '';
      this.classList = {add() {}, remove() {}, toggle() {}, contains() {return false;}};
    }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren() { this.children = []; }
    addEventListener() {}
    setAttribute() {}
    querySelectorAll() { return []; }
  }
  const ids = Object.fromEntries(['raid-root', 'raid-status', 'raid-generated-at', 'raid-error',
    'raid-error-message', 'raid-tooltip', 'raid-owner-select', 'raid-owner-summary'].map(id => [id, new Element()]));
  const snapshot = buildRaidSnapshot([
    title('루드라'), ...Array.from({length: 6}, (_, i) => raid(i + 1)),
    title('침식'), ...Array.from({length: 12}, (_, i) => raid(i + 1))
  ], db);
  const context = {
    document: {getElementById: id => ids[id], createElement: () => new Element(),
      querySelector: () => null, addEventListener() {}},
    window: {addEventListener() {}},
    localStorage: {getItem: () => null, removeItem() {}},
    fetch: async () => ({ok: true, json: async () => snapshot}), console, Intl, Date,
    requestAnimationFrame: callback => callback()
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/raid.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ids['raid-error'].hidden, true);
  const all = node => [node, ...node.children.flatMap(all)];
  const titles = all(ids['raid-root']).filter(node => node.className === 'raid-group-title').map(node => node.textContent);
  assert.equal(titles.length, snapshot.dungeons.reduce((sum, dungeon) => sum + dungeon.raids.length, 0));
  assert.equal(titles.filter(title => title === '6공대').length, 2);
  assert.equal(titles.filter(title => title === '12공대').length, 1);
});
