(function () {
  const POSTS_URL = "data/posts.json";
  const SECTIONS_URL = "data/blog-sections.json";

  const UI = {
    viewPost: "READ",
    moveToSection: "OPEN",
    archiveLabel: "ARCHIVE",
    loadingPosts: "Loading...",
    missingPostTitle: "POST NOT FOUND",
    missingPostBody:
      'Choose a post from <a href="tab_4.html">ARCHIVE</a>.',
    notFoundTitle: "POST NOT FOUND",
    notFoundBody:
      'This post does not exist. Return to <a href="tab_4.html">ARCHIVE</a>.',
    emptyBody: "No content.",
    missingImage: "NO IMAGE",
    genericError: "Failed to load posts.",
    errorBody:
      "Check the data files and try again.",
    fallbackDescriptionSuffix: "news and guides.",
    emptyMessageTemplate:
      "No posts yet."
  };

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
      throw new Error(UI.genericError);
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
      throw new Error(UI.genericError);
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

    list.classList.add("blog-list-compact");
    featured.hidden = true;
    featured.innerHTML = "";

    if (!sectionPosts.length) {
      count.textContent = `${section.label} / 0 POSTS`;
      list.innerHTML = "";
      empty.hidden = false;
      empty.innerHTML = `
        <h2><span class="font-lv1-bold">NO POSTS</span></h2>
        <p><span class="font-lv1">${escapeHtml(
          section.emptyMessage || UI.emptyMessageTemplate.replace("{slug}", section.slug)
        )}</span></p>
      `;
      return;
    }

    count.textContent = `${section.label} / ${formatPostCount(sectionPosts.length)}`;
    list.innerHTML = sectionPosts.map((post) => renderCompactCard(post, sections)).join("");
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

    list.classList.remove("blog-list-compact");

    if (!posts.length) {
      count.textContent = `0 POSTS`;
      featured.hidden = true;
      featured.innerHTML = "";
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    count.textContent = `${sections.length} SECTIONS / ${formatPostCount(posts.length)}`;

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
      page.innerHTML = renderMessage(UI.missingPostTitle, UI.missingPostBody);
      return;
    }

    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      page.innerHTML = renderMessage(UI.notFoundTitle, UI.notFoundBody);
      return;
    }

    const section = findSection(sections, post.category);
    const bodyHtml =
      post.body ||
      `<section class="box blog-message"><p><span class="font-lv1">${UI.emptyBody}</span></p></section>`;

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
          <span class="blog-cta">${UI.viewPost}</span>
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
          </div>
        </a>
      </article>
    `;
  }

  function renderCompactCard(post, sections) {
    return `
      <article class="blog-list-item box">
        <a class="blog-list-item-link" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
          ${renderImage(post, "blog-list-thumb")}
          <div class="blog-list-item-copy">
            ${renderMeta(post, sections)}
            <h2><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h2>
          </div>
        </a>
      </article>
    `;
  }

  function renderDetailPage(post, section, bodyHtml) {
    const backHref = section && section.page ? section.page : "tab_4.html";
    const backLabel = section
      ? `${section.label} \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30`
      : `\uC804\uCCB4 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30`;

    return `
      <p class="blog-back-link"><a href="${escapeAttribute(backHref)}">${escapeHtml(
        backLabel
      )}</a><span class="blog-back-divider">/</span><a href="tab_4.html">${UI.archiveLabel}</a></p>
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
          <p class="blog-meta"><span class="blog-badge">${escapeHtml(section.label)}</span><span class="blog-meta-divider">/</span><span>${formatPostCount(count)}</span></p>
          <h2><span class="font-lv1-bold">${escapeHtml(section.title || `${section.label} \uBE14\uB85C\uADF8`)}</span></h2>
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
            <p class="blog-meta"><span class="blog-badge">${escapeHtml(section.label)}</span><span class="blog-meta-divider">/</span><span>${formatPostCount(count)}</span></p>
            <h2><span class="font-lv1-bold">${escapeHtml(section.title || `${section.label} \uBE14\uB85C\uADF8`)}</span></h2>
            <p><span class="font-lv1">${escapeHtml(section.description || "")}</span></p>
            <span class="blog-cta">${UI.moveToSection}</span>
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
      return `<span class="${className}"><span class="blog-image-placeholder">${UI.missingImage}</span></span>`;
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
      count.textContent = UI.genericError;
    }

    if (featured) {
      featured.hidden = true;
      featured.innerHTML = "";
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
        <h2><span class="font-lv1-bold">${UI.genericError}</span></h2>
        <p><span class="font-lv1">${UI.errorBody}</span></p>
      `;
    }

    if (page) {
      page.innerHTML = renderMessage(UI.genericError, `${UI.errorBody} <a href="tab_4.html">${UI.archiveLabel}</a>`);
    }
  }

  function applySectionHeader(section) {
    const label = section && section.label ? section.label : "";
    const slug = section && section.slug ? section.slug : "";

    setText("blog-section-kicker", section.kicker || `FIELD / ${(label || slug).toUpperCase()}`);
    setText("blog-section-title", section.title || `${label || slug.toUpperCase()} \uBE14\uB85C\uADF8`);
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

    const upper = slug.toUpperCase();

    return {
      slug,
      label: upper,
      title: `${upper} \uBE14\uB85C\uADF8`,
      kicker: `FIELD / ${upper}`,
      description: `${slug} ${UI.fallbackDescriptionSuffix}`,
      emptyMessage: UI.emptyMessageTemplate.replace("{slug}", slug)
    };
  }

  function sameCategory(left, right) {
    return normalizeValue(left) === normalizeValue(right);
  }

  function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizePath(value) {
    return String(value || "").replace(/^\/+/, "");
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

  function formatPostCount(count) {
    return `${count} POST${count === 1 ? "" : "S"}`;
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
