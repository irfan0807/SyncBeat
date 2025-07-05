import {
  supabase,
  DatabaseUser,
  DatabaseRoom,
  DatabaseMessage,
  DatabasePlaybackState,
} from "../lib/supabase";
import { User, Room, Message, Track } from "../types";

export class DatabaseService {
  // User operations
  static async createUser(userData: {
    name: string;
    email?: string;
  }): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email || `${Date.now()}@temp.com`,
        password: Math.random().toString(36).substring(2, 15),
      });

      console.log("SignUp Data:", data);
      // console.error("SignUp Error:", error);

      if (error) throw error;

      return null;
    } catch (error: any) {
      console.error("Error creating user:", error.message || error);
      return null;
    }
  }

  static async updateUserOnlineStatus(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      await supabase
        .from("users")
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  static async getUser(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // avoids throwing on empty result
      console.log(data);

      if (error) {
        console.error("Supabase error (getUser):", error);
        return null;
      }

      return data ?? null;
    } catch (err) {
      console.error("Unexpected error in getUser:", err);
      return null;
    }
  }

  // Room operations
  static async createRoom(roomData: {
    id: string;
    name: string;
    hostId: string;
  }): Promise<DatabaseRoom | null> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          id: roomData.id,
          name: roomData.name,
          host_id: roomData.hostId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add host as room member
      await this.addRoomMember(roomData.id, roomData.hostId);

      return data;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  }

  static async getRoom(roomId: string): Promise<DatabaseRoom | null> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error getting room:", error);
      return null;
    }
  }

  static async updateRoomActivity(roomId: string): Promise<void> {
    try {
      await supabase
        .from("rooms")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", roomId);
    } catch (error) {
      console.error("Error updating room activity:", error);
    }
  }

  static async deactivateRoom(roomId: string): Promise<void> {
    try {
      await supabase
        .from("rooms")
        .update({ is_active: false })
        .eq("id", roomId);
    } catch (error) {
      console.error("Error deactivating room:", error);
    }
  }

  // Room member operations
  static async addRoomMember(roomId: string, userId: string): Promise<void> {
    try {
      await supabase.from("room_members").upsert({
        room_id: roomId,
        user_id: userId,
        is_active: true,
      });
    } catch (error) {
      console.error("Error adding room member:", error);
    }
  }

  static async removeRoomMember(roomId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from("room_members")
        .update({ is_active: false })
        .eq("room_id", roomId)
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error removing room member:", error);
    }
  }

  static async getRoomMembers(roomId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("room_members")
        .select(
          `
          user_id,
          joined_at,
          users (
            id,
            name,
            is_online,
            last_seen
          )
        `
        )
        .eq("room_id", roomId)
        .eq("is_active", true);

      if (error) throw error;

      return data.map((member) => ({
        id: member.user_id,
        name: member.users.name,
        socketId: member.user_id,
        joinedAt: new Date(member.joined_at).getTime(),
        isOnline: member.users.is_online,
        lastSeen: new Date(member.users.last_seen).getTime(),
      }));
    } catch (error) {
      console.error("Error getting room members:", error);
      return [];
    }
  }

  // Message operations
  static async saveMessage(messageData: {
    roomId: string;
    userId: string;
    content: string;
    messageType?: string;
  }): Promise<DatabaseMessage | null> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          room_id: messageData.roomId,
          user_id: messageData.userId,
          content: messageData.content,
          message_type: messageData.messageType || "text",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  }

  static async getRoomMessages(
    roomId: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          message_type,
          created_at,
          users (
            id,
            name
          )
        `
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data.map((msg) => ({
        id: msg.id,
        userId: msg.users.id,
        userName: msg.users.name,
        message: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        delivered: true,
        type: msg.message_type as "text" | "system",
      }));
    } catch (error) {
      console.error("Error getting room messages:", error);
      return [];
    }
  }

  // Playback state operations
  static async savePlaybackState(
    roomId: string,
    track: Track | null,
    isPlaying: boolean,
    position: number
  ): Promise<void> {
    try {
      await supabase.from("playback_state").upsert({
        room_id: roomId,
        track_id: track?.id,
        track_name: track?.name,
        track_artist: track?.artist,
        track_album: track?.album,
        track_image: track?.image,
        track_duration: track?.duration,
        is_playing: isPlaying,
        position: position,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving playback state:", error);
    }
  }

  static async getPlaybackState(roomId: string): Promise<{
    track: Track | null;
    isPlaying: boolean;
    position: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("playback_state")
        .select("*")
        .eq("room_id", roomId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      const track = data.track_id
        ? {
            id: data.track_id,
            name: data.track_name || "",
            artist: data.track_artist || "",
            album: data.track_album || "",
            image: data.track_image || "",
            duration: data.track_duration || 0,
            preview_url: "",
          }
        : null;

      return {
        track,
        isPlaying: data.is_playing,
        position: data.position,
      };
    } catch (error) {
      console.error("Error getting playback state:", error);
      return null;
    }
  }

  // Cleanup operations
  static async cleanupInactiveRooms(): Promise<void> {
    try {
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      await supabase
        .from("rooms")
        .update({ is_active: false })
        .lt("last_activity", oneDayAgo);
    } catch (error) {
      console.error("Error cleaning up inactive rooms:", error);
    }
  }

  static async cleanupOfflineUsers(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      await supabase
        .from("users")
        .update({ is_online: false })
        .lt("last_seen", oneHourAgo);
    } catch (error) {
      console.error("Error cleaning up offline users:", error);
    }
  }
}
