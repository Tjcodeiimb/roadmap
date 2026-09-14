// Hand-written to match supabase/migrations/0001_init.sql. If you use the
// Supabase CLI, `supabase gen types typescript` will regenerate an
// equivalent (more exhaustive) version of this file from the live schema.

export type Status = "todo" | "next" | "active" | "done";
export type ProjectStatus = "idea" | "in_progress" | "done";
export type ThemeName = "light" | "dark";
export type Role = "employee" | "admin";

export interface Step {
  t: string;
  d: string;
}

export type Database = {
  public: {
    Tables: {
      tracks: {
        Row: { id: string; name: string; label: string; order_index: number };
        Insert: { id: string; name: string; label: string; order_index?: number };
        Update: Partial<{ id: string; name: string; label: string; order_index: number }>;
        Relationships: [];
      };
      phases: {
        Row: {
          id: string;
          track_id: string;
          order_index: number;
          title: string;
          description: string;
          estimated_weeks: string | null;
          color: string | null;
        };
        Insert: {
          id: string;
          track_id: string;
          order_index?: number;
          title: string;
          description?: string;
          estimated_weeks?: string | null;
          color?: string | null;
        };
        Update: Partial<{
          id: string;
          track_id: string;
          order_index: number;
          title: string;
          description: string;
          estimated_weeks: string | null;
          color: string | null;
        }>;
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          phase_id: string;
          order_index: number;
          title: string;
          section: string | null;
          tags: string[];
          estimated_time: string | null;
          description: string;
          steps: Step[];
        };
        Insert: {
          id: string;
          phase_id: string;
          order_index?: number;
          title: string;
          section?: string | null;
          tags?: string[];
          estimated_time?: string | null;
          description?: string;
          steps?: Step[];
        };
        Update: Partial<{
          id: string;
          phase_id: string;
          order_index: number;
          title: string;
          section: string | null;
          tags: string[];
          estimated_time: string | null;
          description: string;
          steps: Step[];
        }>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          topic_id: string;
          order_index: number;
          title: string;
          url: string;
          source: string | null;
          format: string | null;
          length: string | null;
          note: string | null;
          icon: string | null;
        };
        Insert: {
          id: string;
          topic_id: string;
          order_index?: number;
          title: string;
          url: string;
          source?: string | null;
          format?: string | null;
          length?: string | null;
          note?: string | null;
          icon?: string | null;
        };
        Update: Partial<{
          id: string;
          topic_id: string;
          order_index: number;
          title: string;
          url: string;
          source: string | null;
          format: string | null;
          length: string | null;
          note: string | null;
          icon: string | null;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: Role;
          theme: ThemeName;
          leaderboard_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Role;
          theme?: ThemeName;
          leaderboard_opt_in?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          full_name: string | null;
          role: Role;
          theme: ThemeName;
          leaderboard_opt_in: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };
      user_track_selection: {
        Row: { user_id: string; track_id: string; selected_at: string };
        Insert: { user_id: string; track_id: string; selected_at?: string };
        Update: Partial<{ user_id: string; track_id: string; selected_at: string }>;
        Relationships: [];
      };
      user_progress: {
        Row: {
          user_id: string;
          topic_id: string;
          status: Status;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          status?: Status;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          topic_id: string;
          status: Status;
          completed_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      user_xp: {
        Row: { user_id: string; total_xp: number; level: number; updated_at: string };
        Insert: { user_id: string; total_xp?: number; level?: number; updated_at?: string };
        Update: Partial<{ user_id: string; total_xp: number; level: number; updated_at: string }>;
        Relationships: [];
      };
      user_streak: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_visit_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_visit_date?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_visit_date: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      spaced_repetition: {
        Row: {
          user_id: string;
          topic_id: string;
          next_review_date: string;
          interval_stage: number;
          ease: number;
          reps: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          next_review_date: string;
          interval_stage?: number;
          ease?: number;
          reps?: number;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          topic_id: string;
          next_review_date: string;
          interval_stage: number;
          ease: number;
          reps: number;
          updated_at: string;
        }>;
        Relationships: [];
      };
      build_projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: ProjectStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          status?: ProjectStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          title: string;
          status: ProjectStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_topic_status: {
        Args: { p_topic_id: string; p_status: Status };
        Returns: void;
      };
      review_topic: {
        Args: { p_topic_id: string; p_quality: number };
        Returns: void;
      };
      touch_streak: {
        Args: Record<string, never>;
        Returns: { current_streak: number; longest_streak: number }[];
      };
      get_leaderboard: {
        Args: Record<string, never>;
        Returns: { full_name: string | null; total_xp: number; current_streak: number }[];
      };
      get_admin_track_stats: {
        Args: Record<string, never>;
        Returns: {
          track_id: string;
          phase_id: string;
          phase_title: string;
          topic_count: number;
          completions: number;
        }[];
      };
      get_admin_roster: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: Role;
          created_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
