import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface ThemeContextType {
  theme: AppTheme;
  updateTheme: (newTheme: Partial<AppTheme>) => void;
}

const defaultTheme: AppTheme = {
  mode: 'dark',
  color: '#3b82f6',
  style: 'modern'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userDoc = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.theme) {
          setTheme(userData.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const updateTheme = async (newTheme: Partial<AppTheme>) => {
    const updated = { ...theme, ...newTheme };
    setTheme(updated);
    
    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, { 
        theme: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme.mode);
    root.style.setProperty('--primary-color', theme.color);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <div className={theme.mode === 'dark' ? 'dark' : ''} style={{ '--primary-accent': theme.color } as any}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
