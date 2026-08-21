"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import AAButton from "./AAButton";
import BaseModalContainer from "./modals/BaseModalContainer";

type SignInFormProps = {
  open: boolean;
  onClose: () => void;
};

const BENEFITS = [
  {
    icon: "bolt",
    label: "benefitUsageLabel",
    description: "benefitUsageDescription",
  },
  {
    icon: "school",
    label: "benefitCourseLabel",
    description: "benefitCourseDescription",
  },
  {
    icon: "quiz",
    label: "benefitQuizLabel",
    description: "benefitQuizDescription",
  },
] as const;

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

export default function SignInForm({
  open,
  onClose,
}: Readonly<SignInFormProps>) {
  const t = useTranslations("auth");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setError(false);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  return (
    <BaseModalContainer
      open={open}
      onClose={handleClose}
      sizeClassName="w-[min(94vw,680px)] max-h-[85vh]"
      closeOnOverlay={!isSubmitting}
      showHeader={false}
      contentClassName="relative"
      contentProps={{ "aria-busy": isSubmitting }}
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label={t("closeForm")}
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            close
          </span>
        </button>

        <div className="px-2 text-center sm:px-8">
          <span
            className="material-symbols-outlined font-light leading-none text-slate-100"
            style={{ fontSize: "72px" }}
            aria-hidden
          >
            account_circle
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {t("formTitle")}
          </h2>
          <p className="mt-3 whitespace-normal text-sm leading-relaxed text-slate-300 sm:whitespace-nowrap">
            {t("formDescription")}
          </p>
        </div>

        <section aria-labelledby="sign-in-benefits-title">
          <h3
            id="sign-in-benefits-title"
            className="text-sm font-semibold text-slate-100"
          >
            {t("benefitsTitle")}
          </h3>
          <ul className="mt-3 divide-y divide-white/10">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit.label}
                className="flex items-center gap-4 px-1 py-3"
              >
                <span
                  className="material-symbols-outlined shrink-0 text-[24px] text-slate-200"
                  aria-hidden
                >
                  {benefit.icon}
                </span>
                <span className="min-w-0 text-sm leading-relaxed">
                  <strong className="block font-semibold text-slate-100">
                    {t(benefit.label)}
                  </strong>
                  <span className="text-slate-400">
                    {t(benefit.description)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <AAButton
          type="submit"
          variant="google"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span
              className="material-symbols-outlined animate-spin text-[20px]"
              aria-hidden
            >
              progress_activity
            </span>
          ) : (
            <GoogleIcon />
          )}
          {isSubmitting ? t("submitting") : t("signInGoogle")}
        </AAButton>

        {error && (
          <p
            className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
            role="alert"
          >
            {t("oauthError")}
          </p>
        )}
      </form>
    </BaseModalContainer>
  );
}
