'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Plus, ThumbsUp, MessageSquare, Upload, Github, Tag, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/services/projectService';
import { formatDistanceToNow } from 'date-fns';

// Dynamically import DashboardLayout to avoid SSR issues
const DynamicDashboardLayout = dynamic(() => Promise.resolve(DashboardLayout), {
  ssr: false,
});

interface Project {
  id: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description: string;
  tags: string[];
  githubLink?: string;
  isPublic: boolean;
  upvotes: number;
  comments: number;
  aiReview?: {
    innovation: number;
    accuracy: number;
    presentation: number;
    overallScore: number;
    feedback: string;
  };
  createdAt?: string | null;
}

const PROJECTS_CACHE_TTL = 60_000;
let projectCache: { data: Project[]; timestamp: number } | null = null;

export default function ProjectLabPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    githubLink: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canUpload = useMemo(() => !!user, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setError('');

      if (projectCache && Date.now() - projectCache.timestamp < PROJECTS_CACHE_TTL) {
        setProjects(projectCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const results = (await projectService.listProjects()) as Project[];
        if (!isMounted) {
          return;
        }
        projectCache = { data: results, timestamp: Date.now() };
        setProjects(results);
      } catch (err: any) {
        console.error('Error loading projects:', err);
        if (isMounted) {
          setError('Unable to load projects right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpvote = (projectId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, upvotes: project.upvotes + 1 } : project
      )
    );

    projectService
      .incrementUpvotes(projectId, 1)
      .catch((err) => console.error('Failed to register upvote:', err));
  };

  const handleUpload = async () => {
    try {
      if (!user) {
        throw new Error('Please sign in to upload a project.');
      }

      const payload = {
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userPhoto: user.photoURL || null,
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        githubLink: newProject.githubLink || null,
        isPublic: newProject.isPublic,
        upvotes: 0,
        comments: 0,
        aiReview: null,
      };

      await projectService.createProject(payload);
      const refreshed = (await projectService.listProjects()) as Project[];
      projectCache = { data: refreshed, timestamp: Date.now() };
      setProjects(refreshed);

      setShowUploadModal(false);
      setNewProject({ title: '', description: '', tags: '', githubLink: '', isPublic: true });
    } catch (err: any) {
      console.error('Project upload failed:', err);
      alert(err.message || 'Failed to upload project.');
    }
  };

  return (
    <DynamicDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-display mb-2">AI Project Lab</h1>
            <p className="text-body">Showcase your AI projects and get feedback</p>
          </motion.div>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!canUpload}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {canUpload ? 'Upload Project' : 'Sign in to Upload'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-body">Loading projects...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : projects.length === 0 ? (
            <p className="text-body-strong">No projects yet. Be the first to upload one!</p>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-xl hover:shadow-glow transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {project.userPhoto ? (
                      <img
                        src={project.userPhoto}
                        alt={project.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {project.userName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-body-strong">{project.userName}</p>
                      <p className="text-caption">
                        {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-section mb-2">{project.title}</h3>
                <p className="text-body mb-4 line-clamp-3">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-caption bg-card rounded flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-body-strong text-primary hover:underline mb-4"
                  >
                    <Github className="w-4 h-4" />
                    View on GitHub
                  </a>
                )}

                {project.aiReview && (
                  <div className="mb-4 p-3 bg-card/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-caption">AI Review Score: {project.aiReview.overallScore}/10</span>
                    </div>
                    <p className="text-body">{project.aiReview.feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-card">
                  <button
                    onClick={() => handleUpvote(project.id)}
                    className="flex items-center gap-2 text-caption hover:text-primary transition-all"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {project.upvotes}
                  </button>
                  <div className="flex items-center gap-2 text-caption">
                    <MessageSquare className="w-5 h-5" />
                    {project.comments}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-title mb-4">Upload Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-caption font-medium mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="Enter project title"
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    rows={4}
                    placeholder="Describe your project..."
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newProject.tags}
                    onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="Machine Learning, Deep Learning, etc."
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    GitHub Link (optional)
                  </label>
                  <input
                    type="url"
                    value={newProject.githubLink}
                    onChange={(e) => setNewProject({ ...newProject, githubLink: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="https://github.com/username/repo"
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newProject.isPublic}
                    onChange={(e) => setNewProject({ ...newProject, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-caption">
                    Make project public
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 bg-card hover:bg-card/80 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!newProject.title || !newProject.description}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DynamicDashboardLayout>
  );
}
