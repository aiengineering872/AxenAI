'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Circle, Menu, X } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import { learningProgressService } from '@/lib/services/learningProgressService';

interface Lesson {
  id: string;
  title: string;
  order?: number;
  completed: boolean;
}

interface ModuleSidebarProps {
  moduleId: string;
  courseId: string;
  currentLessonIndex: number;
  onLessonClick: (index: number) => void;
  moduleTitle?: string;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  moduleId,
  courseId,
  currentLessonIndex,
  onLessonClick,
  moduleTitle,
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const refreshLessons = async () => {
    if (!moduleId) return;

    try {
      setLoading(true);
      const firebaseLessons = await adminService.getLessons(moduleId);
      
      const lessonsWithProgress = firebaseLessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title || 'Untitled Lesson',
        order: lesson.order || 0,
        completed: learningProgressService.isLessonCompleted(
          courseId,
          moduleId,
          lesson.id
        ),
      }));

      // Sort by order
      lessonsWithProgress.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(lessonsWithProgress);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLessons();
  }, [moduleId, courseId]);

  // Refresh completion status when currentLessonIndex changes (lesson might have been completed)
  useEffect(() => {
    setLessons((prevLessons) => {
      if (prevLessons.length === 0) return prevLessons;
      
      return prevLessons.map((lesson) => ({
        ...lesson,
        completed: learningProgressService.isLessonCompleted(
          courseId,
          moduleId,
          lesson.id
        ),
      }));
    });
  }, [currentLessonIndex, courseId, moduleId]);

  const handleLessonClick = (index: number) => {
    onLessonClick(index);
    setIsMobileOpen(false); // Close mobile menu on click
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-card/50">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text text-sm">
            {moduleTitle || 'Module Lessons'}
          </h3>
        </div>
        <p className="text-xs text-textSecondary">
          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
        </p>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto flex-1 max-h-[calc(100vh-120px)]">
        {loading ? (
          <div className="p-4 text-center text-textSecondary text-sm">
            Loading lessons...
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-4 text-center text-textSecondary text-sm">
            No lessons available
          </div>
        ) : (
          lessons.map((lesson, index) => {
            const isActive = index === currentLessonIndex;
            const isCompleted = lesson.completed;

            return (
              <motion.button
                key={lesson.id}
                onClick={() => handleLessonClick(index)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm ${
                  isActive
                    ? 'bg-primary/20 text-primary shadow-glow'
                    : isCompleted
                    ? 'text-textSecondary hover:text-text hover:bg-card/50'
                    : 'text-textSecondary hover:text-text hover:bg-card/50'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="font-medium truncate flex-1">
                  {index + 1}. {lesson.title}
                </span>
              </motion.button>
            );
          })
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card/80 backdrop-blur-sm border border-card rounded-lg text-text hover:bg-card transition-all"
        aria-label="Toggle lesson menu"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-primary/20 relative z-10"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="md:hidden flex flex-col w-64 min-h-screen bg-card border-r border-primary/20 fixed left-0 top-0 z-50"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </>
  );
};

