import ModuleContent from './ModuleContent';

export const dynamic = 'force-dynamic';

export default function ModulePage({ params }: { params: { courseId: string; moduleId: string } }) {
  return <ModuleContent courseId={params.courseId} moduleId={params.moduleId} />;
}
