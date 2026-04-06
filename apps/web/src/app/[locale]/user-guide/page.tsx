"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { PageHeader } from "@/components/PageHeader";
import { UserGuideCard } from "@/components/UserGuideCard";
import UserGuideModal from "@/components/UserGuideModal";
import { UserGuideTableOfContents } from "@/components/UserGuideTableOfContents";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useUserGuideSections } from "@/hooks/useUserGuideSections";
import type { AssistantContext } from "@/lib/assistant/types";
import { UserGuideBlock, UserGuideSection } from "@/types/user-guide";

function summarizeGuideBlocks(
  blocks: UserGuideBlock[],
  t: (key: string) => string,
  limit = 3,
) {
  const parts: string[] = [];

  const visit = (blockList: UserGuideBlock[]) => {
    for (const block of blockList) {
      if (parts.length >= limit) {
        return;
      }

      if (block.type === "paragraph") {
        parts.push(t(block.textKey));
      } else if (block.type === "note" && block.contentKey) {
        parts.push(t(block.contentKey));
      } else if (block.type === "link") {
        parts.push(t(block.linkKey));
      } else if (block.type === "subsection") {
        visit(block.blocks);
      }
    }
  };

  visit(blocks);
  return parts.join(" ");
}

export default function UserGuidePage() {
  const locale = useLocale();
  const t = useTranslations("userGuide");
  const sections = useUserGuideSections();
  const [selectedSection, setSelectedSection] =
    useState<UserGuideSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { finishNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const openModal = (section: UserGuideSection) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSection(null);
    setIsModalOpen(false);
  };

  const assistantContext: AssistantContext = {
    surface: "user-guide",
    locale,
    pageContext: {
      route: "/user-guide",
      view: isModalOpen && selectedSection ? "section-modal" : "guide-grid",
      title: t("title"),
      description: t("subtitle"),
      notes: selectedSection ? [selectedSection.id] : undefined,
    },
    guideSection: selectedSection
      ? {
          id: selectedSection.id,
          title: t(selectedSection.titleKey),
          description: t(selectedSection.descriptionKey),
          summary: summarizeGuideBlocks(selectedSection.content.blocks, t),
        }
      : undefined,
  };

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
            <UserGuideTableOfContents sections={sections} />

            <div className="lg:col-span-3 min-w-0">
              <section aria-label={t("toc")} className="min-w-0">
                <div className="documentation-grid">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 min-w-0 overflow-hidden"
                    >
                      <UserGuideCard
                        section={section}
                        onOpenSection={openModal}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <NavigationFooter
            namespace="userGuide"
            next={{ href: "/examples", labelKey: "viewExamples" }}
          />
        </div>
      </main>

      <UserGuideModal
        open={isModalOpen}
        onClose={closeModal}
        section={selectedSection}
      />

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
