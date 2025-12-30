// Supabase Configuration
const SUPABASE_URL = 'https://sylxsaquzuochdvonuzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bHhzYXF1enVvY2hkdm9udXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTc1MzQsImV4cCI6MjA1MTE3MzUzNH0.sb_publishable_h4O8TJhTOrW1qFJRmBQTxA_8kliquBr';

// Initialize Supabase client using the global supabase object from CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally available
window.supabase = supabaseClient;
