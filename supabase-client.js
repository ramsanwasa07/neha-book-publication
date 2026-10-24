/* ==========================================
   SUPABASE CONFIG
   Project URL aur anon (public) key yahan hain.
   Website ke live settings aur project plans
   yahan se fetch hote hain.
========================================== */

const SUPABASE_URL = "https://vrimaucqaugaugomyxeg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaW1hdWNxYXVnYXVnb215eGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTgzMjAsImV4cCI6MjEwNjA5NDMyMH0.BtbVxHR7PeOtLOqfbK6DjgH_Ep8h-WtS1kLqcRctiYQ";

let supabaseClient = null;

if (typeof supabase !== "undefined" && supabase.createClient) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn("Supabase initialization error:", e);
    }
}
