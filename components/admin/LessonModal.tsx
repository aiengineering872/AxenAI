'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lesson?: any;
  moduleId: string;
  courseId?: string;
}

const defaultForm = {
  title: '',
  content: '',
  videoUrl: '',
  googleColabUrl: '',
  order: 0,
  simulators: [] as string[],
};

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lesson,
  moduleId,
  courseId,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      return;
    }

    if (lesson) {
      setFormData({
        title: lesson.title ?? '',
        content: lesson.content ?? '',
        videoUrl: lesson.videoUrl ?? '',
        googleColabUrl: lesson.googleColabUrl ?? '',
        order: lesson.order ?? 0,
        simulators: Array.isArray(lesson.simulators) ? lesson.simulators : [],
      });
    } else {
      setFormData({
        ...defaultForm,
        order: 0,
      });
    }
  }, [isOpen, lesson]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (lesson?.id) {
        await adminService.updateLesson(lesson.id, {
          ...formData,
          moduleId,
          courseId: courseId || lesson.courseId,
        });
      } else {
        await adminService.createLesson({
          ...formData,
          moduleId,
          courseId: courseId || '',
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">
            {lesson ? 'Edit Lesson' : 'Create Lesson'}
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
          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Lesson title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
              placeholder="Lesson content/description"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Video URL (Optional)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(event) => setFormData((prev) => ({ ...prev, videoUrl: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-text">Google Colab</h3>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Google Colab URL (Optional)
            </label>
            <input
              type="url"
              value={formData.googleColabUrl}
              onChange={(event) => setFormData((prev) => ({ ...prev, googleColabUrl: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://colab.research.google.com/..."
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
              onChange={(event) => setFormData((prev) => ({ ...prev, order: Number(event.target.value) }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              min={0}
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-text">Simulators</h3>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Simulator Topics (Optional)
            </label>
            <div className="space-y-2">
              {formData.simulators.map((simulator, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={simulator}
                    onChange={(event) => {
                      const newSimulators = [...formData.simulators];
                      newSimulators[index] = event.target.value;
                      setFormData((prev) => ({ ...prev, simulators: newSimulators }));
                    }}
                    className="flex-1 rounded-lg border border-card bg-card px-4 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Machine Learning Simulator"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSimulators = formData.simulators.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, simulators: newSimulators }));
                    }}
                    className="p-2 rounded-lg bg-card hover:bg-card/80 text-textSecondary hover:text-text transition-all"
                    aria-label="Remove simulator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, simulators: [...prev.simulators, ''] }));
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card hover:bg-card/80 text-textSecondary hover:text-text transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Simulator Topic
              </button>
            </div>
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
              {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;

