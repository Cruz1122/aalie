// path: apps/web/src/components/Footer.tsx
import HealthStatus from "./HealthStatus";

export default function Footer() {
  return (
    <footer className="glass-header px-10 py-6 text-center">
      <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-sm">
              <a className="text-dark-text hover:text-white transition-colors" href="https://ingenierias.ucaldas.edu.co">Universidad de Caldas - 2025</a>
        <a className="text-dark-text hover:text-white transition-colors" href="/privacy">Política de Privacidad</a>
      </div>
      <div className="flex items-center justify-center gap-2">
          <HealthStatus />
      </div>
    </footer>
  );
}
