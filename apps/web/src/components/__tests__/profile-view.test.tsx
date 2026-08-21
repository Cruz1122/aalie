import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { mockUseSession } = vi.hoisted(() => ({ mockUseSession: vi.fn() }));

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: mockUseSession },
}));

describe("ProfileView", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: null,
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
  });

  it("displays the authenticated profile from the shared session store", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@ucaldas.edu.co",
          emailVerified: true,
          createdAt: "2026-08-19T12:00:00.000Z",
          role: "USER",
        },
      },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });

    render(<ProfileView />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
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
