import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read airports.dat
const airportsData = fs.readFileSync(path.join(__dirname, '../airports.dat'), 'utf-8');
const lines = airportsData.trim().split('\n');

console.log(`Processing ${lines.length} airports...`);

// List of major hub airports that typically support Amadeus
// This is a curated list of major international airports
const amadeusHubIATACodes = new Set([
  // North America
  'ATL', 'LAX', 'ORD', 'DFW', 'DEN', 'JFK', 'SFO', 'SEA', 'LAS', 'MCO',
  'EWR', 'CLT', 'PHX', 'IAH', 'MIA', 'BOS', 'MSP', 'FLL', 'DTW', 'PHL',
  'LGA', 'BWI', 'SLC', 'SAN', 'DCA', 'MDW', 'TPA', 'PDX', 'STL', 'HNL',
  'YYZ', 'YVR', 'YUL', 'YYC', 'MEX', 'GDL', 'MTY', 'CUN',
  
  // Europe
  'LHR', 'CDG', 'AMS', 'FRA', 'MAD', 'BCN', 'FCO', 'MUC', 'IST', 'ZRH',
  'VIE', 'CPH', 'OSL', 'ARN', 'HEL', 'DUB', 'BRU', 'LIS', 'ATH', 'PRG',
  'WAW', 'BUD', 'OTP', 'SOF', 'VNO', 'RIX', 'TLL', 'MAN', 'EDI', 'GLA',
  'ORY', 'LGW', 'STN', 'LTN', 'BHX', 'NCL', 'LBA', 'BRS', 'MXP', 'VCE',
  'NAP', 'PMI', 'AGP', 'VLC', 'SVQ', 'BIO', 'OPO', 'FAO',
  
  // Asia Pacific
  'DXB', 'HND', 'NRT', 'ICN', 'SIN', 'HKG', 'PVG', 'PEK', 'CAN', 'CTU',
  'BKK', 'KUL', 'CGK', 'DEL', 'BOM', 'SYD', 'MEL', 'BNE', 'AKL', 'PER',
  'MNL', 'TPE', 'KIX', 'NGO', 'FUK', 'CTS', 'SHA', 'SZX', 'XIY', 'CKG',
  'HGH', 'NKG', 'WUH', 'CSX', 'KMG', 'TAO', 'XMN', 'SHE', 'DLC', 'HRB',
  'HAN', 'SGN', 'RGN', 'CMB', 'DAC', 'KTM', 'CCU', 'MAA', 'HYD', 'BLR',
  'AMD', 'COK', 'GOI', 'PNH', 'VTE', 'REP',
  
  // Middle East & Africa
  'DOH', 'AUH', 'CAI', 'JNB', 'CPT', 'DUR', 'NBO', 'ADD', 'LOS', 'ACC',
  'ALG', 'TUN', 'CMN', 'RAK', 'TLV', 'AMM', 'BEY', 'KWI', 'BAH', 'MCT',
  'RUH', 'JED', 'DMM',
  
  // South America
  'GRU', 'GIG', 'BSB', 'CGH', 'SDU', 'EZE', 'AEP', 'SCL', 'BOG', 'LIM',
  'UIO', 'GYE', 'PTY', 'SJO', 'SAL', 'GUA',
  
  // Australia & Oceania
  'ADL', 'CBR', 'OOL', 'DRW', 'HBA', 'CHC', 'WLG', 'ZQN', 'NAN', 'PPT'
]);

const sqlInserts = [];
let validCount = 0;

for (const line of lines) {
  // Parse CSV (handle quoted fields)
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  if (fields.length < 14) continue;

  const [
    airportId,
    name,
    city,
    country,
    iataCode,
    icaoCode,
    latitude,
    longitude,
    altitude,
    timezoneOffset,
    dst,
    timezoneName,
    airportType,
    dataSource
  ] = fields;

  // Skip if no IATA code (most important for flight booking)
  if (!iataCode || iataCode === '\\N' || iataCode.length !== 3) continue;

  // Check if this is an Amadeus-supported hub
  const isAmadeusSupported = amadeusHubIATACodes.has(iataCode);

  // Escape single quotes for SQL
  const escapeSql = (str) => str.replace(/'/g, "''");

  const values = [
    airportId === '\\N' ? 'NULL' : airportId,
    `'${escapeSql(name)}'`,
    `'${escapeSql(city)}'`,
    `'${escapeSql(country)}'`,
    `'${iataCode}'`,
    icaoCode === '\\N' ? 'NULL' : `'${icaoCode}'`,
    latitude === '\\N' ? 'NULL' : latitude,
    longitude === '\\N' ? 'NULL' : longitude,
    altitude === '\\N' ? 'NULL' : altitude,
    timezoneOffset === '\\N' ? 'NULL' : timezoneOffset,
    dst === '\\N' ? 'NULL' : `'${dst}'`,
    timezoneName === '\\N' ? 'NULL' : `'${escapeSql(timezoneName)}'`,
    airportType === '\\N' ? 'NULL' : `'${airportType}'`,
    dataSource === '\\N' ? 'NULL' : `'${dataSource}'`,
    isAmadeusSupported ? 'TRUE' : 'FALSE'
  ];

  sqlInserts.push(`(${values.join(', ')})`);
  validCount++;
}

console.log(`Valid airports with IATA codes: ${validCount}`);
console.log(`Amadeus-supported hubs: ${Array.from(amadeusHubIATACodes).length}`);

// Generate SQL file
const sqlContent = `-- Import airports data from OpenFlights.org
-- Generated on ${new Date().toISOString()}
-- Total airports: ${validCount}

INSERT INTO public.airports (
  airport_id, name, city, country, iata_code, icao_code,
  latitude, longitude, altitude, timezone_offset, dst,
  timezone_name, airport_type, data_source, is_amadeus_supported
) VALUES
${sqlInserts.join(',\n')}
ON CONFLICT (airport_id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  iata_code = EXCLUDED.iata_code,
  icao_code = EXCLUDED.icao_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  altitude = EXCLUDED.altitude,
  timezone_offset = EXCLUDED.timezone_offset,
  dst = EXCLUDED.dst,
  timezone_name = EXCLUDED.timezone_name,
  airport_type = EXCLUDED.airport_type,
  data_source = EXCLUDED.data_source,
  is_amadeus_supported = EXCLUDED.is_amadeus_supported;
`;

const outputPath = path.join(__dirname, '../supabase/migrations/20260122_import_airports_data.sql');
fs.writeFileSync(outputPath, sqlContent);

console.log(`✅ SQL file generated: ${outputPath}`);
console.log(`📊 Total INSERT statements: ${validCount}`);
