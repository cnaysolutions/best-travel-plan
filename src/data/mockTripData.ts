import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { TripPlan } from "@/types/trip";

// Helper function to fetch real photos from Pexels API
async function fetchPexelsImage(query: string, city: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-pexels-image", {
      body: { query, city },
    });

    if (error) {
      console.error(`Error fetching Pexels image for "${query}":`, error);
      return null;
    }

    return data?.imageUrl || null;
  } catch (error) {
    console.error(`Exception fetching Pexels image for "${query}":`, error);
    return null;
  }
}

// Helper function to fetch real photos from Pexels API (FREE - already working!)
async function fetchPlacePhoto(placeName: string, city: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-place-photo", {
      body: { placeName, city },
    });

    if (error) {
      console.error(`Error fetching photo for ${placeName}:`, error);
      return null;
    }

    return data?.photoUrl || null;
  } catch (error) {
    console.error(`Exception fetching photo for ${placeName}:`, error);
    return null;
  }
}

// Helper function to fetch attractions from OpenTripMap (FREE!)
async function fetchAttractions(city: string, lat: number, lon: number, limit: number = 15) {
  try {
    console.log(`Fetching attractions for ${city} using OpenTripMap...`);

    const { data, error } = await supabase.functions.invoke("get-attractions-opentripmap", {
      body: {
        city,
        lat,
        lon,
        limit,
        radius: 5000, // 5km radius
      },
    });

    if (error) {
      console.error(`Error fetching attractions for ${city}:`, error);
      return [];
    }

    const attractions = data?.attractions || [];
    console.log(`Found ${attractions.length} attractions for ${city}`);

    return attractions;
  } catch (error) {
    console.error(`Exception fetching attractions for ${city}:`, error);
    return [];
  }
}
// Fallback attractions when API fails or returns empty
function getFallbackAttractions(city: string, count: number) {
  const fallbackAttractionTypes = [
    {
      category: "museum",
      names: ["City Museum", "National Museum", "Art Gallery", "History Museum", "Modern Art Museum"],
      descriptions: ["Explore the rich history and culture", "Discover fascinating exhibits", "Admire world-class art collections"],
      images: [
        "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      category: "historic_site",
      names: ["Old Town Square", "Historic District", "City Center", "Heritage Site", "Ancient Quarter"],
      descriptions: ["Walk through centuries of history", "Experience the city's heritage", "Discover architectural wonders"],
      images: [
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      category: "park",
      names: ["Central Park", "City Park", "Botanical Garden", "Riverside Park", "Public Garden"],
      descriptions: ["Relax in beautiful green spaces", "Enjoy nature in the heart of the city", "Perfect spot for a leisurely stroll"],
      images: [
        "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      category: "shopping",
      names: ["Shopping District", "Local Market", "Artisan Quarter", "Fashion Street", "Souvenir Market"],
      descriptions: ["Browse local shops and boutiques", "Find unique souvenirs and gifts", "Experience local shopping culture"],
      images: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      category: "restaurant",
      names: ["Local Restaurant", "Traditional Cuisine", "Rooftop Dining", "Waterfront Restaurant", "Gourmet Experience"],
      descriptions: ["Savor authentic local flavors", "Enjoy a memorable dining experience", "Taste the best of local cuisine"],
      images: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      ],
    },
  ];

  const attractions = [];
  for (let i = 0; i < count; i++) {
    const type = fallbackAttractionTypes[i % fallbackAttractionTypes.length];
    attractions.push({
      name: type.names[i % type.names.length],
      description: type.descriptions[i % type.descriptions.length],
      category: type.category,
      rating: 7 + Math.random() * 2, // 7-9 rating
      imageUrl: type.images[i % type.images.length],
    });
  }

  return attractions;
}

// City coordinates for fetching attractions
function getCityCoordinates(city: string): { lat: number; lon: number } | null {
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    "Paris": { lat: 48.8566, lon: 2.3522 },
    "London": { lat: 51.5074, lon: -0.1278 },
    "Barcelona": { lat: 41.3851, lon: 2.1734 },
    "Rome": { lat: 41.9028, lon: 12.4964 },
    "Madrid": { lat: 40.4168, lon: -3.7038 },
    "Amsterdam": { lat: 52.3676, lon: 4.9041 },
    "Berlin": { lat: 52.52, lon: 13.405 },
    "Vienna": { lat: 48.2082, lon: 16.3738 },
    "Prague": { lat: 50.0755, lon: 14.4378 },
    "Dublin": { lat: 53.3498, lon: -6.2603 },
    "Brussels": { lat: 50.8503, lon: 4.3517 },
    "Lisbon": { lat: 38.7223, lon: -9.1393 },
    "Athens": { lat: 37.9838, lon: 23.7275 },
    "Istanbul": { lat: 41.0082, lon: 28.9784 },
    "Bangkok": { lat: 13.7563, lon: 100.5018 },
    "Singapore": { lat: 1.3521, lon: 103.8198 },
    "Hong Kong": { lat: 22.3193, lon: 114.1694 },
    "Tokyo": { lat: 35.6762, lon: 139.6503 },
    "Seoul": { lat: 37.5665, lon: 126.978 },
    "Dubai": { lat: 25.2048, lon: 55.2708 },
    "New York": { lat: 40.7128, lon: -74.006 },
    "Los Angeles": { lat: 34.0522, lon: -118.2437 },
    "San Francisco": { lat: 37.7749, lon: -122.4194 },
    "Las Vegas": { lat: 36.1699, lon: -115.1398 },
    "Miami": { lat: 25.7617, lon: -80.1918 },
    "Sydney": { lat: -33.8688, lon: 151.2093 },
    "Melbourne": { lat: -37.8136, lon: 144.9631 },
    "Toronto": { lat: 43.6532, lon: -79.3832 },
    "Vancouver": { lat: 49.2827, lon: -123.1207 },
    "Mexico City": { lat: 19.4326, lon: -99.1332 },
    "Cancun": { lat: 21.1619, lon: -87.0385 },
    "Rio de Janeiro": { lat: -22.9068, lon: -43.1729 },
    "Buenos Aires": { lat: -34.6037, lon: -58.3816 },
    "Lima": { lat: -12.0464, lon: -77.0428 },
    "Bangalore": { lat: 12.9716, lon: 77.5946 },
    "Mumbai": { lat: 19.0760, lon: 72.8777 },
    "Delhi": { lat: 28.7041, lon: 77.1025 },
    "Jaipur": { lat: 26.9124, lon: 75.7873 },
    "Goa": { lat: 15.4909, lon: 73.8278 },
    "Dubrovnik": { lat: 42.6426, lon: 18.1092 },
    "Venice": { lat: 45.4408, lon: 12.3155 },
    "Florence": { lat: 43.7695, lon: 11.2558 },
    "Milan": { lat: 45.4642, lon: 9.1900 },
    "Naples": { lat: 40.8518, lon: 14.2681 },
    "Krakow": { lat: 50.0647, lon: 19.9450 },
    "Warsaw": { lat: 52.2297, lon: 21.0122 },
    "Budapest": { lat: 47.4979, lon: 19.0402 },
    "Hanoi": { lat: 21.0285, lon: 105.8542 },
    "Ho Chi Minh City": { lat: 10.7769, lon: 106.7009 },
    "Chiang Mai": { lat: 18.7883, lon: 98.9853 },
    "Phuket": { lat: 8.1047, lon: 98.3091 },
    "Bali": { lat: -8.6705, lon: 115.2126 },
    "Jakarta": { lat: -6.2088, lon: 106.8456 },
    "Manila": { lat: 14.5994, lon: 120.9842 },
    "Kuala Lumpur": { lat: 3.1390, lon: 101.6869 },
    "Yangon": { lat: 16.8661, lon: 96.1951 },
    "Phnom Penh": { lat: 11.5564, lon: 104.9282 },
    "Cairo": { lat: 30.0444, lon: 31.2357 },
    "Marrakech": { lat: 31.6295, lon: -8.0088 },
    "Cape Town": { lat: -33.9249, lon: 18.4241 },
    "Johannesburg": { lat: -26.2023, lon: 28.0436 },
    "Lagos": { lat: 6.5244, lon: 3.3792 },
    "Nairobi": { lat: -1.2865, lon: 36.8172 },
    "Moscow": { lat: 55.7558, lon: 37.6173 },
    "St. Petersburg": { lat: 59.9311, lon: 30.3609 },
    "Istanbul": { lat: 41.0082, lon: 28.9784 },
    "Ankara": { lat: 39.9334, lon: 32.8597 },
    "Tel Aviv": { lat: 32.0853, lon: 34.7818 },
    "Jerusalem": { lat: 31.7683, lon: 35.2137 },
    "Amman": { lat: 31.9454, lon: 35.9284 },
    "Beirut": { lat: 33.8886, lon: 35.4955 },
    "Dubai": { lat: 25.2048, lon: 55.2708 },
    "Abu Dhabi": { lat: 24.4539, lon: 54.3773 },
    "Doha": { lat: 25.2854, lon: 51.5310 },
    "Riyadh": { lat: 24.7136, lon: 46.6753 },
    "Jeddah": { lat: 21.5433, lon: 39.1727 },
  };

  const coords = cityCoords[city];
  if (!coords) {
    console.warn(`Coordinates not found for ${city}, using Paris as default`);
    return cityCoords["Paris"];
  }
  return coords;
}

// Helper function to get hotel data
function getHotelData(city: string, tripDays: number) {
  const multiplier = getCostMultiplier(city);
  const baseHotelPrice = 120;
  const pricePerNight = Math.round(baseHotelPrice * multiplier);
  const totalPrice = pricePerNight * (tripDays - 1);
  
  const hotelNames = [
    `${city} Luxury Hotel`,
    `${city} Grand Resort`,
    `${city} Premium Suites`,
    `${city} Boutique Hotel`,
    `${city} City Center Hotel`,
  ];
  
  return {
    id: "hotel-1",
    name: hotelNames[Math.floor(Math.random() * hotelNames.length)],
    rating: 4 + Math.random(),
    address: `Central District, ${city}`,
    distanceFromAirport: "15 km",
    pricePerNight,
    totalPrice,
    amenities: ["Free WiFi", "Breakfast Included", "Gym", "Spa", "Restaurant"],
    included: true,
  };
}

// Helper function to get car rental data
function getCarRentalData(city: string, tripDays: number) {
  const multiplier = getCostMultiplier(city);
  const baseDailyPrice = 50;
  const pricePerDay = Math.round(baseDailyPrice * multiplier);
  const totalPrice = pricePerDay * (tripDays - 1);
  
  const carTypes = [
    { type: "Economy", name: "Toyota Corolla" },
    { type: "Compact", name: "Honda Civic" },
    { type: "Sedan", name: "BMW 3 Series" },
    { type: "SUV", name: "Toyota RAV4" },
  ];
  
  const car = carTypes[Math.floor(Math.random() * carTypes.length)];
  
  return {
    id: "car-rental-1",
    company: "Premium Car Rentals",
    vehicleType: car.type,
    vehicleName: car.name,
    pickupLocation: `${city} Airport`,
    dropoffLocation: `${city} Airport`,
    pickupTime: "13:00",
    dropoffTime: "10:00",
    pricePerDay,
    totalPrice,
    included: true,
  };
}

// Helper function to get restaurant recommendations with Resy links
function getRestaurantRecommendation(mealType: string, city: string, dayIndex: number) {
  const restaurants = {
    breakfast: [
      { name: "Morning Brew Cafe", cuisine: "Cafe" },
      { name: "Sunrise Bistro", cuisine: "French" },
      { name: "Local Breakfast House", cuisine: "Local" },
      { name: "Artisan Coffee & Pastries", cuisine: "Cafe" },
    ],
    lunch: [
      { name: "City Lunch Spot", cuisine: "International" },
      { name: "Local Flavors", cuisine: "Local" },
      { name: "Mediterranean Grill", cuisine: "Mediterranean" },
      { name: "Fusion Kitchen", cuisine: "Fusion" },
    ],
    dinner: [
      { name: "Fine Dining Experience", cuisine: "French" },
      { name: "Local Restaurant", cuisine: "Local" },
      { name: "Seafood House", cuisine: "Seafood" },
      { name: "Premium Steakhouse", cuisine: "Steakhouse" },
    ],
  };
  
  const options = restaurants[mealType as keyof typeof restaurants] || restaurants.lunch;
  const restaurant = options[dayIndex % options.length];
  const resyLink = `https://resy.com/cities/${encodeURIComponent(city.toLowerCase())}/venues?search=${encodeURIComponent(restaurant.name)}`;
  
  return {
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    resyLink,
  };
}

// Get airport code for a city
function getAirportCode(city: string): string {
  const airportCodes: Record<string, string> = {
    "Paris": "CDG",
    "London": "LHR",
    "Barcelona": "BCN",
    "Rome": "FCO",
    "Madrid": "MAD",
    "Amsterdam": "AMS",
    "Berlin": "BER",
    "Vienna": "VIE",
    "Prague": "PRG",
    "Dublin": "DUB",
    "Brussels": "BRU",
    "Lisbon": "LIS",
    "Athens": "ATH",
    "Istanbul": "IST",
    "Bangkok": "BKK",
    "Singapore": "SIN",
    "Hong Kong": "HKG",
    "Tokyo": "NRT",
    "Seoul": "ICN",
    "Dubai": "DXB",
    "New York": "JFK",
    "Los Angeles": "LAX",
    "San Francisco": "SFO",
    "Las Vegas": "LAS",
    "Miami": "MIA",
    "Sydney": "SYD",
    "Melbourne": "MEL",
    "Toronto": "YYZ",
    "Vancouver": "YVR",
    "Mexico City": "MEX",
    "Cancun": "CUN",
    "Rio de Janeiro": "GIG",
    "Buenos Aires": "EZE",
    "Lima": "LIM",
    "Bangalore": "BLR",
    "Mumbai": "BOM",
    "Delhi": "DEL",
    "Jaipur": "JAI",
    "Goa": "GOI",
    "Dubrovnik": "DBV",
    "Venice": "VCE",
    "Florence": "FLR",
    "Milan": "MXP",
    "Naples": "NAP",
    "Krakow": "KRK",
    "Warsaw": "WAW",
    "Budapest": "BUD",
    "Hanoi": "HAN",
    "Ho Chi Minh City": "SGN",
    "Chiang Mai": "CNX",
    "Phuket": "HKT",
    "Bali": "DPS",
    "Jakarta": "CGK",
    "Manila": "MNL",
    "Kuala Lumpur": "KUL",
    "Yangon": "RGN",
    "Phnom Penh": "PNH",
    "Cairo": "CAI",
    "Marrakech": "RAK",
    "Cape Town": "CPT",
    "Johannesburg": "JNB",
    "Lagos": "LOS",
    "Nairobi": "NBO",
    "Moscow": "SVO",
    "St. Petersburg": "LED",
    "Tel Aviv": "TLV",
    "Jerusalem": "JRS",
    "Amman": "AMM",
    "Beirut": "BEY",
    "Abu Dhabi": "AUH",
    "Doha": "DOH",
    "Riyadh": "RYD",
    "Jeddah": "JED",
  };

  return airportCodes[city] || "XXX";
}

// City pricing index (cost-of-living multiplier)
const cityPricingIndex: Record<string, number> = {
  // Budget-friendly (5-10)
  "Bangalore": 9.0,
  "Mumbai": 9.5,
  "Delhi": 8.5,
  "Jaipur": 9.0,
  "Goa": 10.0,
  "Kochi": 9.5,
  "Thiruvananthapuram": 9.0,
  "Amritsar": 8.5,
  "Varanasi": 8.0,
  "Agra": 8.5,
  "Shimla": 9.0,
  "Manali": 9.5,
  "Darjeeling": 8.5,
  "Leh": 10.0,
  "Srinagar": 9.0,
  "Jodhpur": 8.5,
  "Udaipur": 9.0,
  "Pushkar": 8.0,
  "Rishikesh": 8.5,
  "Haridwar": 8.0,
  "Mussoorie": 9.5,
  "Nainital": 9.0,
  "Almora": 8.0,
  "Ranikhet": 8.5,
  "Auli": 9.0,
  "Kasol": 8.5,
  "Kufri": 9.0,
  "Dalhousie": 8.5,
  "Dharamshala": 8.5,
  "McLeod Ganj": 8.5,
  "Tso Moriri": 9.0,
  "Tso Kar": 9.0,
  "Pangong": 9.5,
  "Khardung La": 9.5,
  "Nubra": 9.0,
  "Diskit": 9.0,
  "Hunder": 9.0,
  "Turtuk": 9.0,
  "Lamayuru": 9.0,
  "Alchi": 9.0,
  "Basgo": 9.0,
  "Likir": 9.0,
  "Spituk": 9.0,
  "Hemis": 9.0,
  "Thiksey": 9.0,
  "Shey": 9.0,
  "Stok": 9.0,
  "Matho": 9.0,
  "Choglamsar": 9.0,
  "Khaltse": 9.0,
  "Saspol": 9.0,
  "Temisgam": 9.0,
  "Sumur": 9.0,
  "Panamik": 9.0,
  "Bogdang": 9.0,
  "Durbuk": 9.0,
  "Tangtse": 9.0,
  "Chushul": 9.0,
  "Hanle": 9.0,
  "Tso Kiagar": 9.0,
  "Bangkok": 11.0,
  "Chiang Mai": 9.0,
  "Phuket": 11.5,
  "Bali": 10.0,
  "Jakarta": 10.1,
  "Yangon": 7.5,
  "Mandalay": 7.0,
  "Phnom Penh": 8.0,
  "Hanoi": 9.0,
  "Ho Chi Minh City": 9.5,
  "Kuala Lumpur": 13.0,
  "Penang": 11.0,
  
  // Moderate (10-20)
  "Brussels": 20.0,
  "Prague": 14.0,
  "Budapest": 13.5,
  "Warsaw": 12.5,
  "Krakow": 12.5,
  "Wroclaw": 12.0,
  "Gdansk": 12.5,
  "Riga": 12.0,
  "Tallinn": 13.0,
  "Vilnius": 12.5,
  "Minsk": 11.0,
  "Almaty": 11.5,
  "Astana": 12.0,
  "Tashkent": 10.5,
  "Bishkek": 9.5,
  "Ulaanbaatar": 11.0,
  "Da Nang": 8.5,
  "Saigon": 9.5,
  "Siem Reap": 8.5,
  "Cebu": 9.0,
  "Davao": 8.5,
  "Boracay": 10.5,
  "Lahore": 8.5,
  "Islamabad": 9.0,
  "Rawalpindi": 8.5,
  "Hyderabad": 9.5,
  "Chennai": 9.0,
  "Pune": 10.0,
  "Ahmedabad": 9.5,
  "Lucknow": 8.5,
  "Marrakech": 14.0,
  "Cairo": 10.0,
  "Lisbon": 15.0,
  "Athens": 14.0,
  "Istanbul": 15.0,
  
  // Expensive (20-30)
  "Brussels": 20.0,
  "Barcelona": 21.0,
  "Madrid": 19.0,
  "Valencia": 18.0,
  "Seville": 17.0,
  "Malaga": 16.0,
  "Bilbao": 19.0,
  "San Sebastian": 20.0,
  "Palma de Mallorca": 18.0,
  "Ibiza": 22.0,
  "Venice": 24.0,
  "Florence": 20.0,
  "Milan": 22.0,
  "Naples": 18.0,
  "Palermo": 17.0,
  "Rome": 20.0,
  "Vienna": 21.0,
  "Prague": 14.0,
  "Budapest": 13.5,
  "Warsaw": 12.5,
  "Berlin": 19.0,
  "Munich": 21.0,
  "Hamburg": 20.0,
  "Cologne": 19.0,
  "Frankfurt": 20.0,
  "Stuttgart": 20.0,
  "Dusseldorf": 20.0,
  "Amsterdam": 24.0,
  "Rotterdam": 22.0,
  "Utrecht": 21.0,
  "Antwerp": 20.0,
  "Ghent": 18.0,
  "Bruges": 19.0,
  "Copenhagen": 26.0,
  "Stockholm": 27.0,
  "Oslo": 28.0,
  "Helsinki": 26.0,
  "Zurich": 30.0,
  "Geneva": 31.0,
  "Bern": 28.0,
  "Lucerne": 27.0,
  "Interlaken": 26.0,
  "Paris": 25.0,
  "Lyon": 22.0,
  "Marseille": 20.0,
  "Nice": 22.0,
  "Cannes": 23.0,
  "Monaco": 35.0,
  "London": 26.0,
  "Edinburgh": 23.0,
  "Manchester": 21.0,
  "Liverpool": 20.0,
  "Bath": 22.0,
  "Oxford": 21.0,
  "Cambridge": 21.0,
  "Dublin": 24.0,
  "Cork": 21.0,
  "Galway": 20.0,
  "Seoul": 20.7,
  "Dubai": 25.0,
  "Tel Aviv": 23.0,
  
  // Expensive (25-35)
  "Paris": 25.0,
  "London": 26.0,
  "Amsterdam": 24.0,
  "Copenhagen": 26.0,
  "Stockholm": 27.0,
  "Oslo": 28.0,
  "Zurich": 30.0,
  "Geneva": 31.0,
  "Tokyo": 20.7,
  "Hong Kong": 23.0,
  "Sydney": 24.0,
  "Melbourne": 23.0,
  "Toronto": 22.0,
  "New York": 27.0,
  "Los Angeles": 25.0,
  "Miami": 24.0,
  "Moscow": 31.5,
  "Helsinki": 26.0,
  "Auckland": 23.0,
  "Cape Town": 18.0,
  
  // Additional European cities
  "Dubrovnik": 16.0,
  "Split": 15.5,
  "Venice": 24.0,
  "Florence": 20.0,
  "Milan": 22.0,
  "Naples": 18.0,
  "Palermo": 17.0,
  "Krakow": 12.5,
  "Wroclaw": 12.0,
  "Gdansk": 12.5,
  "Riga": 12.0,
  "Tallinn": 13.0,
  "Vilnius": 12.5,
  "Minsk": 11.0,
  "Almaty": 11.5,
  "Astana": 12.0,
  "Tashkent": 10.5,
  "Bishkek": 9.5,
  "Ulaanbaatar": 11.0,
  "Hanoi": 9.0,
  "Da Nang": 8.5,
  "Saigon": 9.5,
  "Phnom Penh": 8.0,
  "Siem Reap": 8.5,
  "Kuala Lumpur": 13.0,
  "Penang": 11.0,
  "Chiang Mai": 9.0,
  "Phuket": 11.5,
  "Bali": 10.0,
  "Jakarta": 10.1,
  "Surabaya": 9.0,
  "Yogyakarta": 8.5,
  "Bandung": 9.5,
  "Cebu": 9.0,
  "Davao": 8.5,
  "Boracay": 10.5,
  "Yangon": 7.5,
  "Mandalay": 7.0,
  "Lahore": 8.5,
  "Islamabad": 9.0,
  "Rawalpindi": 8.5,
  "Hyderabad": 9.5,
  "Chennai": 9.0,
  "Pune": 10.0,
  "Ahmedabad": 9.5,
  "Jaipur": 9.0,
  "Lucknow": 8.5,
  "Goa": 10.0,
  "Kochi": 9.5,
  "Thiruvananthapuram": 9.0,
  "Amritsar": 8.5,
  "Varanasi": 8.0,
  "Agra": 8.5,
  "Shimla": 9.0,
  "Manali": 9.5,
  "Darjeeling": 8.5,
  "Leh": 10.0,
  "Srinagar": 9.0,
  "Jodhpur": 8.5,
  "Udaipur": 9.0,
  "Pushkar": 8.0,
  "Rishikesh": 8.5,
  "Haridwar": 8.0,
  "Mussoorie": 9.5,
  "Nainital": 9.0,
  "Almora": 8.0,
  "Ranikhet": 8.5,
  "Auli": 9.0,
  "Kasol": 8.5,
  "Kufri": 9.0,
  "Dalhousie": 8.5,
  "Dharamshala": 8.5,
  "McLeod Ganj": 8.5,
  "Tso Moriri": 9.0,
  "Tso Kar": 9.0,
  "Pangong": 9.5,
  "Khardung La": 9.5,
  "Nubra": 9.0,
  "Diskit": 9.0,
  "Hunder": 9.0,
  "Turtuk": 9.0,
  "Lamayuru": 9.0,
  "Alchi": 9.0,
  "Basgo": 9.0,
  "Likir": 9.0,
  "Spituk": 9.0,
  "Hemis": 9.0,
  "Thiksey": 9.0,
  "Shey": 9.0,
  "Stok": 9.0,
  "Matho": 9.0,
  "Choglamsar": 9.0,
  "Khaltse": 9.0,
  "Saspol": 9.0,
  "Temisgam": 9.0,
  "Sumur": 9.0,
  "Panamik": 9.0,
  "Bogdang": 9.0,
  "Durbuk": 9.0,
  "Tangtse": 9.0,
  "Chushul": 9.0,
  "Hanle": 9.0,
  "Tso Kiagar": 9.0,
};

// Get cost-of-living multiplier for a city
function getCostMultiplier(city: string): number {
  const cityName = city.includes(',') ? city.split(',')[0].trim() : city;
  
  // Try exact match first
  if (cityPricingIndex[cityName]) {
    return cityPricingIndex[cityName] / 20;
  }
  
  // Try case-insensitive match
  const cityLower = cityName.toLowerCase();
  for (const [key, index] of Object.entries(cityPricingIndex)) {
    if (key.toLowerCase() === cityLower) {
      return index / 20;
    }
  }
  
  // Default to 1.0 (Brussels baseline) if not found
  return 1.0;
}

// Get dynamic meal prices based on city
function getMealPrice(mealType: string, city: string): number {
  const multiplier = getCostMultiplier(city);
  
  // Base prices (for Brussels/moderate cities)
  const basePrices: Record<string, number> = {
    breakfast: 15,  // €15 base
    lunch: 25,      // €25 base
    dinner: 35,     // €35 base
  };
  
  const basePrice = basePrices[mealType] || 25;
  return Math.round(basePrice * multiplier);
}

// Get realistic attraction price based on category
function getAttractionPrice(category: string, rating: number): number {
  const categoryLower = (category || "").toLowerCase();
  
  // Museums: €15-30
  if (categoryLower.includes("museum")) {
    return getRandomPrice(15, 30);
  }
  
  // Historic sites & architecture: €10-25
  if (categoryLower.includes("historic") || categoryLower.includes("architecture") || categoryLower.includes("monument")) {
    return getRandomPrice(10, 25);
  }
  
  // Religious sites: often free or €5-15
  if (categoryLower.includes("religion") || categoryLower.includes("church") || categoryLower.includes("temple")) {
    return getRandomPrice(0, 15);
  }
  
  // Natural sites: €5-20
  if (categoryLower.includes("natural") || categoryLower.includes("park") || categoryLower.includes("garden")) {
    return getRandomPrice(5, 20);
  }
  
  // Entertainment & activities: €20-50
  if (categoryLower.includes("entertainment") || categoryLower.includes("theatre") || categoryLower.includes("sport")) {
    return getRandomPrice(20, 50);
  }
  
  // Cultural sites: €10-35
  if (categoryLower.includes("cultural")) {
    return getRandomPrice(10, 35);
  }
  
  // Default: base on rating (higher rating = more popular = higher price)
  if (rating >= 7) return getRandomPrice(20, 45);
  if (rating >= 5) return getRandomPrice(12, 30);
  if (rating >= 3) return getRandomPrice(8, 20);
  return getRandomPrice(0, 15); // Low rated or free attractions
}

// Random price generator
function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fallback images by category when Pexels fails
function getCategoryFallbackImage(category: string, index: number): string {
  const categoryLower = (category || "").toLowerCase();
  
  // Museum images
  if (categoryLower.includes("museum")) {
    const museumImages = [
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80", // Museum interior
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80", // Art gallery
      "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=800&q=80", // Modern museum
    ];
    return museumImages[index % museumImages.length];
  }
  
  // Historic & architecture
  if (categoryLower.includes("historic") || categoryLower.includes("architecture") || categoryLower.includes("monument")) {
    const historicImages = [
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80", // Historic building
      "https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80", // Monument
      "https://images.unsplash.com/photo-1548445929-4f60a497f851?auto=format&fit=crop&w=800&q=80", // Castle
    ];
    return historicImages[index % historicImages.length];
  }
  
  // Religious sites
  if (categoryLower.includes("religion") || categoryLower.includes("church") || categoryLower.includes("temple")) {
    const religiousImages = [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80", // Cathedral
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80", // Church interior
      "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=800&q=80", // Temple
    ];
    return religiousImages[index % religiousImages.length];
  }
  
  // Natural sites & parks
  if (categoryLower.includes("natural") || categoryLower.includes("park") || categoryLower.includes("garden")) {
    const natureImages = [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80", // Park
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80", // Garden
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80", // Forest
    ];
    return natureImages[index % natureImages.length];
  }
  
  // Entertainment & cultural
  if (categoryLower.includes("entertainment") || categoryLower.includes("theatre") || categoryLower.includes("cultural")) {
    const entertainmentImages = [
      "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80", // Theatre
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80", // Concert hall
      "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80", // Performance
    ];
    return entertainmentImages[index % entertainmentImages.length];
  }
  
  // Default varied travel images
  const defaultImages = [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80", // City landmark
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80", // City street
    "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=800&q=80", // Tourist spot
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80", // Scenic view
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80", // Landmark
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80", // Square
  ];
  return defaultImages[index % defaultImages.length];
}

// Get meal images using Pexels API with fallback
async function getMealImage(mealType: string, dayIndex: number, city: string): Promise<string> {
  const queries: Record<string, string> = {
    breakfast: "breakfast food morning",
    lunch: "lunch meal food",
    dinner: "dinner restaurant food",
  };
  
  const query = queries[mealType] || "food meal";
  const pexelsImage = await fetchPexelsImage(query, city);
  
  if (pexelsImage) {
    return pexelsImage;
  }
  
  // Fallback images if Pexels fails
  const fallbackImages: Record<string, string[]> = {
    breakfast: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80", // Pancakes
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80", // Croissant
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80", // Breakfast bowl
    ],
    lunch: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Salad
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", // Pasta
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", // Sandwich
    ],
    dinner: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Steak
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", // Seafood
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80", // Seafood
    ],
  };
  
  const images = fallbackImages[mealType] || fallbackImages.lunch;
  return images[dayIndex % images.length];
}

// Helper function to generate Google Maps URL
function getGoogleMapsLink(locationQuery: string): string {
  const encodedLocation = encodeURIComponent(locationQuery);
  return `https://www.google.com/maps/search/${encodedLocation}`;
}

export async function generateMockTripPlan(details: any): Promise<TripPlan> {
  const departureDate = details.departureDate || new Date();
  const returnDate = details.returnDate || addDays(departureDate, 5);
  const tripDays = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // ✅ FIX: Calculate total passengers from trip details
  const totalPassengers = (details.adults || 0) + (details.children || 0) + (details.infants || 0);
  console.log(`Total passengers: ${totalPassengers} (Adults: ${details.adults}, Children: ${details.children}, Infants: ${details.infants})`);

  const originCode = getAirportCode(details.departureCity);
  const destCode = getAirportCode(details.destinationCity);

  const baseFlightPrice = details.flightClass === "first" ? 1200 : details.flightClass === "business" ? 650 : 320;

  // Get coordinates for destination city
  const destCoords = getCityCoordinates(details.destinationCity);
  // Fetch real attractions from OpenTripMap (FREE!)
  let attractions: any[] = [];
  if (destCoords) {
    attractions = await fetchAttractions(
      details.destinationCity,
      destCoords.lat,
      destCoords.lon,
      Math.min(tripDays * 3, 20), // Get 3 attractions per day, max 20
    );
  }

  // ✅ ADD FALLBACK: If API fails or returns empty, use generic attractions
  if (attractions.length === 0) {
    console.log(`OpenTripMap returned no attractions for ${details.destinationCity}, using fallback attractions`);
    attractions = getFallbackAttractions(details.destinationCity, Math.min(tripDays * 3, 20));
  }
  

  // Fetch photos for attractions using Pexels (FREE!) with proper fallbacks
  const attractionsWithPhotos = await Promise.all(
    attractions.map(async (attraction, index) => {
      const photoUrl = await fetchPexelsImage(attraction.name, details.destinationCity);
      return {
        ...attraction,
        imageUrl: photoUrl || getCategoryFallbackImage(attraction.category, index),
      };
    }),
  );

  // Build daily itinerary from real attractions
  const itinerary = [];
  for (let day = 1; day <= tripDays; day++) {
    const dayDate = addDays(departureDate, day - 1);
    const dayItems = [];

    // First day: arrival
    if (day === 1) {
      dayItems.push({
        id: `day${day}-arrival`,
        title: `Arrival at ${details.destinationCity} Airport`,
        description: `Welcome to ${details.destinationCity}! Collect your luggage and proceed to your accommodation.`,
        time: "12:45",
        type: "transport",
        cost: 0,
        included: true,
        imageUrl: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80`,
      });
    }

    // ✅ ADD BREAKFAST (08:00) for all days with dynamic pricing
    const breakfastPrice = getMealPrice("breakfast", details.destinationCity);
    const breakfastImage = await getMealImage("breakfast", day - 1, details.destinationCity);
    const breakfastRestaurant = getRestaurantRecommendation("breakfast", details.destinationCity, day - 1);
    dayItems.push({
      id: `day${day}-breakfast`,
      title: `Breakfast at ${details.destinationCity}`,
      description: `Start your day at ${breakfastRestaurant.name} (${breakfastRestaurant.cuisine})`,
      time: "08:00",
      type: "meal",
      cost: breakfastPrice * totalPassengers, costPerPerson: breakfastPrice,
      included: true,
      imageUrl: breakfastImage,
      googleMapsUrl: getGoogleMapsLink(`${breakfastRestaurant.name} ${details.destinationCity}`),
      bookingUrl: breakfastRestaurant.resyLink,
    });

    // Add 2-3 attractions per day
    const startIdx = (day - 1) * 3;
    const dayAttractions = attractionsWithPhotos.slice(startIdx, startIdx + 3);

    // ✅ ENSURE EVERY DAY HAS ATTRACTIONS (use fallback if needed)
    const attractionsToShow = dayAttractions.length > 0 
      ? dayAttractions 
      : getFallbackAttractions(details.destinationCity, 3).map((attr, idx) => ({
          ...attr,
          imageUrl: getCategoryFallbackImage(attr.category, startIdx + idx)
        }));

    attractionsToShow.forEach((attraction, idx) => {
      const hour = 10 + idx * 3; // 10am, 1pm, 4pm (better spacing)
      
      // Generate realistic price based on category
      const attractionCostPerPerson = getAttractionPrice(attraction.category, attraction.rating || 7);
      // ✅ MULTIPLY by total passengers
      const attractionCost = attractionCostPerPerson * totalPassengers;
      
      dayItems.push({
        id: `day${day}-attraction${idx}`,
        title: attraction.name,
        description: attraction.description || `Explore this ${attraction.category} in ${details.destinationCity}`,
        time: `${hour.toString().padStart(2, "0")}:00`,
        type: "attraction",
        cost: attractionCost, costPerPerson: attractionCostPerPerson,
        included: true,
        imageUrl: attraction.imageUrl,
        distance: idx > 0 ? "2.5 km" : undefined,
        duration: "2h",
        googleMapsUrl: getGoogleMapsLink(attraction.name + " " + details.destinationCity),
        bookingUrl: `https://www.google.com/maps/search/${encodeURIComponent(attraction.name + " " + details.destinationCity)}`,
      });
    });

    // ✅ ADD LUNCH (12:00) for all days with dynamic pricing
    const lunchPrice = getMealPrice("lunch", details.destinationCity);
    const lunchImage = await getMealImage("lunch", day - 1, details.destinationCity);
    const lunchRestaurant = getRestaurantRecommendation("lunch", details.destinationCity, day - 1);
    dayItems.push({
      id: `day${day}-lunch`,
      title: `Lunch at ${details.destinationCity}`,
      description: `Enjoy lunch at ${lunchRestaurant.name} (${lunchRestaurant.cuisine})`,
      time: "12:00",
      type: "meal",
      cost: lunchPrice * totalPassengers, costPerPerson: lunchPrice,
      included: true,
      imageUrl: lunchImage,
      googleMapsUrl: getGoogleMapsLink(`${lunchRestaurant.name} ${details.destinationCity}`),
      bookingUrl: lunchRestaurant.resyLink,
    });

    // ✅ ADD DINNER (19:00) for all days with dynamic pricing
    const dinnerPrice = getMealPrice("dinner", details.destinationCity);
    const dinnerImage = await getMealImage("dinner", day - 1, details.destinationCity);
    const dinnerRestaurant = getRestaurantRecommendation("dinner", details.destinationCity, day - 1);
    dayItems.push({
      id: `day${day}-dinner`,
      title: `Dinner at ${details.destinationCity}`,
      description: `Savor dinner at ${dinnerRestaurant.name} (${dinnerRestaurant.cuisine})`,
      time: "19:00",
      type: "meal",
      cost: dinnerPrice * totalPassengers, costPerPerson: dinnerPrice,
      included: true,
      imageUrl: dinnerImage,
      googleMapsUrl: getGoogleMapsLink(`${dinnerRestaurant.name} ${details.destinationCity}`),
      bookingUrl: dinnerRestaurant.resyLink,
    });

    // Last day: departure
    if (day === tripDays) {
      dayItems.push({
        id: `day${day}-departure`,
        title: `Departure from ${details.destinationCity} Airport`,
        description: `Check out of your accommodation and head to the airport for your return flight.`,
        time: "18:30",
        type: "transport",
        cost: 0,
        included: true,
        imageUrl: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80`,
      });
    }

    itinerary.push({
      date: format(dayDate, "yyyy-MM-dd"),
      dayNumber: day,
      items: dayItems,
    });
  }

  // Calculate total cost
  let totalCost = 0;

  // Add flight costs
  const outboundFlightCost = baseFlightPrice * totalPassengers;
  const returnFlightCost = baseFlightPrice * totalPassengers;
  totalCost += outboundFlightCost + returnFlightCost;

  // Add itinerary costs
  itinerary.forEach((day) => {
    day.items.forEach((item) => {
      totalCost += item.cost || 0;
    });
  });

  // Get hotel and car rental data
  const hotel = getHotelData(details.destinationCity, tripDays);
  const carRental = getCarRentalData(details.destinationCity, tripDays);
  
  // Add hotel and car rental costs to total
  totalCost += hotel.totalPrice + carRental.totalPrice;

  // Create Flight objects matching the Flight interface
  const outboundFlight = {
    id: "flight-outbound",
    airline: "SkyWings Airlines",
    flightNumber: `SW${Math.floor(Math.random() * 9000) + 1000}`,
    origin: details.departureCity,
    originCode: originCode,
    destination: details.destinationCity,
    destinationCode: destCode,
    departureTime: "09:15",
    arrivalTime: "12:45",
    duration: "3h 30m",
    class: details.flightClass || "economy",
    pricePerPerson: baseFlightPrice,
    included: true,
  };
  
  const returnFlight = {
    id: "flight-return",
    airline: "SkyWings Airlines",
    flightNumber: `SW${Math.floor(Math.random() * 9000) + 1000}`,
    origin: details.destinationCity,
    originCode: destCode,
    destination: details.departureCity,
    destinationCode: originCode,
    departureTime: "18:30",
    arrivalTime: "22:00",
    duration: "3h 30m",
    class: details.flightClass || "economy",
    pricePerPerson: baseFlightPrice,
    included: true,
  };

  return {
    outboundFlight,
    returnFlight,
    carRental,
    hotel,
    itinerary,
    totalCost,
  };
}
