import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { ClassroomRoster } from "@/components/research/ClassroomRoster";

const messages = {
  classroom: {
    student: "Estudiante",
    lastActivity: "Última actividad",
    analysis: "Análisis",
    traces: "Trazas",
    quizzes: "Quizzes",
    assistant: "Asistente",
    view: "Ver",
    back: "Volver",
    emptyActivity: "Todavía no hay actividad.",
    empty: {
      title: "Todavía no hay actividad",
    },
    loadError: {
      title: "No se pudo cargar la actividad",
      retry: "Intentar de nuevo",
    },
    when: "Fecha",
    action: "Acción",
    result: "Resultado",
    ok: "Sí",
    failed: "No",
    error: "No se pudo cargar la actividad.",
    kinds: {
      analysis: "Análisis",
      trace: "Traza",
      quiz: "Quiz",
      export: "Exportación",
      assistant: "Asistente",
    },
  },
  errorPages: {
    notFound: {
      eyebrow: "PÁGINA NO ENCONTRADA",
      title: "No encontramos lo que buscabas",
      homeLabel: "Volver al inicio",
    },
  },
};

describe("Classroom roster", () => {
  it("shows the study title and the selected student's actions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/roster")) {
          return new Response(
            JSON.stringify([
              {
                email: "jacobo.arroyave46095@ucaldas.edu.co",
                lastActivityAt: "2026-10-09T15:00:00.000Z",
                analysis: 2,
                traces: 1,
                quizzes: 0,
                assistant: 0,
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify([
            {
              occurredAt: "2026-10-09T15:00:00.000Z",
              kind: "analysis",
              success: true,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <ClassroomRoster />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "2026-2" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("jacobo.arroyave46095@ucaldas.edu.co"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver" }));

    expect(await screen.findByText("Sí")).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Estudiante" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(
      await screen.findByRole("heading", { name: "2026-2" }),
    ).toBeInTheDocument();
  });

  it("replaces the table with the empty state when the student has no activity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/roster")) {
          return new Response(
            JSON.stringify([
              {
                email: "jacobo.arroyave46095@ucaldas.edu.co",
                lastActivityAt: null,
                analysis: 0,
                traces: 0,
                quizzes: 0,
                assistant: 0,
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <ClassroomRoster />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ver" }));

    expect(
      await screen.findByRole("heading", { name: "Todavía no hay actividad" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sin actividad")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "2026-2" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });
});
