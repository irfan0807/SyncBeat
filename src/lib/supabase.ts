import { createClient, SupabaseClient } from "@supabase/supabase-js";
const supabaseUrl = 'https://lrrlvtfgunlmrrgvbcyv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxycmx2dGZndW5sbXJyZ3ZiY3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTEwNjMsImV4cCI6MjA2NzI2NzA2M30.heHBBg_gBRfCpjZnPkw3ZpUU5YK0DdpDa6JIgfvwWXQ'

// Create a fallback client even if env vars are missing
export const supabase = supabaseUrl && supabaseAnonKey ? await createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }):null;

    console.log(createClient(supabaseUrl, supabaseAnonKey));




// export function createSupabaseClient(
//   supabaseUrl: string,
//   supabaseAnonKey: string
// ): SupabaseClient {
//   if (!supabaseUrl || !supabaseAnonKey) {
//     throw new Error("Supabase URL or Anon Key is missing!");
//   }

//   const client = createClient(supabaseUrl, supabaseAnonKey);

//   console.log("✅ Supabase client initialized");
//   return client;
// }



// Database types
export interface DatabaseUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  last_seen: string;
  is_online: boolean;
}

export interface DatabaseRoom {
  id: string;
  name: string;
  host_id: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  max_members: number;
}

export interface DatabaseRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface DatabaseMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export interface DatabasePlaybackState {
  id: string;
  room_id: string;
  track_id?: string;
  track_name?: string;
  track_artist?: string;
  track_album?: string;
  track_image?: string;
  track_duration?: number;
  is_playing: boolean;
  position: number;
  updated_at: string;
}