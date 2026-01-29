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
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: Date | string;
  returnDate?: Date | string;
}

export function FlightBookingCard({ flight, passengers, onToggle, totalPriceOnly = false, departureAirport, arrivalAirport, departureDate, returnDate }: FlightBookingCardProps) {
  // If no flight data, don't render anything
  if (!flight) {
    return null;
  }

  // Calculate total price from pricePerPerson
  const totalPassengers = (passengers?.adults || 0) + (passengers?.children || 0);
  const totalPrice = (flight.pricePerPerson || 0) * totalPassengers;
  
  // Safe price formatter
  const safePrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return "€0";
    }
    return `€${Math.round(Number(price)).toLocaleString()}`;
  };

  // Generate pre-filled Booking.com flight link
  const generateBookingLink = (): string => {
    if (!departureAirport || !arrivalAirport || !departureDate || !returnDate) {
      return "https://www.booking.com/flights";
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date | string): string => {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Extract airport codes (e.g., "London (LGW)" -> "LGW")
    const extractCode = (airport: string): string => {
      const match = airport.match(/\(([A-Z]{3})\)/);
      return match ? match[1] : airport;
    };

    const fromCode = extractCode(departureAirport);
    const toCode = extractCode(arrivalAirport);
    const depDate = formatDate(departureDate);
    const retDate = formatDate(returnDate);
    const adults = passengers?.adults || 1;
    const children = passengers?.children || 0;

    // Booking.com flights URL format
    return `https://www.booking.com/flights/index.html?label=gen173nr-10EgdmbGlnaHRzIKgBAzgESB9YA2hRiAEBmAEJuAEXyAEM2AEB6AEB-AELiAIBqAIDuAKZgBjAAgHSAiQ0OGE5ZGNiZi1mOTY3LTRhNjMtOGI4Yy00ZjBiYjU2YjU2YjjYAgbgAgE&type=ROUNDTRIP&adults=${adults}&children=${children}&from=${fromCode}&to=${toCode}&depart_date=${depDate}&return_date=${retDate}&cabinClass=ECONOMY`;
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
              {safePrice(totalPrice)}
            </p>
            {totalPriceOnly && <p className="text-xs text-gray-500">Total price</p>}
            <a
              href={generateBookingLink()}
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
