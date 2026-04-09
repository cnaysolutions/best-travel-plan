import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Clock, Plane } from "lucide-react";

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

    const formatDate = (date: Date | string  ): string => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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

    return `https://www.booking.com/flights/index.html?type=ROUNDTRIP&from=${fromCode}&to=${toCode}&depart_date=${depDate}&return_date=${retDate}&adults=${adults}&children=${children}&cabinclass=ECONOMY`;
  };

  return (
    <Card className="overflow-hidden border-border/40 hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 bg-background/80 backdrop-blur-sm">
      <CardContent className="p-4 xs:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Airline & price header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Plane className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm xs:text-base leading-tight break-words">
                  {flight.airline}
                </h3>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-blue-600 text-base xs:text-lg whitespace-nowrap">
                  {formatPrice(flight.pricePerPerson)}
                </p>
                {!totalPriceOnly && <span className="text-xs text-gray-500">per person</span>}
              </div>
            </div>

            {/* Flight details */}
            <div className="text-xs xs:text-sm text-gray-600 space-y-1.5 ml-[2.875rem]">
              {flight.departure && flight.arrival && (
                <p className="break-words font-medium text-foreground/80">
                  {flight.departure} &rarr; {flight.arrival}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {flight.departureTime && flight.arrivalTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {flight.departureTime} &ndash; {flight.arrivalTime}
                  </span>
                )}
                {flight.duration && (
                  <span className="text-gray-500">{flight.duration}</span>
                )}
                {flight.stops !== undefined && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${flight.stops === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
              {passengers && (
                <p className="text-xs text-gray-500">
                  {passengers.adults} adult{passengers.adults > 1 ? "s" : ""}
                  {passengers.children > 0 && `, ${passengers.children} child${passengers.children > 1 ? "ren" : ""}`}
                  {passengers.infants > 0 && `, ${passengers.infants} infant${passengers.infants > 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {/* Book now link */}
            <div className="ml-[2.875rem] mt-3">
              <a
                href={generateBookingLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
              >
                <ExternalLink className="h-3 w-3" /> Book Now
              </a>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl flex-shrink-0 hover:bg-gray-100 transition-colors"
            onClick={onToggle}
          >
            {flight.included ? (
              <Check className="h-4.5 w-4.5 text-emerald-500" />
            ) : (
              <X className="h-4.5 w-4.5 text-red-400" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
