"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";

export default function DocumentationPage() {
  const { finishNavigation } = useNavigation();
  const t = useTranslations("documentation.index");

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 z-10 max-w-7xl mx-auto">
        {/* Card Documentación Técnica */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">
            code
          </span>
          <h2 className="text-xl font-bold mb-2">{t("technicalTitle")}</h2>
          <p className="text-sm text-dark-text mb-6">
            {t("technicalDesc")}
          </p>
          <NavigationLink
            href="/documentation/technical"
            className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors hover:bg-white/20"
          >
            <span className="material-symbols-outlined mr-2">terminal</span>{" "}
            {t("technicalLink")}
          </NavigationLink>
        </div>

        {/* Card Documentación de Usuario */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">
            menu_book
          </span>
          <h2 className="text-xl font-bold mb-2">{t("userGuideTitle")}</h2>
          <p className="text-sm text-dark-text mb-6">
            {t("userGuideDesc")}
          </p>
          <NavigationLink
            href="/user-guide"
            className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors hover:bg-white/20"
          >
            <span className="material-symbols-outlined mr-2">school</span>{" "}
            {t("userGuideLink")}
          </NavigationLink>
        </div>

        {/* Card Ejemplos */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">
            code_blocks
          </span>
          <h2 className="text-xl font-bold mb-2">{t("examplesTitle")}</h2>
          <p className="text-sm text-dark-text mb-6">
            {t("examplesDesc")}
          </p>
          <NavigationLink
            href="/examples"
            className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors hover:bg-white/20"
          >
            <span className="material-symbols-outlined mr-2">lightbulb</span>{" "}
            {t("examplesLink")}
          </NavigationLink>
        </div>
      </main>

      <Footer />
    </div>
  );
}
