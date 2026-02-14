import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { GlobalLoaderOverlay } from "@/components/GlobalLoaderOverlay";
import NavigationLoadingWrapper from "@/components/NavigationLoadingWrapper";
import { GlobalLoaderProvider } from "@/contexts/GlobalLoaderContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <GlobalLoaderProvider>
        <NavigationProvider>
          <NavigationLoadingWrapper>{children}</NavigationLoadingWrapper>
        </NavigationProvider>
        <GlobalLoaderOverlay />
      </GlobalLoaderProvider>
    </NextIntlClientProvider>
  );
}
