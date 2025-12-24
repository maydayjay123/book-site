// Configuration for Readers Paradise

// Database Configuration
const CONFIG = {
    // Set to 'local' for localStorage (development) or 'supabase' for production
    DB_MODE: 'local', // Change to 'supabase' when ready to deploy
    
    // Supabase Configuration (fill these in when ready)
    SUPABASE_URL: '', // Your Supabase project URL
    SUPABASE_ANON_KEY: '', // Your Supabase anon key
    
    // App Settings
    APP_NAME: 'Readers Paradise',
    VERSION: '2.0.0',
    
    // Image Upload Settings
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

// Check if we're using Supabase
const useSupabase = CONFIG.DB_MODE === 'supabase' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;

// Initialize Supabase client (if using Supabase)
let supabaseClient = null;
if (useSupabase && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

// Export for use in other files
window.CONFIG = CONFIG;
window.useSupabase = useSupabase;
window.supabaseClient = supabaseClient;

console.log('Database Mode:', CONFIG.DB_MODE);
console.log('Using Supabase:', useSupabase);
