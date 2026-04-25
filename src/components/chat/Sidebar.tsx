import { useState } from 'react';
import { User } from 'firebase/auth';
import { Search, Plus, MessageSquare, Users, Settings as SettingsIcon, LogOut, Moon, Sun, Monitor, Hash } from 'lucide-react';
import { ChatMetadata, UserProfile } from '../../types';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Settings from './Settings';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  user: User;
  profile: UserProfile | null;
  chats: ChatMetadata[];
  activeChatId?: string;
  onSelectChat: (chat: ChatMetadata) => void;
  onSignOut: () => void;
}

export default function Sidebar({ user, profile, chats, activeChatId, onSelectChat, onSignOut }: SidebarProps) {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, updateTheme } = useTheme();

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId || searchId === user.uid) return;

    setIsSearching(true);
    try {
      const userSnap = await getDocs(query(collection(db, 'users'), where('id', '==', searchId)));
      
      if (!userSnap.empty) {
        // Check if chat already exists
        const existingChat = chats.find(c => c.type === 'private' && c.members[searchId]);
        if (existingChat) {
          onSelectChat(existingChat);
        } else {
          // Create new chat
          await addDoc(collection(db, 'chats'), {
            type: 'private',
            members: {
              [user.uid]: 'owner',
              [searchId]: 'member'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        alert('User not found. Ensure the ID is exact.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
      setSearchId('');
    }
  };

  const toggleThemeMode = () => {
    updateTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' });
  };

  return (
    <>
      <div className="w-80 flex flex-col bg-slate-900 border-r border-white/5 relative z-20">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-accent flex items-center justify-center shadow-lg shadow-primary-accent/20">
                <MessageSquare className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tighter">Lumina</h1>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={toggleThemeMode}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {theme.mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>

          {/* Search by User ID */}
          <form onSubmit={handleSearchUser} className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search User ID..."
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-accent/30 border-t-primary-accent rounded-full animate-spin"></div>
              </div>
            )}
          </form>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-4 border-b border-white/5 mb-2">
          <button className="pb-3 text-sm font-medium border-b-2 border-primary-accent text-white">Chats</button>
          <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">Groups</button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-4 scrollbar-hide">
          {chats.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">No active chats</p>
            </div>
          ) : (
            chats.map(chat => {
              const isSelected = activeChatId === chat.id;
              const otherMemberId = Object.keys(chat.members).find(id => id !== user.uid);
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group relative",
                    isSelected ? "bg-white/10 ring-1 ring-white/10" : "hover:bg-white/5"
                  )}
                >
                  <div className="relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherMemberId || chat.id}`}
                      alt="Chat"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {chat.name || (otherMemberId ? `User ${otherMemberId.slice(0, 5)}` : 'Unnamed Chat')}
                      </h3>
                      <span className="text-[10px] text-slate-500">Just now</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-accent rounded-r-full"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Profile Bar */}
        <div className="p-4 bg-slate-950/50 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt="Me"
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10"
                />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-slate-950 rounded-full",
                  profile?.status === 'online' ? 'bg-green-500' : 'bg-amber-500'
                )}></div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{profile?.name || 'Loading...'}</p>
                <div className="flex items-center gap-1">
                   <p className="text-[10px] text-slate-500 font-mono truncate max-w-[80px]">
                    ID: {user.uid}
                  </p>
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(user.uid);
                        alert('Your ID copied to clipboard!');
                    }}
                    className="p-1 hover:bg-white/5 rounded text-[8px] text-slate-600 hover:text-white transition-all uppercase font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={onSignOut}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <Settings profile={profile} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
