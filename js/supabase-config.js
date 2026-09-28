/**
 * NEXORA Tech E-Commerce - Supabase Configuration & Client
 * Project URL: https://mlhgxsdjigumwwiukxnu.supabase.co
 */

const SUPABASE_CONFIG = {
    url: 'https://mlhgxsdjigumwwiukxnu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGd4c2RqaWd1bXd3aXVreG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODk0OTIsImV4cCI6MjEwNjE2NTQ5Mn0.lnngXUgLL4buVXU0WsFEpPke4mmCdsuXtFOAjUSikiM',
    publishableKey: 'sb_publishable_wgSuagMRmJFWD3FM7_vihw_JOUT-1Sq'
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.supabaseClient = null;

function initSupabase() {
    if (window.supabaseClient) return window.supabaseClient;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('⚡ NEXORA: Supabase client connected successfully to project mlhgxsdjigumwwiukxnu');
        } catch (err) {
            console.warn('⚠️ NEXORA: Supabase init error:', err);
        }
    } else {
        console.warn('⚠️ NEXORA: Supabase SDK script not loaded yet.');
    }
    return window.supabaseClient;
}

// Initialize immediately if script tag already evaluated
initSupabase();

// Auto-run on DOM ready or window load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
}
window.addEventListener('load', initSupabase);

// Helper: Check if Supabase is connected and products table is available
async function checkSupabaseConnection() {
    const client = window.supabaseClient || initSupabase();
    if (!client) return { connected: false, error: 'Client not initialized' };

    try {
        const { data, error } = await client
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            return { connected: false, error: error.message };
        }
        return { connected: true, data };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}
