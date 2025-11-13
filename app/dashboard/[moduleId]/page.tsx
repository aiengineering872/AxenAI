import DashboardContent from './DashboardContent';
import { Brain, Cpu } from 'lucide-react';

const moduleConfigs: Record<string, { courseId: string; title: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  'ai-engineering': {
    courseId: 'ai-engineering',
    title: 'AI Engineering',
    icon: Brain,
    description: 'Master the fundamentals and advanced concepts of AI Engineering',
  },
  'aiml': {
    courseId: 'aiml-engineering',
    title: 'AIML',
    icon: Cpu,
    description: 'Comprehensive AI and Machine Learning engineering course',
  },
};

// Generate static params for static export
export function generateStaticParams() {
  return Object.keys(moduleConfigs).map((moduleId) => ({
    moduleId,
  }));
}

export default function ModuleDashboardPage() {
  return <DashboardContent />;
}

