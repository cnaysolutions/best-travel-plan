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

  const checkinDate = formatDate(tripDetails.departureDate);
  const checkoutDate = formatDate(tripDetails.returnDate);
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
  const [isSaving, setIsSaving] = React.useState(false);

  // Calculate total cost
  const totalCost = React.useMemo(() => {
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
          origin_country: tripDetails.departureLocation?.country || null,
          destination_country: tripDetails.destinationLocation?.country || null,
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
            provider_data: { time: item.time },
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
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl mb-2">
              Your Itinerary: {tripDetails.departureCity} → {tripDetails.destinationCity}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {safeFormatDate(tripDetails.departureDate, "MMM d, yyyy")} - {safeFormatDate(tripDetails.returnDate, "MMM d, yyyy")}
            </p>
          </div>
          <Button onClick={onReset} variant="outline" className="w-full sm:w-auto">
            Start Over
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Estimated Total */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Estimated Total</p>
            <p className="text-3xl font-bold text-blue-600">{safePrice(totalCost)}</p>
            <p className="text-xs text-gray-500 mt-2">
              {tripDetails.passengers?.adults || 0} Adult{(tripDetails.passengers?.adults || 0) !== 1 ? "s" : ""} {tripDetails.passengers?.children || 0 > 0 ? `+ ${tripDetails.passengers?.children} Child${(tripDetails.passengers?.children || 0) !== 1 ? "ren" : ""}` : ""}
            </p>
          </div>

          {/* Flights */}
          {(tripPlan.outboundFlight || tripPlan.returnFlight) && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plane className="h-5 w-5" /> Flights
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
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" /> Accommodation
              </h2>
              <div className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Car className="h-5 w-5" /> Car Rental
              </h2>
              <div className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" /> Daily Itinerary
              </h2>
              {tripPlan.itinerary.map((day, index) => (
                <Card key={index} className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Day {day.day}: {safeFormatDate(day.date, "EEEE, MMMM d")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {day.items.map((item) => (
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" /> Save Trip
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { Calendar } from "lucide-react";
