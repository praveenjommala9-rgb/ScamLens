export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Answer = "phishing" | "legitimate" | "unsure";
export type SessionType = "baseline" | "training" | "final";
export type SessionStatus = "in_progress" | "completed";
export type Channel = "email" | "sms" | "chat" | "social" | "login";
export type Difficulty = "easy" | "medium" | "hard";
export type ProfileRole = "user" | "admin";

export const SCENARIO_CATEGORIES = [
  "Banking & Payment",
  "Account Takeover",
  "Delivery / Parcel",
  "Job & Recruitment",
  "Rewards & Promotions",
  "Impersonation",
  "Tech Support",
  "Password / Credential Reset",
] as const;
export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

export const RED_FLAG_VALUES = [
  "Urgency",
  "Suspicious link/domain",
  "Credential request",
  "Impersonation",
  "Threatening language",
  "Unusual sender",
  "Unrealistic reward",
  "Payment request",
] as const;
export type RedFlag = (typeof RED_FLAG_VALUES)[number];

export interface ProfileRow {
  id: string;
  full_name: string;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface ScenarioRow {
  id: string;
  title: string;
  channel: Channel;
  category: ScenarioCategory;
  difficulty: Difficulty;
  sender_name: string | null;
  sender_address: string | null;
  subject: string | null;
  body: string;
  displayed_url: string | null;
  correct_answer: Answer;
  red_flags: RedFlag[];
  explanation: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  type: SessionType;
  status: SessionStatus;
  total_questions: number;
  answered_questions: number;
  score: number | null;
  scenario_ids: string[];
  started_at: string;
  completed_at: string | null;
}

export interface AttemptRow {
  id: string;
  session_id: string;
  user_id: string;
  scenario_id: string;
  answer: Answer;
  selected_red_flags: RedFlag[];
  is_correct: boolean;
  response_time_ms: number;
  reflection_note: string | null;
  created_at: string;
}

export interface AiFeedbackRow {
  id: string;
  attempt_id: string;
  coaching_summary: string;
  what_you_did_well: string[];
  missed_signals: string[];
  next_rule: string;
  focus_category: ScenarioCategory;
  model: string;
  created_at: string;
}

type Table<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      scenarios: Table<ScenarioRow>;
      sessions: Table<SessionRow>;
      attempts: Table<AttemptRow>;
      ai_feedback: Table<AiFeedbackRow>;
    };
    Views: Record<string, never>;
    Functions: {
      submit_scam_attempt: {
        Args: {
          p_session_id: string;
          p_user_id: string;
          p_scenario_id: string;
          p_answer: Answer;
          p_selected_red_flags: Json;
          p_is_correct: boolean;
          p_response_time_ms: number;
          p_reflection_note: string | null;
        } & Record<string, unknown>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
