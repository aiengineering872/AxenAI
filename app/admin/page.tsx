'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, FlaskConical, MessageSquare, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import ModuleModal from '@/components/admin/ModuleModal';
import CourseModal from '@/components/admin/CourseModal';
import ProjectModal from '@/components/admin/ProjectModal';

type AdminTab = 'dashboard' | 'courses' | 'modules' | 'projects' | 'users' | 'faq';

const tabs: Array<{ id: AdminTab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'projects', label: 'Projects', icon: FlaskConical },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'faq', label: 'FAQ', icon: MessageSquare },
];

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

  const hasCourses = courses.length > 0;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsData = await adminService.getStats();
        setStats(statsData);
      }

      if (activeTab === 'courses') {
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);
      }

      if (activeTab === 'modules') {
        const [modulesData, coursesData] = await Promise.all([
          adminService.getModules(),
          adminService.getCourses(),
        ]);
        setModules(modulesData);
        setCourses(coursesData);
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
  };

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Learning Modules</h2>
              <button
                onClick={() => {
                  setEditingModule(null);
                  setShowModuleModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasCourses}
              >
                <Plus className="h-5 w-5" />
                Add Module
              </button>
            </div>

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
                    return (
                      <div key={module.id} className="flex items-center justify-between rounded-lg bg-card/50 p-4 transition hover:bg-card">
                        <div>
                          <h3 className="font-medium text-text">{module.title}</h3>
                          <p className="text-sm text-textSecondary">
                            {course?.title ?? 'Unassigned'} • {module.difficulty} • {module.duration}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                    );
                  })}

                  {modules.length === 0 && (
                    <div className="py-8 text-center text-textSecondary">No modules yet. Create your first module.</div>
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

        <ModuleModal
          isOpen={showModuleModal}
          onClose={() => {
            setShowModuleModal(false);
            setEditingModule(null);
          }}
          onSuccess={() => void loadData()}
          module={editingModule}
          courses={courses}
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
      </div>
    </DashboardLayout>
  );
}


