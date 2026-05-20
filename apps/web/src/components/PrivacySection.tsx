import type { ReactNode } from "react";

interface PrivacySectionProps {
  title: string;
  children: ReactNode;
}

export function PrivacySection({ title, children }: PrivacySectionProps) {
  return (
    <section className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-1 rounded-full bg-primary/70"
          aria-hidden="true"
        />
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-4 space-y-4 text-sm leading-7 text-dark-text">
        {children}
      </div>
    </section>
  );
}
