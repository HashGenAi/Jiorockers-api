export default {
  async fetch(request) {

    const url = new URL(request.url);

    // =========================
    // 1. SPA ROUTING FIX
    // =========================
    // If user opens /post/anything → serve index page
    if (url.pathname.startsWith("/post/")) {
      url.pathname = "/";
      return fetch(request);
    }

    // =========================
    // 2. API MODE (LIST)
    // =========================
    const page = parseInt(url.searchParams.get("page")) || 1;
    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    const api =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const res = await fetch(api);
    const data = await res.json();

    const posts = data.feed.entry || [];

    // =========================
    // SLUG FUNCTION (must match frontend)
    // =========================
    const slugify = (text) =>
      (text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // =========================
    // 3. SINGLE POST MODE (?slug=)
    // =========================
    const slug = url.searchParams.get("slug");

    if (slug) {

      const found = posts.find(post => {
        const title = post.title?.$t || "";
        return slugify(title) === slug;
      });

      return new Response(JSON.stringify(found || null), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // =========================
    // 4. RETURN LIST
    // =========================
    return new Response(JSON.stringify({
      page,
      posts
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
