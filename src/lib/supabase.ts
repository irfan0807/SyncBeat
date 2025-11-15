import { createClient } from "@supabase/supabase-js";

// Use environment variables with fallback for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrrlvtfgunlmrrgvbcyv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxycmx2dGZndW5sbXJyZ3ZiY3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTEwNjMsImV4cCI6MjA2NzI2NzA2M30.heHBBg_gBRfCpjZnPkw3ZpUU5YK0DdpDa6JIgfvwWXQ';

// Create Supabase client synchronously
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});



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