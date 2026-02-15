"use client";

interface PageHeaderProps {
  /** Icono: nombre de material-symbols-outlined (string) o elemento React (ej. Lucide) */
  icon: string | React.ReactNode;
  title: string;
  description: string;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Contenido opcional debajo de la descripción (ej. badge de última actualización) */
  children?: React.ReactNode;
}

export function PageHeader({
  icon,
  title,
  description,
  className = "",
  children,
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col items-center text-center space-y-3 mb-6 ${className}`}
      aria-labelledby="page-header-title"
    >
      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
        {typeof icon === "string" ? (
          <span className="material-symbols-outlined text-primary text-2xl">
            {icon}
          </span>
        ) : (
          <div className="text-primary [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
        )}
      </div>
      <h1
        id="page-header-title"
        className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight"
      >
        {title}
      </h1>
      <p className="text-dark-text text-xs sm:text-sm lg:text-base leading-relaxed max-w-3xl">
        {description}
      </p>
      {children}
    </header>
  );
}
