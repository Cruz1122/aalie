"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

import SignInForm from "./SignInForm";

type AuthControlsProps = {
  variant?: "header" | "footer";
};

export default function AuthControls({
  variant = "header",
}: Readonly<AuthControlsProps>) {
  const isFooter = variant === "footer";
  const t = useTranslations("auth");
  const { data: session, isPending } = authClient.useSession();
  const [isSignInFormOpen, setIsSignInFormOpen] = useState(false);

  if (isPending) {
    return null;
  }

  if (!session) {
    return (
      <>
        <button
          type="button"
          className={
            isFooter
              ? "group inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              : "group flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.08)] transition-all hover:scale-105 hover:border-cyan-300/60 hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          }
          onClick={() => setIsSignInFormOpen(true)}
          aria-label={t("signIn")}
          title={t("signIn")}
        >
          <span
            className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isFooter ? "footer-icon" : "text-[20px]"}`}
          >
            login
          </span>
          {isFooter && <span>{t("signIn")}</span>}
        </button>
        <SignInForm
          open={isSignInFormOpen}
          onClose={() => setIsSignInFormOpen(false)}
        />
      </>
    );
  }

  return (
    <div
      className={
        isFooter
          ? "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs text-dark-text"
          : "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1"
      }
    >
      <Link
        href="/profile"
        className="group inline-flex items-center gap-1.5 rounded-lg px-1 text-slate-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label={t("myProfile")}
        title={t("myProfile")}
      >
        <span
          className={`material-symbols-outlined leading-none text-slate-200 ${isFooter ? "footer-icon" : ""}`}
          style={isFooter ? undefined : { fontSize: "20px" }}
          aria-hidden
        >
          account_circle
        </span>
        <span className={isFooter ? "" : "hidden md:inline"}>
          {t("myProfile")}
        </span>
      </Link>
      <button
        type="button"
        className="group flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70"
        onClick={() => authClient.signOut()}
        aria-label={t("signOut")}
        title={t("signOut")}
      >
        <span
          className={`material-symbols-outlined transition-transform group-hover:translate-x-0.5 ${isFooter ? "footer-icon" : "text-[18px]"}`}
        >
          logout
        </span>
      </button>
    </div>
  );
}
