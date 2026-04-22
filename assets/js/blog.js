(function () {
  const DATA_URL = "data/posts.json";

  document.addEventListener("DOMContentLoaded", () => {
    const hasIndex = Boolean(document.getElementById("blog-list"));
    const hasDetail = Boolean(document.getElementById("blog-post-page"));

    if (!hasIndex && !hasDetail) {
      return;
    }

    loadPosts()
      .then((posts) => {
        if (hasIndex) {
          renderIndex(posts);
        }

        if (hasDetail) {
          renderDetail(posts);
        }
      })
      .catch((error) => {
        console.error(error);
        renderErrorState();
      });
  });

  async function loadPosts() {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("게시글 메타데이터를 불러오지 못했습니다.");
    }

    const payload = await response.json();
    const posts = Array.isArray(payload) ? payload.slice() : [];

    return posts
      .filter((post) => post && post.slug && post.title)
      .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  }

  function renderIndex(posts) {
    const count = document.getElementById("blog-count");
    const featured = document.getElementById("blog-featured");
    const list = document.getElementById("blog-list");
    const empty = document.getElementById("blog-empty");

    if (!count || !featured || !list || !empty) {
      return;
    }

    if (!posts.length) {
      count.textContent = "게시글 0개";
      featured.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    count.textContent = `게시글 ${posts.length}개`;

    const [latest, ...rest] = posts;
    featured.innerHTML = renderFeatured(latest);
    featured.hidden = false;

    list.innerHTML = rest.map(renderCard).join("");
    empty.hidden = true;
  }

  async function renderDetail(posts) {
    const page = document.getElementById("blog-post-page");

    if (!page) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
      page.innerHTML = renderMessage(
        "게시글이 선택되지 않았습니다",
        '<a href="tab_4.html">게시글 목록</a>에서 글을 선택해 주세요.'
      );
      return;
    }

    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      page.innerHTML = renderMessage(
        "게시글을 찾을 수 없습니다",
        '요청한 글이 존재하지 않습니다. <a href="tab_4.html">저널 페이지</a>로 돌아가 주세요.'
      );
      return;
    }

    const bodyHtml = post.body || '<section class="box blog-message"><p><span class="font-lv1">아직 본문이 작성되지 않았습니다.</span></p></section>';

    document.title = `HAX | ${post.title}`;
    page.innerHTML = renderDetailPage(post, bodyHtml);
  }

  function renderFeatured(post) {
    return `
      <a class="blog-featured-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
        ${renderImage(post, "blog-featured-image")}
        <div class="blog-featured-copy">
          ${renderMeta(post)}
          <h2><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h2>
          <p><span class="font-lv1">${escapeHtml(post.excerpt || "")}</span></p>
          <span class="blog-cta">글 보기</span>
        </div>
      </a>
    `;
  }

  function renderCard(post) {
    return `
      <article class="blog-card box">
        <a class="blog-card-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
          ${renderImage(post, "blog-card-image")}
          <div class="blog-card-body">
            ${renderMeta(post)}
            <h2><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h2>
            <p><span class="font-lv1">${escapeHtml(post.excerpt || "")}</span></p>
            <span class="blog-cta">글 보기</span>
          </div>
        </a>
      </article>
    `;
  }

  function renderDetailPage(post, bodyHtml) {
    return `
      <p class="blog-back-link"><a href="tab_4.html">목록으로 돌아가기</a></p>
      <header class="blog-post-header">
        ${renderMeta(post)}
        <h1><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h1>
        ${post.excerpt ? `<p class="blog-post-excerpt"><span class="font-lv1">${escapeHtml(post.excerpt)}</span></p>` : ""}
      </header>
      ${post.cover ? `<span class="image main blog-hero"><img src="${escapeAttribute(normalizePath(post.cover))}" alt="${escapeAttribute(post.coverAlt || post.title)}" /></span>` : ""}
      <div class="blog-content">
        ${bodyHtml}
      </div>
    `;
  }

  function renderImage(post, className) {
    if (!post.cover) {
      return `<span class="${className}"><span class="blog-image-placeholder">이미지 없음</span></span>`;
    }

    return `
      <span class="${className}">
        <img src="${escapeAttribute(normalizePath(post.cover))}" alt="${escapeAttribute(post.coverAlt || post.title)}" loading="lazy" />
      </span>
    `;
  }

  function renderMeta(post) {
    const pieces = [];

    if (post.category) {
      pieces.push(`<span class="blog-badge">${escapeHtml(post.category)}</span>`);
    }

    if (post.date) {
      pieces.push(`<span>${escapeHtml(formatDate(post.date))}</span>`);
    }

    if (!pieces.length) {
      return "";
    }

    return `<p class="blog-meta">${pieces.join('<span class="blog-meta-divider">/</span>')}</p>`;
  }

  function renderMessage(title, description) {
    return `
      <section class="box blog-message">
        <h2><span class="font-lv1-bold">${escapeHtml(title)}</span></h2>
        <p><span class="font-lv1">${description}</span></p>
      </section>
    `;
  }

  function renderErrorState() {
    const count = document.getElementById("blog-count");
    const featured = document.getElementById("blog-featured");
    const list = document.getElementById("blog-list");
    const empty = document.getElementById("blog-empty");
    const page = document.getElementById("blog-post-page");

    if (count) {
      count.textContent = "게시글 데이터를 불러오지 못했습니다";
    }

    if (featured) {
      featured.hidden = true;
    }

    if (list) {
      list.innerHTML = "";
    }

    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `
        <h2><span class="font-lv1-bold">게시글을 불러오지 못했습니다</span></h2>
        <p><span class="font-lv1"><code>data/posts.json</code> 파일을 확인한 뒤 다시 시도해 주세요.</span></p>
      `;
    }

    if (page) {
      page.innerHTML = renderMessage(
        "게시글을 불러오지 못했습니다",
        'Pages CMS에서 저장된 데이터와 이미지 경로를 확인한 뒤 <a href="tab_4.html">저널 페이지</a>로 돌아가 주세요.'
      );
    }
  }

  function normalizePath(value) {
    return String(value).replace(/^\/+/, "");
  }

  function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
