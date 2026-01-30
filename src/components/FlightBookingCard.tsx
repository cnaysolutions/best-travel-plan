import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink } from "lucide-react";

interface Flight {
  airline: string;
  pricePerPerson: number;
  departure?: string;
  arrival?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  stops?: number;
  included?: boolean;
}

interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

interface FlightBookingCardProps {
  flight: Flight;
  passengers?: Passengers;
  onToggle: () => void;
  totalPriceOnly?: boolean;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: Date | string;
  returnDate?: Date | string;
}

export function FlightBookingCard({ flight, passengers, onToggle, totalPriceOnly = false, departureAirport, arrivalAirport, departureDate, returnDate }: FlightBookingCardProps) {
  const formatPrice = (price: number) => {
    return `€${Math.round(price).toLocaleString()}`;
  };

  // Generate pre-filled Booking.com flights link
  const generateBookingLink = (): string => {
    if (!departureAirport || !arrivalAirport || !departureDate || !returnDate) {
      return "https://www.booking.com/flights/";
    }

    // Format dates as YYYY-MM-DD for Booking.com
    const formatDate = (date: Date | string  ): string => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
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

    // Booking.com flights URL with pre-filled search parameters
    return `https://www.booking.com/flights/index.html?type=ROUNDTRIP&from=${fromCode}&to=${toCode}&depart_date=${depDate}&return_date=${retDate}&adults=${adults}&children=${children}&cabinclass=ECONOMY`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-3 xs:p-4">
        <div className="flex items-start justify-between gap-2 xs:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm xs:text-base leading-tight break-words">
                {flight.airline}
              </h3>
              <p className="font-bold text-blue-700 text-sm xs:text-base whitespace-nowrap flex-shrink-0">
                {formatPrice(flight.pricePerPerson )}
                {!totalPriceOnly && <span className="text-xs text-gray-500 ml-1">/ person</span>}
              </p>
            </div>
            <div className="text-xs xs:text-sm text-gray-600 space-y-0.5">
              {flight.departure && flight.arrival && (
                <p className="break-words">
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
