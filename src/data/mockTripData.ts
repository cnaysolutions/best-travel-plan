import type { TripPlan, TripDetails } from "@/types/trip";
import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
        "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3807516/pexels-photo-3807516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3807515/pexels-photo-3807515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
    {
      category: "historic_site",
      names: ["Old Town Square", "Historic District", "City Center", "Heritage Site", "Ancient Quarter"],
      descriptions: ["Walk through centuries of history", "Experience the city's heritage", "Discover architectural wonders"],
      images: [
        "https://images.pexels.com/photos/3707517/pexels-photo-3707517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3707516/pexels-photo-3707516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3707515/pexels-photo-3707515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
    {
      category: "park",
      names: ["Central Park", "City Park", "Botanical Garden", "Riverside Park", "Public Garden"],
      descriptions: ["Relax in beautiful green spaces", "Enjoy nature in the heart of the city", "Perfect spot for a leisurely stroll"],
      images: [
        "https://images.pexels.com/photos/3607517/pexels-photo-3607517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3607516/pexels-photo-3607516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3607515/pexels-photo-3607515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
    {
      category: "shopping",
      names: ["Shopping District", "Local Market", "Artisan Quarter", "Fashion Street", "Souvenir Market"],
      descriptions: ["Browse local shops and boutiques", "Find unique souvenirs and gifts", "Experience local shopping culture"],
      images: [
        "https://images.pexels.com/photos/3507517/pexels-photo-3507517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3507516/pexels-photo-3507516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3507515/pexels-photo-3507515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
    {
      category: "restaurant",
      names: ["Local Restaurant", "Traditional Cuisine", "Rooftop Dining", "Waterfront Restaurant", "Gourmet Experience"],
      descriptions: ["Savor authentic local flavors", "Enjoy a memorable dining experience", "Taste the best of local cuisine"],
      images: [
        "https://images.pexels.com/photos/3407517/pexels-photo-3407517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3407516/pexels-photo-3407516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3407515/pexels-photo-3407515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
    {
      category: "cultural",
      names: ["Cultural Center", "Theater District", "Music Hall", "Performance Venue", "Arts Quarter"],
      descriptions: ["Immerse yourself in local culture", "Experience performing arts", "Discover cultural traditions"],
      images: [
        "https://images.pexels.com/photos/3307517/pexels-photo-3307517.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3307516/pexels-photo-3307516.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3307515/pexels-photo-3307515.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  ];

  const attractions = [];
  for (let i = 0; i < count; i++ ) {
    const typeIndex = i % fallbackAttractionTypes.length;
    const type = fallbackAttractionTypes[typeIndex];
    const nameIndex = Math.floor(i / fallbackAttractionTypes.length) % type.names.length;
    const descIndex = i % type.descriptions.length;
    const imgIndex = i % type.images.length;

    attractions.push({
      name: `${type.names[nameIndex]} of ${city}`,
      description: type.descriptions[descIndex],
      category: type.category,
      rating: 6 + (i % 3), // Rating between 6-8
      imageUrl: type.images[imgIndex],
    });
  }

  return attractions;
}
// City coordinates for OpenTripMap API
const cityCoordinates: Record<string, { lat: number; lon: number }> = {
  // Europe
  Paris: { lat: 48.8566, lon: 2.3522 },
  Barcelona: { lat: 41.3874, lon: 2.1686 },
  Rome: { lat: 41.9028, lon: 12.4964 },
  London: { lat: 51.5074, lon: -0.1278 },
  Amsterdam: { lat: 52.3676, lon: 4.9041 },
  Berlin: { lat: 52.52, lon: 13.405 },
  Madrid: { lat: 40.4168, lon: -3.7038 },
  Prague: { lat: 50.0755, lon: 14.4378 },
  Vienna: { lat: 48.2082, lon: 16.3738 },
  Athens: { lat: 37.9838, lon: 23.7275 },

  // Asia
  Tokyo: { lat: 35.6762, lon: 139.6503 },
  Dubai: { lat: 25.2048, lon: 55.2708 },
  Bangkok: { lat: 13.7563, lon: 100.5018 },
  Singapore: { lat: 1.3521, lon: 103.8198 },
  "Hong Kong": { lat: 22.3193, lon: 114.1694 },
  Seoul: { lat: 37.5665, lon: 126.978 },
  Istanbul: { lat: 41.0082, lon: 28.9784 },

  // Americas
  "New York": { lat: 40.7128, lon: -74.006 },
  "Los Angeles": { lat: 34.0522, lon: -118.2437 },
  Miami: { lat: 25.7617, lon: -80.1918 },
  Toronto: { lat: 43.6532, lon: -79.3832 },
  "Mexico City": { lat: 19.4326, lon: -99.1332 },
  "Rio de Janeiro": { lat: -22.9068, lon: -43.1729 },
  "Buenos Aires": { lat: -34.6037, lon: -58.3816 },

  // Oceania
  Sydney: { lat: -33.8688, lon: 151.2093 },
  Melbourne: { lat: -37.8136, lon: 144.9631 },
  Auckland: { lat: -36.8485, lon: 174.7633 },

  // Africa & Middle East
  Cairo: { lat: 30.0444, lon: 31.2357 },
  "Cape Town": { lat: -33.9249, lon: 18.4241 },
  "Tel Aviv": { lat: 32.0853, lon: 34.7818 },
};

function getCityCoordinates(city: string): { lat: number; lon: number } | null {
  // Strip country name if present (e.g., "Barcelona, Spain" -> "Barcelona")
  const cityName = city.includes(',') ? city.split(',')[0].trim() : city;
  
  // Try exact match first
  if (cityCoordinates[cityName]) {
    return cityCoordinates[cityName];
  }

  // Try case-insensitive match
  const cityLower = cityName.toLowerCase();
  for (const [key, coords] of Object.entries(cityCoordinates)) {
    if (key.toLowerCase() === cityLower) {
      return coords;
    }
  }

  // Default to Paris if not found
  console.warn(`Coordinates not found for ${cityName}, using Paris as default`);
  return cityCoordinates["Paris"];
}

function getAirportCode(city: string): string {
  // Strip country name if present (e.g., "Madrid, Spain" -> "Madrid")
  const cityName = city.includes(',') ? city.split(',')[0].trim() : city;
  
  const codes: Record<string, string> = {
    Paris: "CDG",
    Barcelona: "BCN",
    Rome: "FCO",
    London: "LHR",
    Amsterdam: "AMS",
    Berlin: "BER",
    Madrid: "MAD",
    Prague: "PRG",
    Vienna: "VIE",
    Athens: "ATH",
    Tokyo: "NRT",
    Dubai: "DXB",
    Bangkok: "BKK",
    Singapore: "SIN",
    "Hong Kong": "HKG",
    Seoul: "ICN",
    Istanbul: "IST",
    "New York": "JFK",
    "Los Angeles": "LAX",
    Miami: "MIA",
    Toronto: "YYZ",
    "Mexico City": "MEX",
    "Rio de Janeiro": "GIG",
    "Buenos Aires": "EZE",
    Sydney: "SYD",
    Melbourne: "MEL",
    Auckland: "AKL",
    Cairo: "CAI",
    "Cape Town": "CPT",
    "Tel Aviv": "TLV",
    Frankfurt: "FRA",
    Munich: "MUC",
    Lisbon: "LIS",
    Dublin: "DUB",
    Brussels: "BRU",
    Zurich: "ZRH",
    Geneva: "GVA",
    Copenhagen: "CPH",
    Stockholm: "ARN",
    Oslo: "OSL",
    Helsinki: "HEL",
    Warsaw: "WAW",
    Budapest: "BUD",
    Bucharest: "OTP",
    Sofia: "SOF",
    Zagreb: "ZAG",
    Belgrade: "BEG",
  };

  // Try exact match first
  if (codes[cityName]) {
    return codes[cityName];
  }

  // Try case-insensitive match
  const cityLower = cityName.toLowerCase();
  for (const [key, code] of Object.entries(codes)) {
    if (key.toLowerCase() === cityLower) {
      return code;
    }
  }

  return "XXX";
}

// Helper to get random price within a range
function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

// Fallback images by category when Pexels fails
function getCategoryFallbackImage(category: string, index: number): string {
  const categoryLower = (category || "").toLowerCase();
  
  // Museum images
  if (categoryLower.includes("museum")) {
    const museumImages = [
      "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3807516/pexels-photo-3807516.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3807515/pexels-photo-3807515.jpeg?auto=compress&cs=tinysrgb&w=800",
    ];
    return museumImages[index % museumImages.length];
  }
  
  // Historic & architecture
  if (categoryLower.includes("historic") || categoryLower.includes("architecture") || categoryLower.includes("monument")) {
    const historicImages = [
      "https://images.pexels.com/photos/3707517/pexels-photo-3707517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3707516/pexels-photo-3707516.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3707515/pexels-photo-3707515.jpeg?auto=compress&cs=tinysrgb&w=800",
    ];
    return historicImages[index % historicImages.length];
  }
  
  // Religious sites
  if (categoryLower.includes("religion") || categoryLower.includes("church") || categoryLower.includes("temple")) {
    const religiousImages = [
      "https://images.pexels.com/photos/3607517/pexels-photo-3607517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3607516/pexels-photo-3607516.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3607515/pexels-photo-3607515.jpeg?auto=compress&cs=tinysrgb&w=800",
    ];
    return religiousImages[index % religiousImages.length];
  }
  
  // Natural sites & parks
  if (categoryLower.includes("natural") || categoryLower.includes("park") || categoryLower.includes("garden")) {
    const natureImages = [
      "https://images.pexels.com/photos/3507517/pexels-photo-3507517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3507516/pexels-photo-3507516.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3507515/pexels-photo-3507515.jpeg?auto=compress&cs=tinysrgb&w=800",
    ];
    return natureImages[index % natureImages.length];
  }
  
  // Entertainment & cultural
  if (categoryLower.includes("entertainment") || categoryLower.includes("theatre") || categoryLower.includes("cultural")) {
    const entertainmentImages = [
      "https://images.pexels.com/photos/3407517/pexels-photo-3407517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3407516/pexels-photo-3407516.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3407515/pexels-photo-3407515.jpeg?auto=compress&cs=tinysrgb&w=800",
    ];
    return entertainmentImages[index % entertainmentImages.length];
  }
  
  // Default varied travel images
  const defaultImages = [
    "https://images.pexels.com/photos/3307517/pexels-photo-3307517.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3307516/pexels-photo-3307516.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3307515/pexels-photo-3307515.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3307514/pexels-photo-3307514.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3307513/pexels-photo-3307513.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3307512/pexels-photo-3307512.jpeg?auto=compress&cs=tinysrgb&w=800",
  ];
  return defaultImages[index % defaultImages.length];
}

// Meal images with variety
function getMealImage(mealType: string, dayIndex: number): string {
  const lunchImages = [
    "https://images.pexels.com/photos/3407517/pexels-photo-3407517.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3407516/pexels-photo-3407516.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3407515/pexels-photo-3407515.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3407514/pexels-photo-3407514.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3407513/pexels-photo-3407513.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3407512/pexels-photo-3407512.jpeg?auto=compress&cs=tinysrgb&w=800",
  ];
  
  return lunchImages[dayIndex % lunchImages.length];
}

export async function generateMockTripPlan(details: TripDetails): Promise<TripPlan> {
  const departureDate = details.departureDate || new Date();
  const returnDate = details.returnDate || addDays(departureDate, 5);
  const tripDays = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // ✅ CALCULATE TOTAL PASSENGERS for price multiplication
  const totalPassengers = (details.passengers?.adults || 1) + 
                          (details.passengers?.children || 0) + 
                          (details.passengers?.infants || 0);

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
      const photoUrl = await fetchPlacePhoto(attraction.name, details.destinationCity);
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
        imageUrl: `https://images.pexels.com/photos/3207517/pexels-photo-3207517.jpeg?auto=compress&cs=tinysrgb&w=800`,
      });
    }

    // ✅ ADD BREAKFAST (08:00) for all days
    dayItems.push({
      id: `day${day}-breakfast`,
      title: `Breakfast at ${details.destinationCity}`,
      description: "Start your day with a delicious local breakfast",
      time: "08:00",
      type: "meal",
      cost: 25 * totalPassengers, // ✅ Multiply by passengers
      included: true,
      imageUrl: getMealImage("breakfast", day - 1),
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
        cost: attractionCost,
        included: true,
        imageUrl: attraction.imageUrl,
        distance: idx > 0 ? "2.5 km" : undefined,
        duration: "2h",
      });
    });

    // ✅ ADD LUNCH (12:00) for all days
    dayItems.push({
      id: `day${day}-lunch`,
      title: `Lunch at ${details.destinationCity}`,
      description: "Enjoy a memorable dining experience",
      time: "12:00",
      type: "meal",
      cost: 45 * totalPassengers, // ✅ Multiply by passengers
      included: true,
      imageUrl: getMealImage("lunch", day - 1),
    });

    // ✅ ADD DINNER (19:00) for all days
    dayItems.push({
      id: `day${day}-dinner`,
      title: `Dinner at ${details.destinationCity}`,
      description: "Savor authentic local flavors",
      time: "19:00",
      type: "meal",
      cost: 55 * totalPassengers, // ✅ Multiply by passengers
      included: true,
      imageUrl: getMealImage("dinner", day - 1),
    });

    // Last day: departure
    if (day === tripDays) {
      dayItems.push({
        id: `day${day}-departure`,
        title: `Return to ${details.destinationCity} Airport`,
        description: `Check out and head to the airport for your return flight.`,
        time: "16:00",
        type: "transport",
        cost: 0,
        included: true,
        imageUrl: `https://images.pexels.com/photos/3207517/pexels-photo-3207517.jpeg?auto=compress&cs=tinysrgb&w=800`,
      });
    }

    // ✅ SORT ITEMS BY TIME to ensure correct chronological order
    dayItems.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    itinerary.push({
      day,
      date: format(dayDate, "EEE, MMM d"),
      items: dayItems,
    });
  }

  // Calculate total activity costs
  const activityCosts = itinerary.reduce((sum, day) => {
    return sum + day.items.filter((i) => i.included).reduce((daySum, item) => daySum + (item.cost || 0), 0);
  }, 0);

  const plan: TripPlan = {
    outboundFlight: {
      id: "outbound-1",
      airline: "SkyWings Airlines",
      flightNumber: "SW 1247",
      origin: details.departureCity,
      originCode,
      destination: details.destinationCity,
      destinationCode: destCode,
      departureTime: "09:15",
      arrivalTime: "12:45",
      duration: "3h 30m",
      class: details.flightClass,
      pricePerPerson: baseFlightPrice,
      included: true,
    },
    returnFlight: {
      id: "return-1",
      airline: "SkyWings Airlines",
      flightNumber: "SW 1248",
      origin: details.destinationCity,
      originCode: destCode,
      destination: details.departureCity,
      destinationCode: originCode,
      departureTime: "18:30",
      arrivalTime: "22:00",
      duration: "3h 30m",
      class: details.flightClass,
      pricePerPerson: baseFlightPrice,
      included: true,
    },
    carRental: details.includeCarRental
      ? {
          id: "car-1",
          company: "EuroMobility",
          vehicleType: "Compact",
          vehicleName: "Volkswagen Tiguan or similar",
          pickupLocation: `${details.destinationCity} Airport`,
          dropoffLocation: `${details.destinationCity} Airport`,
          pickupTime: format(departureDate, "MMM d, h:mm a"),
          dropoffTime: format(returnDate, "MMM d, h:mm a"),
          pricePerDay: 45,
          totalPrice: 45 * (tripDays - 1),
          included: true,
        }
      : undefined,
    hotel: details.includeHotel
      ? {
          id: "hotel-1",
          name: `Grand ${details.destinationCity}, Spain Palace Hotel`,
          rating: 4.5,
          address: `123 Central Avenue, ${details.destinationCity}, Spain`,
          distanceFromAirport: "18 km from airport",
          pricePerNight: 180,
          totalPrice: 180 * (tripDays - 1),
          amenities: ["Free WiFi", "Pool", "Gym", "Restaurant"],
          included: true,
        }
      : undefined,
    itinerary,
    totalCost: 0, // Will be calculated below
  };

  // Calculate total cost
  const flightCost = (plan.outboundFlight?.pricePerPerson || 0) + (plan.returnFlight?.pricePerPerson || 0);
  const carCost = plan.carRental?.totalPrice || 0;
  const hotelCost = plan.hotel?.totalPrice || 0;

  plan.totalCost = flightCost + carCost + hotelCost + activityCosts;

  return plan;
}
