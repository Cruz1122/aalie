import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthControls from "@/components/AuthControls";

const { mockSignInSocial, mockSignOut, mockUseSession, mockReplace } =
  vi.hoisted(() => ({
    mockSignInSocial: vi.fn(),
    mockSignOut: vi.fn(),
    mockUseSession: vi.fn(),
    mockReplace: vi.fn(),
  }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        signIn: "Sign in",
        myProfile: "My profile",
        formTitle: "Sign in",
        formDescription: "Choose a provider",
        closeForm: "Close sign-in form",
        benefitsTitle: "Benefits of signing in",
        benefitUsageLabel: "Higher usage limits",
        benefitUsageDescription: "Use AALIE with higher limits.",
        benefitCourseLabel: "Course progress",
        benefitCourseDescription: "Keep your learning progress.",
        benefitQuizLabel: "Quiz tracking",
        benefitQuizDescription: "Save and review your attempts.",
        signInGoogle: "Sign in with Google",
        submitting: "Connecting to Google...",
        signOut: "Sign out",
        oauthError: "Sign-in failed.",
        signOutError: "Sign-out failed.",
      }) as Record<string, string>
    )[key] ?? key,
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
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    signIn: { social: mockSignInSocial },
    signOut: mockSignOut,
  },
}));

describe("AuthControls", () => {
  beforeEach(() => {
    mockSignInSocial.mockReset();
    mockSignOut.mockReset();
    mockReplace.mockReset();
    mockUseSession.mockReturnValue({ data: null, isPending: false });
  });

  it("renders nothing while the session is loading", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });

    const { container } = render(<AuthControls variant="footer" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("links an authenticated user to their profile", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          image: null,
        },
      },
      isPending: false,
    });

    render(<AuthControls variant="footer" />);

    const profileLink = screen.getByRole("link", { name: "My profile" });

    expect(profileLink).toHaveAttribute("href", "/profile");
    expect(profileLink.querySelector(".material-symbols-outlined")).toHaveClass(
      "footer-icon",
    );
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });

  it("waits for sign-out and reports an API error", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Ada", email: "ada@example.com" } },
      isPending: false,
    });
    let resolveSignOut: (value: { error: { message: string } }) => void;
    mockSignOut.mockReturnValue(
      new Promise((resolve) => {
        resolveSignOut = resolve;
      }),
    );

    render(<AuthControls variant="footer" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.getByRole("button", { name: "Sign out" })).toBeDisabled();
    resolveSignOut!({ error: { message: "Unavailable" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign-out failed.",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to home after a successful sign-out", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Ada", email: "ada@example.com" } },
      isPending: false,
    });
    mockSignOut.mockResolvedValue({ error: null });

    render(<AuthControls variant="footer" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("opens the sign-in form without calling the authentication API", () => {
    render(<AuthControls variant="footer" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignInSocial).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose a provider")).toHaveClass(
      "whitespace-normal",
      "sm:whitespace-nowrap",
    );
    expect(screen.getByText("Benefits of signing in")).toBeInTheDocument();
    expect(screen.getByText("Course progress")).toBeInTheDocument();
    expect(screen.getByText("Quiz tracking")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
  });

  it("calls the authentication API only when the form is submitted", async () => {
    mockSignInSocial.mockResolvedValue({ error: null });
    render(<AuthControls variant="footer" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with Google" }),
    );

    await waitFor(() => {
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: window.location.href,
      });
    });
    expect(
      screen.getByRole("button", { name: "Connecting to Google..." }),
    ).toBeDisabled();
  });

  it("shows validation errors returned by the authentication API", async () => {
    mockSignInSocial.mockResolvedValue({ error: { message: "Unauthorized" } });
    render(<AuthControls variant="footer" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with Google" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign-in failed.",
    );
  });
});
