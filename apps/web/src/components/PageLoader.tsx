"use client";

interface PageLoaderProps {
  readonly isLoading: boolean;
}

export default function PageLoader({ isLoading }: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] glass animate-in fade-in duration-100">
      <div className="flex items-center justify-center min-h-screen">
        {/* Loader tipo pulse - elegante y minimalista */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
          <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}