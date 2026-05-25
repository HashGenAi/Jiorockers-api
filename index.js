export default {
  async fetch(request) {

    const url = new URL(request.url);

    // ✅ FIX: allow /post/slug routing
    if (url.pathname.startsWith("/post/")) {
      url.pathname = "/";
      return fetch(request);
    }

    const slug = url.searchParams.get("slug");
    const page = parseInt(url.searchParams.get("page")) || 1;

    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    const api =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const res = await fetch(api);
    const data = await res.json();

    const posts = data.feed.entry || [];

    const slugify = (text) =>
      (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

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

    return new Response(JSON.stringify({ page, posts }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
