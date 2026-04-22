# Pages CMS 사용법

이 사이트의 저널은 `Pages CMS -> data/posts.json -> tab_4.html` 흐름으로 연결됩니다.

## 글 작성 방법

1. `app.pagescms.org`에 로그인합니다.
2. 저장소 `r4e000.github.io`를 엽니다.
3. `Content` 탭으로 이동합니다.
4. `게시글`에서 `+ add an item`을 누릅니다.
5. 제목, 작성일, 요약, 커버 이미지, 본문을 입력합니다.
6. 저장하면 `data/posts.json`과 이미지 파일이 GitHub 저장소에 바로 반영됩니다.

## 화면 반영 구조

- 글 목록 페이지: `tab_4.html`
- 글 상세 페이지: `blog-post.html`
- 글 데이터: `data/posts.json`
- 업로드 이미지: `images/blog/`

## 참고

- `slug`는 글 주소용 값이므로 영어 소문자와 하이픈 형태가 가장 안전합니다.
- 본문은 Pages CMS에서 HTML로 저장되며, 상세 페이지에서 그대로 출력됩니다.
- 새 글을 올린 뒤 반영이 늦으면 GitHub Pages 배포가 끝날 때까지 잠시 기다리면 됩니다.
