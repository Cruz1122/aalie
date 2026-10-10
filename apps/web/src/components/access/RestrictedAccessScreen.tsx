"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import AAButton from "@/components/AAButton";
import AALIEEmotionIcon from "@/components/AALIEEmotionIcon";
import AALIEIcon from "@/components/AALIEIcon";
import { authClient } from "@/lib/auth-client";
import { leaveApp } from "@/lib/leave-app";

const CONTACT_EMAIL = "luzenith_g@ucaldas.edu.co";

type RestrictedAccessScreenProps = {
  readonly mode: "login" | "denied";
};

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.27.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}

export default function RestrictedAccessScreen({
  mode,
}: RestrictedAccessScreenProps) {
  const t = useTranslations("accessGate");
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const denied = mode === "denied";
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t("mailSubject"))}`;

  const handleSignIn = async () => {
    setError(false);
    setIsSubmitting(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });
      if (result.error) {
        setError(true);
        setIsSubmitting(false);
      }
    } catch {
      setError(true);
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError(false);
    setIsSubmitting(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(true);
        setIsSubmitting(false);
        return;
      }
      leaveApp(locale);
    } catch {
      setError(true);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
            denied
              ? "bg-gradient-to-br from-rose-500/30 to-red-500/20 text-rose-300"
              : "bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-purple-300"
          }`}
        >
          {denied ? (
            <AALIEEmotionIcon name="worried" size={42} />
          ) : (
            <AALIEIcon size={42} />
          )}
        </div>
        <h1
          className={`text-xl font-semibold sm:text-2xl ${
            denied ? "text-rose-400" : "text-purple-400"
          }`}
        >
          {denied ? t("deniedTitle") : t("restrictedTitle")}
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-200">
          {denied ? t("deniedBody") : t("restrictedBody")}
        </p>
        {denied ? (
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
            {t.rich("deniedHelp", {
              contact: (chunks) => (
                <a
                  href={mailto}
                  className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
                >
                  {chunks}
                </a>
              ),
              signOut: (chunks) => (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSubmitting}
                  className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white disabled:opacity-50"
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
        ) : (
          <AAButton
            type="button"
            variant="google"
            size="lg"
            className="mt-8"
            onClick={handleSignIn}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            {isSubmitting ? t("signingIn") : t("signIn")}
          </AAButton>
        )}
        {error ? (
          <p className="mt-4 text-sm text-rose-300" role="alert">
            {denied ? t("signOutError") : t("signInError")}
          </p>
        ) : null}
      </div>
    </main>
  );
}
