'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleSidebar } from './ModuleSidebar';

interface ModuleLayoutProps {
  children: ReactNode;
  courseId: string;
  moduleId: string;
  currentLessonIndex: number;
  onLessonClick: (index: number) => void;
  moduleTitle?: string;
}

export const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  children,
  courseId,
  moduleId,
  currentLessonIndex,
  onLessonClick,
  moduleTitle,
}) => {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user && !firebaseUser) {
      router.replace('/auth/login');
    }
  }, [loading, user, firebaseUser, router]);

  const formatPathname = (pathname: string) => {
    if (!pathname || pathname === '/') return 'Dashboard';
    const parts = pathname.replace(/^\//, '').split('/');
    return parts
      .map((part) => part.replace(/-/g, ' '))
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' › ');
  };

  const pageTitle = formatPathname(pathname || '');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text">
        Loading...
      </div>
    );
  }

  if (!user && !firebaseUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ModuleSidebar
        moduleId={moduleId}
        courseId={courseId}
        currentLessonIndex={currentLessonIndex}
        onLessonClick={onLessonClick}
        moduleTitle={moduleTitle}
      />
      
      <main className="flex-1 overflow-x-hidden md:ml-0 relative z-10">
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-card md:mt-0 mt-16">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-textSecondary">Current view</p>
              <h2 className="text-lg font-semibold text-text">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-3">
              {(user || firebaseUser) && (
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-text">
                    {user?.displayName ||
                      firebaseUser?.displayName ||
                      user?.email ||
                      firebaseUser?.email ||
                      ''}
                  </span>
                  <span className="text-xs text-textSecondary">Learner</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 relative z-10">{children}</div>
      </main>
    </div>
  );
};

