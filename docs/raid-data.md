# 공대표 데이터 갱신

`raid.html`은 `data/raid-snapshot.json`의 모든 던전과 공대를 표시합니다.
화면에는 5공대 제한이 없습니다. 2026-09-27의 6공대 누락은 JSON에
루드라·침식 각각 5공대만 저장되어 발생했습니다.

## 현재 운영 프로젝트

2026-09-27에 기존 Apps Script 프로젝트의 `buildSiteSnapshot_()`를
이 저장소의 공통 파서와 연결했습니다. 기존 `AION2 → 사이트 데이터 갱신` 메뉴와
`publishSiteSnapshot` 실행 이름은 유지되므로 별도 메뉴 설치가 필요하지 않습니다.
원본은 Apps Script 버전 1로 백업했습니다.

운영 코드는 역할별 파일로 분리했습니다. 전체/선택 캐릭터 갱신은 공통 경로를 사용하며,
성공한 행만 갱신하고 오너 열과 실패한 행의 체크를 보존합니다. GitHub 토큰은 계속
기존 User Properties의 `GITHUB_TOKEN`을 사용하며 저장소에 올리지 않습니다.
동시 갱신은 스크립트 잠금으로 방지합니다. 기존 공개 함수 이름 12개와 매니페스트를 유지했습니다.

`scripts/raid-snapshot.js`는 운영 프로젝트의 `RaidParser.js`와 같은 파서입니다.
향후 이 파일을 변경하면 Apps Script에도 반영해야 합니다. GitHub Pages 배포만으로
Apps Script 코드가 자동 업데이트되지는 않습니다.

## 다른 프로젝트에 연결하기

새 프로젝트나 다른 기존 생성기에 연결한다면:

1. 기존 스프레드시트의 Apps Script 프로젝트에 `scripts/raid-snapshot.js`와
   `scripts/raid-snapshot-apps-script.gs` 내용을 각각 스크립트 파일로 추가합니다.
2. 기존 업로드 함수에서 고정 행/5회 반복으로 JSON을 만들던 부분을
   `const snapshot = buildRaidSnapshotFromSheets();`로 교체합니다.
3. 기존 GitHub 업로드 코드에 `JSON.stringify(snapshot, null, 2) + "\n"`을 전달합니다.
   토큰, 저장 경로, GitHub 업로드 방식과 기존 트리거는 유지합니다.
   생성 함수에서 오류가 발생하면 업로드를 중단하고 기존 JSON을 보존합니다.
4. 시트에 연결된 스크립트는 기본적으로 현재 파일을 사용합니다. 독립 프로젝트는
   스크립트 속성 `RAID_SPREADSHEET_ID`에 원본 파일 ID를 지정합니다.
   탭 이름 변경 시 `RAID_SHEET_NAME`, `RAID_CHARACTER_SHEET_NAME`도 설정합니다.
5. 기존 갱신 함수를 한 번 실행하고 JSON과 사이트에 루드라·침식 6공대가 표시되는지 확인합니다.

다른 생성기에서도 `buildRaidSnapshot(raidRows, characterRows, options)`를 사용할 수 있습니다.
Node.js에서는 `require('./scripts/raid-snapshot.js')`로 가져옵니다.
기존 던전 ID를 유지하려면 `options.previousSnapshot`에 직전 JSON을 전달합니다.
ID는 화면 표시나 공대 수에 영향을 주지 않습니다.

## 시트 구조

- B열 `[루드라 본2부4: 침식 이후]` 등 대괄호 제목은 새 던전을 시작합니다.
- 이후 B열 `[1공대]`, `[6공대]`, `[12공대]` 등의 행을 다음 던전 제목까지 모두 읽습니다.
- 중간 빈 행·일반 안내 행은 건너뛰며, 번호 누락을 임의로 채우거나 재정렬하지 않습니다.
- 인원이 없는 `[n공대]` 행도 빈 공대로 표시합니다.
- 기본 파티 구성은 C:G와 I:M, H열은 구분선입니다.
- 다른 슬롯/파티 구조는 `options.partyColumns`의 **0부터 시작하는 열 번호 배열**로 명시합니다.
  예: `[[2,3,4,5,6], [8,9,10,11,12], [14,15,16,17,18]]`.
- 캐릭터DB는 열 이름으로 읽으므로 열 순서 변경에 대응합니다. 전투력은 표시 문자열이 아닌 숫자,
  갱신시각은 Date 또는 ISO 문자열로 전달합니다.
- 기존 `*캐릭터명*` 강조 표기를 보존합니다. `options.dungeonIds`로 기존 던전 ID를 유지할 수 있습니다.
- 동일 던전의 중복 공대 번호, 던전 제목 없는 공대, 중복 닉네임·필수 DB 헤더 누락은 오류 처리합니다.

## 검증

추가 패키지 설치 없이 `node --test tests/raid-snapshot.test.cjs`를 실행합니다.
6·12공대, 이동된 던전, 빈 행·빈 공대, 추가 던전·파티, 원본 캐릭터DB 구조와
실제 렌더러의 6공대 출력 여부를 검증합니다.
