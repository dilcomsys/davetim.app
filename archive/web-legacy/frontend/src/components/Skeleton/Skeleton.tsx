import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
};

export const InvitationCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-3" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        {/* Invitation Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InvitationCardSkeleton />
          <InvitationCardSkeleton />
          <InvitationCardSkeleton />
        </div>
      </div>
    </div>
  );
};

export const TemplateCardSkeleton: React.FC = () => {
  return (
    <div className="block bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-64" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
};

export const TemplatesPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-30 rounded-full" />
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
        </div>
      </div>
    </div>
  );
};

export const EditorPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Editor Controls */}
        <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48 mb-4" />
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <Skeleton className="w-full rounded-lg" style={{ height: '600px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PublicInvitationSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Invitation Preview */}
        <Skeleton className="w-full rounded-lg" style={{ height: '700px' }} />
      </div>
    </div>
  );
};

export const RSVPPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto mb-2" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* RSVP Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            </div>
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

