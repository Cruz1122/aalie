"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UserGuideCard } from "@/components/UserGuideCard";
import { useNavigation } from "@/contexts/NavigationContext";
import { useContentProgress } from "@/hooks/useContentProgress";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useRouter } from "@/i18n/navigation";
import type { AssistantContext } from "@/lib/assistant/types";
import { searchContentIndex } from "@/lib/content/search";
import type { UserGuideLandingData } from "@/lib/content/types";

interface UserGuideLandingViewProps {
  data: UserGuideLandingData;
}

export function UserGuideLandingView({ data }: UserGuideLandingViewProps) {
  const locale = useLocale();
  const t = useTranslations("contentUi");
  const router = useRouter();
  const { finishNavigation, startNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();
  const { moduleProgressById, spaceProgress } = useContentProgress(
    data.space.spaceId,
    data.modules,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const matches = useMemo(
    () => searchContentIndex(data.searchIndex, data.modules, query).slice(0, 6),
    [data.modules, data.searchIndex, query],
  );

  const assistantContext: AssistantContext = useMemo(
    () => ({
      surface: "user-guide",
      locale,
      pageContext: {
        route: data.space.route,
        view: "guide-grid",
        title: data.space.title,
        description: data.space.description,
        query: query.trim() || undefined,
        notes: [`modules=${data.modules.length}`, `progress=${spaceProgress}`],
      },
    }),
    [data.modules.length, data.space, locale, query, spaceProgress],
  );

  const handleNavigate = (href: string) => {
    setQuery("");
    startNavigation();
    router.push(href);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <section className="relative">
            <label className="glass-card flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && matches.length > 0) {
                    handleNavigate(matches[0].entry.route);
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAriaLabel")}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            {query.trim() ? (
              <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#182431] shadow-xl">
                {matches.length > 0 ? (
                  <ul className="divide-y divide-white/10">
                    {matches.map((match) => (
                      <li key={`${match.entry.kind}-${match.entry.id}`}>
                        <button
                          type="button"
                          onClick={() => handleNavigate(match.entry.route)}
                          className="w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
                        >
                          <div className="text-sm font-semibold text-white">
                            {match.entry.title}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            {match.moduleTitle}
                          </div>
                          {match.snippet ? (
                            <div className="mt-2 text-xs leading-5 text-slate-300">
                              {match.snippet}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-400">
                    <div className="font-semibold text-white">
                      {t("emptySearchTitle")}
                    </div>
                    <div className="mt-1">{t("emptySearchDescription")}</div>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section aria-label={t("moduleGrid")} className="documentation-grid">
            {data.modules.map((module) => (
              <div key={module.moduleId} className="min-w-0 h-full">
                <UserGuideCard
                  module={module}
                  progress={moduleProgressById[module.moduleId] ?? 0}
                />
              </div>
            ))}
          </section>
        </div>
      </main>

      <EmbeddedAssistantLauncher
        surface="user-guide"
        assistantContext={assistantContext}
        onAnalyzeCode={(code) => {
          void runAnalysis(code);
        }}
      />

      <Footer />
    </div>
  );
}
