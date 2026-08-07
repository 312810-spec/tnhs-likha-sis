// Shared CORS headers for Supabase Edge Functions.
// Kept in a single _shared module so every function stays consistent.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
