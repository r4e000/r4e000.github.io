(function () {
  const POSTS_URL = "data/posts.json";
  const SECTIONS_URL = "data/blog-sections.json";

  document.addEventListener("DOMContentLoaded", () => {
    const hasList = Boolean(document.getElementById("blog-list"));
    const hasDetail = Boolean(document.getElementById("blog-post-page"));

    if (!hasList && !hasDetail) {
      return;
    }

    Promise.all([loadPosts(), loadSections()])
      .then(([posts, sections]) => {
        if (hasList) {
          renderListPage(posts, sections);
        }

        if (hasDetail) {
          renderDetail(posts, sections);
        }
      })
      .catch((error) => {
        console.error(error);
        renderErrorState();
      });
  });

  async function loadPosts() {
    const response = await fetch(POSTS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("게시글 메타데이터를 불러오지 못했습니다.");
    }

    const payload = await response.json();
    const posts = Array.isArray(payload) ? payload.slice() : [];

    return posts
      .filter((post) => post && post.slug && post.title)
      .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  }

  async function loadSections() {
    const response = await fetch(SECTIONS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("분야 설정 데이터를 불러오지 못했습니다.");
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload.slice() : [];
  }

  function renderListPage(posts, sections) {
    const view = document.body.dataset.blogView || "hub";

    if (view === "section") {
      renderSectionPage(posts, sections);
      return;
    }

    renderHubPage(posts, sections);
  }

  function renderSectionPage(posts, sections) {
    const sectionSlug = document.body.dataset.blogSection || "";
    const section = findSection(sections, sectionSlug) || fallbackSection(sectionSlug);
    const sectionPosts = posts.filter((post) => sameCategory(post.category, section.slug));
    const count = document.getElementById("blog-count");
    const featured = document.getElementById("blog-featured");
    const list = document.getElementById("blog-list");
    const empty = document.getElementById("blog-empty");
    const summary = document.getElementById("blog-section-summary");

    applySectionHeader(section);

    if (summary) {
      summary.innerHTML = renderSectionSummary(section, sectionPosts.length);
      summary.hidden = false;
    }

    if (!count || !featured || !list || !empty) {
      return;
    }

    if (!sectionPosts.length) {
      count.textContent = `${section.label} 글 0개`;
      featured.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      empty.innerHTML = `
        <h2><span class="font-lv1-bold">아직 ${escapeHtml(section.label)} 글이 없습니다</span></h2>
        <p><span class="font-lv1">${escapeHtml(section.emptyMessage || `Pages CMS에서 분야를 ${section.slug}로 지정해 글을 작성하면 이 목록에 표시됩니다.`)}</span></p>
      `;
      return;
    }

    count.textContent = `${section.label} 글 ${sectionPosts.length}개`;

    const [latest, ...rest] = sectionPosts;
    featured.innerHTML = renderFeatured(latest, sections);
    featured.hidden = false;
    list.innerHTML = rest.map((post) => renderCard(post, sections)).join("");
    empty.hidden = true;
  }

  function renderHubPage(posts, sections) {
    const count = document.getElementById("blog-count");
    const featured = document.getElementById("blog-featured");
    const list = document.getElementById("blog-list");
    const empty = document.getElementById("blog-empty");
    const sectionGrid = document.getElementById("blog-section-grid");

    if (sectionGrid) {
      sectionGrid.innerHTML = sections.map((section) => renderSectionCard(section, posts)).join("");
    }

    if (!count || !featured || !list || !empty) {
      return;
    }

    if (!posts.length) {
      count.textContent = "전체 글 0개";
      featured.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    count.textContent = `분야 ${sections.length}개 · 전체 글 ${posts.length}개`;

    const [latest, ...rest] = posts;
    featured.innerHTML = renderFeatured(latest, sections);
    featured.hidden = false;
    list.innerHTML = rest.map((post) => renderCard(post, sections)).join("");
    empty.hidden = true;
  }

  function renderDetail(posts, sections) {
    const page = document.getElementById("blog-post-page");

    if (!page) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
      page.innerHTML = renderMessage(
        "게시글이 선택되지 않았습니다",
        '<a href="tab_4.html">전체 게시글 목록</a>에서 글을 선택해 주세요.'
      );
      return;
    }

    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      page.innerHTML = renderMessage(
        "게시글을 찾을 수 없습니다",
        '요청한 글이 존재하지 않습니다. <a href="tab_4.html">전체 아카이브</a>로 돌아가 주세요.'
      );
      return;
    }

    const section = findSection(sections, post.category);
    const bodyHtml = post.body || '<section class="box blog-message"><p><span class="font-lv1">아직 본문이 작성되지 않았습니다.</span></p></section>';

    document.title = `HAX | ${post.title}`;
    page.innerHTML = renderDetailPage(post, section, bodyHtml);
    enhanceContentMedia(page);
  }

  function renderFeatured(post, sections) {
    return `
      <a class="blog-featured-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
        ${renderImage(post, "blog-featured-image")}
        <div class="blog-featured-copy">
          ${renderMeta(post, sections)}
          <h2><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h2>
          <p><span class="font-lv1">${escapeHtml(post.excerpt || "")}</span></p>
          <span class="blog-cta">글 보기</span>
        </div>
      </a>
    `;
  }

  function renderCard(post, sections) {
    return `
      <article class="blog-card box">
        <a class="blog-card-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
          ${renderImage(post, "blog-card-image")}
          <div class="blog-card-body">
            ${renderMeta(post, sections)}
            <h2><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h2>
            <p><span class="font-lv1">${escapeHtml(post.excerpt || "")}</span></p>
            <span class="blog-cta">글 보기</span>
          </div>
        </a>
      </article>
    `;
  }

  function renderDetailPage(post, section, bodyHtml) {
    const backHref = section && section.page ? section.page : "tab_4.html";
    const backLabel = section ? `${section.label} 목록으로 돌아가기` : "전체 목록으로 돌아가기";

    return `
      <p class="blog-back-link"><a href="${escapeAttribute(backHref)}">${escapeHtml(backLabel)}</a><span class="blog-back-divider">/</span><a href="tab_4.html">전체 아카이브</a></p>
      <header class="blog-post-header">
        ${renderMeta(post, section ? [section] : [])}
        <h1><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h1>
        ${post.excerpt ? `<p class="blog-post-excerpt"><span class="font-lv1">${escapeHtml(post.excerpt)}</span></p>` : ""}
      </header>
      ${post.cover ? `<span class="image main blog-hero"><img src="${escapeAttribute(normalizePath(post.cover))}" alt="${escapeAttribute(post.coverAlt || post.title)}" /></span>` : ""}
      <div class="blog-content">
        ${bodyHtml}
      </div>
    `;
  }

  function renderSectionSummary(section, count) {
    return `
      <div class="blog-featured-link blog-section-summary">
        ${section.heroImage ? `<span class="blog-featured-image"><img src="${escapeAttribute(normalizePath(section.heroImage))}" alt="${escapeAttribute(section.heroAlt || section.label)}" /></span>` : ""}
        <div class="blog-featured-copy">
          <p class="blog-meta"><span class="blog-badge">${escapeHtml(section.label)}</span><span class="blog-meta-divider">/</span><span>${count}개 글</span></p>
          <h2><span class="font-lv1-bold">${escapeHtml(section.title || `${section.label} 블로그`)}</span></h2>
          <p><span class="font-lv1">${escapeHtml(section.description || "")}</span></p>
        </div>
      </div>
    `;
  }

  function renderSectionCard(section, posts) {
    const count = posts.filter((post) => sameCategory(post.category, section.slug)).length;

    return `
      <article class="blog-section-card box">
        <a class="blog-card-link" href="${escapeAttribute(section.page || "tab_4.html")}">
          ${section.heroImage ? `<span class="blog-card-image"><img src="${escapeAttribute(normalizePath(section.heroImage))}" alt="${escapeAttribute(section.heroAlt || section.label)}" loading="lazy" /></span>` : `<span class="blog-card-image"><span class="blog-image-placeholder">${escapeHtml(section.label)}</span></span>`}
          <div class="blog-card-body">
            <p class="blog-meta"><span class="blog-badge">${escapeHtml(section.label)}</span><span class="blog-meta-divider">/</span><span>${count}개 글</span></p>
            <h2><span class="font-lv1-bold">${escapeHtml(section.title || `${section.label} 블로그`)}</span></h2>
            <p><span class="font-lv1">${escapeHtml(section.description || "")}</span></p>
            <span class="blog-cta">분야로 이동</span>
          </div>
        </a>
      </article>
    `;
  }

  function enhanceContentMedia(container) {
    const images = container.querySelectorAll(".blog-content img");

    images.forEach((image) => {
      if (!image.getAttribute("loading")) {
        image.setAttribute("loading", "lazy");
      }

      if (!image.getAttribute("decoding")) {
        image.setAttribute("decoding", "async");
      }
    });
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

  function renderMeta(post, sections) {
    const pieces = [];
    const section = findSection(sections, post.category);
    const categoryLabel = section ? section.label : post.category;

    if (categoryLabel) {
      pieces.push(`<span class="blog-badge">${escapeHtml(categoryLabel)}</span>`);
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
    const sectionGrid = document.getElementById("blog-section-grid");

    if (count) {
      count.textContent = "게시글 데이터를 불러오지 못했습니다";
    }

    if (featured) {
      featured.hidden = true;
    }

    if (sectionGrid) {
      sectionGrid.innerHTML = "";
    }

    if (list) {
      list.innerHTML = "";
    }

    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `
        <h2><span class="font-lv1-bold">게시글을 불러오지 못했습니다</span></h2>
        <p><span class="font-lv1"><code>data/posts.json</code> 또는 <code>data/blog-sections.json</code> 파일을 확인한 뒤 다시 시도해 주세요.</span></p>
      `;
    }

    if (page) {
      page.innerHTML = renderMessage(
        "게시글을 불러오지 못했습니다",
        'Pages CMS에 저장된 글 데이터와 분야 설정을 확인한 뒤 <a href="tab_4.html">전체 아카이브</a>로 돌아가 주세요.'
      );
    }
  }

  function applySectionHeader(section) {
    setText("blog-section-kicker", section.kicker || `FIELD / ${section.label || section.slug.toUpperCase()}`);
    setText("blog-section-title", section.title || `${section.label} 블로그`);
    setText("blog-section-description", section.description || "");
  }

  function setText(id, value) {
    const node = document.getElementById(id);

    if (!node || !value) {
      return;
    }

    node.textContent = value;
  }

  function findSection(sections, slug) {
    if (!slug) {
      return null;
    }

    return sections.find((section) => sameCategory(section.slug, slug)) || null;
  }

  function fallbackSection(slug) {
    if (!slug) {
      return null;
    }

    return {
      slug,
      label: slug.toUpperCase(),
      title: `${slug.toUpperCase()} 블로그`,
      kicker: `FIELD / ${slug.toUpperCase()}`,
      description: `${slug} 분야 글을 모아보는 카테고리입니다.`
    };
  }

  function sameCategory(left, right) {
    return normalizeValue(left) === normalizeValue(right);
  }

  function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
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
