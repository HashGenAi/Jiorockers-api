if (url.pathname.startsWith("/post/")) {
  return fetch(new Request(request.url.replace(url.pathname, "/"), request));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const slugify = (text) =>
      (text || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const jsonResponse = (data) =>
      new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    const getFeedPage = async (page, perPage) => {
      const startIndex = (page - 1) * perPage + 1;
      const api =
        `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;
      const res = await fetch(api);
      const data = await res.json();
      return data.feed?.entry || [];
    };

    // Serve the app for /post/slug
    if (url.pathname.startsWith("/post/")) {
      if (env.ASSETS) {
        const assetsUrl = new URL(request.url);
        assetsUrl.pathname = "/";
        return env.ASSETS.fetch(new Request(assetsUrl, request));
      }

      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = "/";
      return fetch(new Request(fallbackUrl, request));
    }

    // Single post mode: /?slug=movie-name
    const slug = url.searchParams.get("slug");
    if (slug) {
      const maxPagesToSearch = 30;
      const perPage = 50;

      for (let page = 1; page <= maxPagesToSearch; page++) {
        const posts = await getFeedPage(page, perPage);

        const found = posts.find((post) => {
          const title = post.title?.$t || "";
          const titleSlug = slugify(title);

          const altLink = post.link?.find((l) => l.rel === "alternate")?.href || "";
          const linkSlug = slugify(
            altLink.split("/").pop()?.replace(".html", "") || ""
          );

          return titleSlug === slug || linkSlug === slug;
        });

        if (found) return jsonResponse(found);

        if (posts.length < perPage) break;
      }

      return jsonResponse(null);
    }

    // List mode: /?page=1
    const page = parseInt(url.searchParams.get("page")) || 1;
    const perPage = 50;
    const posts = await getFeedPage(page, perPage);

    return jsonResponse({
      page,
      posts
    });
  }
};
