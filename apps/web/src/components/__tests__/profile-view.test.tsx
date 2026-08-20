import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProfileView from "@/components/ProfileView";

const translations: Record<string, string> = {
  loading: "Loading your profile...",
  verifiedEmail: "Verified email",
  universityBadge: "University of Caldas",
  "privacy.body": "Your account data is handled according to our",
  "privacy.action": "Privacy Policy.",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ProfileView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and displays the authenticated profile from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@ucaldas.edu.co",
          emailVerified: true,
          createdAt: "2026-08-19T12:00:00.000Z",
          role: "USER",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfileView />);

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(screen.getByText("ada@ucaldas.edu.co")).toBeInTheDocument();
    const verifiedBadge = screen.getByRole("img", {
      name: "Verified email",
    });
    const universityBadge = screen.getByRole("img", {
      name: "University of Caldas",
    });

    expect(verifiedBadge.parentElement?.className).toBe(
      universityBadge.parentElement?.className,
    );
    expect(
      screen.getByRole("link", { name: "Privacy Policy." }),
    ).toHaveAttribute("href", "/privacy");
  });
});
