'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, FlaskConical, MessageSquare, Plus, Edit, Trash2, TrendingUp, Clock, X, ChevronDown } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import ModuleModal from '@/components/admin/ModuleModal';
import CourseModal from '@/components/admin/CourseModal';
import ProjectModal from '@/components/admin/ProjectModal';
import LessonModal from '@/components/admin/LessonModal';
import { Toast } from '@/components/ui/Toast';

type AdminTab = 'dashboard' | 'courses' | 'modules' | 'projects' | 'users' | 'faq';

const tabs: Array<{ id: AdminTab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'projects', label: 'Projects', icon: FlaskConical },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'faq', label: 'FAQ', icon: MessageSquare },
];

const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours && !minutes && secs) parts.push(`${secs}s`);
  return parts.slice(0, 2).join(' ');
};

const computeActivity = (activityLog: Record<string, number> | undefined) => {
  const today = new Date();
  const todayKey = getDateKey(today);
  const todaySeconds = activityLog?.[todayKey] ?? 0;

  let last7DaysSeconds = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = getDateKey(date);
    const value = activityLog?.[key];
    if (typeof value === 'number') {
      last7DaysSeconds += value;
    }
  }

  return {
    todaySeconds,
    last7DaysSeconds,
  };
};

export default function AdminPanelPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    totalProjects: 0,
    totalCourses: 0,
  });
  const [modules, setModules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showLessonDropdown, setShowLessonDropdown] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const hasCourses = courses.length > 0;
  
  // Sync courses from learning hub to Firebase
  const syncCoursesFromLearningHub = async () => {
    try {
      const existingCourses = await adminService.getCourses();
      const existingCourseIds = existingCourses.map((c: any) => c.id);
      
      // Define courses from learning hub (only courses that should be auto-synced)
      const learningHubCourses = [
        {
          id: 'aiml-engineering',
          title: 'AI/ML Engineering',
          description: 'Comprehensive AI and Machine Learning engineering course',
          duration: '4 weeks',
          levels: ['beginner', 'intermediate', 'advanced'],
        },
      ];
      
      // List of course IDs that should NOT be auto-created (removed from hardcoded list)
      const excludedCourseIds = ['ai-engineering'];
      
      // Add courses that don't exist in Firebase and are not excluded
      for (const course of learningHubCourses) {
        if (!existingCourseIds.includes(course.id) && !excludedCourseIds.includes(course.id)) {
          await adminService.createCourse(course);
          console.log(`Created course: ${course.title}`);
        }
      }
      
      // Reload courses after syncing
      if (activeTab === 'courses' || activeTab === 'modules') {
        const updatedCourses = await adminService.getCourses();
        setCourses(updatedCourses);
      }
    } catch (error) {
      console.error('Error syncing courses:', error);
    }
  };
  
  // Debug: Log courses and hasCourses state
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsData = await adminService.getStats();
        setStats(statsData);
      }

      if (activeTab === 'courses') {
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);
        
        // Sync courses from learning hub if they don't exist
        await syncCoursesFromLearningHub();
      }

      if (activeTab === 'modules') {
        // Sync courses first
        await syncCoursesFromLearningHub();
        
        const [modulesData, coursesData] = await Promise.all([
          adminService.getModules(selectedCourseId || undefined),
          adminService.getCourses(),
        ]);
        setModules(modulesData);
        setCourses(coursesData);
        
        // Load lessons for all modules
        const allLessons = await adminService.getLessons();
        setLessons(allLessons);
      }

      if (activeTab === 'projects') {
        const projectsData = await adminService.getProjects();
        setProjects(projectsData);
      }

      if (activeTab === 'users') {
        const usersData = await adminService.getUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  }, [activeTab, selectedCourseId]);

  useEffect(() => {
    if (activeTab === 'modules') {
      console.log('Courses:', courses);
      console.log('Has courses:', hasCourses);
    }
  }, [activeTab, courses, hasCourses]);
  
  // Sync courses when admin panel loads (only once)
  useEffect(() => {
    if (isAdmin && !authLoading) {
      syncCoursesFromLearningHub().then(() => {
        // Reload data after syncing
        if (activeTab === 'courses' || activeTab === 'modules') {
          void loadData();
        }
      });
    }
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [isAdmin, authLoading, activeTab, loadData]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, loadData]);

  // Close lesson dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLessonDropdown && !target.closest('.lesson-dropdown-container')) {
        setShowLessonDropdown(null);
      }
    };

    if (showLessonDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showLessonDropdown]);

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module? This action cannot be undone.')) return;

    try {
      await adminService.deleteModule(moduleId);
      await loadData();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module. Please try again.');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This action cannot be undone.')) return;

    try {
      await adminService.deleteLesson(lessonId);
      await loadData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson. Please try again.');
    }
  };

  const toggleModuleExpansion = async (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      // Load lessons for this module
      const moduleLessons = await adminService.getLessons(moduleId);
      setLessons((prev) => {
        const filtered = prev.filter((l) => l.moduleId !== moduleId);
        return [...filtered, ...moduleLessons];
      });
    }
    setExpandedModules(newExpanded);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;

    try {
      await adminService.deleteProject(projectId);
      await loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleProjectSaved = async () => {
    await loadData();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course? This will also remove related modules.')) return;

    try {
      await adminService.deleteCourse(courseId);
      await loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text">Admin Panel</h1>
          <p className="text-textSecondary">Manage content, users, and platform settings</p>
        </motion.div>

        <div className="flex gap-4 border-b border-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textSecondary hover:text-text'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
              <p className="text-textSecondary">Total Learners</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalModules}</span>
              </div>
              <p className="text-textSecondary">Modules</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <FlaskConical className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalProjects}</span>
              </div>
              <p className="text-textSecondary">Projects</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalCourses}</span>
              </div>
              <p className="text-textSecondary">Courses</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'courses' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Courses</h2>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Add Course
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading courses...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {courses.map((course) => {
                    const levelList = Array.isArray(course.levels) && course.levels.length
                      ? course.levels.join(', ')
                      : 'n/a';

                    return (
                      <div key={course.id} className="flex items-center justify-between rounded-lg bg-card/50 p-4 transition hover:bg-card">
                        <div>
                          <h3 className="font-medium text-text">{course.title}</h3>
                          <p className="text-sm text-textSecondary">{course.description}</p>
                          <p className="text-xs text-textSecondary">
                            {course.duration} • Levels: {levelList}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setShowCourseModal(true);
                            }}
                            className="rounded p-2 transition hover:bg-card"
                          >
                            <Edit className="h-5 w-5 text-textSecondary" />
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="rounded p-2 transition hover:bg-card">
                            <Trash2 className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                    </div>
                    );
                  })}
                  {courses.length === 0 && (
                    <div className="py-8 text-center text-textSecondary">No courses yet. Create your first course.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'modules' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-text">Learning Modules</h2>
              
              <div className="flex items-center gap-3">
                {/* Course Selector */}
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setExpandedModules(new Set()); // Reset expanded modules when course changes
                    }}
                    className="appearance-none rounded-lg border border-card bg-card px-4 py-2 pr-10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!hasCourses) {
                      setToast({ message: 'Please create a course first before adding modules. Go to the "Courses" tab to create one.', type: 'error' });
                      return;
                    }
                    
                    if (!selectedCourseId) {
                      setToast({ message: 'Please select a course first', type: 'error' });
                      return;
                    }
                    
                    setEditingModule(null);
                    setShowModuleModal(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90 relative z-10 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    opacity: hasCourses && selectedCourseId ? 1 : 0.5,
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Add Module
                </button>
              </div>
            </div>
            
            {selectedCourseId && (
              <p className="text-sm text-textSecondary">
                Showing modules for: <span className="font-medium text-text">{courses.find(c => c.id === selectedCourseId)?.title || 'Unknown'}</span>
              </p>
            )}

            {!loading && !hasCourses && (
              <p className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Create a course first, then you can add modules to it.
              </p>
            )}

            {loading ? (
              <div className="py-8 text-center">Loading modules...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {modules.map((module) => {
                    const course = courses.find((courseItem) => courseItem.id === module.courseId);
                    const moduleLessons = lessons.filter((l) => l.moduleId === module.id).sort((a, b) => (a.order || 0) - (b.order || 0));
                    const isExpanded = expandedModules.has(module.id);
                    
                    return (
                      <div key={module.id} className="rounded-lg bg-card/50 transition hover:bg-card">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleModuleExpansion(module.id)}
                                className="text-textSecondary hover:text-text transition"
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                              <div>
                                <h3 className="font-medium text-text">{module.title}</h3>
                                <p className="text-sm text-textSecondary">
                                  {course?.title ?? 'Unassigned'} • {module.difficulty} • {module.duration} • {moduleLessons.length} lessons
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 relative lesson-dropdown-container">
                            <button
                              onClick={async () => {
                                // Load lessons for this module if not already loaded
                                if (moduleLessons.length === 0) {
                                  const moduleLessonsData = await adminService.getLessons(module.id);
                                  setLessons((prev) => {
                                    const filtered = prev.filter((l) => l.moduleId !== module.id);
                                    return [...filtered, ...moduleLessonsData];
                                  });
                                }
                                // Toggle dropdown
                                setShowLessonDropdown(showLessonDropdown === module.id ? null : module.id);
                              }}
                              className="flex items-center gap-1 rounded px-3 py-1.5 text-sm bg-primary/20 text-primary hover:bg-primary/30 transition relative z-10"
                              title="Add/Edit Lessons"
                            >
                              <Plus className="h-4 w-4" />
                              Add Lesson
                            </button>
                            
                            {showLessonDropdown === module.id && (
                              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-lg border border-card/50 p-4 z-50 shadow-xl">
                                <div className="mb-3 flex items-center justify-between">
                                  <h4 className="font-semibold text-text">Lessons for {module.title}</h4>
                                  <button
                                    onClick={() => setShowLessonDropdown(null)}
                                    className="text-textSecondary hover:text-text"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                <div className="max-h-64 space-y-2 overflow-y-auto">
                                  {moduleLessons.length === 0 ? (
                                    <p className="text-sm text-textSecondary text-center py-4">No lessons yet.</p>
                                  ) : (
                                    moduleLessons.map((lesson) => (
                                      <div
                                        key={lesson.id}
                                        className="flex items-center justify-between rounded bg-card/30 p-2 hover:bg-card/50 transition"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-sm font-medium text-text truncate">{lesson.title}</h5>
                                          <p className="text-xs text-textSecondary">Order: {lesson.order || 0}</p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <button
                                            onClick={() => {
                                              setSelectedModuleForLessons(module.id);
                                              setEditingLesson(lesson);
                                              setShowLessonModal(true);
                                              setShowLessonDropdown(null);
                                            }}
                                            className="rounded p-1.5 transition hover:bg-card"
                                            title="Edit Lesson"
                                          >
                                            <Edit className="h-3.5 w-3.5 text-textSecondary" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (confirm('Delete this lesson?')) {
                                                handleDeleteLesson(lesson.id);
                                              }
                                            }}
                                            className="rounded p-1.5 transition hover:bg-card"
                                            title="Delete Lesson"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                                
                                <div className="mt-3 border-t border-card/50 pt-3">
                                  <button
                                    onClick={() => {
                                      setSelectedModuleForLessons(module.id);
                                      setEditingLesson(null);
                                      setShowLessonModal(true);
                                      setShowLessonDropdown(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary/90"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add New Lesson
                                  </button>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setEditingModule(module);
                                setShowModuleModal(true);
                              }}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Edit className="h-5 w-5 text-textSecondary" />
                            </button>
                            <button onClick={() => handleDeleteModule(module.id)} className="rounded p-2 transition hover:bg-card">
                              <Trash2 className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-card/50 p-4 space-y-2">
                            {moduleLessons.length === 0 ? (
                              <p className="text-sm text-textSecondary text-center py-4">No lessons yet. Click "Add Lesson" to create one.</p>
                            ) : (
                              moduleLessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between rounded bg-card/30 p-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-text">{lesson.title}</h4>
                                    <p className="text-xs text-textSecondary">Order: {lesson.order || 0}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedModuleForLessons(module.id);
                                        setEditingLesson(lesson);
                                        setShowLessonModal(true);
                                      }}
                                      className="rounded p-1.5 transition hover:bg-card"
                                    >
                                      <Edit className="h-4 w-4 text-textSecondary" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="rounded p-1.5 transition hover:bg-card"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {modules.length === 0 && selectedCourseId && (
                    <div className="py-8 text-center text-textSecondary">No modules yet for this course. Click "Add Module" to create one.</div>
                  )}
                  
                  {modules.length === 0 && !selectedCourseId && (
                    <div className="py-8 text-center text-textSecondary">Please select a course to view its modules.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Project Lab</h2>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Add Project
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading projects...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex flex-col gap-3 rounded-lg bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text">{project.title}</h3>
                          {project.isPublic === false && (
                            <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">Private</span>
                          )}
                        </div>
                        <p className="text-sm text-textSecondary">{project.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-textSecondary">
                          {Array.isArray(project.tags) &&
                            project.tags.map((tag: string) => (
                              <span key={tag} className="rounded-full bg-card px-2 py-1">
                                #{tag}
                              </span>
                            ))}
                        </div>
                        <div className="text-xs text-textSecondary">
                          Owner: {project.userName || project.ownerName || 'Unknown'}{' '}
                          {project.ownerEmail ? `• ${project.ownerEmail}` : ''}
                        </div>
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-sm text-primary hover:underline"
                          >
                            View on GitHub
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setShowProjectModal(true);
                          }}
                          className="rounded p-2 transition hover:bg-card"
                        >
                          <Edit className="h-5 w-5 text-textSecondary" />
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)} className="rounded p-2 transition hover:bg-card">
                          <Trash2 className="h-5 w-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="py-8 text-center text-textSecondary">No projects yet.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">User Management</h2>
            </div>
            <div className="glass rounded-xl p-6">
              {loading ? (
                <div className="py-8 text-center text-textSecondary">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-textSecondary">No users found yet.</div>
              ) : (
                <div className="divide-y divide-card/60">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
                      <div className="flex items-center gap-4">
                        {userItem.photoURL ? (
                          <img
                            src={userItem.photoURL}
                            alt={userItem.displayName || userItem.email || 'User avatar'}
                            className="h-12 w-12 rounded-full object-cover border border-primary/40"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold">
                            {(userItem.displayName || userItem.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-text">
                            {userItem.displayName || userItem.email || 'Unknown user'}
                          </p>
                          <p className="text-sm text-textSecondary">{userItem.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-textSecondary">
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          Role: <span className="font-medium text-text">{userItem.role || 'student'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          Level: <span className="font-medium text-text">{userItem.level ?? 1}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          XP: <span className="font-medium text-text">{userItem.xp ?? 0}</span>
                        </span>
                        {(() => {
                          const { todaySeconds, last7DaysSeconds } = computeActivity(userItem.activityLog);
                          const hasActivity = todaySeconds > 0 || last7DaysSeconds > 0;
                          if (!hasActivity) {
                            return (
                              <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                                <Clock className="h-4 w-4" />
                                Activity: <span className="font-medium text-text">No data</span>
                              </span>
                            );
                          }

                          return (
                            <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                              <Clock className="h-4 w-4" />
                              Activity:{' '}
                              <span className="font-medium text-text">
                                {formatDuration(todaySeconds)} today • {formatDuration(last7DaysSeconds)} / 7d
                              </span>
                            </span>
                          );
                        })()}
                        {userItem.createdAt && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                            Joined:{' '}
                            <span className="font-medium text-text">
                              {typeof userItem.createdAt?.toDate === 'function'
                                ? userItem.createdAt.toDate().toLocaleDateString()
                                : new Date(userItem.createdAt).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'faq' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">FAQ & Knowledge Base</h2>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-textSecondary">FAQ management coming soon.</p>
            </div>
          </motion.div>
        )}

        <CourseModal
          isOpen={showCourseModal}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
          onSuccess={() => void loadData()}
          course={editingCourse}
        />

        <ModuleModal
          isOpen={showModuleModal}
          onClose={() => {
            setShowModuleModal(false);
            setEditingModule(null);
          }}
          onSuccess={() => {
            void loadData();
            setToast({ message: editingModule ? 'Module updated successfully!' : 'Module created successfully!', type: 'success' });
          }}
          module={editingModule}
          courses={courses}
          preselectedCourseId={selectedCourseId}
        />

        <LessonModal
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
            setSelectedModuleForLessons(null);
          }}
          onSuccess={() => {
            void loadData();
            setToast({ message: editingLesson ? 'Lesson updated successfully!' : 'Lesson created successfully!', type: 'success' });
          }}
          lesson={editingLesson}
          moduleId={selectedModuleForLessons || ''}
          courseId={selectedCourseId || modules.find(m => m.id === selectedModuleForLessons)?.courseId}
        />

        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSuccess={handleProjectSaved}
          project={editingProject}
        />
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={!!toast}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}


