export default {
  async fetch(request) {

    const url = new URL(request.url);

    const slug = url.searchParams.get("slug");
    const page = parseInt(url.searchParams.get("page")) || 1;

    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    const BASE =
      "https://www.jiorockers.online/feeds/posts/default?alt=json";

    // -------------------------
    // CLEAN SLUG FUNCTION
    // -------------------------
    const getSlug = (link) => {
      try {
        const path = new URL(link).pathname;
        return path.replace(/^\/|\/$/g, "").replace(".html", "");
      } catch {
        return null;
      }
    };

    // -------------------------
    // NORMALIZE POST
    // -------------------------
    const normalizePost = (post) => {
      const link =
        post.link?.find(l => l.rel === "alternate")?.href || "";

      return {
        title: post.title?.$t || "",
        content: post.content?.$t || "",
        published: post.published?.$t || "",
        labels: post.category?.map(c => c.term) || [],
        image:
          post.media$thumbnail?.url ||
          post.content?.$t?.match(/<img.*?src="(.*?)"/i)?.[1] ||
          "",
        url: link,
        slug: getSlug(link)
      };
    };

    // =====================================================
    // 🔥 SINGLE POST MODE (SLUG SEARCH)
    // =====================================================
    if (slug) {

      const target = slug.replace(/\/$/g, "");

      let foundPost = null;
      let currentIndex = 1;

      // LIMIT to avoid infinite loop
      const MAX_PAGES = 10;

      for (let i = 0; i < MAX_PAGES; i++) {

        const api =
          `${BASE}&start-index=${currentIndex}&max-results=${perPage}`;

        const res = await fetch(api);
        const data = await res.json();

        const entries = data.feed?.entry || [];

        if (!entries.length) break;

        for (const post of entries) {

          const normalized = normalizePost(post);

          if (normalized.slug === target) {
            foundPost = normalized;
            break;
          }
        }

        if (foundPost) break;

        currentIndex += perPage;
      }

      return new Response(JSON.stringify(foundPost || null), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // =====================================================
    // 📄 LIST MODE (FAST PAGE LOAD)
    // =====================================================
    const api =
      `${BASE}&start-index=${startIndex}&max-results=${perPage}`;

    const res = await fetch(api);
    const data = await res.json();

    const posts =
      (data.feed?.entry || []).map(normalizePost);

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
};
