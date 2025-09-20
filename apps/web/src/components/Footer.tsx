// path: apps/web/src/components/Footer.tsx
import HealthStatus from "./HealthStatus";

export default function Footer() {
  return (
    <footer className="mt-8 flex w-full items-center justify-center py-6">
      <HealthStatus />
    </footer>
  );
}
