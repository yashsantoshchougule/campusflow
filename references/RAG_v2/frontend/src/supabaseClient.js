import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("URL:", url)
console.log("KEY length:", key?.length)

export const supabase = createClient(url, key)