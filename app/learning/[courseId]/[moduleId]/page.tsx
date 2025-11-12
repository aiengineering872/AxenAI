'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Play, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { learningProgressService } from '@/lib/services/learningProgressService';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  completed: boolean;
}

// Generate lessons based on module (6 lessons per module)
const generateLessons = (moduleId: string): Lesson[] => {
  const lessonTemplates: Record<string, Lesson[]> = {
    python: [
      { id: '1', title: 'Introduction to Python', content: 'Python is a high-level, interpreted programming language known for its simplicity and readability...', completed: false },
      { id: '2', title: 'Variables and Data Types', content: 'Learn about Python variables, strings, numbers, lists, dictionaries, and more...', completed: false },
      { id: '3', title: 'Control Flow', content: 'Master if statements, loops, and conditional logic in Python...', completed: false },
      { id: '4', title: 'Functions and Modules', content: 'Learn how to create and use functions, import modules, and organize your code...', completed: false },
      { id: '5', title: 'Object-Oriented Programming', content: 'Understand classes, objects, inheritance, and polymorphism in Python...', completed: false },
      { id: '6', title: 'File Handling and Exceptions', content: 'Learn to read/write files and handle exceptions gracefully...', completed: false },
    ],
    'machine-learning': [
      { id: '1', title: 'Introduction to Machine Learning', content: 'Learn the fundamentals of machine learning, supervised vs unsupervised learning...', completed: false },
      { id: '2', title: 'Data Preprocessing', content: 'Learn to clean, transform, and prepare data for machine learning models...', completed: false },
      { id: '3', title: 'Regression Models', content: 'Understand linear regression, polynomial regression, and evaluation metrics...', completed: false },
      { id: '4', title: 'Classification Models', content: 'Learn about logistic regression, decision trees, and random forests...', completed: false },
      { id: '5', title: 'Clustering and Dimensionality Reduction', content: 'Explore K-means clustering, PCA, and unsupervised learning techniques...', completed: false },
      { id: '6', title: 'Model Evaluation and Validation', content: 'Master cross-validation, confusion matrices, and model selection...', completed: false },
    ],
    'deep-learning': [
      { id: '1', title: 'Introduction to Neural Networks', content: 'Learn the basics of neural networks, neurons, and activation functions...', completed: false },
      { id: '2', title: 'Building Your First Neural Network', content: 'Create a neural network from scratch using TensorFlow/Keras...', completed: false },
      { id: '3', title: 'Convolutional Neural Networks (CNN)', content: 'Understand CNNs for image recognition and computer vision...', completed: false },
      { id: '4', title: 'Recurrent Neural Networks (RNN)', content: 'Learn about RNNs, LSTM, and GRU for sequence data...', completed: false },
      { id: '5', title: 'Transfer Learning', content: 'Master transfer learning and fine-tuning pre-trained models...', completed: false },
      { id: '6', title: 'Advanced Architectures', content: 'Explore Transformers, Attention mechanisms, and modern architectures...', completed: false },
    ],
    'generative-ai': [
      { id: '1', title: 'Introduction to Generative AI', content: 'Learn about generative models, GANs, and their applications...', completed: false },
      { id: '2', title: 'Large Language Models (LLMs)', content: 'Understand how LLMs work, tokenization, and prompt engineering...', completed: false },
      { id: '3', title: 'Fine-tuning LLMs', content: 'Learn to fine-tune language models for specific tasks...', completed: false },
      { id: '4', title: 'Prompt Engineering', content: 'Master techniques for effective prompt design and optimization...', completed: false },
      { id: '5', title: 'RAG (Retrieval Augmented Generation)', content: 'Learn to build RAG systems for enhanced AI applications...', completed: false },
      { id: '6', title: 'AI Agents and Automation', content: 'Explore AI agents, tool use, and autonomous systems...', completed: false },
    ],
    'mlops': [
      { id: '1', title: 'Introduction to MLOps', content: 'Learn the fundamentals of MLOps and DevOps for machine learning...', completed: false },
      { id: '2', title: 'Model Versioning and Tracking', content: 'Understand MLflow, model registries, and experiment tracking...', completed: false },
      { id: '3', title: 'Model Deployment', content: 'Learn to deploy models to production using containers and cloud services...', completed: false },
      { id: '4', title: 'CI/CD for ML', content: 'Master continuous integration and deployment pipelines for ML models...', completed: false },
      { id: '5', title: 'Monitoring and Observability', content: 'Learn to monitor model performance, drift detection, and alerting...', completed: false },
      { id: '6', title: 'Scaling ML Systems', content: 'Explore techniques for scaling ML systems and handling production workloads...', completed: false },
    ],
  };

  return lessonTemplates[moduleId] || lessonTemplates.python;
};

export default function ModulePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Load lessons and progress on mount
  useEffect(() => {
    const moduleLessons = generateLessons(moduleId);
    
    // Load saved progress for each lesson
    const lessonsWithProgress = moduleLessons.map((lesson) => ({
      ...lesson,
      completed: learningProgressService.isLessonCompleted(courseId, moduleId, lesson.id),
    }));
    
    setLessons(lessonsWithProgress);
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

  if (lessons.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl text-center">
            <p className="text-textSecondary">Loading lessons...</p>
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
          <h1 className="text-3xl font-bold text-text mb-4">
            {lessons[currentLesson]?.title}
          </h1>

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
            <p className="text-textSecondary text-lg leading-relaxed">
              {lessons[currentLesson]?.content}
            </p>
          </div>

          {lessons[currentLesson]?.videoUrl && (
            <div className="mb-6 aspect-video bg-card rounded-lg flex items-center justify-center">
              <Play className="w-16 h-16 text-primary opacity-50" />
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

