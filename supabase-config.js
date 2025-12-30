// Supabase Configuration
(function() {
    const SUPABASE_URL = 'https://sylxsaquzuochdvonuzr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bHhzYXF1enVvY2hkdm9udXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzIyNDksImV4cCI6MjA4MTY0ODI0OX0.Y9Qh0qx_CB7RdkgvglpA5t6enoLSogiAC9l4ODYzEWY';

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
