// Supabase Configuration
(function() {
    const SUPABASE_URL = 'https://sylxsaquzuochdvonuzr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bHhzYXF1enVvY2hkdm9udXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTc1MzQsImV4cCI6MjA1MTE3MzUzNH0.sb_publishable_h4O8TJhTOrW1qFJRmBQTxA_8kliquBr';

    // Wait for the Supabase library to load
    function initSupabase() {
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            // Initialize Supabase client
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            // Make it globally available
            window.supabase = supabaseClient;
            console.log('Supabase initialized successfully');
        } else {
            // Retry after a short delay
            setTimeout(initSupabase, 100);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
})();
