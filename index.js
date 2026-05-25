export default {
  async fetch(request) {

    const url = new URL(request.url);

    const slug = url.searchParams.get("slug");
    const page = parseInt(url.searchParams.get("page")) || 1;

    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    // FETCH POSTS
    const api =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const res = await fetch(api);
    const data = await res.json();

    const posts = data.feed.entry || [];

    // SINGLE POST MODE
    if (slug) {

      const found = posts.find(post => {

        const link =
          post.link?.find(l => l.rel === "alternate")?.href || "";

        const path = new URL(link).pathname;

        return path === slug;
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
