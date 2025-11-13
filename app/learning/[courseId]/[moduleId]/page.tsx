'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  googleColabUrl?: string;
  completed: boolean;
}


export default function ModulePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load module info and lessons from Firebase
  useEffect(() => {
    const loadModuleAndLessons = async () => {
      try {
        setLoading(true);
        
        // Fetch module information to get the title
        const allModules = await adminService.getModules();
        const module = allModules.find((m: any) => m.id === moduleId);
        
        console.log('Looking for module with ID:', moduleId);
        console.log('All modules:', allModules);
        console.log('Found module:', module);
        
        if (module && module.title) {
          setModuleTitle(module.title);
          console.log('Set module title to:', module.title);
        } else {
          // Try to get module by courseId if not found by id
          const moduleByCourse = allModules.find((m: any) => 
            m.courseId === courseId && (m.id === moduleId || m.title?.toLowerCase().includes(moduleId.toLowerCase()))
          );
          if (moduleByCourse && moduleByCourse.title) {
            setModuleTitle(moduleByCourse.title);
            console.log('Set module title from course match:', moduleByCourse.title);
          } else {
            // Fallback: use moduleId if module not found
            setModuleTitle(moduleId);
            console.log('Using moduleId as fallback:', moduleId);
          }
        }
        
        // Fetch lessons for this module from Firebase
        console.log('Fetching lessons for moduleId:', moduleId);
        const firebaseLessons = await adminService.getLessons(moduleId);
        console.log('Fetched lessons:', firebaseLessons);
        
        if (firebaseLessons.length > 0) {
          // Lessons are already sorted by getLessons
          // Load saved progress for each lesson
          const lessonsWithProgress = firebaseLessons.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content || '',
            videoUrl: lesson.videoUrl,
            googleColabUrl: lesson.googleColabUrl,
            completed: learningProgressService.isLessonCompleted(courseId, moduleId, lesson.id),
          }));
          
          console.log('Lessons with progress:', lessonsWithProgress);
          setLessons(lessonsWithProgress);
        } else {
          // No lessons found, show empty state
          console.log('No lessons found for moduleId:', moduleId);
          setLessons([]);
        }
      } catch (error) {
        console.error('Error loading module and lessons:', error);
        setLessons([]);
        setModuleTitle(moduleId); // Fallback to moduleId
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && courseId) {
      loadModuleAndLessons();
    }
  }, [courseId, moduleId]);

  const handleLessonComplete = async () => {
    const currentLessonData = lessons[currentLesson];
    if (!currentLessonData) return;

    // Update local state
    const updatedLessons = [...lessons];
    updatedLessons[currentLesson].completed = true;
    setLessons(updatedLessons);

    // Save to storage
    await learningProgressService.saveLessonProgress(
      courseId,
      moduleId,
      currentLessonData.id,
      true
    );
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

  // Format content to convert asterisks to bullet points
  const formatContent = (content: string) => {
    if (!content) return null;

    // Split content by lines
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`para-${elements.length}`} className="text-text text-lg leading-relaxed mb-4" style={{ color: '#e2e8f0' }}>
            {currentParagraph.join(' ')}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-lg leading-relaxed" style={{ color: '#e2e8f0' }}>
                {item.trim()}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Check if line starts with "* " (asterisk followed by space)
      if (trimmedLine.startsWith('* ')) {
        flushParagraph();
        // Remove the "* " prefix and add to list
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === '') {
        // Empty line - flush both paragraph and list
        flushParagraph();
        flushList();
      } else {
        // Regular text line
        flushList();
        currentParagraph.push(trimmedLine);
      }
    });

    // Flush any remaining content
    flushParagraph();
    flushList();

    return elements.length > 0 ? elements : null;
  };

  const renderVideoContent = (url: string) => {
    if (!url) return null;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    const youtubeMatch = trimmedUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{11})/
    );

    if (youtubeMatch?.[1]) {
      const embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      return (
        <div className="mb-6 aspect-video">
          <iframe
            src={embedUrl}
            title="Lesson video"
            className="h-full w-full rounded-lg border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmedUrl)) {
      return (
        <div className="mb-6 aspect-video">
          <video
            controls
            playsInline
            className="h-full w-full rounded-lg bg-card object-cover"
            src={trimmedUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div className="mb-6 aspect-video">
        <iframe
          src={trimmedUrl}
          title="Lesson video"
          className="h-full w-full rounded-lg border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  };

  if (loading) {
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
          <div className="glass p-6 rounded-xl text-center">
            <p className="text-textSecondary">Loading module...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (lessons.length === 0) {
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
          <div className="glass p-6 rounded-xl">
            <h1 className="text-3xl font-bold text-text mb-4">{moduleTitle || 'Module'}</h1>
            <p className="text-textSecondary text-center py-8">No lessons available for this module yet. Please add lessons via the admin panel.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-text mb-2">{moduleTitle || 'Module'}</h1>
            <p className="text-textSecondary text-sm">Course: {courseId}</p>
          </div>
          
          <h2 className="text-2xl font-bold text-text mb-4 border-t border-card/50 pt-4">
            {lessons[currentLesson]?.title}
          </h2>

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
            {formatContent(lessons[currentLesson]?.content || '')}
          </div>

          {renderVideoContent(lessons[currentLesson]?.videoUrl || '')}

          {lessons[currentLesson]?.googleColabUrl && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text mb-3">Google Colab</h3>
              <a
                href={lessons[currentLesson]?.googleColabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium"
              >
                Open in Google Colab
                <ExternalLink className="w-5 h-5" />
              </a>
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

