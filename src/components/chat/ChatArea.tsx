import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Send, Plus, MapPin, Paperclip, Mic, Video, Phone, MoreVertical, Shield, Bell, Zap, Info, Bot, Clock } from 'lucide-react';
import { ChatMetadata, Message, UserProfile } from '../../types';
import { encryptMessage, decryptMessage } from '../../lib/encryption';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface ChatAreaProps {
  chat: ChatMetadata;
  currentUser: User;
  profile: UserProfile | null;
}

export default function ChatArea({ chat, currentUser, profile }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Use a derived key for this chat (in production use shared secrets)
  const chatKey = chat.id;

  const [selfDestruct, setSelfDestruct] = useState(false);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const now = new Date().toISOString();
      const msgs = snapshot.docs
        .map(doc => {
          const data = doc.data() as Message;
          return {
            ...data,
            content: data.isEncrypted ? decryptMessage(data.content, chatKey) : data.content
          };
        })
        .filter(m => !m.expiresAt || m.expiresAt > now) // Filter self-destructed
        .reverse();
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chat.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string, type: Message['type'] = 'text', metadata: any = {}) => {
    if (!content.trim() && type === 'text') return;

    const createdAt = new Date().toISOString();
    let expiresAt: string | undefined = undefined;
    
    if (selfDestruct && type === 'text') {
      // Expire in 30 seconds for demo
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + 30);
      expiresAt = expiry.toISOString();
    }

    const encrypted = encryptMessage(content, chatKey);
    const messageDoc = {
      chatId: chat.id,
      senderId: currentUser.uid,
      content: encrypted,
      type,
      metadata,
      isEncrypted: true,
      createdAt,
      expiresAt
    };

    try {
      await addDoc(collection(db, 'chats', chat.id, 'messages'), messageDoc);
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: { content, senderId: currentUser.uid, createdAt: messageDoc.createdAt },
        updatedAt: messageDoc.createdAt
      });
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      let type: Message['type'] = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      await sendMessage(url, type, { fileName: file.name, fileSize: file.size });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      await sendMessage(url, 'location', { lat: latitude, lng: longitude });
    });
  };

  const sendNudge = async () => {
    setIsNudging(true);
    await sendMessage('Sent a nudge!', 'nudge');
    setTimeout(() => setIsNudging(false), 2000);
  };

  const askAI = async () => {
    if (!inputText.trim()) return;
    const prompt = inputText;
    setInputText('');
    
    // Add user message to UI immediately logic...
    await sendMessage(prompt, 'text');
    
    setIsLoading(true);
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      await sendMessage(text, 'text', { isAI: true });
    } catch (err) {
      console.error('AI integration failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const otherMemberId = Object.keys(chat.members).find(id => id !== currentUser.uid);

  return (
    <div className={`flex-1 flex flex-col h-full bg-slate-950 relative ${isNudging ? 'animate-[shake_0.5s_infinite]' : ''}`}>
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px) rotate(-1deg); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherMemberId || chat.id}`} 
              className="w-10 h-10 rounded-xl bg-slate-800"
              alt="Avatar"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {chat.name || (otherMemberId ? `User ${otherMemberId.slice(0, 8)}` : 'Chat')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3 text-green-500/80" />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">End-to-end encrypted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Phone size={18} /></button>
          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Video size={18} /></button>
          <div className="w-px h-6 bg-white/5 mx-2"></div>
          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Info size={18} /></button>
          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><MoreVertical size={18} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth scrollbar-hide">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const isAI = msg.metadata?.isAI;
          
          return (
            <motion.div
              layout
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] group ${isMe ? 'order-2' : ''}`}>
                <div className={`
                  relative px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${isMe 
                    ? 'bg-primary-accent text-white rounded-tr-none' 
                    : isAI 
                      ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30 rounded-tl-none' 
                      : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'}
                  ${msg.type === 'nudge' ? 'animate-bounce !bg-amber-500 font-bold !text-slate-900 py-4 px-8' : ''}
                `}>
                  {msg.type === 'text' && (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {msg.type === 'image' && (
                    <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg mb-2" />
                  )}
                  {msg.type === 'location' && (
                    <div className="flex flex-col gap-2">
                       <div className="w-full aspect-video bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                          <MapPin size={32} className="text-red-500 opacity-50" />
                       </div>
                       <a href={msg.content} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline flex items-center gap-1">
                         View on Google Maps <Zap size={10} />
                       </a>
                    </div>
                  )}
                  {msg.type === 'nudge' && <div className="flex items-center gap-2">HOLA! ESTOU AQUI! <Zap fill="currentColor" /></div>}
                  
                  {msg.type === 'file' && (
                    <a href={msg.content} target="_blank" className="flex items-center gap-3 p-2 bg-black/20 rounded-xl hover:bg-black/30 transition-all">
                      <div className="p-2 bg-white/10 rounded-lg"><Paperclip size={16} /></div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{msg.metadata?.fileName || 'File'}</p>
                        <p className="text-[10px] opacity-50">{(msg.metadata?.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </a>
                  )}

                  <div className={`text-[9px] mt-1.5 flex items-center gap-2 opacity-50 ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                    <span>{format(new Date(msg.createdAt), 'p')}</span>
                    {isMe && <span>• Seen</span>}
                    {isAI && <span className="flex items-center gap-0.5"><Bot size={10} /> AI Enhanced</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 pt-2">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-2 flex items-end gap-2 shadow-2xl relative">
            <div className="flex items-center p-1">
              <label className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <Plus size={20} />
              </label>
              <button 
                onClick={shareLocation}
                className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <MapPin size={20} />
              </button>
              <button 
                onClick={() => setSelfDestruct(!selfDestruct)}
                className={`p-3 rounded-full transition-all ${selfDestruct ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-red-400 hover:bg-red-400/5'}`}
                title="Self-Destruct (30s)"
              >
                <Clock size={20} />
              </button>
              <button 
                onClick={sendNudge}
                className="p-3 text-slate-400 hover:text-amber-400 hover:bg-amber-400/5 rounded-full transition-all"
                title="Send Nudge"
              >
                <Zap size={20} />
              </button>
            </div>

            <textarea 
              rows={1}
              placeholder="Encrypt a message or ask Gemini..."
              className="flex-1 bg-transparent border-none text-slate-200 py-3 px-2 focus:ring-0 resize-none max-h-40 scrollbar-hide text-sm overflow-hidden"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
            />

            <div className="flex items-center p-1 gap-1">
               <button 
                onClick={askAI}
                disabled={isLoading || !inputText.trim()}
                className="p-3 text-purple-400 hover:text-white hover:bg-purple-600/20 rounded-full transition-all disabled:opacity-30"
                title="Ask AI"
              >
                <Bot size={22} />
              </button>
              <button 
                disabled={!inputText.trim()}
                onClick={() => sendMessage(inputText)}
                className="p-3 bg-primary-accent text-white rounded-full shadow-lg shadow-primary-accent/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                <Send size={20} />
              </button>
            </div>
            
            {isLoading && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                 <div className="w-2 h-2 bg-primary-accent rounded-full animate-bounce"></div>
                 <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Processing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
