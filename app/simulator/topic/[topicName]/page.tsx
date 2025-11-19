'use client';

import React, { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function TopicSimulatorContent() {
  const params = useParams();
  const topicName = params.topicName as string;

  // Decode topic name from URL
  const decodedTopicName = topicName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/learning"
            className="text-primary hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text">{decodedTopicName} Simulator</h1>
            <p className="text-textSecondary">Coming soon...</p>
          </div>
        </div>

        {/* Empty Content Area */}
        <div className="glass p-12 rounded-xl text-center min-h-[400px] flex items-center justify-center">
          <div>
            <p className="text-textSecondary text-lg">This simulator will be available soon.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function TopicSimulatorPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl text-center">
            <p className="text-textSecondary">Loading simulator...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <TopicSimulatorContent />
    </Suspense>
  );
}

