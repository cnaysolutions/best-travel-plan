import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function updatePosition() {
      if (containerRef.current && isOpen) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('orientationchange', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('orientationchange', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setAirports([]);
      setIsOpen(false);
      return;
    }

    if (selectedAirport && value === formatAirportDisplay(selectedAirport)) {
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-airport-dropdown]')) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  function formatAirportDisplay(airport: Airport): string {
    return `${airport.city} (${airport.iata_code}) - ${airport.name}`;
  }

  function handleSelect(airport: Airport) {
    onChange(formatAirportDisplay(airport));
    onAirportSelect(airport);
    setIsOpen(false);
    setAirports([]);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }

  function handleItemClick(e: React.MouseEvent | React.TouchEvent, airport: Airport) {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(airport);
  }

  const DropdownContent = () => {
    if (!isOpen || (!airports.length && !error)) return null;

    return createPortal(
      <div
        data-airport-dropdown
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          maxHeight: '384px',
          overflow: 'hidden',
        }}
      >
        {error ? (
          <div style={{ padding: '12px', fontSize: '14px', color: '#dc2626' }}>{error}</div>
        ) : (
          <ul style={{ maxHeight: '384px', overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {airports.map((airport) => (
              <li key={airport.id}>
                <button
                  type="button"
                  onClick={(e) => handleItemClick(e, airport)}
                  onTouchEnd={(e) => handleItemClick(e, airport)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Plane style={{ height: '16px', width: '16px', color: '#d97706' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>
                        {airport.city}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: '#e5e7eb',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: '#374151',
                      }}>
                        {airport.iata_code}
                      </span>
                      {airport.is_amadeus_supported && (
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontWeight: 500,
                        }}>
                          Real Prices
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {airport.name}, {airport.country}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (airports.length > 0 && value.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            selectedAirport && "border-success"
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="search"
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

      <DropdownContent />
    </div>
  );
}