import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { ChatMetadata, UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatMain({ user }: { user: User }) {
  const [activeChat, setActiveChat] = useState<ChatMetadata | null>(null);
  const [chats, setChats] = useState<ChatMetadata[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Listen to user profile
    const userDoc = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setCurrentUserProfile(doc.data() as UserProfile);
      }
    });

    // Listen to user chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where(`members.${user.uid}`, 'in', ['owner', 'admin', 'member']),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMetadata));
      setChats(chatData);
    });

    // Set presence to online
    updateDoc(userDoc, { status: 'online', updatedAt: new Date().toISOString() });

    return () => {
      unsubscribeProfile();
      unsubscribeChats();
      // updateDoc(userDoc, { status: 'offline', updatedAt: new Date().toISOString() }); // Optionally handle offline
    };
  }, [user.uid]);

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 selection:bg-primary-accent/30 font-sans">
      <Sidebar 
        user={user} 
        profile={currentUserProfile}
        chats={chats} 
        activeChatId={activeChat?.id}
        onSelectChat={setActiveChat}
        onSignOut={handleSignOut}
      />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <ChatArea 
              key={activeChat.id}
              chat={activeChat} 
              currentUser={user} 
              profile={currentUserProfile}
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-32 h-32 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-primary-accent/20 blur-3xl rounded-full"></div>
                <svg className="w-16 h-16 text-primary-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Start a conversation</h2>
              <p className="text-slate-500 mt-2 max-w-sm">
                Select a chat from the sidebar or search for a user by their ID to begin a secure connection.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
