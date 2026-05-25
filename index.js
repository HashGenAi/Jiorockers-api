export default {
  async fetch(request) {

    const url = new URL(request.url);

    // SUPPORT BOTH:
    // /post/movie-name  (pathname)
    // ?slug=movie-name  (query fallback)

    let slug =
      url.searchParams.get("slug") ||
      url.pathname.replace("/post/", "").replace(/\/$/, "");

    const page = parseInt(url.searchParams.get("page")) || 1;

    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    // BLOGGER API
    const api =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const res = await fetch(api);
    const data = await res.json();

    const posts = data.feed.entry || [];

    // SLUGIFY FUNCTION (must match frontend)
    const slugify = (text) =>
      (text || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // SINGLE POST MODE
    if (slug && slug !== "undefined") {

      const found = posts.find(post => {

        const title = post.title?.$t || "";
        const postSlug = slugify(title);

        return postSlug === slug;
      });

      return new Response(JSON.stringify(found || null), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // LIST MODE
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
