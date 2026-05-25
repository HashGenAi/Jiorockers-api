export default {
  async fetch(request) {

    const url = new URL(request.url);

    const slug =
      url.searchParams.get("slug");

    const page =
      parseInt(url.searchParams.get("page")) || 1;

    const perPage = 24;

    const startIndex =
      (page - 1) * perPage + 1;

    const bloggerUrl =
      `https://www.jiorockers.online/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${perPage}`;

    const response =
      await fetch(bloggerUrl);

    const data =
      await response.json();

    const posts =
      data.feed.entry || [];

    // SINGLE POST
    if(slug){

      const found =
        posts.find(post => {

          const link =
            post.link?.find(
              l => l.rel === "alternate"
            )?.href || "";

          const pathname =
            new URL(link).pathname;

          return pathname === slug;
        });

      return new Response(
        JSON.stringify(found || null),
        {
          headers:{
            "Content-Type":"application/json",
            "Access-Control-Allow-Origin":"*"
          }
        }
      );
    }

    // ALL POSTS
    return new Response(
      JSON.stringify({
        posts
      }),
      {
        headers:{
          "Content-Type":"application/json",
          "Access-Control-Allow-Origin":"*"
        }
      }
    );
  }
}
