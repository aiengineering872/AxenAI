'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight, ExternalLink, Video, Code2, Brain, Target, Grid3x3, ChevronRight, Code } from 'lucide-react';
import Link from 'next/link';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  googleColabUrl?: string;
  simulators?: string[];
  completed: boolean;
  order?: number;
}

interface ModuleContentProps {
  courseId: string;
  moduleId: string;
}

export default function ModuleContent({ courseId, moduleId }: ModuleContentProps) {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load module info and lessons from Firebase - only use Firebase data
  useEffect(() => {
    const loadModuleAndLessons = async () => {
      if (!moduleId || !courseId) return;

      try {
        setLoading(true);
        
        // Fetch module and lessons in parallel
        const [moduleData, firebaseLessons] = await Promise.all([
          adminService.getModule(moduleId),
          adminService.getLessons(moduleId),
        ]);
        
        // Set module title - only if exists in Firebase
        const module = moduleData as any;
        if (module?.title) {
          setModuleTitle(module.title);
        } else {
          setModuleTitle('');
        }
        
        // Process lessons - only use Firebase data
        if (firebaseLessons.length > 0) {
          const lessonsWithProgress = firebaseLessons.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title || '',
            content: lesson.content || '',
            videoUrl: lesson.videoUrl || undefined,
            googleColabUrl: lesson.googleColabUrl || undefined,
            simulators: Array.isArray(lesson.simulators) ? lesson.simulators : [],
            completed: learningProgressService.isLessonCompleted(courseId, moduleId, lesson.id),
            order: lesson.order || 0,
          }));
          
          // Sort by order
          lessonsWithProgress.sort((a, b) => (a.order || 0) - (b.order || 0));
          setLessons(lessonsWithProgress);
        } else {
          setLessons([]);
        }
      } catch (error) {
        console.error('Error loading module and lessons:', error);
        setLessons([]);
        setModuleTitle('');
      } finally {
        setLoading(false);
      }
    };

    loadModuleAndLessons();
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

  const handleLessonClick = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentLesson(index);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const nextLesson = () => {
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const prevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      <ModuleLayout
        courseId={courseId}
        moduleId={moduleId}
        currentLessonIndex={currentLesson}
        onLessonClick={handleLessonClick}
        moduleTitle={moduleTitle}
      >
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
      </ModuleLayout>
    );
  }

  if (lessons.length === 0) {
    return (
      <ModuleLayout
        courseId={courseId}
        moduleId={moduleId}
        currentLessonIndex={currentLesson}
        onLessonClick={handleLessonClick}
        moduleTitle={moduleTitle}
      >
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
            {moduleTitle && <h1 className="text-3xl font-bold text-text mb-4">{moduleTitle}</h1>}
            <p className="text-textSecondary text-center py-8">No lessons available for this module yet. Please add lessons via the admin panel.</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      courseId={courseId}
      moduleId={moduleId}
      currentLessonIndex={currentLesson}
      onLessonClick={handleLessonClick}
      moduleTitle={moduleTitle}
    >
      <div className="space-y-6" ref={contentRef}>
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
          {moduleTitle && (
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-text mb-2">{moduleTitle}</h1>
              <p className="text-textSecondary text-sm">Course: {courseId}</p>
            </div>
          )}
          
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

          <div className="prose prose-invert max-w-3xl mb-6">
            {formatContent(lessons[currentLesson]?.content || '')}
          </div>

          {/* Video Lectures and Simulators Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Video Lectures Section - Takes 2 columns */}
            <div className="lg:col-span-2 glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text">Video Lectures</h3>
              </div>
              <div className="bg-card/50 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
                {lessons[currentLesson]?.videoUrl ? (
                  <div className="w-full aspect-video">
                    {renderVideoContent(lessons[currentLesson]?.videoUrl || '')}
                  </div>
                ) : (
                  <div className="text-center">
                    <Video className="w-20 h-20 text-textSecondary mx-auto mb-4" />
                    <p className="text-textSecondary">No videos available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Simulators Section - Takes 1 column */}
            <div className="lg:col-span-1 glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text">Simulators</h3>
              </div>
              <div className="space-y-3">
                {lessons[currentLesson]?.simulators && lessons[currentLesson]?.simulators.length > 0 ? (
                  lessons[currentLesson].simulators.map((simulatorName, index) => {
                    // Map simulator name to type for URL
                    const getSimulatorType = (name: string): string => {
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('machine learning') || lowerName.includes('ml')) {
                        return 'machine-learning';
                      }
                      if (lowerName.includes('bias') || lowerName.includes('variance')) {
                        return 'bias-variance';
                      }
                      if (lowerName.includes('confusion') || lowerName.includes('matrix')) {
                        return 'confusion-matrix';
                      }
                      // Default fallback
                      return 'machine-learning';
                    };

                    // Map simulator name to icon
                    const getSimulatorIcon = (name: string) => {
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('machine learning') || lowerName.includes('ml')) {
                        return Brain;
                      }
                      if (lowerName.includes('bias') || lowerName.includes('variance')) {
                        return Target;
                      }
                      if (lowerName.includes('confusion') || lowerName.includes('matrix')) {
                        return Grid3x3;
                      }
                      return Code;
                    };

                    const SimulatorIcon = getSimulatorIcon(simulatorName);
                    // Create URL-friendly topic name
                    const topicSlug = simulatorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                    return (
                      <Link key={index} href={`/simulator/topic/${topicSlug}`}>
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="flex items-center gap-3 p-3 bg-card/50 rounded-xl hover:bg-card/70 cursor-pointer transition-all"
                        >
                          <SimulatorIcon className="w-5 h-5 text-primary" />
                          <span className="flex-1 text-text font-medium text-sm">{simulatorName}</span>
                          <ChevronRight className="w-4 h-4 text-textSecondary" />
                        </motion.div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <Code className="w-12 h-12 text-textSecondary mx-auto mb-2" />
                    <p className="text-textSecondary text-sm">No simulators available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

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
    </ModuleLayout>
  );
}
