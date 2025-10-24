// path: apps/web/src/components/Footer.tsx
import HealthStatus from "./HealthStatus";

export default function Footer() {
  return (
    <footer className="glass-header px-6 py-3 text-center">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <a
          className="text-dark-text hover:text-white transition-colors"
          href="https://ingenierias.ucaldas.edu.co"
        >
          Universidad de Caldas - 2025
        </a>
        <span className="text-slate-600">•</span>
        <a className="text-dark-text hover:text-white transition-colors" href="/privacy">
          Política de Privacidad
        </a>
        <span className="text-slate-600">•</span>
        <HealthStatus />
      </div>
    </footer>
  );
}
