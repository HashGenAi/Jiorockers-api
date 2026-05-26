export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================
    // SPA ROUTING
    // =========================
    // /post/movie-name -> serve homepage
    if (url.pathname.startsWith("/post/")) {

      // serve index.html from static assets
      if (env.ASSETS) {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = "/";
        return env.ASSETS.fetch(new Request(assetUrl, request));
      }

      // fallback
      return fetch("https://jiorockers.salim1monira.workers.dev/");
    }

    // =========================
    // HELPERS
    // =========================

    const slugify = (text) =>
      (text || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const json = (data) =>
      new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    async function getPosts(page = 1, perPage = 50) {

      const startIndex = (page - 1) * perPage + 1;

      const api =
        `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

      const res = await fetch(api);
      const data = await res.json();

      return data.feed?.entry || [];
    }

    // =========================
    // SINGLE POST
    // =========================

    const slug = url.searchParams.get("slug");

    if (slug) {

      const perPage = 50;
      const maxPages = 20;

      for (let page = 1; page <= maxPages; page++) {

        const posts = await getPosts(page, perPage);

        const found = posts.find(post => {

          const title = post.title?.$t || "";
          const postSlug = slugify(title);

          return postSlug === slug;
        });

        if (found) {
          return json(found);
        }

        // stop if last page
        if (posts.length < perPage) {
          break;
        }
      }

      return json(null);
    }

    // =========================
    // POSTS LIST
    // =========================

    const page = parseInt(url.searchParams.get("page")) || 1;

    const posts = await getPosts(page);

    return json({
      page,
      posts
    });
  }
}
