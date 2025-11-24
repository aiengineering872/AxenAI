'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topic?: any;
  moduleId: string;
  subjectId: string;
}

const defaultForm = {
  name: '',
  content: '',
  order: 0,
};

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  topic,
  moduleId,
  subjectId,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(topic);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      return;
    }

    if (topic) {
      setFormData({
        name: topic.name ?? '',
        content: topic.content ?? '',
        order: topic.order ?? 0,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [isOpen, topic]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a topic name.');
      return;
    }

    setLoading(true);
    try {
      // Get current subject data
      const subjectData = await adminService.getModule(subjectId);
      if (!subjectData?.modules) {
        throw new Error('Subject or modules not found');
      }

      // Preserve all module data including IDs, numbers, names, orders
      const updatedModules = subjectData.modules.map((m: any, index: number) => {
        if (m.id === moduleId) {
          const topics = Array.isArray(m.topics) ? m.topics : [];
          let updatedTopics;

          if (isEditMode && topic?.id) {
            // Update existing topic
            updatedTopics = topics.map((t: any) =>
              t.id === topic.id
                ? {
                    id: t.id, // Preserve topic ID
                    name: formData.name,
                    content: formData.content,
                    order: formData.order,
                  }
                : {
                    // Preserve all topic fields
                    id: t.id || `topic-${index}-${Date.now()}`,
                    name: t.name || '',
                    content: t.content || '',
                    order: t.order ?? 0,
                  }
            );
          } else {
            // Add new topic
            const newTopic = {
              id: `topic-${Date.now()}-${Math.random()}`,
              name: formData.name,
              content: formData.content,
              order: formData.order,
            };
            updatedTopics = [...topics, newTopic];
          }

          // Preserve ALL module fields
          return {
            id: m.id || `module-${index}-${Date.now()}`,
            number: m.number || String(index + 1),
            name: m.name || '',
            order: m.order ?? index,
            topics: updatedTopics,
          };
        }
        // Preserve ALL fields for other modules
        return {
          id: m.id || `module-${index}-${Date.now()}`,
          number: m.number || String(index + 1),
          name: m.name || '',
          order: m.order ?? index,
          topics: Array.isArray(m.topics) ? m.topics.map((t: any, tIndex: number) => ({
            id: t.id || `topic-${index}-${tIndex}`,
            name: t.name || '',
            content: t.content || '',
            order: t.order ?? tIndex,
          })) : [],
        };
      });

      // Preserve all subject fields
      const dataToSave = {
        title: subjectData.title || '',
        description: subjectData.description || '',
        duration: subjectData.duration || '',
        difficulty: subjectData.difficulty || 'beginner',
        courseId: subjectData.courseId || '',
        order: subjectData.order ?? 0,
        modules: updatedModules, // Always include modules array
      };

      console.log('Saving topic - Modules count:', updatedModules.length);
      console.log('Saving topic - Modules:', updatedModules);
      console.log('Saving topic - Data to save:', dataToSave);

      await adminService.updateModule(subjectId, dataToSave);
      
      // Verify the save by reading it back
      const verifyData = await adminService.getModule(subjectId);
      console.log('Verified saved data - Modules count:', verifyData?.modules?.length);
      console.log('Verified saved data - Modules:', verifyData?.modules);
      
      if (!verifyData?.modules || verifyData.modules.length === 0) {
        if (updatedModules.length > 0) {
          console.error('CRITICAL ERROR: Modules were lost during save!');
          alert('ERROR: Modules were not saved correctly. Please refresh and try again.');
          setLoading(false);
          return;
        }
      } else if (verifyData.modules.length !== updatedModules.length) {
        console.warn('WARNING: Module count mismatch after save!');
        console.warn('Expected:', updatedModules.length, 'Got:', verifyData.modules.length);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert(`Failed to save topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            {topic ? 'Edit Topic' : 'Create Topic'}
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
              Topic Name *
            </label>
            <input
              required
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., What is Python?"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(event) => handleChange('content', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[200px]"
              placeholder="Enter the main learning content for this topic..."
              rows={8}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(event) => handleChange('order', Number(event.target.value))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              min={0}
            />
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
              {loading ? 'Saving...' : topic ? 'Update Topic' : 'Create Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;

