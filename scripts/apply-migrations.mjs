import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://wpadifvbkmgnbwztcfli.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYWRpZnZia21nbmJ3enRjZmxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5NDA1MiwiZXhwIjoyMDgyMDcwMDUyfQ.uel1aVpEOp58ZOo8_lwBDdjkTnr5-ouj5I15eMEvEEs';

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // Try direct SQL execution via REST API
    const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!directResponse.ok) {
      const error = await directResponse.text();
      throw new Error(`SQL execution failed: ${error}`);
    }
  }

  return response.ok;
}

async function applyMigrations() {
  console.log('🚀 Starting database migrations...\n');

  // Read migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:\n`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  for (const file of files) {
    console.log(`📝 Applying: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    try {
      await executeSql(sql);
      console.log(`✅ Success: ${file}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`Error: ${error.message}\n`);
      // Continue with next migration
    }
  }

  console.log('🎉 Migration process complete!');
}

applyMigrations().catch(console.error);
