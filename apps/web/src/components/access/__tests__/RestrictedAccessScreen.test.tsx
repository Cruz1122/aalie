import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInSocial = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());
const leaveApp = vi.hoisted(() => vi.fn());

vi.mock("@/lib/leave-app", () => ({
  leaveApp,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { social: signInSocial },
    signOut,
  },
}));

import RestrictedAccessScreen from "../RestrictedAccessScreen";

const messages = {
  accessGate: {
    restrictedTitle: "¡AALIE está en acceso restringido!",
    restrictedBody:
      "Inicia sesión con tu cuenta institucional para usar el software",
    signIn: "Iniciar sesión",
    signingIn: "Conectando con Google...",
    signInError: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    deniedTitle: "¡Lo sentimos!",
    deniedBody: "No haces parte de los usuarios seleccionados",
    deniedHelp:
      "Si crees que esto es un error, <contact>contáctanos</contact> o <signOut>cierra sesión</signOut>.",
    mailSubject: "AALIE acceso restringido",
    signOutError: "No se pudo cerrar sesión. Inténtalo de nuevo.",
  },
};

function renderScreen(mode: "login" | "denied") {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <RestrictedAccessScreen mode={mode} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  signInSocial.mockReset();
  signOut.mockReset();
  leaveApp.mockReset();
  signInSocial.mockResolvedValue({});
  signOut.mockResolvedValue({});
});

describe("RestrictedAccessScreen", () => {
  it("shows the institutional sign-in screen without site chrome", async () => {
    renderScreen("login");

    expect(
      screen.getByRole("heading", {
        name: "¡AALIE está en acceso restringido!",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Inicia sesión con tu cuenta institucional para usar el software",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: window.location.href,
    });
  });

  it("shows the rejection screen with contact and sign-out", async () => {
    renderScreen("denied");

    expect(
      screen.getByRole("heading", { name: "¡Lo sentimos!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No haces parte de los usuarios seleccionados"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contáctanos" })).toHaveAttribute(
      "href",
      "mailto:luzenith_g@ucaldas.edu.co?subject=AALIE%20acceso%20restringido",
    );

    fireEvent.click(screen.getByRole("button", { name: "cierra sesión" }));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledOnce();
      expect(leaveApp).toHaveBeenCalledWith("es");
    });
  });
});
