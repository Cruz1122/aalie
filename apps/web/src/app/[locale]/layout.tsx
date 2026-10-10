import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import RestrictedAccessScreen from "@/components/access/RestrictedAccessScreen";
import { AdminNavProvider } from "@/components/AdminNav";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { GlobalLoaderOverlay } from "@/components/GlobalLoaderOverlay";
import NavigationLoadingWrapper from "@/components/NavigationLoadingWrapper";
import { AnalysisProgressProvider } from "@/contexts/AnalysisProgressContext";
import { GlobalLoaderProvider } from "@/contexts/GlobalLoaderContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { routing } from "@/i18n/routing";
import { resolveAccessGate } from "@/lib/access-allowlist";
import { getAuth } from "@/lib/auth";
import { isOperatorAdminEmail } from "@/lib/operator-admins";
import { restrictedAccessEnabled } from "@/lib/restricted-access";

// The access gate is controlled by runtime OCI configuration and request auth.
export const dynamic = "force-dynamic";

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

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const sessionUser = await readSessionUser();
  const accessGate = restrictedAccessEnabled()
    ? await resolveAccessGate(sessionUser?.email ?? null)
    : "open";
  const isAdmin =
    sessionUser?.role === "ADMIN" || isOperatorAdminEmail(sessionUser?.email);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AdminNavProvider isAdmin={isAdmin}>
        <GlobalLoaderProvider>
          <AnalysisProgressProvider>
            <NavigationProvider>
              <NavigationLoadingWrapper>
                <AppErrorBoundary locale={locale}>
                  {accessGate === "open" ? (
                    children
                  ) : (
                    <RestrictedAccessScreen mode={accessGate} />
                  )}
                </AppErrorBoundary>
              </NavigationLoadingWrapper>
            </NavigationProvider>
            <GlobalLoaderOverlay />
          </AnalysisProgressProvider>
        </GlobalLoaderProvider>
      </AdminNavProvider>
    </NextIntlClientProvider>
  );
}

async function readSessionUser(): Promise<{
  email: string | null;
  role: string | null;
} | null> {
  try {
    const session = await getAuth().api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session?.user) return null;
    const user = session.user as {
      email?: string | null;
      role?: string | null;
    };
    return {
      email: user.email ?? null,
      role: user.role ?? null,
    };
  } catch (error) {
    console.error("restricted access session check failed", error);
    return null;
  }
}
