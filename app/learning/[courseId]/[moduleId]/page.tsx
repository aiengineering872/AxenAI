'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Play, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  completed: boolean;
}

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Introduction to Python',
    content: 'Python is a high-level, interpreted programming language...',
    completed: false,
  },
  {
    id: '2',
    title: 'Variables and Data Types',
    content: 'Learn about Python variables, strings, numbers, and more...',
    completed: false,
  },
  {
    id: '3',
    title: 'Control Flow',
    content: 'Master if statements, loops, and conditional logic...',
    completed: false,
  },
];

export default function ModulePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);

  const handleLessonComplete = () => {
    const updatedLessons = [...lessons];
    updatedLessons[currentLesson].completed = true;
    setLessons(updatedLessons);
  };

  const nextLesson = () => {
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };

  const prevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/learning"
            className="text-primary hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-xl"
        >
          <h1 className="text-3xl font-bold text-text mb-4">
            {lessons[currentLesson]?.title}
          </h1>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex-1 h-2 rounded ${
                    index === currentLesson
                      ? 'bg-primary'
                      : lesson.completed
                      ? 'bg-green-500'
                      : 'bg-card'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-textSecondary">
              Lesson {currentLesson + 1} of {lessons.length}
            </p>
          </div>

          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-textSecondary text-lg leading-relaxed">
              {lessons[currentLesson]?.content}
            </p>
          </div>

          {lessons[currentLesson]?.videoUrl && (
            <div className="mb-6 aspect-video bg-card rounded-lg flex items-center justify-center">
              <Play className="w-16 h-16 text-primary opacity-50" />
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-card">
            <button
              onClick={prevLesson}
              disabled={currentLesson === 0}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              {!lessons[currentLesson]?.completed && (
                <button
                  onClick={handleLessonComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}

              <button
                onClick={nextLesson}
                disabled={currentLesson === lessons.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quiz Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-xl"
        >
          <h2 className="text-2xl font-bold text-text mb-4">Practice Quiz</h2>
          <p className="text-textSecondary mb-4">
            Test your understanding with interactive quizzes
          </p>
          <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all">
            Start Quiz
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

