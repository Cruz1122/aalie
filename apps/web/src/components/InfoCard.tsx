import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  accentClassName?: string;
  children?: ReactNode;
}

export function InfoCard({
  title,
  description,
  icon,
  accentClassName = "border-primary/30",
  children,
}: InfoCardProps) {
  return (
    <article
      className={`glass-card rounded-2xl border p-5 sm:p-6 ${accentClassName}`}
    >
      {icon ? (
        <div className="mb-5 flex justify-center text-primary [&_.material-symbols-outlined]:text-[2.8rem] [&_svg]:h-14 [&_svg]:w-14">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-dark-text">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
