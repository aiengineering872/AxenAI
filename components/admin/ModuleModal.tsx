'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  module?: any;
  courses: any[];
}

const defaultForm = {
  title: '',
  description: '',
  duration: '',
  difficulty: 'beginner',
  courseId: '',
  order: 0,
};

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  module,
  courses,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(module);
  const hasCourses = courses.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      return;
    }

    if (module) {
      setFormData({
        title: module.title ?? '',
        description: module.description ?? '',
        duration: module.duration ?? '',
        difficulty: module.difficulty ?? 'beginner',
        courseId: module.courseId ?? courses[0]?.id ?? '',
        order: module.order ?? 0,
      });
    } else {
      setFormData({
        ...defaultForm,
        courseId: courses[0]?.id ?? '',
        order: 0,
      });
    }
  }, [isOpen, module, courses]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (module?.id) {
        await adminService.updateModule(module.id, formData);
      } else {
        await adminService.createModule(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Failed to save module. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">
            {module ? 'Edit Module' : 'Create Module'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-card"
          >
            <X className="h-5 w-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        {!hasCourses && !isEditMode && (
          <p className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
            You need at least one course before you can add modules.
          </p>
        )}

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Course *
            </label>
            <select
              required
              value={formData.courseId}
              onChange={(event) => handleChange('courseId', event.target.value)}
            className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasCourses && !isEditMode}
            >
              <option value="" disabled>
                Select course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            {!hasCourses && module?.courseId && (
              <option value={module.courseId}>{'Current course (archived)'}</option>
            )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Module title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Brief description of the module"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Duration *
              </label>
              <input
                required
                value={formData.duration}
                onChange={(event) => handleChange('duration', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 2 weeks"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Order *
              </label>
              <input
                required
                type="number"
                value={formData.order}
                onChange={(event) => handleChange('order', Number(event.target.value))}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(event) => handleChange('difficulty', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-card px-4 py-3 hover:bg-card/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-white transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleModal;

