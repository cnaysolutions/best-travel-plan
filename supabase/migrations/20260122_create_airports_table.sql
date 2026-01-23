-- Create airports table
CREATE TABLE IF NOT EXISTS public.airports (
  id BIGSERIAL PRIMARY KEY,
  airport_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  iata_code TEXT,
  icao_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  altitude INTEGER,
  timezone_offset DOUBLE PRECISION,
  dst TEXT,
  timezone_name TEXT,
  airport_type TEXT,
  data_source TEXT,
  is_amadeus_supported BOOLEAN DEFAULT FALSE,
  search_text TEXT GENERATED ALWAYS AS (
    LOWER(name || ' ' || city || ' ' || country || ' ' || COALESCE(iata_code, '') || ' ' || COALESCE(icao_code, ''))
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_airports_iata ON public.airports(iata_code) WHERE iata_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airports_icao ON public.airports(icao_code) WHERE icao_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airports_city ON public.airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_country ON public.airports(country);
CREATE INDEX IF NOT EXISTS idx_airports_search_text ON public.airports USING gin(to_tsvector('english', search_text));

-- Enable Row Level Security
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read airports (public data)
CREATE POLICY "Allow public read access to airports"
  ON public.airports
  FOR SELECT
  TO public
  USING (true);

-- Add comment
COMMENT ON TABLE public.airports IS 'Global airports database from OpenFlights.org with 6,000+ airports';
