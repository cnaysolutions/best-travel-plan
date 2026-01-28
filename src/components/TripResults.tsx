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
                />
              )}

              {tripPlan.returnFlight && (
                <FlightBookingCard
                  flight={tripPlan.returnFlight}
                  passengers={tripDetails.passengers}
                  onToggle={() => onToggleItem("returnFlight", tripPlan.returnFlight!.id)}
                />
              )}
            </div>
          )}

          {/* Accommodation */}
          {tripPlan.hotel ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Accommodation
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base xs:text-lg mb-2 break-words">{tripPlan.hotel.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {tripPlan.hotel.rating && (
                          <p className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span> {tripPlan.hotel.rating} • {tripPlan.hotel.distance}
                          </p>
                        )}
                        {tripPlan.hotel.address && <p>{tripPlan.hotel.address}</p>}
                        {tripPlan.hotel.checkInDate && tripPlan.hotel.checkOutDate && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {safeFormatDate(tripPlan.hotel.checkInDate, "MMM d")} - {safeFormatDate(tripPlan.hotel.checkOutDate, "MMM d")}
                          </p>
                        )}
                        {tripPlan.hotel.mapUrl && (
                          <a href={tripPlan.hotel.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> View on Map
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start xs:items-end">
                      <p className="font-semibold text-xs xs:text-sm sm:text-base">
                        {safePrice(tripPlan.hotel.totalPrice)}
                      </p>
                      <a
                        href={`https://www.booking.com/searchresults.html?ss=${tripDetails.destinationCity}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 hover:underline font-semibold flex items-center text-xs mt-1 min-h-[32px] py-1 px-2 rounded transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" /> Book Now
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0"
                      onClick={() => onToggleItem("hotel", tripPlan.hotel!.id)}
                    >
                      {tripPlan.hotel.included ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Car Rental */}
          {tripPlan.carRental ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Car className="h-5 w-5" /> Car Rental
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base xs:text-lg mb-2 break-words">{tripPlan.carRental.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {tripPlan.carRental.company && <p>{tripPlan.carRental.company}</p>}
                        {tripPlan.carRental.pickupDate && tripPlan.carRental.dropoffDate && (
                          <div>
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Pickup: {safeFormatDate(tripPlan.carRental.pickupDate, "MMM d, HH:mm")}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Dropoff: {safeFormatDate(tripPlan.carRental.dropoffDate, "MMM d, HH:mm")}
                            </p>
                          </div>
                        )}
                        {tripPlan.carRental.mapUrl && (
                          <a href={tripPlan.carRental.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> View on Map
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start xs:items-end">
                      <p className="font-semibold text-xs xs:text-sm sm:text-base">
                        {safePrice(tripPlan.carRental.totalPrice)}
                      </p>
                      <a
                        href={`https://www.rentalcars.com/en/search?dropoffLocation=${tripDetails.destinationCity}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 hover:underline font-semibold flex items-center text-xs mt-1 min-h-[32px] py-1 px-2 rounded transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" /> Book Now
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0"
                      onClick={() => onToggleItem("carRental", tripPlan.carRental!.id)}
                    >
                      {tripPlan.carRental.included ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Daily Itinerary */}
          {tripPlan.itinerary && tripPlan.itinerary.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" /> Daily Itinerary
              </h2>
              {tripPlan.itinerary.map((day) => (
                <Card key={day.day}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Day {day.day}: {safeFormatDate(
                        new Date(
                          (tripDetails.departureDate as Date).getTime() +
                            (day.day - 1) * 24 * 60 * 60 * 1000
                        ),
                        "EEEE, MMM d"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.items?.map((item) => (
                      <div key={item.id} className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm xs:text-base">{item.time}</p>
                              <p className="text-sm text-gray-600">{item.title}</p>
                            </div>
                          </div>
                          {item.description && <p className="text-sm text-gray-600 mb-2 ml-6">{item.description}</p>}
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title} className="h-24 w-32 object-cover rounded mb-2 ml-6" />
                          )}
                          <div className="flex gap-2 ml-6">
                            {item.bookingUrl && (
                              <a
                                href={item.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-900 hover:underline font-semibold flex items-center text-xs mt-1 min-h-[32px] py-1 px-2 rounded transition-colors"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" /> Book Now
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
                            {safePrice(item.costPerPerson)}<span class=\"text-xs text-gray-500 ml-1\">/ person</span>
                          </p>
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
