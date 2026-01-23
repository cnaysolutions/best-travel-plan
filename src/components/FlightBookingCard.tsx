import { ExternalLink, Plane, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateSkyscannerUrl } from "@/lib/priceEstimation";
import type { TripDetails } from "@/types/trip";

interface FlightBookingCardProps {
  tripDetails: TripDetails;
  isAmadeusSupported: boolean;
}

export function FlightBookingCard({ tripDetails, isAmadeusSupported }: FlightBookingCardProps) {
  // Check if we have all required data
  if (
    !tripDetails.departureLocation ||
    !tripDetails.destinationLocation ||
    !tripDetails.departureDate ||
    !tripDetails.returnDate
  ) {
    return null;
  }

  const bookingUrl = generateSkyscannerUrl(
    tripDetails.departureLocation.iataCode,
    tripDetails.destinationLocation.iataCode,
    tripDetails.departureDate,
    tripDetails.returnDate,
    tripDetails.passengers.adults,
    tripDetails.passengers.children,
    tripDetails.passengers.infants,
    tripDetails.flightClass
  );

  return (
    <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold">Book Your Flights</h3>
              {isAmadeusSupported ? (
                <Badge variant="default" className="bg-green-600">
                  Real-Time Prices Available
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Prices Shown are Estimates
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {isAmadeusSupported
                ? "Search and compare real-time flight prices from hundreds of airlines on Skyscanner."
                : "The prices shown above are AI-generated estimates. Click below to see real-time prices and book your flights on Skyscanner."}
            </p>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Tip:</strong> Book your flights 2-3 months in advance for the best prices. 
                Prices may vary based on availability and demand.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="shrink-0"
            onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Real Prices & Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
