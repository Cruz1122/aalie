import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminNavProvider } from "@/components/AdminNav";
import Header from "@/components/Header";
import { NavigationProvider } from "@/contexts/NavigationContext";

const pathname = vi.hoisted(() => ({ current: "/" }));
const useSession = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname.current,
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

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession },
}));

const messages = {
  nav: {
    home: "Inicio",
    analyzer: "Analizador",
    examples: "Ejemplos",
    course: "Curso",
    about: "Acerca de",
    openMenu: "Abrir menú",
    howToUse: "Cómo usar",
    quizzes: "Quizzes",
    management: "Gestión",
  },
};

function renderHeader(isAdmin = false) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AdminNavProvider isAdmin={isAdmin}>
        <NavigationProvider>
          <Header />
        </NavigationProvider>
      </AdminNavProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  pathname.current = "/";
  useSession.mockReset();
  useSession.mockReturnValue({ data: null, isPending: false });
});

describe("Header navigation", () => {
  it("keeps the quizzes tab for students", () => {
    useSession.mockReturnValue({
      data: { user: { role: "USER" } },
      isPending: false,
    });

    renderHeader();

    const quizzes = screen.getAllByRole("link", { name: "Quizzes" });
    expect(quizzes[0]).toHaveAttribute("href", "/quizzes");
    expect(
      screen.queryByRole("link", { name: "Gestión" }),
    ).not.toBeInTheDocument();
  });

  it("replaces quizzes with the traceability panel for administrators", () => {
    useSession.mockReturnValue({
      data: { user: { role: "ADMIN" } },
      isPending: false,
    });

    renderHeader();

    const management = screen.getAllByRole("link", { name: "Gestión" });
    expect(management[0]).toHaveAttribute("href", "/admin/research");
    expect(
      screen.queryByRole("link", { name: "Quizzes" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Gestión for an operator when the client session has no role", () => {
    useSession.mockReturnValue({
      data: { user: { email: "juan.cruz37552@ucaldas.edu.co" } },
      isPending: false,
    });

    renderHeader();

    expect(screen.getAllByRole("link", { name: "Gestión" })[0]).toHaveAttribute(
      "href",
      "/admin/research",
    );
  });

  it("keeps Gestión after navigation when the server already knows the admin", () => {
    pathname.current = "/analyzer";

    renderHeader(true);

    const management = screen.getAllByRole("link", { name: "Gestión" });
    expect(management[0]).toHaveAttribute("href", "/admin/research");
    expect(management[0].className).not.toContain("border-white/55");
  });

  it("marks Gestión active when the current route is the panel", () => {
    pathname.current = "/es/admin/research";
    useSession.mockReturnValue({
      data: { user: { role: "ADMIN" } },
      isPending: false,
    });

    renderHeader();

    expect(
      screen.getAllByRole("link", { name: "Gestión" })[0].className,
    ).toContain("border-white/55");
  });
});
