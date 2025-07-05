/*
  # Create users and rooms tables for SyncPlay

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, optional)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `last_seen` (timestamp)
      - `is_online` (boolean)
    
    - `rooms`
      - `id` (text, primary key) - room code
      - `name` (text)
      - `host_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `last_activity` (timestamp)
      - `is_active` (boolean)
      - `max_members` (integer)
    
    - `room_members`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key)
      - `user_id` (uuid, foreign key)
      - `joined_at` (timestamp)
      - `is_active` (boolean)
    
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key)
      - `user_id` (uuid, foreign key)
      - `content` (text)
      - `message_type` (text)
      - `created_at` (timestamp)
    
    - `playback_state`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key)
      - `track_id` (text)
      - `track_name` (text)
      - `track_artist` (text)
      - `track_album` (text)
      - `track_image` (text)
      - `track_duration` (integer)
      - `is_playing` (boolean)
      - `position` (integer)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT false
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  max_members integer DEFAULT 10
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);

-- Playback state table
CREATE TABLE IF NOT EXISTS playback_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  track_id text,
  track_name text,
  track_artist text,
  track_album text,
  track_image text,
  track_duration integer,
  is_playing boolean DEFAULT false,
  position integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_state ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Anyone can read active rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

-- Room members policies
CREATE POLICY "Room members can read room membership"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = room_members.room_id 
      AND rm.user_id = auth.uid() 
      AND rm.is_active = true
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Room members can read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = messages.room_id 
      AND rm.user_id = auth.uid() 
      AND rm.is_active = true
    )
  );

CREATE POLICY "Room members can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = messages.room_id 
      AND rm.user_id = auth.uid() 
      AND rm.is_active = true
    )
  );

-- Playback state policies
CREATE POLICY "Room members can read playback state"
  ON playback_state
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = playback_state.room_id 
      AND rm.user_id = auth.uid() 
      AND rm.is_active = true
    )
  );

CREATE POLICY "Room host can update playback state"
  ON playback_state
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = playback_state.room_id 
      AND r.host_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_playback_state_room_id ON playback_state(room_id);