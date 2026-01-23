import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Plane, Users, CalendarDays, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AirportAutocomplete, type Airport } from "@/components/AirportAutocomplete";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import type { TripDetails, FlightClass } from "@/types/trip";
import type { Location } from "@/types/location";

interface TripIntakeFormProps {
  onSubmit: (details: TripDetails) => void;
  isLoading?: boolean;
}

export function TripIntakeForm({ onSubmit, isLoading }: TripIntakeFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits, deductCredit, redirectToCheckout, isDeducting } = useCredits();
  
  const [departureInput, setDepartureInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [flightClass, setFlightClass] = useState<FlightClass>("economy");
  const [includeCarRental, setIncludeCarRental] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);

  // Inline error states for gentle feedback
  const [departureError, setDepartureError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);

  // Convert Airport to Location format for backward compatibility
  function airportToLocation(airport: Airport): Location {
    return {
      name: airport.name,
      iataCode: airport.iata_code,
      subType: 'AIRPORT',
      cityName: airport.city,
      countryCode: airport.country.substring(0, 2).toUpperCase(),
      countryName: airport.country,
      lat: airport.latitude || undefined,
      lon: airport.longitude || undefined,
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepartureError(null);
    setDestinationError(null);

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to plan your trip.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Validate airports are selected
    if (!departureAirport) {
      setDepartureError("Please select a departure airport from the suggestions.");
      return;
    }

    if (!destinationAirport) {
      setDestinationError("Please select a destination airport from the suggestions.");
      return;
    }

    // Check if user has credits
    if (credits !== null && credits <= 0) {
      toast({
        title: "No Credits Available",
        description: "You need credits to plan a trip. Purchase credits to continue.",
        variant: "destructive",
      });
      redirectToCheckout();
      return;
    }

    // Try to deduct a credit
    const creditDeducted = await deductCredit();
    if (!creditDeducted) {
      toast({
        title: "Credit Deduction Failed",
        description: "Unable to deduct credit. Please purchase more credits.",
        variant: "destructive",
      });
      redirectToCheckout();
      return;
    }

    // Convert airports to Location format for backward compatibility
    const departureLocation = airportToLocation(departureAirport);
    const destinationLocation = airportToLocation(destinationAirport);

    // Submit trip details
    onSubmit({
      departureCity: `${departureAirport.city} (${departureAirport.iata_code})`,
      destinationCity: `${destinationAirport.city} (${destinationAirport.iata_code})`,
      departureLocation,
      destinationLocation,
      departureDate,
      returnDate,
      passengers: { adults, children, infants },
      flightClass,
      includeCarRental,
      includeHotel,
    });
  };

  const handleDepartureAirportSelect = (airport: Airport) => {
    setDepartureAirport(airport);
    setDepartureError(null);
  };

  const handleDestinationAirportSelect = (airport: Airport) => {
    setDestinationAirport(airport);
    setDestinationError(null);
  };

  // Clear airport and error when input changes manually
  const handleDepartureInputChange = (value: string) => {
    setDepartureInput(value);
    setDepartureError(null);
    if (departureAirport && value !== formatAirportDisplay(departureAirport)) {
      setDepartureAirport(null);
    }
  };

  const handleDestinationInputChange = (value: string) => {
    setDestinationInput(value);
    setDestinationError(null);
    if (destinationAirport && value !== formatAirportDisplay(destinationAirport)) {
      setDestinationAirport(null);
    }
  };

  function formatAirportDisplay(airport: Airport): string {
    return `${airport.city} (${airport.iata_code}) - ${airport.name}`;
  }

  const PassengerControl = ({
    label,
    sublabel,
    value,
    onChange,
    min = 0,
  }: {
    label: string;
    sublabel: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-8 w-8 rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-display text-xl">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const flightClasses: { value: FlightClass; label: string }[] = [
    { value: "economy", label: "Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
  ];

  // Form is valid when airports are selected and dates are set
  const isFormValid =
    Boolean(departureAirport) &&
    Boolean(destinationAirport) &&
    Boolean(departureDate) &&
    Boolean(returnDate) &&
    adults > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Destination Section */}
      <Card variant="premium" className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Plane className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Where would you like to go?</CardTitle>
              <CardDescription>Search from 6,000+ airports worldwide</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Airport</Label>
              <AirportAutocomplete
                id="departure"
                value={departureInput}
                onChange={handleDepartureInputChange}
                onAirportSelect={handleDepartureAirportSelect}
                selectedAirport={departureAirport}
                placeholder="Search airports (e.g., JFK, London, Dubai)..."
              />
              {departureError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {departureError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Airport</Label>
              <AirportAutocomplete
                id="destination"
                value={destinationInput}
                onChange={handleDestinationInputChange}
                onAirportSelect={handleDestinationAirportSelect}
                selectedAirport={destinationAirport}
                placeholder="Search airports (e.g., LAX, Paris, Tokyo)..."
              />
              {destinationError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {destinationError}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates Section */}
      <Card variant="premium" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>When are you traveling?</CardTitle>
              <CardDescription>Choose your departure and return dates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDate || undefined}
                    onSelect={(date) => setDepartureDate(date || null)}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Return Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate || undefined}
                    onSelect={(date) => setReturnDate(date || null)}
                    disabled={(date) => {
                      const minDate = departureDate || new Date();
                      return date < minDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passengers Section */}
      <Card variant="premium" className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <CardTitle>Who's traveling?</CardTitle>
              <CardDescription>Add passengers and select cabin class</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <PassengerControl
              label="Adults"
              sublabel="Age 12+"
              value={adults}
              onChange={setAdults}
              min={1}
            />
            <PassengerControl
              label="Children"
              sublabel="Age 2-11"
              value={children}
              onChange={setChildren}
            />
            <PassengerControl
              label="Infants"
              sublabel="Under 2"
              value={infants}
              onChange={setInfants}
            />
          </div>

          <div className="space-y-2">
            <Label>Cabin Class</Label>
            <div className="grid grid-cols-3 gap-2">
              {flightClasses.map((fc) => (
                <Button
                  key={fc.value}
                  type="button"
                  variant={flightClass === fc.value ? "default" : "outline"}
                  onClick={() => setFlightClass(fc.value)}
                  className="w-full"
                >
                  {fc.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full text-lg h-14"
        disabled={!isFormValid || isLoading || isDeducting}
      >
        {isLoading || isDeducting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Planning your trip...
          </>
        ) : (
          <>
            <Plane className="mr-2 h-5 w-5" />
            Plan My Trip
          </>
        )}
      </Button>
    </form>
  );
}
