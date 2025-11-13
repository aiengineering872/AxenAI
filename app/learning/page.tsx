'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, Clock, TrendingUp, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

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
  courseId?: string;
  title: string;
  description?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  weeks: string;
  order?: number;
}

const coursesData: Omit<Course, 'modules'>[] = [
  {
    id: 'ai-engineering',
    title: 'AI Engineering',
    description: 'Master the fundamentals and advanced concepts of AI Engineering',
    duration: '4 weeks',
    levels: ['beginner', 'intermediate', 'advanced'],
    modules: [],
  },
  {
    id: 'aiml-engineering',
    title: 'AI/ML Engineering',
    description: 'Comprehensive AI and Machine Learning engineering course',
    duration: '4 weeks',
    levels: ['beginner', 'intermediate', 'advanced'],
    modules: [],
  },
];

const moduleDefinitions: Record<string, Module[]> = {
  'ai-engineering': [
    {
      id: 'ai-intro',
      title: 'AI Foundations & Roadmap',
      duration: '1 week',
      difficulty: 'beginner',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'sql-data-engineering',
      title: 'SQL & Data Engineering Essentials',
      duration: '1 week',
      difficulty: 'beginner',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'python',
      title: 'Python for AI Engineering',
      duration: '1 week',
      difficulty: 'beginner',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning Systems',
      duration: '1 week',
      difficulty: 'intermediate',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning Fundamentals',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'generative-ai',
      title: 'Generative AI & Creative Models',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'llm-integration',
      title: 'Working with LLMs (Python Integration)',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'transformer-architecture',
      title: 'Transformer Architecture Mastery',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'hugging-face',
      title: 'Hugging Face & Pre-trained Models',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'frameworks',
      title: 'AI Frameworks in Production',
      duration: '1 week',
      difficulty: 'intermediate',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'ai-applications',
      title: 'Designing AI Applications',
      duration: '1 week',
      difficulty: 'intermediate',
      progress: 0,
      weeks: '1 week',
    },
    {
      id: 'ai-agents',
      title: 'Building AI Agents & Orchestration',
      duration: '1 week',
      difficulty: 'advanced',
      progress: 0,
      weeks: '1 week',
    },
  ],
  'aiml-engineering': [
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
};

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Load courses and modules from Firebase
  useEffect(() => {
    const loadCoursesAndModules = async () => {
      try {
        setLoading(true);
        // Fetch all courses from Firebase
        const firebaseCourses = await adminService.getCourses();
        
        // If no courses in Firebase, use hardcoded courses as fallback
        const coursesToUse = firebaseCourses.length > 0 ? firebaseCourses : coursesData;
        
        // Fetch all modules from Firebase
        const allModules = await adminService.getModules();
        
        // Map modules to courses and calculate progress
        const coursesWithModules = coursesToUse.map((course: any) => {
          // Filter modules for this course
          const courseModules = allModules
            .filter((module: any) => module.courseId === course.id)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((module: any) => {
              // Calculate progress for this module
              const moduleProgress = learningProgressService.getModuleProgress(course.id, module.id);
              return {
                id: module.id,
                courseId: module.courseId,
                title: module.title,
                description: module.description,
                duration: module.duration || '1 week',
                difficulty: module.difficulty || 'beginner',
                progress: moduleProgress.progress,
                weeks: module.duration || '1 week',
                order: module.order || 0,
              } as Module;
            });
          
          // If no modules from Firebase, use hardcoded modules as fallback
          let finalModules = courseModules;
          if (courseModules.length === 0 && moduleDefinitions[course.id]) {
            const hardcodedModules = moduleDefinitions[course.id];
            finalModules = hardcodedModules.map((module) => {
              const moduleProgress = learningProgressService.getModuleProgress(course.id, module.id);
              return {
                ...module,
                progress: moduleProgress.progress,
              };
            });
          }
          
          return {
            id: course.id,
            title: course.title,
            description: course.description || '',
            duration: course.duration || '4 weeks',
            levels: Array.isArray(course.levels) ? course.levels : ['beginner', 'intermediate', 'advanced'],
            modules: finalModules,
          } as Course;
        });
        
        setCourses(coursesWithModules);
      } catch (error) {
        console.error('Error loading courses and modules:', error);
        // Fallback to hardcoded data on error
        const coursesWithProgress = coursesData.map((course) => {
          const modules = moduleDefinitions[course.id] || [];
          const modulesWithProgress = modules.map((module) => {
            const moduleProgress = learningProgressService.getModuleProgress(course.id, module.id);
            return {
              ...module,
              progress: moduleProgress.progress,
            };
          });
          return {
            ...course,
            modules: modulesWithProgress,
          };
        });
        setCourses(coursesWithProgress);
      } finally {
        setLoading(false);
      }
    };

    loadCoursesAndModules();
  }, []);

  // Reload progress when course selection changes
  useEffect(() => {
    if (selectedCourse && courses.length > 0) {
      const updatedCourses = courses.map((course) => {
        if (course.id === selectedCourse) {
          const modulesWithProgress = course.modules.map((module) => {
            const moduleProgress = learningProgressService.getModuleProgress(course.id, module.id);
            return {
              ...module,
              progress: moduleProgress.progress,
            };
          });
          return {
            ...course,
            modules: modulesWithProgress,
          };
        }
        return course;
      });
      setCourses(updatedCourses);
    }
  }, [selectedCourse]);

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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">No courses available yet. Check back soon!</p>
          </div>
        ) : !selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="group glass modern-card glow-border p-6 rounded-xl cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(255,107,53,0.35)] hover:border-[#ff6b35]/75"
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-[#ff6b35]/60 group-hover:bg-[#ff6b35]/15 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#ff6b35]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text transition-colors duration-300 group-hover:text-[#ffe3d0]">
                        {course.title}
                      </h2>
                      <p className="text-sm text-textSecondary transition-colors duration-300 group-hover:text-white/80">
                        {course.duration}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-textSecondary mb-4 transition-colors duration-300 group-hover:text-white/80">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.levels.map((level) => (
                    <span
                      key={level}
                      className="px-2 py-1 rounded text-xs bg-card text-textSecondary capitalize transition-all duration-300 group-hover:border group-hover:border-[#ff6b35]/60 group-hover:bg-[#ff6b35]/15 group-hover:text-[#ffe3d0]"
                    >
                      {level}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-primary font-medium transition-colors duration-300 group-hover:text-[#ff6b35]">
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

            {selectedCourseData?.modules.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary">No modules available for this course yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCourseData?.modules.map((module, index) => {
                  const moduleUrl = `/learning/${selectedCourse}/${module.id}`;
                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="group glass modern-card glow-border p-6 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:border-[#ff6b35]/70"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text mb-2 transition-colors duration-300 group-hover:text-[#ffe3d0]">
                            {module.title}
                          </h3>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 text-textSecondary transition-colors duration-300 group-hover:text-white/80">
                              <Clock className="w-4 h-4 text-[#ff6b35]" />
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

                      <Link 
                        href={moduleUrl}
                        className="w-full py-3 bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,107,53,0.35)] hover:shadow-[0_0_28px_rgba(255,69,0,0.45)] block text-center no-underline relative z-10"
                        onClick={(e) => {
                          if (!selectedCourse || !module.id) {
                            e.preventDefault();
                            console.error('Missing courseId or moduleId:', { selectedCourse, moduleId: module.id });
                            return;
                          }
                          console.log('Navigating to:', moduleUrl);
                        }}
                      >
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
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

