import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://wpadifvbkmgnbwztcfli.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYWRpZnZia21nbmJ3enRjZmxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5NDA1MiwiZXhwIjoyMDgyMDcwMDUyfQ.uel1aVpEOp58ZOo8_lwBDdjkTnr5-ouj5I15eMEvEEs';

// List of major hub airports that support Amadeus
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

async function importAirports() {
  console.log('🚀 Starting airport import to Supabase...\n');

  // Read airports.dat
  const airportsData = fs.readFileSync(path.join(__dirname, '../airports.dat'), 'utf-8');
  const lines = airportsData.trim().split('\n');

  console.log(`📊 Processing ${lines.length} airports...`);

  const airports = [];

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

    // Skip if no IATA code
    if (!iataCode || iataCode === '\\N' || iataCode.length !== 3) continue;

    airports.push({
      airport_id: airportId === '\\N' ? null : parseInt(airportId),
      name: name,
      city: city,
      country: country,
      iata_code: iataCode,
      icao_code: icaoCode === '\\N' ? null : icaoCode,
      latitude: latitude === '\\N' ? null : parseFloat(latitude),
      longitude: longitude === '\\N' ? null : parseFloat(longitude),
      altitude: altitude === '\\N' ? null : parseInt(altitude),
      timezone_offset: timezoneOffset === '\\N' ? null : parseFloat(timezoneOffset),
      dst: dst === '\\N' ? null : dst,
      timezone_name: timezoneName === '\\N' ? null : timezoneName,
      airport_type: airportType === '\\N' ? null : airportType,
      data_source: dataSource === '\\N' ? null : dataSource,
      is_amadeus_supported: amadeusHubIATACodes.has(iataCode)
    });
  }

  console.log(`✅ Parsed ${airports.length} valid airports\n`);

  // Import in batches of 500
  const BATCH_SIZE = 500;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < airports.length; i += BATCH_SIZE) {
    const batch = airports.slice(i, i + BATCH_SIZE);
    console.log(`📤 Importing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(airports.length / BATCH_SIZE)} (${batch.length} airports)...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/airports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(batch)
      });

      if (response.ok) {
        imported += batch.length;
        console.log(`   ✅ Success (${imported}/${airports.length})`);
      } else {
        const error = await response.text();
        console.error(`   ❌ Failed: ${error}`);
        failed += batch.length;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed += batch.length;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 Import complete!');
  console.log(`✅ Successfully imported: ${imported} airports`);
  console.log(`❌ Failed: ${failed} airports`);
  console.log(`🌍 Amadeus-supported hubs: ${Array.from(amadeusHubIATACodes).length}`);
}

importAirports().catch(console.error);
