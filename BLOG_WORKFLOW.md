# Blog Workflow

`tab_4.html` is now a post list page, and `blog-post.html` is the detail page.

## Add a post

1. Put the cover image in `images/blog/`
2. Copy `content/blog/_template.html` to a new file such as `content/blog/my-first-post.html`
3. Add a new object to `assets/data/blog-posts.json`
4. Set these fields:
   - `slug`: URL id such as `my-first-post`
   - `title`: post title
   - `category`: short label
   - `date`: `YYYY-MM-DD`
   - `excerpt`: short summary for the list page
   - `image`: example `images/blog/my-first-post.jpg`
   - `imageAlt`: alt text for the cover image
   - `contentFile`: example `content/blog/my-first-post.html`
5. Push the changes

## Remove a post

1. Remove the matching object from `assets/data/blog-posts.json`
2. Delete the related HTML file in `content/blog/`
3. Delete the cover image if you no longer need it
4. Push the changes

## Notes

- The latest date appears first on `tab_4.html`
- Reuse `content/blog/_template.html` whenever you start a new article
- If you preview this page locally, use a web server or GitHub Pages rather than opening the HTML file directly with `file://`
