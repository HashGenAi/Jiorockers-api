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

    return new Response(
      JSON.stringify({
        success: true,
        page,
        totalResults: data.feed["openSearch$totalResults"]?.$t || 0,
        itemsPerPage: data.feed["openSearch$itemsPerPage"]?.$t || perPage,
        posts: data.feed.entry || []
      }, null, 2),
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
