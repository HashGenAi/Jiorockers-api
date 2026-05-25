export default {
  async fetch(request) {

    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page")) || 1;

    const perPage = 24;

    const startIndex = (page - 1) * perPage + 1;

    const bloggerUrl =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const response = await fetch(bloggerUrl);

    const data = await response.json();

    const posts = (data.feed.entry || []).map(post => {

      const title = post.title.$t;

      const link =
        post.link.find(l => l.rel === "alternate")?.href || "";

      const content = post.content?.$t || "";

      const imageMatch =
        content.match(/<img.*?src="(.*?)"/);

      const image = imageMatch
        ? imageMatch[1]
        : "";

      return {
        title,
        link,
        image
      };
    });

    return new Response(
      JSON.stringify({
        page,
        posts
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      }
    );
  }
}
