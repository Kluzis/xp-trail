export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  age?: number;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  skin_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile extends User {}

export interface LevelThreshold {
  level: number;
  min_xp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  xp_reward: number;
  difficulty_level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  videos?: LessonVideo[];
  completed?: boolean;
}

export interface LessonVideo {
  id: string;
  lesson_id: string;
  title: string;
  video_url: string;
  duration_seconds?: number;
  sort_order: number;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  required_level: number;
  x_position: number;
  y_position: number;
  created_at: string;
  status?: 'locked' | 'available' | 'completed';
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  status: 'locked' | 'available' | 'completed';
  completed_at?: string;
  created_at: string;
  skill?: Skill;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  xp_earned: number;
  time_spent_seconds?: number;
  lesson?: Lesson;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'special';
  xp_reward: number;
  target_value?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed_at?: string;
  created_at: string;
  challenge?: Challenge;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  event_data: Record<string, any>;
  session_id?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  rank: number;
  tier: string;
}

export interface DashboardStats {
  totalXp: number;
  currentLevel: number;
  nextLevelXp: number;
  currentStreak: number;
  completedLessons: number;
  availableSkills: number;
  activeChallenges: number;
  rank: number;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
}

export interface SkinConfig {
  body_color: string;
  hair_style: string;
  hair_color: string;
  outfit: string;
  accessory?: string;
}

// Analytics Event Types
export type AnalyticsEventType = 
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'lesson_start'
  | 'lesson_complete'
  | 'video_start'
  | 'video_complete'
  | 'video_pause'
  | 'video_resume'
  | 'xp_awarded'
  | 'level_up'
  | 'skill_unlocked'
  | 'challenge_start'
  | 'challenge_complete'
  | 'leaderboard_view'
  | 'profile_edit'
  | 'skin_change'
  | 'daily_login'
  | 'streak_milestone'
  | 'page_view'
  | 'search'
  | 'share';

export interface AnalyticsEventData {
  event_name: AnalyticsEventType;
  properties?: Record<string, any>;
  session_id?: string;
  timestamp?: number;
}