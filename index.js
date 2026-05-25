export default {
  async fetch(request) {
    const url = new URL(request.url);

    const slug = url.searchParams.get("slug");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = 50;
    const startIndex = (page - 1) * perPage + 1;

    const SOURCE_API =
      "https://www.jiorockers.online/feeds/posts/default?alt=json";

    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const normalizeSlug = (value = "") =>
      String(value)
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .replace(/\.html$/i, "");

    const extractSlugFromLink = (link = "") => {
      try {
        const path = new URL(link).pathname;
        return normalizeSlug(path.split("/").pop() || "");
      } catch {
        return "";
      }
    };

    const normalizePost = (post) => {
      const link =
        post.link?.find((l) => l.rel === "alternate")?.href || "";

      const content = post.content?.$t || "";
      const img =
        post.media$thumbnail?.url ||
        content.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
        "";

      return {
        title: post.title?.$t || "",
        slug: extractSlugFromLink(link),
        url: link,
        image: img,
        published: post.published?.$t || "",
        updated: post.updated?.$t || "",
        labels: post.category?.map((c) => c.term) || [],
        content,
      };
    };

    try {
      if (slug) {
        const target = normalizeSlug(slug);

        let found = null;
        let index = 1;
        const maxPages = 20;

        for (let i = 0; i < maxPages; i++) {
          const api = `${SOURCE_API}&start-index=${index}&max-results=${perPage}`;
          const res = await fetch(api);
          if (!res.ok) break;

          const data = await res.json();
          const entries = data.feed?.entry || [];
          if (!entries.length) break;

          for (const post of entries) {
            const item = normalizePost(post);
            if (item.slug === target) {
              found = item;
              break;
            }
          }

          if (found) break;
          index += perPage;
        }

        return new Response(JSON.stringify(found), { headers: corsHeaders });
      }

      const api = `${SOURCE_API}&start-index=${startIndex}&max-results=${perPage}`;
      const res = await fetch(api);
      if (!res.ok) {
        return new Response(JSON.stringify({ page, posts: [] }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      const data = await res.json();
      const posts = (data.feed?.entry || []).map(normalizePost);

      return new Response(JSON.stringify({ page, posts }), {
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Worker failed",
          message: String(err?.message || err),
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
