'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, Clock, TrendingUp, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  modules: Module[];
  levels: string[];
}

interface Module {
  id: string;
  title: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  weeks: string;
}

const courses: Course[] = [
  {
    id: 'ai-engineering',
    title: 'AI Engineering',
    description: 'Master the fundamentals and advanced concepts of AI Engineering',
    duration: '4 weeks',
    levels: ['beginner', 'intermediate', 'advanced'],
    modules: [
      {
        id: 'python',
        title: 'Python Fundamentals',
        duration: '1 week',
        difficulty: 'beginner',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'machine-learning',
        title: 'Machine Learning',
        duration: '1 week',
        difficulty: 'intermediate',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'deep-learning',
        title: 'Deep Learning',
        duration: '1 week',
        difficulty: 'advanced',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'generative-ai',
        title: 'Generative AI',
        duration: '1 week',
        difficulty: 'advanced',
        progress: 0,
        weeks: '1 week',
      },
    ],
  },
  {
    id: 'aiml-engineering',
    title: 'AI/ML Engineering',
    description: 'Comprehensive AI and Machine Learning engineering course',
    duration: '4 weeks',
    levels: ['beginner', 'intermediate', 'advanced'],
    modules: [
      {
        id: 'python',
        title: 'Python Fundamentals',
        duration: '1 week',
        difficulty: 'beginner',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'machine-learning',
        title: 'Machine Learning',
        duration: '1 week',
        difficulty: 'intermediate',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'deep-learning',
        title: 'Deep Learning',
        duration: '1 week',
        difficulty: 'advanced',
        progress: 0,
        weeks: '1 week',
      },
      {
        id: 'mlops',
        title: 'MLOps & Deployment',
        duration: '2 weeks',
        difficulty: 'advanced',
        progress: 0,
        weeks: '2 weeks',
      },
    ],
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/20 text-green-400';
    case 'intermediate':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'advanced':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export default function LearningHubPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Learning Hub</h1>
          <p className="text-textSecondary">Choose a course and start your learning journey</p>
        </motion.div>

        {!selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="glass modern-card glow-border p-6 rounded-xl cursor-pointer"
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text">{course.title}</h2>
                      <p className="text-sm text-textSecondary">{course.duration}</p>
                    </div>
                  </div>
                </div>
                <p className="text-textSecondary mb-4">{course.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.levels.map((level) => (
                    <span
                      key={level}
                      className="px-2 py-1 rounded text-xs bg-card text-textSecondary capitalize"
                    >
                      {level}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Play className="w-4 h-4" />
                  <span>Start Learning</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="mb-6 text-primary hover:underline flex items-center gap-2"
            >
              ← Back to Courses
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold text-text mb-2">
                {selectedCourseData?.title}
              </h2>
              <p className="text-textSecondary">{selectedCourseData?.description}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCourseData?.modules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="glass modern-card glow-border p-6 rounded-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text mb-2">{module.title}</h3>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 text-textSecondary">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{module.weeks}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                            module.difficulty
                          )}`}
                        >
                          {module.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-textSecondary">Progress</span>
                      <span className="text-sm font-medium">{module.progress}%</span>
                    </div>
                    <div className="w-full bg-card rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${module.progress}%` }}
                        className="bg-primary h-2 rounded-full"
                      />
                    </div>
                  </div>

                  <Link href={`/learning/${selectedCourse}/${module.id}`}>
                    <button className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                      {module.progress > 0 ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Continue Learning
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Start Learning
                        </>
                      )}
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

