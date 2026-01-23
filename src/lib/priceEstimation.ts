import type { FlightClass } from "@/types/trip";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate flight price based on distance, class, and season
 */
export function estimateFlightPrice(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  flightClass: FlightClass,
  departureDate: Date
): { min: number; max: number; average: number } {
  // Calculate distance
  const distance = calculateDistance(originLat, originLon, destLat, destLon);

  // Base price per km (in USD)
  let baseRate = 0.15; // $0.15 per km for economy

  // Adjust for flight class
  switch (flightClass) {
    case "business":
      baseRate *= 3.5;
      break;
    case "first":
      baseRate *= 5.5;
      break;
    default:
      // economy stays at base rate
      break;
  }

  // Calculate base price
  let basePrice = distance * baseRate;

  // Add minimum price (short flights have overhead)
  const minimumPrice = flightClass === "economy" ? 50 : flightClass === "business" ? 200 : 400;
  basePrice = Math.max(basePrice, minimumPrice);

  // Seasonal adjustment
  const month = departureDate.getMonth();
  let seasonalMultiplier = 1.0;

  // Peak season (June-August, December)
  if (month >= 5 && month <= 7) {
    seasonalMultiplier = 1.3;
  } else if (month === 11) {
    seasonalMultiplier = 1.4;
  }
  // Shoulder season (April-May, September-October)
  else if ((month >= 3 && month <= 4) || (month >= 8 && month <= 9)) {
    seasonalMultiplier = 1.1;
  }
  // Low season (January-March, November)
  else {
    seasonalMultiplier = 0.9;
  }

  basePrice *= seasonalMultiplier;

  // Add variance for price range
  const variance = 0.25; // 25% variance
  const min = Math.round(basePrice * (1 - variance));
  const max = Math.round(basePrice * (1 + variance));
  const average = Math.round(basePrice);

  return { min, max, average };
}

/**
 * Generate Skyscanner affiliate booking URL
 * Note: Replace 'YOUR_AFFILIATE_ID' with actual Skyscanner affiliate ID when available
 */
export function generateSkyscannerUrl(
  originIATA: string,
  destIATA: string,
  departureDate: Date,
  returnDate: Date | null,
  adults: number,
  children: number,
  infants: number,
  cabinClass: FlightClass
): string {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const depDate = formatDate(departureDate);
  const retDate = returnDate ? formatDate(returnDate) : "";

  // Skyscanner cabin class mapping
  const cabinMap = {
    economy: "economy",
    business: "business",
    first: "first",
  };

  // Build Skyscanner URL
  // Format: https://www.skyscanner.com/transport/flights/{origin}/{dest}/{depDate}/{retDate}/?adults={adults}&children={children}&infants={infants}&cabinclass={class}
  const baseUrl = "https://www.skyscanner.com/transport/flights";
  const tripType = returnDate ? "return" : "oneway";
  
  let url = `${baseUrl}/${originIATA}/${destIATA}/${depDate}`;
  if (returnDate) {
    url += `/${retDate}`;
  }
  
  const params = new URLSearchParams({
    adults: adults.toString(),
    ...(children > 0 && { children: children.toString() }),
    ...(infants > 0 && { infants: infants.toString() }),
    cabinclass: cabinMap[cabinClass],
  });

  // TODO: Add affiliate tracking parameter when Skyscanner affiliate ID is available
  // params.append('associateid', 'YOUR_AFFILIATE_ID');

  return `${url}?${params.toString()}`;
}

/**
 * Format price range for display
 */
export function formatPriceRange(min: number, max: number): string {
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

/**
 * Calculate total trip cost estimate
 */
export function estimateTotalTripCost(
  flightPrice: number,
  nights: number,
  includeHotel: boolean,
  includeCarRental: boolean
): number {
  let total = flightPrice * 2; // Round trip

  if (includeHotel) {
    // Average hotel price per night (can be adjusted based on destination)
    const hotelPerNight = 120;
    total += hotelPerNight * nights;
  }

  if (includeCarRental) {
    // Average car rental per day
    const carPerDay = 50;
    total += carPerDay * nights;
  }

  return Math.round(total);
}
