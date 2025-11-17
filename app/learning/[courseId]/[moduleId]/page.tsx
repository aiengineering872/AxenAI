import ModuleContent from './ModuleContent';

export const dynamic = 'force-dynamic';

export default async function ModulePage({ params }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const { courseId, moduleId } = await params;
  return <ModuleContent courseId={courseId} moduleId={moduleId} />;
}
