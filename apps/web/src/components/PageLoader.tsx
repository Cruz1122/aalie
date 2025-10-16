"use client";

import { useEffect, useState } from "react";

interface PageLoaderProps {
  readonly isLoading: boolean;
}

export default function PageLoader({ isLoading }: PageLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Pequeño delay para que la animación se vea suave
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] glass transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
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