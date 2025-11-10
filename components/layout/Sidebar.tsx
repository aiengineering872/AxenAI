'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  BookOpen,
  Code,
  FlaskConical,
  MessageSquare,
  Compass,
  Settings,
  LogOut,
  Sparkles,
  Trophy,
  Award,
  Video,
  FileText,
  UserRound,
  Key,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { useTheme } from '@/contexts/ThemeContext';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Learning Hub', path: '/learning' },
  { icon: Code, label: 'Code Simulator', path: '/simulator' },
  { icon: FlaskConical, label: 'Project Lab', path: '/projects' },
  { icon: MessageSquare, label: 'AI Mentor', path: '/mentor' },
  { icon: Compass, label: 'Career Compass', path: '/career' },
  { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  { icon: Award, label: 'Certificates', path: '/certificates' },
  { icon: Video, label: 'Videos', path: '/videos' },
  { icon: FileText, label: 'Practice Tests', path: '/practice-tests' },
  { icon: UserRound, label: 'Resume Builder', path: '/resume-builder' },
  { icon: Key, label: 'API Integration', path: '/api-integration' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, firebaseUser, isAdmin } = useAuth();
  
  // useTheme now returns defaults if provider not available
  const { currentTheme } = useTheme();

  const handleLogout = async () => {
    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured.');
      }

      const { logout } = await import('@/lib/firebase/auth');
      await logout();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/auth/login';
    }
  };

  const getThemeStyles = () => {
    // Always use dark midnight theme
    return 'bg-card border-r border-primary/20 relative z-10';
  };

  return (
    <motion.aside
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className={`w-64 min-h-screen ${getThemeStyles()} transition-theme hidden md:block`}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AXEN
          </h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            if (!Icon) {
              console.error(`[Sidebar] Icon is undefined for menu item: "${item.label}"`);
              return null;
            }
            
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary shadow-glow'
                      : 'text-textSecondary hover:text-text hover:bg-card/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin">
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-primary/20 text-primary shadow-glow'
                    : 'text-textSecondary hover:text-text hover:bg-card/50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Admin Panel</span>
              </motion.div>
            </Link>
          )}
        </nav>

        <div className="mt-8 pt-8 border-t border-card">
          {(user || firebaseUser) && (
            <div className="mb-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                {user?.photoURL || firebaseUser?.photoURL ? (
                  <img
                    src={user?.photoURL || firebaseUser?.photoURL}
                    alt={user?.displayName || firebaseUser?.displayName || 'User avatar'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    {(user?.displayName ||
                      firebaseUser?.displayName ||
                      user?.email ||
                      firebaseUser?.email ||
                      'U')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {user?.displayName ||
                      firebaseUser?.displayName ||
                      user?.email ||
                      firebaseUser?.email ||
                      ''}
                  </p>
                  <p className="text-xs text-textSecondary">Level {user?.level || 1}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-textSecondary hover:text-text hover:bg-card/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

