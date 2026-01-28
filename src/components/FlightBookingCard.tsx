import { ExternalLink, Plane, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Flight } from "@/types/trip";

interface FlightBookingCardProps {
  totalPriceOnly?: boolean;
  flight: Flight | null | undefined;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  onToggle: () => void;
}

export function FlightBookingCard({ flight, passengers, onToggle, totalPriceOnly = false }: FlightBookingCardProps) {
  // If no flight data, don't render anything
  if (!flight) {
    return null;
  }

  // Safe price formatter
  const safePrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return "€0";
    }
    return `€${Math.round(Number(price)).toLocaleString()}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base xs:text-lg mb-2 break-words">
              {flight.airline || "Flight"}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              {flight.departure && flight.arrival && (
                <p className="font-medium text-gray-900">
                  {flight.departure} → {flight.arrival}
                </p>
              )}
              {flight.departureTime && flight.arrivalTime && (
                <p>
                  {flight.departureTime} - {flight.arrivalTime}
                </p>
              )}
              {flight.duration && (
                <p>Duration: {flight.duration}</p>
              )}
              {flight.stops !== undefined && (
                <p>
                  {flight.stops === 0 ? "Direct flight" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                </p>
              )}
              {passengers && (
                <p className="text-xs text-gray-500">
                  {passengers.adults} adult{passengers.adults > 1 ? "s" : ""}
                  {passengers.children > 0 && `, ${passengers.children} child${passengers.children > 1 ? "ren" : ""}`}
                  {passengers.infants > 0 && `, ${passengers.infants} infant${passengers.infants > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start xs:items-end gap-2">
            <p className="font-semibold text-base xs:text-lg">
              {safePrice(flight.price)}
            </p>
            {totalPriceOnly && <p className="text-xs text-gray-500">Total price</p>}
            <a
              href="https://www.booking.com/flights"
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
            onClick={onToggle}
          >
            {flight.included ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
