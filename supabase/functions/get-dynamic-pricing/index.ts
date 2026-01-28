import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

// Load the city price index data
const priceIndexData = await Deno.readTextFile(
  "./city_price_index.csv"
);
const priceIndex = parse(priceIndexData, {
  skipFirstRow: true,
  strip: true,
});

serve(async (req) => {
  const { city, country } = await req.json();

  // Find the cost-of-living index for the given city
  const cityData = priceIndex.find(
    (row) => row.city === city && row.country === country
  );
  const costOfLivingIndex = cityData ? parseFloat(cityData.cost_of_living_index) : 100;

  // Base prices for a mid-range city (index = 50)
  const basePrices = {
    breakfast: 15,
    lunch: 25,
    dinner: 40,
    attraction: 30,
  };

  // Calculate dynamic prices based on the cost-of-living index
  const dynamicPrices = {
    breakfast: basePrices.breakfast * (costOfLivingIndex / 50),
    lunch: basePrices.lunch * (costOfLivingIndex / 50),
    dinner: basePrices.dinner * (costOfLivingIndex / 50),
    attraction: basePrices.attraction * (costOfLivingIndex / 50),
  };

  // Use Google Places API to find real places
  const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  const places = [];

  for (const meal of ["breakfast", "lunch", "dinner"]) {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${city}&key=${googleApiKey}&type=restaurant&maxprice=3`
    );
    const searchData = await searchResponse.json();
    if (searchData.results && searchData.results.length > 0) {
      const place = searchData.results[Math.floor(Math.random() * searchData.results.length)];
      places.push({
        name: place.name,
        type: meal,
        cost: dynamicPrices[meal],
        rating: place.rating,
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${place.name}&query_place_id=${place.place_id}`,
        booking_url: place.website || `https://www.google.com/search?q=${place.name}`
      });
    }
  }

  return new Response(
    JSON.stringify({ places, dynamicPrices }),
    { headers: { "Content-Type": "application/json" } },
  );
});
