'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, FlaskConical, TrendingUp, Sparkles, Target, ArrowLeft, Brain, Cpu } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ChartSkeleton from '@/components/dashboard/ChartSkeleton';
import { learningProgressService } from '@/lib/services/learningProgressService';

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
    text: "Don't watch the clock; do what it does. Keep going.",
    author: 'Sam Levenson',
  },
];

const moduleConfigs: Record<string, { courseId: string; title: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  'ai-engineering': {
    courseId: 'ai-engineering',
    title: 'AI Engineering',
    icon: Brain,
    description: 'Master the fundamentals and advanced concepts of AI Engineering',
  },
  'aiml': {
    courseId: 'aiml-engineering',
    title: 'AIML',
    icon: Cpu,
    description: 'Comprehensive AI and Machine Learning engineering course',
  },
};

export default function DashboardContent() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { user, firebaseUser } = useAuth();
  const [quote, setQuote] = useState<Quote>(defaultQuote);
  const [aiTools, setAiTools] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<{ name: string; progress: number }[]>([]);
  const [completionData, setCompletionData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [modulesCompleted, setModulesCompleted] = useState(0);

  const moduleConfig = moduleConfigs[moduleId];

  useEffect(() => {
    if (!moduleConfig) return;
    pickLocalQuote();
    fetchAiTools();
    loadProgressData();

    // Refresh progress when window gains focus (user returns to tab)
    const handleFocus = () => {
      loadProgressData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [moduleConfig]);

  const loadProgressData = () => {
    if (!moduleConfig) return;

    const courseId = moduleConfig.courseId;
    
    // Get progress data for bar chart (defaults to 0 if no progress)
    const progress = learningProgressService.getDashboardProgressData(courseId);
    setProgressData(progress.length > 0 ? progress : [
      { name: 'Python', progress: 0 },
      { name: courseId === 'ai-engineering' ? 'ML' : 'Machine Learning', progress: 0 },
      { name: 'Deep Learning', progress: 0 },
      { name: courseId === 'ai-engineering' ? 'Generative AI' : 'MLOps', progress: 0 },
    ]);

    // Get completion status for pie chart
    const completion = learningProgressService.getCompletionStatus(courseId);
    setCompletionData(completion.length > 0 ? completion : [
      { name: 'Completed', value: 0, color: '#10b981' },
      { name: 'In Progress', value: 0, color: '#3b82f6' },
      { name: 'Not Started', value: 100, color: '#6b7280' },
    ]);

    // Calculate overall progress
    const overall = learningProgressService.getCourseProgress(courseId);
    setOverallProgress(overall);

    // Count completed modules (100% progress)
    const allModuleProgress = learningProgressService.getAllModuleProgress(courseId);
    const completed = allModuleProgress.filter(m => m.progress === 100).length;
    setModulesCompleted(completed);
  };

  const pickLocalQuote = () => {
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    setQuote(randomQuote);
  };

  const fetchAiTools = async () => {
    setAiTools([
      { name: 'GPT-4', category: 'LLM', trend: 'up' },
      { name: 'Claude 3', category: 'LLM', trend: 'up' },
      { name: 'LangChain', category: 'Framework', trend: 'up' },
      { name: 'TensorFlow 2.15', category: 'Framework', trend: 'stable' },
    ]);
  };

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

  if (!moduleConfig) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Module Not Found</h1>
            <p className="text-textSecondary mb-6">The module you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = moduleConfig.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/dashboard">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </motion.button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-display mb-2">
                {getGreeting()}
                {greetingSuffix}! 👋
              </h1>
              <p className="text-body">{moduleConfig.title} Dashboard</p>
            </div>
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
              <span className="text-2xl font-bold">{modulesCompleted}</span>
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
              <span className="text-2xl font-bold">{overallProgress}%</span>
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
            <h2 className="text-section mb-4">{moduleConfig.title} Module Progress</h2>
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
            <CompletionStatusChart data={completionData.length > 0 ? completionData : [
              { name: 'Completed', value: 0, color: '#10b981' },
              { name: 'In Progress', value: 0, color: '#3b82f6' },
              { name: 'Not Started', value: 100, color: '#6b7280' },
            ]} />
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

