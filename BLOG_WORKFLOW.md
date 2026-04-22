# 블로그 사용법

`tab_4.html`은 게시글 목록 페이지이고, `blog-post.html`은 게시글 상세 페이지입니다.

## 글 추가 방법

1. 커버 이미지를 `images/blog/` 폴더에 넣습니다.
2. `content/blog/_template.html`을 복사해서 새 파일을 만듭니다.
예: `content/blog/my-first-post.html`
3. `assets/data/blog-posts.json`에 새 객체를 하나 추가합니다.
4. 아래 항목을 채웁니다.
- `slug`: URL에 들어갈 고유값
예: `my-first-post`
- `title`: 글 제목
- `category`: 짧은 분류명
- `date`: `YYYY-MM-DD` 형식의 날짜
- `excerpt`: 목록 페이지에 보일 짧은 소개문
- `image`: 커버 이미지 경로
예: `images/blog/my-first-post.jpg`
- `imageAlt`: 이미지 설명 문구
- `contentFile`: 본문 HTML 파일 경로
예: `content/blog/my-first-post.html`
5. 변경사항을 푸시하면 GitHub Pages에 반영됩니다.

## 글 삭제 방법

1. `assets/data/blog-posts.json`에서 해당 글 객체를 삭제합니다.
2. 연결된 본문 HTML 파일을 `content/blog/`에서 삭제합니다.
3. 더 이상 쓰지 않는 커버 이미지도 함께 정리합니다.
4. 변경사항을 푸시합니다.

## 참고

- 최신 날짜의 글이 `tab_4.html`에서 가장 먼저 표시됩니다.
- 새 글을 쓸 때는 `content/blog/_template.html`을 계속 복사해서 쓰면 편합니다.
- 로컬에서 미리 볼 때는 `file://`로 직접 열기보다 웹 서버나 GitHub Pages 환경에서 확인하는 것이 안전합니다.
