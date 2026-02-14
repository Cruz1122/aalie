import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested)
      ? requested
      : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;
  let examplesItems: Record<string, { name: string; description: string; complexity: string; note?: string }> | null = null;
  try {
    examplesItems = (
      await import(`../../messages/examples-items-${locale}.json`)
    ).default;
  } catch {
    // examples-items-{locale}.json no existe para este locale
  }
  if (messages.examples && examplesItems) {
    (messages as Record<string, unknown>).examples = {
      ...messages.examples,
      items: examplesItems,
    };
  }

  return {
    locale,
    messages,
  };
});
