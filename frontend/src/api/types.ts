export type UserRole = "admin" | "soc_analyst" | "employee";

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserBrief {
  id: string;
  full_name: string;
  email: string;
}

export interface MessageOut {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationSummary {
  user_id: string;
  full_name: string;
  email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface SharedFileOut {
  id: string;
  owner_id: string;
  recipient_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface FeedbackPostOut {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface FeedbackCommentOut {
  id: string;
  body: string;
  created_at: string;
}
