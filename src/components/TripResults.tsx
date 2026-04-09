import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { format, isValid } from "date-fns";
import {
  Plane,
  Car,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  X,
  Check,
  Utensils,
  Camera,
  Coffee,
  Bed,
  Mail,
  FileText,
  Loader2,
  ExternalLink,
  Share2,
} from "lucide-react";

// Helper function for safe date parsing
function safeParseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return isValid(date) ? date : null;
}

// Helper function for safe date formatting
function safeFormatDate(value: unknown, formatStr: string, fallback: string = "Date not available"): string {
  const date = safeParseDate(value);
  if (!date) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}

// Helper function for safe string display (time, duration, etc.)
function safeString(value: unknown, fallback: string = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

// ✅ NEW: Helper function for safe price formatting
function safePrice(value: number | undefined | null): string {
  if (value === null || value === undefined || isNaN(value)) return "€0";
  return `€${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FlightBookingCard } from "@/components/FlightBookingCard";
import type { TripDetails, TripPlan, DayItinerary } from "@/types/trip";

// Helper function to generate Google Maps URL
const getGoogleMapsLink = (locationQuery: string): string => {
  const encodedLocation = encodeURIComponent(locationQuery);
  return `https://www.google.com/maps/search/${encodedLocation}`;
};

// Helper function to generate pre-filled Booking.com hotel link
const generateHotelBookingLink = (hotel: any, tripDetails: TripDetails): string => {
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Guard against null/undefined dates
  const checkinDate = tripDetails.departureDate
    ? formatDate(tripDetails.departureDate)
    : "";
  const checkoutDate = tripDetails.returnDate
    ? formatDate(tripDetails.returnDate)
    : "";

  if (!checkinDate || !checkoutDate) return "#";

  const adults = tripDetails.passengers?.adults || 2;
  const children = tripDetails.passengers?.children || 0;
  const rooms = 1; // Default to 1 room

  // Booking.com hotel search URL with dates and guest counts
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.address)}&checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=${adults}&group_children=${children}&no_rooms=${rooms}`;
};

// Helper function to generate pre-filled Rentalcars.com link
const generateCarRentalLink = (carRental: any, tripDetails: TripDetails): string => {
  const parseLocation = (location: string): { code: string; name: string } => {
    if (!location) return { code: "", name: "" };
    const match = location.match(/^(.+?)\s*\(([A-Z]{3})\)$/);
    if (match) {
      return { code: match[2], name: match[1].trim() };
    }
    return { code: "", name: location };
  };

  // Guard against null/undefined dates
  if (!tripDetails.departureDate || !tripDetails.returnDate) return "#";

  const pickupDate = new Date(tripDetails.departureDate);
  const dropoffDate = new Date(tripDetails.returnDate);
  const pickupTime = carRental?.pickupTime || "10:00";
  const dropoffTime = carRental?.dropoffTime || "10:00";
  
  const [puHour, puMinute] = pickupTime.split(':');
  const [doHour, doMinute] = dropoffTime.split(':');
  
  const location = parseLocation(tripDetails.destinationCity);
  const locationName = location.name ? `${location.name} Airport` : "";
  const locationIata = location.code;

  return `https://www.rentalcars.com/search-results?location=&dropLocation=&locationName=${encodeURIComponent(locationName )}&locationIata=${locationIata}&dropLocationName=${encodeURIComponent(locationName)}&dropLocationIata=${locationIata}&driversAge=30&puDay=${pickupDate.getDate()}&puMonth=${pickupDate.getMonth() + 1}&puYear=${pickupDate.getFullYear()}&puMinute=${puMinute || '0'}&puHour=${puHour || '10'}&doDay=${dropoffDate.getDate()}&doMonth=${dropoffDate.getMonth() + 1}&doYear=${dropoffDate.getFullYear()}&doMinute=${doMinute || '0'}&doHour=${doHour || '10'}&ftsType=A&dropFtsType=A`;
};
interface TripResultsProps {
  tripDetails: TripDetails;
  tripPlan: TripPlan;
  tripId?: string;
  onToggleItem: (type: string, id: string) => void;
  onReset: () => void;
}

export function TripResults({
  tripDetails,
  tripPlan,
  tripId: propTripId,
  onToggleItem,
  onReset,
}: TripResultsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Calculate total cost
  const totalCost = useMemo(() => {
    let cost = 0;
    if (tripPlan.outboundFlight?.included && tripPlan.outboundFlight?.pricePerPerson) {
      cost += tripPlan.outboundFlight.pricePerPerson * ((tripDetails.passengers?.adults || 0) + (tripDetails.passengers?.children || 0));
    }
    if (tripPlan.returnFlight?.included && tripPlan.returnFlight?.pricePerPerson) {
      cost += tripPlan.returnFlight.pricePerPerson * ((tripDetails.passengers?.adults || 0) + (tripDetails.passengers?.children || 0));
    }
    if (tripPlan.hotel?.included && tripPlan.hotel?.totalPrice) {
      cost += tripPlan.hotel.totalPrice;
    }
    if (tripPlan.carRental?.included && tripPlan.carRental?.totalPrice) {
      cost += tripPlan.carRental.totalPrice;
    }
    tripPlan.itinerary?.forEach((day) => {
      day.items?.forEach((item) => {
        if (item.included && item.cost) {
          cost += item.cost;
        }
      });
    });
    return cost;
  }, [tripPlan, tripDetails]);

  const handleSaveTrip = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save trips",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          origin_city: tripDetails.departureCity,
          destination_city: tripDetails.destinationCity,
          departure_date: tripDetails.departureDate,
          return_date: tripDetails.returnDate,
          adults: tripDetails.passengers?.adults || 0,
          children: tripDetails.passengers?.children || 0,
          infants: tripDetails.passengers?.infants || 0,
          flight_class: tripDetails.flightClass,
          include_hotel: tripDetails.includeHotel,
          include_car: tripDetails.includeCarRental,
          origin_iata_code: tripDetails.departureLocation?.iataCode || null,
          destination_iata_code: tripDetails.destinationLocation?.iataCode || null,
          origin_country: tripDetails.departureLocation?.countryName || null,
          destination_country: tripDetails.destinationLocation?.countryName || null,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Save trip items
      const items: any[] = [];

      if (tripPlan.outboundFlight) {
        items.push({
          trip_id: trip.id,
          item_type: "flight",
          name: `${tripDetails.departureCity} to ${tripDetails.destinationCity}`,
          description: "Outbound flight",
          cost: tripPlan.outboundFlight.pricePerPerson * ((tripDetails.passengers?.adults || 0) + (tripDetails.passengers?.children || 0)),
          included: tripPlan.outboundFlight.included,
          provider_data: { ...tripPlan.outboundFlight, direction: "outbound" },
        });
      }

      if (tripPlan.returnFlight) {
        items.push({
          trip_id: trip.id,
          item_type: "flight",
          name: `${tripDetails.destinationCity} to ${tripDetails.departureCity}`,
          description: "Return flight",
          cost: tripPlan.returnFlight.pricePerPerson * ((tripDetails.passengers?.adults || 0) + (tripDetails.passengers?.children || 0)),
          included: tripPlan.returnFlight.included,
          provider_data: { ...tripPlan.returnFlight, direction: "return" },
        });
      }

      if (tripPlan.hotel) {
        items.push({
          trip_id: trip.id,
          item_type: "hotel",
          name: tripPlan.hotel.name || "Hotel",
          description: tripPlan.hotel.address,
          cost: tripPlan.hotel.totalPrice,
          included: tripPlan.hotel.included,
          provider_data: tripPlan.hotel,
        });
      }

      if (tripPlan.carRental) {
        items.push({
          trip_id: trip.id,
          item_type: "car",
          name: tripPlan.carRental.name || "Car Rental",
          description: `${tripPlan.carRental.pickupDate} - ${tripPlan.carRental.dropoffDate}`,
          cost: tripPlan.carRental.totalPrice,
          included: tripPlan.carRental.included,
          provider_data: tripPlan.carRental,
        });
      }

      // Add itinerary items
      tripPlan.itinerary?.forEach((day, dayIndex) => {
        day.items?.forEach((item) => {
          items.push({
            trip_id: trip.id,
            item_type: "activity",
            name: item.title,
            description: item.description,
            cost: item.cost || 0,
            included: item.included,
            day_number: dayIndex + 1,
            image_url: item.imageUrl,
            booking_url: item.bookingUrl,
            provider_data: { 
              time: item.time,
              costPerPerson: (item as any).costPerPerson || null,
            },
          });
        });
      });

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("trip_items").insert(items);
        if (itemsError) throw itemsError;
      }

      toast({
        title: "Trip saved!",
        description: "Your trip has been saved to your profile",
      });
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error saving trip",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalPassengers = (tripDetails.passengers?.adults || 0) + (tripDetails.passengers?.children || 0);

  return (
    <Card className="w-full overflow-hidden shadow-elevated border-border/30">
      <CardHeader className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-violet-950/50 pb-8">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-accent to-violet-500" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl mb-2 font-display font-bold">
              {tripDetails.departureCity} <span className="text-accent">&rarr;</span> {tripDetails.destinationCity}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {safeFormatDate(tripDetails.departureDate, "MMM d, yyyy")} &mdash; {safeFormatDate(tripDetails.returnDate, "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/50 hover:border-accent/50 transition-all duration-300"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied!", description: "Trip link copied to clipboard." });
              }}
            >
              <Share2 className="h-4 w-4 mr-2" /> Share Trip
            </Button>
            <Button onClick={onReset} variant="outline" className="w-full sm:w-auto rounded-xl border-border/50 hover:border-accent/50 transition-all duration-300">
              Start Over
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8">
        <div className="space-y-8">
          {/* Estimated Total */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border border-blue-200/50 shadow-soft overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full" />
            <p className="text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide">Estimated Total</p>
            <p className="text-4xl font-bold text-blue-600 font-display">{safePrice(totalCost)}</p>
            <p className="text-xs text-gray-500 mt-3">
              {tripDetails.passengers?.adults || 0} Adult{(tripDetails.passengers?.adults || 0) !== 1 ? "s" : ""}{(tripDetails.passengers?.children ?? 0) > 0 ? ` + ${tripDetails.passengers?.children} Child${(tripDetails.passengers?.children ?? 0) !== 1 ? "ren" : ""}` : ""}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center italic">
            * Prices are estimates for planning purposes only. Actual prices may vary. Always verify before booking.
          </p>

          {/* Flights */}
          {(tripPlan.outboundFlight || tripPlan.returnFlight) && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Plane className="h-4.5 w-4.5 text-blue-600" />
                </div>
                Flights
              </h2>

              {tripPlan.outboundFlight && (
                <FlightBookingCard
                  flight={tripPlan.outboundFlight}
                  passengers={tripDetails.passengers}
                  onToggle={() => onToggleItem("outboundFlight", tripPlan.outboundFlight!.id)}
                  totalPriceOnly={true}
                  departureAirport={tripDetails.departureCity}
                  arrivalAirport={tripDetails.destinationCity}
                  departureDate={tripDetails.departureDate}
                  returnDate={tripDetails.returnDate}
                />
              )}

              {tripPlan.returnFlight && (
                <FlightBookingCard
                  flight={tripPlan.returnFlight}
                  passengers={tripDetails.passengers}
                  onToggle={() => onToggleItem("returnFlight", tripPlan.returnFlight!.id)}
                  totalPriceOnly={true}
                  departureAirport={tripDetails.departureCity}
                  arrivalAirport={tripDetails.destinationCity}
                  departureDate={tripDetails.departureDate}
                  returnDate={tripDetails.returnDate}
                />
              )}
            </div>
          )}

          {/* Accommodation */}
          {tripPlan.hotel && (
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-amber-600" />
                </div>
                Accommodation
              </h2>
              <div className="border border-border/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/60 backdrop-blur-sm hover:shadow-soft transition-all duration-300">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{tripPlan.hotel.name}</h3>
                  <p className="text-sm text-gray-500">{tripPlan.hotel.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-sm text-yellow-500">
                      {tripPlan.hotel.rating.toFixed(1)} ⭐
                    </div>
                    <span className="text-sm text-gray-500">·</span>
                    <a
                      href={getGoogleMapsLink(tripPlan.hotel.name + ", " + tripPlan.hotel.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" /> View on Map
                    </a>
                    <span className="text-sm text-gray-500">·</span>
                    <a
                      href={generateHotelBookingLink(tripPlan.hotel, tripDetails)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" /> Book Now
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg whitespace-nowrap">{safePrice(tripPlan.hotel.totalPrice)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => onToggleItem("hotel", tripPlan.hotel!.id)}
                  >
                    {tripPlan.hotel.included ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Car Rental */}
          {tripPlan.carRental && (
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Car className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                Car Rental
              </h2>
              <div className="border border-border/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/60 backdrop-blur-sm hover:shadow-soft transition-all duration-300">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{tripPlan.carRental.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{tripPlan.carRental.company} · {tripPlan.carRental.vehicleType}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Pickup: {tripPlan.carRental.pickupLocation} at {tripPlan.carRental.pickupTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    Dropoff: {tripPlan.carRental.dropoffLocation} at {tripPlan.carRental.dropoffTime}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={generateCarRentalLink(tripPlan.carRental, tripDetails)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" /> Book Now
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg whitespace-nowrap">{safePrice(tripPlan.carRental.totalPrice)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => onToggleItem("carRental", tripPlan.carRental!.id)}
                  >
                    {tripPlan.carRental.included ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Daily Itinerary */}
          {tripPlan.itinerary && tripPlan.itinerary.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-violet-600" />
                </div>
                Daily Itinerary
              </h2>
              {tripPlan.itinerary.map((day, index) => (
                <Card key={`day-${day.day || index}`} className="mb-6 border-border/40 overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-b border-border/20">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-bold shadow-sm">{day.day}</span>
                      {safeFormatDate(day.date, "EEEE, MMMM d")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {[...day.items]
                      .sort((a, b) => {
                        // Sort by time (HH:MM format)
                        const timeA = a.time || "99:99";
                        const timeB = b.time || "99:99";
                        return timeA.localeCompare(timeB);
                      })
                      .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-start gap-4 border-b last:border-b-0 py-4"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full sm:w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Clock className="h-4 w-4" />
                            <span>{item.time}</span>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-2">
                            {item.bookingUrl && (
                              <a
                                href={item.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-4 w-4" /> Book Now
                              </a>
                            )}
                            {item.bookingUrl && item.googleMapsUrl && <span className="text-sm text-gray-500">·</span>}
                            {item.googleMapsUrl && (
                              <a
                                href={item.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <MapPin className="h-4 w-4" /> View on Map
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 self-start sm:self-center">
                          <div className="text-right">
                            <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
                              {safePrice(item.costPerPerson)} <span className="text-xs text-gray-500">/ person</span>
                            </p>
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {safePrice((item.costPerPerson || 0) * totalPassengers)} total
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => onToggleItem("itinerary", item.id)}
                          >
                            {item.included ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Save Trip Button */}
          <Button
            onClick={handleSaveTrip}
            disabled={isSaving}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-base font-medium shadow-medium hover:shadow-elevated transition-all duration-300 hover:scale-[1.01]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving your trip...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" /> Save Trip
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

