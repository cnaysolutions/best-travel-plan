import { useState, useEffect, useRef } from "react";
import { Plane, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface Airport {
  id: number;
  airport_id: number | null;
  name: string;
  city: string;
  country: string;
  iata_code: string;
  icao_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_amadeus_supported: boolean;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAirportSelect: (airport: Airport) => void;
  placeholder?: string;
  id?: string;
  selectedAirport?: Airport | null;
}

export function AirportAutocomplete({
  value,
  onChange,
  onAirportSelect,
  placeholder = "Search airports...",
  id,
  selectedAirport,
}: AirportAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search for airports when input changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setAirports([]);
      setIsOpen(false);
      return;
    }

    // Don't search if we have a selected airport that matches input
    if (selectedAirport && value === formatAirportDisplay(selectedAirport)) {
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Search airports using full-text search
        const searchTerm = value.toLowerCase();
        
        const { data, error: searchError } = await supabase
          .from('airports')
          .select('*')
          .or(`iata_code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
          .order('is_amadeus_supported', { ascending: false })
          .order('city')
          .limit(50);

        if (searchError) throw searchError;

        setAirports(data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Airport search error:', err);
        setError('Unable to search airports');
        setAirports([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, selectedAirport]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function formatAirportDisplay(airport: Airport): string {
    return `${airport.city} (${airport.iata_code}) - ${airport.name}`;
  }

  function handleSelect(airport: Airport) {
    onChange(formatAirportDisplay(airport));
    onAirportSelect(airport);
    setIsOpen(false);
    setAirports([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            selectedAirport && "border-success"
          )}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : selectedAirport ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs font-mono text-success">{selectedAirport.iata_code}</span>
            </div>
          ) : (
            <Plane className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (airports.length > 0 || error) && (
        <div className="absolute z-[9999] mt-1 w-full rounded-lg border border-border bg-popover shadow-lg animate-fade-in max-h-96 overflow-hidden">
          {error ? (
            <div className="p-3 text-sm text-destructive">{error}</div>
          ) : (
            <ul className="max-h-96 overflow-auto py-1">
              {airports.map((airport) => (
                <li key={airport.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(airport)}
                    className="w-full px-3 py-2.5 text-left hover:bg-accent/10 focus:bg-accent/10 focus:outline-none transition-colors flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Plane className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {airport.city}
                        </span>
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {airport.iata_code}
                        </span>
                        {airport.is_amadeus_supported && (
                          <Badge variant="secondary" className="text-xs">
                            Real Prices
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {airport.name}, {airport.country}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
