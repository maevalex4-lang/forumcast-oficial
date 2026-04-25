export type UserStatus = 'online' | 'away' | 'offline';

export interface AppTheme {
  mode: 'light' | 'dark';
  color: string;
  style: 'modern' | '3d' | 'transparent';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  theme: AppTheme;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
}

export interface ChatMetadata {
  id: string;
  name?: string;
  type: 'private' | 'group';
  members: Record<string, 'owner' | 'admin' | 'member'>;
  memberProfiles?: Record<string, { name: string; avatar: string; status: UserStatus }>;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string; // Encrypted
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'nudge';
  metadata?: any;
  isEncrypted: boolean;
  expiresAt?: string;
  createdAt: string;
}
