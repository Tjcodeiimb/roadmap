// Hand-written to match supabase/migrations/0001_init.sql. If you use the
// Supabase CLI, `supabase gen types typescript` will regenerate an
// equivalent (more exhaustive) version of this file from the live schema.

export type Status = "todo" | "next" | "active" | "done";
export type ProjectStatus = "idea" | "in_progress" | "done";
export type ThemeName = "light" | "dark";
export type Role = "employee" | "admin";
export type Tier = "foundational" | "intermediate" | "advanced";
export type EnrollmentStatus = "active" | "archived";
export type ResourceStatus = "in_progress" | "done";
export type MediaProvider = "youtube" | "vimeo" | "external";
export type LinkStatus = "ok" | "broken" | "unchecked";

export interface Step {
  t: string;
  d: string;
}

export type Database = {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string;
          name: string;
          label: string;
          order_index: number;
          tier: Tier;
          summary: string;
          domain: string | null;
          estimated_hours: number | null;
          effort_per_week: string | null;
          icon_key: string | null;
          published: boolean;
        };
        Insert: {
          id: string;
          name: string;
          label: string;
          order_index?: number;
          tier?: Tier;
          summary?: string;
          domain?: string | null;
          estimated_hours?: number | null;
          effort_per_week?: string | null;
          icon_key?: string | null;
          published?: boolean;
        };
        Update: Partial<{
          id: string;
          name: string;
          label: string;
          order_index: number;
          tier: Tier;
          summary: string;
          domain: string | null;
          estimated_hours: number | null;
          effort_per_week: string | null;
          icon_key: string | null;
          published: boolean;
        }>;
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
          provider: MediaProvider | null;
          external_id: string | null;
          duration_seconds: number | null;
          embeddable: boolean;
          icon_key: string | null;
          link_status: LinkStatus;
          last_checked_at: string | null;
          created_at: string;
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
          provider?: MediaProvider | null;
          external_id?: string | null;
          duration_seconds?: number | null;
          embeddable?: boolean;
          icon_key?: string | null;
          link_status?: LinkStatus;
          last_checked_at?: string | null;
          created_at?: string;
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
          provider: MediaProvider | null;
          external_id: string | null;
          duration_seconds: number | null;
          embeddable: boolean;
          icon_key: string | null;
          link_status: LinkStatus;
          last_checked_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string;
          role: Role;
          theme: ThemeName;
          leaderboard_opt_in: boolean;
          onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          username?: string;
          role?: Role;
          theme?: ThemeName;
          leaderboard_opt_in?: boolean;
          onboarded?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          full_name: string | null;
          username: string;
          role: Role;
          theme: ThemeName;
          leaderboard_opt_in: boolean;
          onboarded: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };
      user_track_selection: {
        Row: {
          user_id: string;
          track_id: string;
          selected_at: string;
          status: EnrollmentStatus;
          source: string;
        };
        Insert: {
          user_id: string;
          track_id: string;
          selected_at?: string;
          status?: EnrollmentStatus;
          source?: string;
        };
        Update: Partial<{
          user_id: string;
          track_id: string;
          selected_at: string;
          status: EnrollmentStatus;
          source: string;
        }>;
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          name: string;
          label: string;
          summary: string;
          tier: Tier;
          order_index: number;
          icon_key: string | null;
          estimated_hours: number | null;
          published: boolean;
        };
        Insert: {
          id: string;
          name: string;
          label: string;
          summary?: string;
          tier?: Tier;
          order_index?: number;
          icon_key?: string | null;
          estimated_hours?: number | null;
          published?: boolean;
        };
        Update: Partial<{
          id: string;
          name: string;
          label: string;
          summary: string;
          tier: Tier;
          order_index: number;
          icon_key: string | null;
          estimated_hours: number | null;
          published: boolean;
        }>;
        Relationships: [];
      };
      cohort_courses: {
        Row: { cohort_id: string; track_id: string; order_index: number };
        Insert: { cohort_id: string; track_id: string; order_index?: number };
        Update: Partial<{ cohort_id: string; track_id: string; order_index: number }>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          name: string;
          domain: string;
          description: string;
          tier: Tier;
          icon_key: string | null;
          xp_reward: number;
          threshold: number;
        };
        Insert: {
          id: string;
          name: string;
          domain: string;
          description?: string;
          tier?: Tier;
          icon_key?: string | null;
          xp_reward?: number;
          threshold?: number;
        };
        Update: Partial<{
          id: string;
          name: string;
          domain: string;
          description: string;
          tier: Tier;
          icon_key: string | null;
          xp_reward: number;
          threshold: number;
        }>;
        Relationships: [];
      };
      skill_resources: {
        Row: { skill_id: string; resource_id: string };
        Insert: { skill_id: string; resource_id: string };
        Update: Partial<{ skill_id: string; resource_id: string }>;
        Relationships: [];
      };
      user_cohort_enrollment: {
        Row: { user_id: string; cohort_id: string; enrolled_at: string };
        Insert: { user_id: string; cohort_id: string; enrolled_at?: string };
        Update: Partial<{ user_id: string; cohort_id: string; enrolled_at: string }>;
        Relationships: [];
      };
      user_resource_progress: {
        Row: {
          user_id: string;
          resource_id: string;
          status: ResourceStatus;
          seconds_watched: number;
          last_position_seconds: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          resource_id: string;
          status?: ResourceStatus;
          seconds_watched?: number;
          last_position_seconds?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          resource_id: string;
          status: ResourceStatus;
          seconds_watched: number;
          last_position_seconds: number;
          completed_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      user_skills: {
        Row: {
          user_id: string;
          skill_id: string;
          unlocked_at: string;
          seen_at: string | null;
        };
        Insert: {
          user_id: string;
          skill_id: string;
          unlocked_at?: string;
          seen_at?: string | null;
        };
        Update: Partial<{
          user_id: string;
          skill_id: string;
          unlocked_at: string;
          seen_at: string | null;
        }>;
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
      // `doc` is jsonb and typed `unknown` on purpose: it forces every read
      // through normalizeResumeDoc() in src/lib/resume/types.ts rather than
      // letting callers assume a shape the database doesn't enforce.
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          doc: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          doc?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          title: string;
          doc: unknown;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      // Returns the ids of any skills this write unlocked, so the caller can
      // fire the unlock animation for exactly those.
      set_topic_status: {
        Args: { p_topic_id: string; p_status: Status };
        Returns: string[];
      };
      enroll_track: {
        Args: { p_track_id: string; p_source?: string };
        Returns: void;
      };
      unenroll_track: {
        Args: { p_track_id: string };
        Returns: void;
      };
      enroll_cohort: {
        Args: { p_cohort_id: string };
        Returns: void;
      };
      leave_cohort: {
        Args: { p_cohort_id: string };
        Returns: void;
      };
      set_resource_progress: {
        Args: {
          p_resource_id: string;
          p_position: number;
          p_watched: number;
          p_complete?: boolean;
        };
        Returns: string[];
      };
      complete_resource: {
        Args: { p_resource_id: string };
        Returns: string[];
      };
      ack_skills: {
        Args: { p_skill_ids: string[] | null };
        Returns: void;
      };
      evaluate_skills: {
        Args: { p_user_id: string };
        Returns: string[];
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
        Returns: { full_name: string | null; total_xp: number; is_you: boolean }[];
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
      search_catalog: {
        Args: { p_query: string };
        Returns: {
          type: "track" | "topic" | "resource" | "skill" | "cohort";
          id: string;
          parent_track_id: string | null;
          title: string;
          snippet: string | null;
          rank: number;
        }[];
      };
      get_trending_tracks: {
        Args: { p_days?: number; p_limit?: number };
        Returns: { track_id: string; completions: number }[];
      };
      update_username: {
        Args: { p_username: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
