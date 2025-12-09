
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = "https://hrhinypojencomgweew.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGlucHl5b2plbm9jbWd3ZWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDUzMjMsImV4cCI6MjA2NzI4MTMyM30.svo6OKlDpgAQnbM4UlsjKaYFT3NNwZB5zJDEKIidESk";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
