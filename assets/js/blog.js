(function () {
  const DATA_URL = "assets/data/blog-posts.json";

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
      throw new Error("Failed to load post metadata.");
    }

    const payload = await response.json();
    const posts = Array.isArray(payload.posts) ? payload.posts.slice() : [];

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
      count.textContent = "0 posts published";
      featured.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    count.textContent = `${posts.length} post${posts.length === 1 ? "" : "s"} published`;

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
        "Post not selected",
        'Open a post from the journal page, or go back to <a href="tab_4.html">all posts</a>.'
      );
      return;
    }

    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      page.innerHTML = renderMessage(
        "Post not found",
        'The requested post does not exist. Return to <a href="tab_4.html">the journal page</a>.'
      );
      return;
    }

    let bodyHtml = "";

    if (post.contentFile) {
      try {
        const response = await fetch(post.contentFile, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load the post body.");
        }

        bodyHtml = await response.text();
      } catch (error) {
        console.error(error);
        bodyHtml = '<section class="box blog-message"><p>Post body could not be loaded.</p></section>';
      }
    }

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
          <span class="blog-cta">Read post</span>
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
            <span class="blog-cta">Read post</span>
          </div>
        </a>
      </article>
    `;
  }

  function renderDetailPage(post, bodyHtml) {
    return `
      <p class="blog-back-link"><a href="tab_4.html">Back to all posts</a></p>
      <header class="blog-post-header">
        ${renderMeta(post)}
        <h1><span class="font-lv1-bold">${escapeHtml(post.title)}</span></h1>
        ${post.excerpt ? `<p class="blog-post-excerpt"><span class="font-lv1">${escapeHtml(post.excerpt)}</span></p>` : ""}
      </header>
      ${post.image ? `<span class="image main blog-hero"><img src="${escapeAttribute(post.image)}" alt="${escapeAttribute(post.imageAlt || post.title)}" /></span>` : ""}
      <div class="blog-content">
        ${bodyHtml}
      </div>
    `;
  }

  function renderImage(post, className) {
    if (!post.image) {
      return `<span class="${className}"><span class="blog-image-placeholder">No image</span></span>`;
    }

    return `
      <span class="${className}">
        <img src="${escapeAttribute(post.image)}" alt="${escapeAttribute(post.imageAlt || post.title)}" loading="lazy" />
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
      count.textContent = "Post data could not be loaded";
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
        <h2><span class="font-lv1-bold">Could not load posts</span></h2>
        <p><span class="font-lv1">Check <code>assets/data/blog-posts.json</code> and try again.</span></p>
      `;
    }

    if (page) {
      page.innerHTML = renderMessage(
        "Could not load the post",
        'Check the metadata file and the post content path, then return to <a href="tab_4.html">the journal page</a>.'
      );
    }
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
