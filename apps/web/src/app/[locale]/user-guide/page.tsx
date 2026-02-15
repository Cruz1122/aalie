"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import AALIEIcon from "@/components/AALIEIcon";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ImageModal } from "@/components/ImageModal";
import { NavigationFooter } from "@/components/NavigationFooter";
import NavigationLink from "@/components/NavigationLink";
import { PageHeader } from "@/components/PageHeader";
import { useNavigation } from "@/contexts/NavigationContext";
import { useImageModal } from "@/hooks/useImageModal";

interface TableOfContentsItem {
  id: string;
  titleKey: string;
  icon: string;
  subsections?: { id: string; titleKey: string; icon?: string }[];
}

export default function UserGuidePage() {
  const t = useTranslations("userGuide");
  const tableOfContents: TableOfContentsItem[] = [
    { id: "introduccion", titleKey: "introduccion", icon: "info" },
    {
      id: "editor",
      titleKey: "editor",
      icon: "edit",
      subsections: [
        { id: "editor-basico", titleKey: "editorBasico", icon: "settings" },
        { id: "editor-validacion", titleKey: "editorValidacion", icon: "verified" },
        { id: "editor-atajos", titleKey: "editorAtajos", icon: "keyboard" },
      ],
    },
    {
      id: "gramatica",
      titleKey: "gramatica",
      icon: "code",
      subsections: [
        { id: "gramatica-procedimientos", titleKey: "gramaticaProcedimientos", icon: "functions" },
        { id: "gramatica-variables", titleKey: "gramaticaVariables", icon: "variable_add" },
        { id: "gramatica-estructuras", titleKey: "gramaticaEstructuras", icon: "account_tree" },
        { id: "gramatica-operadores", titleKey: "gramaticaOperadores", icon: "calculate" },
        { id: "gramatica-arrays", titleKey: "gramaticaArrays", icon: "data_array" },
        { id: "gramatica-print", titleKey: "gramaticaPrint", icon: "print" },
      ],
    },
    {
      id: "analisis",
      titleKey: "analisis",
      icon: "analytics",
      subsections: [
        { id: "analisis-editor", titleKey: "analisisEditor", icon: "code" },
        { id: "analisis-chatbot", titleKey: "analisisChatbot", icon: "aalie" },
        { id: "analisis-resultados", titleKey: "analisisResultados", icon: "insights" },
        { id: "analisis-llm", titleKey: "analisisLlm", icon: "compare_arrows" },
        { id: "analisis-gpu-cpu", titleKey: "analisisGpuCpu", icon: "memory" },
        { id: "analisis-trace", titleKey: "analisisTrace", icon: "route" },
      ],
    },
    { id: "ejemplos", titleKey: "ejemplos", icon: "lightbulb" },
    { id: "errores", titleKey: "errores", icon: "bug_report" },
  ];
  const { selectedImage, closeModal, isModalOpen } = useImageModal();
  const [activeSection, setActiveSection] = useState<string>("introduccion");
  const { finishNavigation } = useNavigation();

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon="menu_book"
            title={t("title")}
            description={t("subtitle")}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Índice lateral mejorado */}
            <aside className="lg:col-span-1">
              <div className="glass-card p-5 sticky top-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">
                    list
                  </span>
                  <h2 className="text-lg font-bold text-white">{t("toc")}</h2>
                </div>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <div key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${activeSection === item.id
                          ? "text-white bg-primary/20 border border-primary/30"
                          : "text-dark-text hover:text-white hover:bg-white/5"
                          }`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          {item.icon}
                        </span>
                        <span>{t(item.titleKey)}</span>
                      </a>
                      {item.subsections && (
                        <div className="ml-6 space-y-1 mt-1 border-l border-white/10 pl-3">
                          {item.subsections.map((sub) => (
                            <a
                              key={sub.id}
                              href={`#${sub.id}`}
                              className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded transition-all ${activeSection === sub.id
                                ? "text-primary bg-white/10"
                                : "text-dark-text hover:text-white hover:bg-white/5"
                                }`}
                              onClick={() => setActiveSection(sub.id)}
                            >
                              {sub.icon && (
                                sub.icon === "aalie" ? (
                                  <AALIEIcon className="text-primary" size={14} />
                                ) : (
                                  <span className="material-symbols-outlined text-xs">
                                    {sub.icon}
                                  </span>
                                )
                              )}
                              <span>{t(sub.titleKey)}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-8">
              {/* Introducción */}
              <section
                id="introduccion"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      info
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("introduccion")}
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("introDesc1")}
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("introDesc2")}
                  </p>
                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                        lightbulb
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          {t("introTip")}
                        </p>
                        <p className="text-blue-200 text-sm">
                            {t("introTipDescPre")}
                            <NavigationLink
                              href="/examples"
                              className="underline hover:text-blue-100 font-medium"
                            >
                              {t("introTipDescLinkText")}
                            </NavigationLink>
                            {t("introTipDescPost")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Uso del Editor */}
              <section
                id="editor"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      edit
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("editor")}
                  </h2>
                </div>

                <div id="editor-basico" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      settings
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("editorBasico")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("editorBasicDesc")}
                    </p>
                    <ul className="list-none space-y-2 ml-2">
                      {[t("editorBasic1"), t("editorBasic2"), t("editorBasic3"), t("editorBasic4"), t("editorBasic5")].map((text, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="text-sm sm:text-base">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div id="editor-validacion" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      verified
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("editorValidacion")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("editorValidDesc")}
                    </p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-400 text-sm mt-0.5 shrink-0">
                          error
                        </span>
                        <span className="text-sm sm:text-base">{t("editorValid1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-yellow-400 text-sm mt-0.5 shrink-0">
                          warning
                        </span>
                        <span className="text-sm sm:text-base">{t("editorValid2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5 shrink-0">
                          info
                        </span>
                        <span className="text-sm sm:text-base">{t("editorValid3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5 shrink-0">
                          info
                        </span>
                        <span className="text-sm sm:text-base">{t("editorValid4")}</span>
                      </li>
                    </ul>
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl shrink-0">
                          info
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            {t("editorValidNote")}
                          </p>
                          <p className="text-yellow-200 text-sm">
                            {t("editorValidNoteDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="editor-atajos" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      keyboard
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("editorAtajos")}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="glass-secondary rounded-lg overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-left py-3 px-4 text-white font-semibold">
                              {t("shortcutShortcut")}
                            </th>
                            <th className="text-left py-3 px-4 text-white font-semibold">
                              {t("shortcutAction")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-text">
                          {[
                            ["Ctrl+S", "shortcut1"],
                            ["Ctrl+F", "shortcut2"],
                            ["Ctrl+H", "shortcut3"],
                            ["Ctrl+/", "shortcut4"],
                            ["Tab", "shortcut5"],
                            ["Shift+Tab", "shortcut6"],
                          ].map(([key, label]) => (
                            <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-mono bg-slate-800/50">
                                <code className="text-cyan-300">{key}</code>
                              </td>
                              <td className="py-3 px-4">{t(label)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sintaxis de la Gramática */}
              <section
                id="gramatica"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      code
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("gramatica")}
                  </h2>
                </div>

                <div
                  id="gramatica-procedimientos"
                  className="mb-8 scroll-mt-24"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      functions
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("gramaticaProcedimientos")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("gramProcDesc")}
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`nombreProcedimiento(parametros) BEGIN
    sentencias...
END`}
                      </pre>
                    </div>
                    <p className="mt-4 text-sm sm:text-base">{t("gramProcTypes")}</p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramProcScalar")}</strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            factorial(n)
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramProcArrayDim")}</strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            buscar(A[n], x)
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramProcArrayRange")}</strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            ordenar(A[1]..[n])
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramProcTyped")}</strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            procesar(Lista lista)
                          </code>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div id="gramatica-variables" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      variable_add
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("gramaticaVariables")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("gramVarDesc")}
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`variable <- expresion;    // Recomendado
variable := expresion;    // Estilo Pascal
variable 🡨 expresion;     // Unicode
variable ← expresion;     // Unicode
variable ⟵ expresion;     // Unicode`}
                      </pre>
                    </div>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                          info
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            {t("gramVarImportant")}
                          </p>
                          <p className="text-blue-200 text-sm">
                            {t("gramVarImportantDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="gramatica-estructuras" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      account_tree
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("gramaticaEstructuras")}
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <span className="material-symbols-outlined text-sm">
                          code
                        </span>
                        {t("gramStructIf")}
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`IF (condicion) THEN BEGIN
    sentencias...
END
ELSE BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <span className="material-symbols-outlined text-sm">
                          loop
                        </span>
                        {t("gramStructFor")}
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`FOR variable <- inicio TO fin DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <span className="material-symbols-outlined text-sm">
                          repeat
                        </span>
                        {t("gramStructWhile")}
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`WHILE (condicion) DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <span className="material-symbols-outlined text-sm">
                          repeat_one
                        </span>
                        {t("gramStructRepeat")}
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`REPEAT
    sentencias...
UNTIL (condicion);`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl shrink-0">
                          warning
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            {t("gramStructImportant")}
                          </p>
                          <p className="text-yellow-200 text-sm">
                            {t("gramStructImportantDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="gramatica-operadores" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      calculate
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("gramaticaOperadores")}
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <div className="overflow-x-auto">
                      <div className="glass-secondary rounded-lg overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                {t("gramOpType")}
                              </th>
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                {t("gramOpOps")}
                              </th>
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                {t("gramOpPrec")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                {t("gramOpArith")}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  + - * / DIV MOD
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                {t("gramOpPrecArith")}
                              </td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                {t("gramOpRel")}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  = != {"<"} {">"} {"<="} {">="}
                                </code>
                              </td>
                              <td className="py-3 px-4">{t("gramOpPrecRel")}</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                {t("gramOpLog")}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  AND OR NOT
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                {t("gramOpPrecLog")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <p className="text-dark-text mb-2 text-sm sm:text-base">{t("gramOpExamples")}</p>
                      <pre className="text-green-300 m-0">
                        {`resultado <- (a + b) * c;
es_valido <- (x > 0) AND (x < 100);
cociente <- total DIV cantidad;
resto <- total MOD cantidad;`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div id="gramatica-arrays" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      data_array
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">{t("gramaticaArrays")}</h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("gramArraysDesc")}
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`// Declaración
A[10];              // Array de 10 elementos
matriz[5][5];       // Matriz 5x5

// Acceso
elemento <- A[i];
valor <- matriz[i][j];

// Asignación
A[i] <- valor;
matriz[i][j] <- A[i] + 1;`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div id="gramatica-print" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      print
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("gramaticaPrint")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("gramPrintDesc")}
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`print("Hola mundo");
print("Total: ", resultado);
print("Valor de n: " + n);
print("Suma: ", a + b);

// Escapar comillas internas
print("Dijo \"hola\" y salió");`}
                      </pre>
                    </div>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramPrintLiteral")}</strong>{" "}
                          {t("gramPrintLiteralDesc")}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramPrintMulti")}</strong>{" "}
                          {t("gramPrintMultiDesc")}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramPrintExpr")}</strong>{" "}
                          {t("gramPrintExprDesc")}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm sm:text-base">
                          <strong className="text-white">{t("gramPrintEscape")}</strong>{" "}
                          {t("gramPrintEscapeDesc")}
                        </span>
                      </li>
                    </ul>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                          info
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            {t("gramPrintNote")}
                          </p>
                          <p className="text-blue-200 text-sm">
                            {t("gramPrintNoteDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Análisis de Complejidad */}
              <section
                id="analisis"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      analytics
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("analisis")}
                  </h2>
                </div>

                <div id="analisis-editor" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      code
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("analisisEditor")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("analisisEditorDesc")}
                    </p>
                    <ol className="list-none space-y-3 ml-2">
                      {[
                        [t("analisisEditor1"), t("analisisEditor1b")],
                        [t("analisisEditor2"), t("analisisEditor2b")],
                        [t("analisisEditor3"), t("analisisEditor3b")],
                        [t("analisisEditor4"), t("analisisEditor4b")],
                      ].map(([title, desc], i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                            {i + 1}
                          </span>
                          <div className="text-sm sm:text-base">
                            <strong className="text-white">{title}</strong>{" "}
                            {desc}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                          lightbulb
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            {t("analisisEditorTip")}
                          </p>
                          <p className="text-blue-200 text-sm">
                            {t("analisisEditorTipDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="analisis-chatbot" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <AALIEIcon className="text-primary" size={20} />
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("analisisChatbot")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("analisisChatbotDesc")}
                    </p>
                    <ol className="list-none space-y-3 ml-2">
                      {[
                        [t("analisisChatbot1"), t("analisisChatbot1b")],
                        [t("analisisChatbot2"), t("analisisChatbot2b")],
                        [t("analisisChatbot3"), t("analisisChatbot3b")],
                        [t("analisisChatbot4"), t("analisisChatbot4b")],
                      ].map(([title, desc], i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                            {i + 1}
                          </span>
                          <div className="text-sm sm:text-base">
                            <strong className="text-white">{title}</strong>{" "}
                            {desc}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-green-400 text-xl shrink-0">
                          check_circle
                        </span>
                        <div>
                          <p className="text-green-300 text-sm font-semibold mb-1">
                            {t("analisisChatbotAdv")}
                          </p>
                          <p className="text-green-200 text-sm">
                            {t("analisisChatbotAdvDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="analisis-resultados" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      insights
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {t("analisisResultados")}
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <p className="text-sm sm:text-base leading-relaxed">
                      {t("analisisResultDesc")}
                    </p>
                  <ul className="list-none space-y-2 ml-2">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisResult1")}</strong>{" "}
                        {t("analisisResult1b")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisResult2")}</strong>{" "}
                        {t("analisisResult2b")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisResult3")}</strong>{" "}
                        {t("analisisResult3b")}
                      </span>
                    </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <div>
                          <strong className="text-white">{t("analisisResult4")}</strong>
                          <ul className="list-none ml-4 mt-2 space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">•</span>
                              <span className="text-sm">{t("analisisResult4a")}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">•</span>
                              <span className="text-sm">{t("analisisResult4b")}</span>
                            </li>
                          </ul>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-6">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <span className="material-symbols-outlined text-primary text-lg">
                          tune
                        </span>
                        {t("analisisModes")}
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-400">
                              trending_up
                            </span>
                            <h5 className="font-semibold text-green-300">
                              {t("bestCase")}
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            {t("bestCaseDesc")}
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            {[t("bestCase1"), t("bestCase2"), t("bestCase3")].map((text, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400 text-xs mt-1">•</span>
                                <span>{text}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>{t("bestCaseEx")}</strong> {t("bestCaseExDesc")}
                          </p>
                        </div>

                        <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-red-400">
                              trending_down
                            </span>
                            <h5 className="font-semibold text-red-300">
                              {t("worstCase")}
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            {t("worstCaseDesc")}
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            {[t("worstCase1"), t("worstCase2"), t("worstCase3")].map((text, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-red-400 text-xs mt-1">•</span>
                                <span>{text}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>{t("worstCaseEx")}</strong> {t("worstCaseExDesc")}
                          </p>
                        </div>

                        <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-400">
                              show_chart
                            </span>
                            <h5 className="font-semibold text-blue-300">
                              {t("avgCase")}
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            {t("avgCaseDesc")}
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            {[t("avgCase1"), t("avgCase2"), t("avgCase3"), t("avgCase4")].map((text, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-400 text-xs mt-1">•</span>
                                <span>{text}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>{t("avgCaseEx")}</strong> {t("avgCaseExDesc")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl shrink-0">
                          info
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            {t("analisisResultNote")}
                          </p>
                          <p className="text-yellow-200 text-sm">
                            {t("analisisResultNoteDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Comparación con LLM */}
              <section
                id="analisis-llm"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      compare_arrows
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("analisisLlm")}
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("analisisLlmDesc")}
                  </p>
                  <ul className="list-none space-y-2 ml-2">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisLlm1")}</strong>{" "}
                        {t("analisisLlm1b")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisLlm2")}</strong>{" "}
                        {t("analisisLlm2b")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm sm:text-base">
                        <strong className="text-white">{t("analisisLlm3")}</strong>{" "}
                        {t("analisisLlm3b")}
                      </span>
                    </li>
                  </ul>
                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                        info
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          {t("analisisLlmNote")}
                        </p>
                        <p className="text-blue-200 text-sm">
                          {t("analisisLlmNoteDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Análisis GPU vs CPU */}
              <section
                id="analisis-gpu-cpu"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      memory
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("analisisGpuCpu")}
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("analisisGpuDesc")}
                  </p>
                  <div className="space-y-4 mt-4">
                    <div className="bg-purple-500/10 border-l-4 border-purple-500/50 rounded-r-lg p-4">
                      <h3 className="font-semibold text-purple-300 mb-2 text-lg">
                        {t("analisisGpuMetrics")}
                      </h3>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuRec")}</strong> {t("analisisGpuRecDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuBranch")}</strong> {t("analisisGpuBranchDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuLoops")}</strong> {t("analisisGpuLoopsDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuArrays")}</strong> {t("analisisGpuArraysDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuOps")}</strong> {t("analisisGpuOpsDesc")}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-cyan-500/10 border-l-4 border-cyan-500/50 rounded-r-lg p-4">
                      <h3 className="font-semibold text-cyan-300 mb-2 text-lg">
                        {t("analisisGpuRecs")}
                      </h3>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuGpu")}</strong> {t("analisisGpuGpuDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuCpuLabel")}</strong> {t("analisisGpuCpuDesc")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span><strong>{t("analisisGpuMix")}</strong> {t("analisisGpuMixDesc")}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seguimiento de Pseudocódigo */}
              <section
                id="analisis-trace"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      route
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("analisisTrace")}
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("analisisTraceDesc")}
                  </p>
                  <div className="space-y-4 mt-4">
                    <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-green-400">
                          code
                        </span>
                        <h3 className="font-semibold text-green-300 text-lg">
                          {t("analisisTraceIter")}
                        </h3>
                      </div>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        {[t("analisisTraceIter1"), t("analisisTraceIter2"), t("analisisTraceIter3"), t("analisisTraceIter4")].map((text, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-400 text-xs mt-1">•</span>
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-500/10 border-l-4 border-orange-500/50 rounded-r-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-orange-400">
                          account_tree
                        </span>
                        <h3 className="font-semibold text-orange-300 text-lg">
                          {t("analisisTraceRec")}
                        </h3>
                      </div>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        {[t("analisisTraceRec1"), t("analisisTraceRec2"), t("analisisTraceRec3"), t("analisisTraceRec4")].map((text, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-400 text-xs mt-1">•</span>
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-yellow-400 text-xl shrink-0">
                        info
                      </span>
                      <div>
                        <p className="text-yellow-300 text-sm font-semibold mb-1">
                          {t("analisisTraceNote")}
                        </p>
                        <p className="text-yellow-200 text-sm">
                          {t("analisisTraceNoteDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Ejemplos Rápidos */}
              <section
                id="ejemplos"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      lightbulb
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("ejemplos")}
                  </h2>
                </div>
                <div className="space-y-6 text-dark-text">
                  <p className="text-sm sm:text-base leading-relaxed">
                    {t("ejemplosDesc")}
                  </p>

                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span className="material-symbols-outlined text-primary text-sm">
                        calculate
                      </span>
                      {t("ejemplo1")}
                    </h4>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span className="material-symbols-outlined text-primary text-sm">
                        search
                      </span>
                      {t("ejemplo2")}
                    </h4>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                        arrow_forward
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          {t("ejemplosMore")}
                        </p>
                        <p className="text-blue-200 text-sm">
                            {t("ejemplosMoreDescPre")}
                            <NavigationLink
                              href="/examples"
                              className="underline hover:text-blue-100 font-medium"
                            >
                              {t("ejemplosMoreDescLinkText")}
                            </NavigationLink>
                            {t("ejemplosMoreDescPost")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Solución de Problemas */}
              <section
                id="errores"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      bug_report
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {t("errores")}
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            {t("errorUnexpected")}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">{t("errorUnexpectedCause")}</strong>{" "}
                              {t("errorUnexpectedCauseDesc")}
                            </p>
                            <p>
                              <strong className="text-white">{t("errorUnexpectedSol")}</strong>{" "}
                              {t("errorUnexpectedSolDesc")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            {t("errorMissingBegin")}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">{t("errorUnexpectedCause")}</strong>{" "}
                              {t("errorMissingBeginCause")}
                            </p>
                            <p>
                              <strong className="text-white">{t("errorUnexpectedSol")}</strong>{" "}
                              {t("errorMissingBeginSol")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            {t("errorMissingSemicolon")}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">{t("errorUnexpectedCause")}</strong>{" "}
                              {t("errorMissingSemicolonCause")}
                            </p>
                            <p>
                              <strong className="text-white">{t("errorUnexpectedSol")}</strong>{" "}
                              {t("errorMissingSemicolonSol")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">
                          warning
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-300 mb-2">
                            {t("errorApiUnavailable")}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">{t("errorUnexpectedCause")}</strong>{" "}
                              {t("errorApiCause")}
                            </p>
                            <p>
                              <strong className="text-white">{t("errorUnexpectedSol")}</strong>{" "}
                              {t("errorApiSol")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <NavigationFooter
                namespace="userGuide"
                prev={{ href: "/documentation", labelKey: "backToDoc" }}
                next={{ href: "/examples", labelKey: "viewExamples" }}
              />
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <Footer />
    </div>
  );
}
