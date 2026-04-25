import { useState } from 'react';
import { X, ShieldCheck, Palette, Layers, Bell, Cloud, Trash2, Globe, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { UserProfile } from '../../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';

interface SettingsProps {
  profile: UserProfile | null;
  onClose: () => void;
}

export default function Settings({ profile, onClose }: SettingsProps) {
  const { theme, updateTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'privacy' | 'theme' | 'general'>('privacy');

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  const toggle2FA = async () => {
    if (!profile) return;
    const userDoc = doc(db, 'users', profile.id);
    await updateDoc(userDoc, {
      twoFactorEnabled: !profile.twoFactorEnabled,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex h-[35rem]"
      >
        {/* Sidebar */}
        <div className="w-1/3 bg-slate-950/50 p-8 border-r border-white/5">
          <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Settings</h2>
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'privacy' ? 'bg-primary-accent text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <ShieldCheck size={20} />
              <span className="text-sm font-medium">Privacy & 2FA</span>
            </button>
            <button 
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'theme' ? 'bg-primary-accent text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Palette size={20} />
              <span className="text-sm font-medium">Appearance</span>
            </button>
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'general' ? 'bg-primary-accent text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Layers size={20} />
              <span className="text-sm font-medium">General</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-end p-4">
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-0">
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Security</h3>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><ShieldCheck size={20} /></div>
                      <div>
                        <p className="text-sm font-bold text-white">Two-Factor Authentication</p>
                        <p className="text-[11px] text-slate-500">Secure your account with 2FA</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggle2FA}
                      className={`w-12 h-6 rounded-full relative transition-colors ${profile?.twoFactorEnabled ? 'bg-green-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile?.twoFactorEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Data Management</h3>
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                         <div className="flex items-center gap-3">
                            <Cloud size={18} className="text-slate-400 group-hover:text-blue-400" />
                            <span className="text-sm text-slate-300">Cloud Backup Settings</span>
                         </div>
                         <Clock size={16} className="text-slate-600" />
                      </button>
                      <button className="w-full flex items-center justify-between p-4 bg-red-400/5 rounded-2xl hover:bg-red-400/10 transition-all group">
                         <div className="flex items-center gap-3">
                            <Trash2 size={18} className="text-red-400" />
                            <span className="text-sm text-red-400/80">Clear All Chat Data</span>
                         </div>
                      </button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-8">
                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Base Theme</h3>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => updateTheme({ mode: 'dark' })}
                        className={`p-4 rounded-2xl border transition-all ${theme.mode === 'dark' ? 'border-primary-accent bg-primary-accent/10' : 'border-white/5 bg-white/5'}`}
                      >
                         <Moon size={20} className="mb-2 text-slate-400" />
                         <p className="text-sm font-bold text-white">Dark Mode</p>
                      </button>
                      <button 
                        onClick={() => updateTheme({ mode: 'light' })}
                        className={`p-4 rounded-2xl border transition-all ${theme.mode === 'light' ? 'border-primary-accent bg-primary-accent/10' : 'border-white/5 bg-white/5'}`}
                      >
                         <Sun size={20} className="mb-2 text-slate-400" />
                         <p className="text-sm font-bold text-white">Light Mode</p>
                      </button>
                   </div>
                </div>

                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Accent Color</h3>
                   <div className="flex gap-3">
                      {colors.map(c => (
                        <button 
                          key={c}
                          onClick={() => updateTheme({ color: c })}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${theme.color === c ? 'border-white shadow-xl scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">UI Style</h3>
                   <div className="grid grid-cols-3 gap-3">
                      {['modern', '3d', 'transparent'].map(s => (
                        <button 
                          key={s}
                          onClick={() => updateTheme({ style: s as any })}
                          className={`p-3 rounded-xl border capitalize text-xs font-bold transition-all ${theme.style === s ? 'border-primary-accent bg-primary-accent/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}
                        >
                          {s}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'general' && (
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-300">Push Notifications</span>
                    </div>
                    <button className="text-[10px] uppercase font-bold text-primary-accent tracking-widest">Enabled</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-slate-400" />
                      <span className="text-sm text-slate-300">System Language</span>
                    </div>
                    <span className="text-xs text-slate-500">English</span>
                  </div>
               </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
