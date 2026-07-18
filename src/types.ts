export enum ConfessionType {
  QUOTE = "QUOTE",
  FREE_TEXT = "FREE_TEXT",
  POETRY = "POETRY",
  PANTUN = "PANTUN",
  SONG_LYRIC = "SONG_LYRIC"
}

export enum EmotionType {
  SAD = "SAD",       // Sedih
  HAPPY = "HAPPY",   // Senang
  ANXIOUS = "ANXIOUS", // Cemas
  ANGRY = "ANGRY",   // Marah
  CALM = "CALM",     // Tenang
  TIRED = "TIRED"    // Lelah
}

export interface User {
  id: string;
  username: string;
  penName: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export interface TemplateStyle {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  fontClass: string;
  borderClass: string;
}

export interface Confession {
  id: string;
  userId: string;
  authorPenName: string;
  type: ConfessionType;
  title: string;
  encryptedContent: string; // The message encrypted client-side
  adminEncryptedContent?: string; // The message encrypted with Counselor key
  iv?: string; // Optional IV for crypto
  templateStyleId: string;
  cardSize: "SQUARE" | "PORTRAIT" | "LANDSCAPE";
  isAnonymousToAdmin: boolean;
  createdAt: string;
  aiReflection?: string; // Automatically generated comforting analysis by AI
  counselorResponse?: string; // Custom warm response from Guru BK
  counselorRepliedAt?: string;
}

export interface EmotionalLog {
  id: string;
  userId: string;
  emotion: EmotionType;
  intensity: number; // 1 to 5
  note: string; // optional user notes (unencrypted or encrypted, let's keep it simple)
  createdAt: string; // ISO string
}

export interface CounselingSession {
  id: string;
  userId: string;
  username: string;
  penName: string;
  scheduledAt: string; // Date string
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: string;
}
