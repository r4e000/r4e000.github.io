(() => {

  "use strict";


  const SNAPSHOT_URL =
    "data/raid-snapshot.json";


  const JOB_ROLE = {

    "수호성": "tank",
    "검성": "tank",

    "치유성": "healer",

    "호법성": "support"

  };


  const ROLE_NAME = {

    tank: "탱커",
    healer: "힐러",
    support: "버퍼",
    dealer: "딜러"

  };


  let snapshot = null;

  let activeMember = null;


  const root =
    document.getElementById(
      "raid-root"
    );


  const status =
    document.getElementById(
      "raid-status"
    );


  const generatedAt =
    document.getElementById(
      "raid-generated-at"
    );


  const errorBox =
    document.getElementById(
      "raid-error"
    );


  const errorMessage =
    document.getElementById(
      "raid-error-message"
    );


  const tooltip =
    document.getElementById(
      "raid-tooltip"
    );


  function getRole(job) {

    return (
      JOB_ROLE[job] ||
      "dealer"
    );

  }


  function formatCombatPower(value) {

    const number =
      Number(value);


    if (
      !Number.isFinite(number) ||
      number <= 0
    ) {

      return "-";

    }


    if (number >= 1000000) {

      return (
        (number / 1000000)
          .toFixed(1)
          .replace(/\.0$/, "") +
        "M"
      );

    }


    if (number >= 1000) {

      return (
        (number / 1000)
          .toFixed(1)
          .replace(/\.0$/, "") +
        "K"
      );

    }


    return number.toLocaleString(
      "ko-KR"
    );

  }


  function formatDate(value) {

    if (!value) {

      return "-";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "-";

    }


    return new Intl.DateTimeFormat(
      "ko-KR",
      {

        timeZone:
          "Asia/Seoul",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hour12:
          false

      }
    ).format(date);

  }


  function cleanLabel(value) {

    return String(value || "")
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .trim();

  }


  function makeElement(
    tag,
    className,
    text
  ) {

    const node =
      document.createElement(tag);


    if (className) {

      node.className =
        className;

    }


    if (
      text !== undefined &&
      text !== null
    ) {

      node.textContent =
        text;

    }


    return node;

  }


  function createMember(slot) {

    const member =
      makeElement(
        "div",
        "raid-member"
      );


    if (slot.slot) {

      member.appendChild(
        makeElement(
          "span",
          "raid-slot-label",
          slot.slot
        )
      );

    }


    if (!slot.name) {

      member.classList.add(
        "is-empty"
      );


      member.appendChild(
        makeElement(
          "span",
          "raid-member-empty",
          "—"
        )
      );


      return member;

    }


    const character =
      snapshot.characters[
        slot.name
      ];


    const role =
      getRole(
        character?.job
      );


    /*
     * 카드 전체에서
     * 캐릭터 이름을 찾을 수 있도록 저장
     */
    member.dataset.character =
      slot.name;


    member.classList.add(
      "raid-role-" + role
    );


    if (slot.emphasis) {

      member.classList.add(
        "is-emphasis"
      );

    }


    const button =
      makeElement(
        "button",
        "raid-member-button",
        slot.name
      );


    button.type =
      "button";


    /*
     * 키보드 접근용으로 버튼에도 유지
     */
    button.dataset.character =
      slot.name;


    if (!character) {

      button.classList.add(
        "is-missing"
      );

    }


    member.appendChild(
      button
    );


    return member;

  }


  function createParty(party) {

    const section =
      makeElement(
        "section",
        "raid-party"
      );


    const header =
      makeElement(
        "header",
        "raid-party-header"
      );


    header.appendChild(
      makeElement(
        "strong",
        "raid-party-title",
        party.partyNumber +
          "파티"
      )
    );


    const filled =
      party.slots.filter(
        slot => slot.name
      ).length;


    header.appendChild(
      makeElement(
        "span",
        "raid-party-count",
        filled +
          " / " +
          party.slots.length
      )
    );


    section.appendChild(
      header
    );


    const members =
      makeElement(
        "div",
        "raid-party-members"
      );


    party.slots.forEach(
      slot => {

        members.appendChild(
          createMember(slot)
        );

      }
    );


    section.appendChild(
      members
    );


    return section;

  }


  function createRaid(raid) {

    const article =
      makeElement(
        "article",
        "raid-group"
      );


    const header =
      makeElement(
        "header",
        "raid-group-header"
      );


    header.appendChild(
      makeElement(
        "h3",
        "raid-group-title",
        cleanLabel(
          raid.label
        )
      )
    );


    const total =
      raid.parties
        .flatMap(
          party =>
            party.slots
        )
        .filter(
          slot =>
            slot.name
        )
        .length;


    header.appendChild(
      makeElement(
        "span",
        "raid-group-count",
        total + "명"
      )
    );


    article.appendChild(
      header
    );


    const parties =
      makeElement(
        "div",
        "raid-parties"
      );


    raid.parties.forEach(
      party => {

        parties.appendChild(
          createParty(party)
        );

      }
    );


    article.appendChild(
      parties
    );


    return article;

  }


  function createDungeon(dungeon) {

    const section =
      makeElement(
        "section",
        "raid-dungeon"
      );


    const header =
      makeElement(
        "header",
        "raid-dungeon-header"
      );


    const titleBox =
      makeElement("div");


    titleBox.appendChild(
      makeElement(
        "p",
        "raid-dungeon-kicker",
        "DUNGEON"
      )
    );


    titleBox.appendChild(
      makeElement(
        "h2",
        "raid-dungeon-title",
        cleanLabel(
          dungeon.title
        )
      )
    );


    header.appendChild(
      titleBox
    );


    header.appendChild(
      makeElement(
        "span",
        "raid-dungeon-meta",
        dungeon.raids.length +
          "개 공대 · " +
          dungeon.partyCount +
          "파티"
      )
    );


    section.appendChild(
      header
    );


    const groups =
      makeElement(
        "div",
        "raid-groups"
      );


    dungeon.raids.forEach(
      raid => {

        groups.appendChild(
          createRaid(raid)
        );

      }
    );


    section.appendChild(
      groups
    );


    return section;

  }


  function renderSnapshot() {

    root.replaceChildren();


    snapshot.dungeons.forEach(
      dungeon => {

        root.appendChild(
          createDungeon(
            dungeon
          )
        );

      }
    );


    generatedAt.textContent =
      formatDate(
        snapshot.generatedAt
      );


    status.textContent =
      "던전 " +
      snapshot.dungeons.length +
      "개 · 캐릭터DB " +
      Object.keys(
        snapshot.characters
      ).length +
      "명";


    root.hidden =
      false;


    errorBox.hidden =
      true;

  }


  function createTooltipRow(
    label,
    value
  ) {

    const row =
      makeElement(
        "div",
        "raid-tooltip-row"
      );


    row.appendChild(
      makeElement(
        "span",
        "raid-tooltip-label",
        label
      )
    );


    row.appendChild(
      makeElement(
        "strong",
        "raid-tooltip-value",
        value
      )
    );


    return row;

  }


  function positionTooltip(member) {

    if (
      !member ||
      tooltip.hidden
    ) {

      return;

    }


    const rect =
      member.getBoundingClientRect();


    const tooltipRect =
      tooltip.getBoundingClientRect();


    const margin = 12;


    let left =
      rect.left +
      rect.width / 2 -
      tooltipRect.width / 2;


    let top =
      rect.top -
      tooltipRect.height -
      margin;


    if (left < margin) {

      left =
        margin;

    }


    if (
      left +
      tooltipRect.width >
      window.innerWidth -
      margin
    ) {

      left =
        window.innerWidth -
        tooltipRect.width -
        margin;

    }


    /*
     * 카드 위에 공간이 없으면
     * 카드 아래에 표시
     */
    if (top < margin) {

      top =
        rect.bottom +
        margin;

    }


    tooltip.style.left =
      Math.round(left) +
      "px";


    tooltip.style.top =
      Math.round(top) +
      "px";

  }


  function showTooltip(member) {

    const name =
      member.dataset.character;


    if (!name) {

      return;

    }


    activeMember =
      member;


    const character =
      snapshot.characters[
        name
      ];


    tooltip.replaceChildren();


    tooltip.appendChild(
      makeElement(
        "strong",
        "raid-tooltip-name",
        name
      )
    );


    if (!character) {

      tooltip.appendChild(
        createTooltipRow(
          "상태",
          "캐릭터DB 정보 없음"
        )
      );

    } else {

      const role =
        getRole(
          character.job
        );


      tooltip.appendChild(
        createTooltipRow(
          "직업",
          character.job || "-"
        )
      );


      tooltip.appendChild(
        createTooltipRow(
          "역할",
          ROLE_NAME[role]
        )
      );


      tooltip.appendChild(
        createTooltipRow(
          "서버",
          character.server || "-"
        )
      );


      tooltip.appendChild(
        createTooltipRow(
          "전투력",
          formatCombatPower(
            character.combatPower
          )
        )
      );


      tooltip.appendChild(
        createTooltipRow(
          "캐릭터 오너",
          character.owner || "-"
        )
      );


      tooltip.appendChild(
        createTooltipRow(
          "정보 갱신",
          formatDate(
            character.updatedAt
          )
        )
      );

    }


    tooltip.hidden =
      false;


    requestAnimationFrame(
      () => {

        positionTooltip(
          member
        );

      }
    );

  }


  function hideTooltip() {

    activeMember =
      null;


    tooltip.hidden =
      true;

  }


  /*
   * ==================================================
   * 카드 전체 마우스오버
   * ==================================================
   */


  root.addEventListener(
    "mouseover",
    event => {

      const member =
        event.target.closest(
          ".raid-member[data-character]"
        );


      if (!member) {

        return;

      }


      /*
       * 같은 카드 내부 요소끼리 이동할 때는
       * 툴팁을 다시 띄우지 않음
       */
      if (
        event.relatedTarget &&
        member.contains(
          event.relatedTarget
        )
      ) {

        return;

      }


      showTooltip(
        member
      );

    }
  );


  root.addEventListener(
    "mouseout",
    event => {

      const member =
        event.target.closest(
          ".raid-member[data-character]"
        );


      if (!member) {

        return;

      }


      /*
       * 카드 내부에서
       * 이름 → 빈 공간처럼 이동하는 건
       * 실제 mouseleave가 아님
       */
      if (
        event.relatedTarget &&
        member.contains(
          event.relatedTarget
        )
      ) {

        return;

      }


      hideTooltip();

    }
  );


  /*
   * 키보드 접근
   */

  root.addEventListener(
    "focusin",
    event => {

      const member =
        event.target.closest(
          ".raid-member[data-character]"
        );


      if (member) {

        showTooltip(
          member
        );

      }

    }
  );


  root.addEventListener(
    "focusout",
    event => {

      const member =
        event.target.closest(
          ".raid-member[data-character]"
        );


      if (!member) {

        return;

      }


      if (
        event.relatedTarget &&
        member.contains(
          event.relatedTarget
        )
      ) {

        return;

      }


      hideTooltip();

    }
  );


  /*
   * 모바일 터치용
   */

  root.addEventListener(
    "click",
    event => {

      const member =
        event.target.closest(
          ".raid-member[data-character]"
        );


      if (!member) {

        return;

      }


      if (
        activeMember === member &&
        !tooltip.hidden
      ) {

        hideTooltip();

        return;

      }


      showTooltip(
        member
      );

    }
  );


  /*
   * 화면 크기나 스크롤 위치가 변하면
   * 툴팁 위치 재계산
   */

  window.addEventListener(
    "resize",
    () => {

      if (
        activeMember &&
        !tooltip.hidden
      ) {

        positionTooltip(
          activeMember
        );

      }

    }
  );


  window.addEventListener(
    "scroll",
    () => {

      if (
        activeMember &&
        !tooltip.hidden
      ) {

        positionTooltip(
          activeMember
        );

      }

    },
    true
  );


  /*
   * ESC로 툴팁 닫기
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        hideTooltip();

      }

    }
  );


  async function loadSnapshot() {

    try {

      const response =
        await fetch(
          SNAPSHOT_URL +
          "?v=" +
          Date.now(),
          {

            cache:
              "no-store"

          }
        );


      if (!response.ok) {

        throw new Error(
          "raid-snapshot.json 요청 실패: HTTP " +
          response.status
        );

      }


      snapshot =
        await response.json();


      if (
        !snapshot.characters ||
        !Array.isArray(
          snapshot.dungeons
        )
      ) {

        throw new Error(
          "raid-snapshot.json 형식이 올바르지 않습니다."
        );

      }


      renderSnapshot();

    } catch (error) {

      console.error(error);


      status.textContent =
        "공대 데이터 로딩 실패";


      root.hidden =
        true;


      errorBox.hidden =
        false;


      errorMessage.textContent =
        error.message;

    }

  }


  loadSnapshot();

})();
