# Pages CMS 사용법

이 사이트의 블로그는 `Pages CMS -> data/posts.json -> 분야별 페이지(tab_1, tab_2, ...) / 전체 아카이브(tab_4)` 흐름으로 연결됩니다.

## 글 작성 방법

1. `app.pagescms.org`에 로그인합니다.
2. 저장소 `r4e000.github.io`를 엽니다.
3. `Content` 탭으로 이동합니다.
4. `게시글`에서 `+ add an item`을 누릅니다.
5. 제목, 분야, 작성일, 요약, 커버 이미지, 본문을 입력합니다.
6. 저장하면 `data/posts.json`과 이미지 파일이 GitHub 저장소에 바로 반영됩니다.

## 화면 반영 구조

- AION2 페이지: `tab_1.html`
- Steam 페이지: `tab_2.html`
- 전체 아카이브: `tab_4.html`
- 글 상세 페이지: `blog-post.html`
- 글 데이터: `data/posts.json`
- 분야 설정: `data/blog-sections.json`
- 업로드 이미지: `images/blog/`

## 참고

- `slug`는 글 주소용 값이므로 영어 소문자와 하이픈 형태가 가장 안전합니다.
- `category`는 분야 구분용 값입니다.
현재는 `aion2`, `steam`을 사용합니다.
- 본문은 Pages CMS에서 HTML로 저장되며, 상세 페이지에서 그대로 출력됩니다.
- 새 글을 올린 뒤 반영이 늦으면 GitHub Pages 배포가 끝날 때까지 잠시 기다리면 됩니다.
- 새 분야를 추가할 때는 `blog-section-template.html`을 복사해서 새 페이지를 만들고, `data/blog-sections.json`에 같은 slug를 추가하면 됩니다.
