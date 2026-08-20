"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type ProfileUser = {
  name: string;
  email: string;
  emailVerified: boolean;
};

export default function ProfileView() {
  const t = useTranslations("profile");
  const { data: session, error, isPending, refetch } = authClient.useSession();
  const user = (session?.user as ProfileUser | undefined) ?? null;
  const state = isPending
    ? "loading"
    : error
      ? "error"
      : user
        ? "ready"
        : "unauthenticated";

  const isUniversityMember =
    user?.email.toLowerCase().endsWith("@ucaldas.edu.co") ?? false;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center text-center">
      {state === "loading" && (
        <section
          className="flex flex-col items-center gap-4"
          aria-live="polite"
        >
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-8 w-52 animate-pulse rounded bg-white/10" />
          <div className="h-5 w-64 animate-pulse rounded bg-white/[0.06]" />
          <span className="sr-only">{t("loading")}</span>
        </section>
      )}

      {state === "error" && (
        <section className="max-w-xl space-y-5" role="alert">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {t("error.title")}
          </h2>
          <p className="text-[15px] leading-7 text-dark-text">
            {t("error.body")}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
          >
            {t("error.retry")}
          </button>
        </section>
      )}

      {state === "unauthenticated" && (
        <section className="max-w-xl space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {t("unauthenticated.title")}
          </h2>
          <p className="text-[15px] leading-7 text-dark-text">
            {t("unauthenticated.body")}
          </p>
          <Link
            href="/"
            className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
          >
            {t("unauthenticated.action")}
          </Link>
        </section>
      )}

      {state === "ready" && user && (
        <section className="flex w-full flex-col items-center">
          <span
            className="material-symbols-outlined shrink-0 leading-none text-slate-100"
            style={{ fontSize: "96px" }}
            aria-hidden
          >
            account_circle
          </span>

          <h1 className="mt-5 max-w-full truncate text-3xl font-bold tracking-tight text-white">
            {user.name}
          </h1>
          <p className="mt-2 max-w-full truncate text-[15px] text-dark-text">
            {user.email}
          </p>

          {(isUniversityMember || user.emailVerified) && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {isUniversityMember && (
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
                  title={t("universityBadge")}
                >
                  <Image
                    src="/ucaldas.svg"
                    width={24}
                    height={24}
                    alt={t("universityBadge")}
                  />
                </span>
              )}
              {user.emailVerified && (
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
                  title={t("verifiedEmail")}
                >
                  <span
                    className="material-symbols-outlined leading-none text-white"
                    style={{ fontSize: "24px" }}
                    role="img"
                    aria-label={t("verifiedEmail")}
                  >
                    verified
                  </span>
                </span>
              )}
            </div>
          )}

          <p className="mt-10 max-w-xl text-sm leading-6 text-dark-text">
            {t("privacy.body")}{" "}
            <Link
              href="/privacy"
              className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              {t("privacy.action")}
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
