'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Cpu } from 'lucide-react';
import Link from 'next/link';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

const learningModules: LearningModule[] = [
  {
    id: 'ai-engineering',
    title: 'AI Engineering',
    description: 'Master the fundamentals and advanced concepts of AI Engineering. Build real-world AI applications and systems.',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'aiml',
    title: 'AIML',
    description: 'Comprehensive AI and Machine Learning engineering course. Learn ML algorithms, deep learning, and MLOps.',
    icon: Cpu,
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
  },
];

export default function DashboardHomePage() {
  const { user, firebaseUser } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayNameCandidates = [
    user?.displayName,
    firebaseUser?.displayName,
    user?.email?.split('@')[0],
    firebaseUser?.email?.split('@')[0],
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  const resolvedName = displayNameCandidates[0] ?? '';
  const greetingName = resolvedName.split(' ')[0] || resolvedName;
  const greetingSuffix = greetingName ? `, ${greetingName}` : '';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:text-left"
        >
          <h1 className="text-display mb-2">
            {getGreeting()}
            {greetingSuffix}! 👋
          </h1>
          <p className="text-body text-lg">Choose a learning module to view your dashboard</p>
        </motion.div>

        {/* Learning Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {learningModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={module.id} href={`/dashboard/${module.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className={`glass modern-card glow-border p-8 rounded-xl cursor-pointer transition-all relative overflow-hidden group ${module.gradient}`}
                >
                  {/* Background Gradient Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" />
                    </div>

                    <h2 className="text-2xl font-bold text-text mb-3">{module.title}</h2>
                    <p className="text-textSecondary mb-6 leading-relaxed">{module.description}</p>

                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>View Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-section">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-text">{user?.level || 1}</p>
              <p className="text-caption">Current Level</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-text">{user?.xp || 0}</p>
              <p className="text-caption">Total XP</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-text">2</p>
              <p className="text-caption">Learning Modules</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

