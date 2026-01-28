import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { query, city } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build search query with city if provided
    const searchQuery = city ? `${query} ${city}` : query;

    // Fetch from Pexels API
    const pexelsResponse = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY || "",
        },
      }
    );

    if (!pexelsResponse.ok) {
      console.error(`Pexels API error: ${pexelsResponse.status}`);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch from Pexels",
          status: pexelsResponse.status,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await pexelsResponse.json();

    if (!data.photos || data.photos.length === 0) {
      console.warn(`No images found for: ${searchQuery}`);
      return new Response(
        JSON.stringify({
          imageUrl: null,
          query: searchQuery,
          reason: "No images found",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the first image
    const photo = data.photos[0];
    const imageUrl = photo.src.medium || photo.src.large;

    return new Response(
      JSON.stringify({
        imageUrl,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        query: searchQuery,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-pexels-image:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
