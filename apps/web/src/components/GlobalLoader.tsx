import React from "react";

import { LoaderVariant, LoaderSize } from "@/types/loader";

interface GlobalLoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  message?: string;
  progress?: number;
  className?: string;
}

const sizeConfig = {
  sm: { spinner: "w-4 h-4", dot: "w-2 h-2", text: "text-xs" },
  md: { spinner: "w-6 h-6", dot: "w-3 h-3", text: "text-sm" },
  lg: { spinner: "w-8 h-8", dot: "w-4 h-4", text: "text-base" },
  xl: { spinner: "w-12 h-12", dot: "w-5 h-5", text: "text-lg" },
};

const SpinnerLoader: React.FC<{ size: LoaderSize }> = ({ size }) => (
  <div
    className={`${sizeConfig[size].spinner} animate-spin rounded-full border-2 border-slate-300/30 border-t-blue-500`}
  />
);

const DotsLoader: React.FC<{ size: LoaderSize }> = ({ size }) => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={`${sizeConfig[size].dot} bg-blue-500 rounded-full animate-pulse`}
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: "1.4s",
        }}
      />
    ))}
  </div>
);

const ProgressLoader: React.FC<{ progress: number; size: LoaderSize }> = ({
  progress,
  size,
}) => {
  const progressConfig = {
    sm: { width: "w-32", height: "h-1" },
    md: { width: "w-48", height: "h-2" },
    lg: { width: "w-64", height: "h-3" },
    xl: { width: "w-80", height: "h-3" },
  };

  const { width, height } = progressConfig[size];

  return (
    <div
      className={`${width} ${height} bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm`}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

const PulseLoader: React.FC<{ size: LoaderSize }> = ({ size }) => (
  <div className="flex items-center justify-center">
    <div
      className={`${sizeConfig[size].spinner} bg-blue-500/20 rounded-full animate-ping`}
    />
    <div
      className={`${sizeConfig[size].spinner} bg-blue-500/40 rounded-full animate-ping absolute`}
      style={{ animationDelay: "0.5s" }}
    />
    <div
      className={`${sizeConfig[size].dot} bg-blue-500 rounded-full absolute`}
    />
  </div>
);

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({
  variant = "spinner",
  size = "md",
  message,
  progress = 0,
  className = "",
}) => {
  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return <SpinnerLoader size={size} />;
      case "dots":
        return <DotsLoader size={size} />;
      case "progress":
        return <ProgressLoader progress={progress} size={size} />;
      case "pulse":
        return <PulseLoader size={size} />;
      default:
        return <SpinnerLoader size={size} />;
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {renderLoader()}
      {message && (
        <p
          className={`${sizeConfig[size].text} text-slate-300 font-medium text-center max-w-xs animate-pulse`}
        >
          {message}
        </p>
      )}
      {variant === "progress" && (
        <span className={`${sizeConfig[size].text} text-slate-400 font-mono`}>
          {progress.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
