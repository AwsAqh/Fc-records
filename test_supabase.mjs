import { createClient } from '@supabase/supabase-js';

const url = 'https://dgwkghpkijkpcgwnnoqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnd2tnaHBraWprcGNnd25ub3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTkwMjksImV4cCI6MjEwMTIzNTAyOX0.KrCZC1EfQZh5p02ExW7eaBbje8PXxhGjJOzJ3YRhYeM';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('app_data')
    .select('id, user_id, updated_at')
    .order('updated_at', { ascending: false });
    
  console.log('Result:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

run();
