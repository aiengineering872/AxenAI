import ModuleContent from './ModuleContent';

// Generate static params for static export
export function generateStaticParams() {
  const courses = ['ai-engineering', 'aiml-engineering'];
  const modules: Record<string, string[]> = {
    'ai-engineering': [
      'ai-intro',
      'sql-data-engineering',
      'python',
      'machine-learning',
      'deep-learning',
      'generative-ai',
      'llm-integration',
      'transformer-architecture',
      'hugging-face',
      'frameworks',
      'ai-applications',
      'ai-agents',
    ],
    'aiml-engineering': ['python', 'machine-learning', 'deep-learning', 'mlops'],
  };

  const params: { courseId: string; moduleId: string }[] = [];
  courses.forEach((courseId) => {
    modules[courseId]?.forEach((moduleId) => {
      params.push({ courseId, moduleId });
    });
  });
  return params;
}

export default function ModulePage() {
  return <ModuleContent />;
}
