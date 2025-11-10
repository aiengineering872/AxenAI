'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, FlaskConical, TrendingUp, Sparkles, Target } from 'lucide-react';
import ChartSkeleton from '@/components/dashboard/ChartSkeleton';

const ModuleProgressChart = dynamic(
  () => import('@/components/dashboard/ModuleProgressChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

const CompletionStatusChart = dynamic(
  () => import('@/components/dashboard/CompletionStatusChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

interface Quote {
  text: string;
  author: string;
}

const defaultQuote: Quote = {
  text: 'The future belongs to those who learn more skills and combine them in creative ways.',
  author: 'Robert Greene',
};

const inspirationalQuotes: Quote[] = [
  defaultQuote,
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    text: 'Learning never exhausts the mind.',
    author: 'Leonardo da Vinci',
  },
  {
    text: 'The expert in anything was once a beginner.',
    author: 'Helen Hayes',
  },
  {
    text: 'Don’t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
  },
];

export default function DashboardPage() {
  const { user, firebaseUser } = useAuth();
  const [quote, setQuote] = useState<Quote>(defaultQuote);
  const [aiTools, setAiTools] = useState<any[]>([]);

  useEffect(() => {
    // Load motivational quote locally to avoid external API failures
    pickLocalQuote();
    // Fetch AI tools feed
    fetchAiTools();
  }, []);

  const pickLocalQuote = () => {
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    setQuote(randomQuote);
  };

  const fetchAiTools = async () => {
    // Mock AI tools data - in production, integrate with actual API
    setAiTools([
      { name: 'GPT-4', category: 'LLM', trend: 'up' },
      { name: 'Claude 3', category: 'LLM', trend: 'up' },
      { name: 'LangChain', category: 'Framework', trend: 'up' },
      { name: 'TensorFlow 2.15', category: 'Framework', trend: 'stable' },
    ]);
  };

  const progressData = [
    { name: 'Python', progress: 75 },
    { name: 'ML', progress: 60 },
    { name: 'Deep Learning', progress: 40 },
    { name: 'Generative AI', progress: 30 },
  ];

  const completionData = [
    { name: 'Completed', value: 45, color: '#10b981' },
    { name: 'In Progress', value: 30, color: '#3b82f6' },
    { name: 'Not Started', value: 25, color: '#6b7280' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRank = (level: number) => {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Intermediate';
    if (level < 15) return 'Advanced';
    return 'Expert';
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
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-display mb-2">
              {getGreeting()}
              {greetingSuffix}! 👋
            </h1>
            <p className="text-body">Continue your AI engineering journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-body-strong">Rank: {getRank(user?.level || 1)}</span>
              </div>
            </div>
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-body-strong">{user?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">{user?.level || 1}</span>
            </div>
            <p className="text-caption">Level</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">4</span>
            </div>
            <p className="text-caption">Modules Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <FlaskConical className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">12</span>
            </div>
            <p className="text-caption">Projects Submitted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">85%</span>
            </div>
            <p className="text-caption">Overall Progress</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">Module Progress</h2>
            <ModuleProgressChart data={progressData} />
          </motion.div>

          {/* Completion Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">Completion Status</h2>
            <CompletionStatusChart data={completionData} />
          </motion.div>
        </div>

        {/* Quote and AI Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">Daily Inspiration</h2>
            <div>
              <p className="text-body italic mb-4">"{quote.text}"</p>
              <p className="text-caption">— {quote.author}</p>
            </div>
          </motion.div>

          {/* AI Tools Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">Latest AI Tools & Trends</h2>
            <div className="space-y-3">
              {aiTools.map((tool, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-card/50 rounded-lg hover:bg-card transition-all"
                >
                  <div>
                    <p className="text-body-strong">{tool.name}</p>
                    <p className="text-caption">{tool.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tool.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tool.trend === 'up' ? '↑ Trending' : 'Stable'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

