import { createClient } from "@supabase/supabase-js";

const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL as string;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY as string;

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_SECRET_KEY, {
	auth: { persistSession: false },
});
