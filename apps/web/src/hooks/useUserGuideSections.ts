import { useMemo } from "react";

import { UserGuideSection } from "@/types/user-guide";

/**
 * Hook que retorna las secciones de la guía de usuario.
 * Author: @Cruz1122
 * Version: 0.1.0
 */
export const useUserGuideSections = (): UserGuideSection[] => {
  return useMemo(
    () => [
      {
        id: "introduccion",
        titleKey: "introduccion",
        descriptionKey: "introDesc1",
        icon: "info",
        content: {
          blocks: [
            { type: "paragraph", textKey: "introDesc1" },
            { type: "paragraph", textKey: "introDesc2" },
            {
              type: "note",
              variant: "tip",
              titleKey: "introTip",
              preKey: "introTipDescPre",
              linkKey: "introTipDescLinkText",
              postKey: "introTipDescPost",
              href: "/examples",
            },
          ],
        },
      },
      {
        id: "editor-basico",
        titleKey: "editorBasico",
        descriptionKey: "editorBasicDesc",
        icon: "settings",
        content: {
          blocks: [
            { type: "paragraph", textKey: "editorBasicDesc" },
            {
              type: "list",
              items: [
                { icon: "check", textKey: "editorBasic1" },
                { icon: "check", textKey: "editorBasic2" },
                { icon: "check", textKey: "editorBasic3" },
                { icon: "check", textKey: "editorBasic4" },
                { icon: "check", textKey: "editorBasic5" },
              ],
            },
          ],
        },
      },
      {
        id: "editor-validacion",
        titleKey: "editorValidacion",
        descriptionKey: "editorValidDesc",
        icon: "verified",
        content: {
          blocks: [
            { type: "paragraph", textKey: "editorValidDesc" },
            {
              type: "list",
              items: [
                { icon: "error", textKey: "editorValid1" },
                { icon: "warning", textKey: "editorValid2" },
                { icon: "info", textKey: "editorValid3" },
                { icon: "info", textKey: "editorValid4" },
              ],
            },
            {
              type: "note",
              variant: "warning",
              titleKey: "editorValidNote",
              contentKey: "editorValidNoteDesc",
            },
          ],
        },
      },
      {
        id: "editor-atajos",
        titleKey: "editorAtajos",
        descriptionKey: "shortcut1",
        icon: "keyboard",
        content: {
          blocks: [
            {
              type: "table",
              headerKeys: ["shortcutShortcut", "shortcutAction"],
              rows: [
                { key: "Ctrl+S", labelKey: "shortcut1" },
                { key: "Ctrl+F", labelKey: "shortcut2" },
                { key: "Ctrl+H", labelKey: "shortcut3" },
                { key: "Ctrl+/", labelKey: "shortcut4" },
                { key: "Tab", labelKey: "shortcut5" },
                { key: "Shift+Tab", labelKey: "shortcut6" },
              ],
            },
          ],
        },
      },
      {
        id: "gramatica-procedimientos",
        titleKey: "gramaticaProcedimientos",
        descriptionKey: "gramProcDesc",
        icon: "functions",
        content: {
          blocks: [
            { type: "paragraph", textKey: "gramProcDesc" },
            {
              type: "code",
              code: `nombreProcedimiento(parametros) BEGIN
    sentencias...
END`,
            },
            { type: "paragraph", textKey: "gramProcTypes" },
            {
              type: "list",
              items: [
                {
                  icon: "check",
                  titleKey: "gramProcScalar",
                  codeSnippet: "factorial(n)",
                },
                {
                  icon: "check",
                  titleKey: "gramProcArrayDim",
                  codeSnippet: "buscar(A[n], x)",
                },
                {
                  icon: "check",
                  titleKey: "gramProcArrayRange",
                  codeSnippet: "ordenar(A[1]..[n])",
                },
                {
                  icon: "check",
                  titleKey: "gramProcTyped",
                  codeSnippet: "procesar(Lista lista)",
                },
              ],
            },
          ],
        },
      },
      {
        id: "gramatica-variables",
        titleKey: "gramaticaVariables",
        descriptionKey: "gramVarDesc",
        icon: "variable_add",
        content: {
          blocks: [
            { type: "paragraph", textKey: "gramVarDesc" },
            {
              type: "code",
              code: `variable <- expresion;    // Recomendado
variable := expresion;    // Estilo Pascal
variable 🡨 expresion;     // Unicode
variable ← expresion;     // Unicode
variable ⟵ expresion;     // Unicode`,
            },
            {
              type: "note",
              variant: "info",
              titleKey: "gramVarImportant",
              contentKey: "gramVarImportantDesc",
            },
          ],
        },
      },
      {
        id: "gramatica-estructuras",
        titleKey: "gramaticaEstructuras",
        descriptionKey: "gramStructIf",
        icon: "account_tree",
        content: {
          blocks: [
            {
              type: "subsection",
              titleKey: "gramStructIf",
              icon: "code",
              blocks: [
                {
                  type: "code",
                  code: `IF (condicion) THEN BEGIN
    sentencias...
END
ELSE BEGIN
    sentencias...
END`,
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "gramStructFor",
              icon: "loop",
              blocks: [
                {
                  type: "code",
                  code: `FOR variable <- inicio TO fin DO BEGIN
    sentencias...
END`,
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "gramStructWhile",
              icon: "repeat",
              blocks: [
                {
                  type: "code",
                  code: `WHILE (condicion) DO BEGIN
    sentencias...
END`,
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "gramStructRepeat",
              icon: "repeat_one",
              blocks: [
                {
                  type: "code",
                  code: `REPEAT
    sentencias...
UNTIL (condicion);`,
                },
              ],
            },
            {
              type: "note",
              variant: "warning",
              titleKey: "gramStructImportant",
              contentKey: "gramStructImportantDesc",
            },
          ],
        },
      },
      {
        id: "gramatica-operadores",
        titleKey: "gramaticaOperadores",
        descriptionKey: "gramOpExamples",
        icon: "calculate",
        content: {
          blocks: [
            {
              type: "table",
              headerKeys: ["gramOpType", "gramOpOps", "gramOpPrec"],
              rows: [
                {
                  typeKey: "gramOpArith",
                  ops: "+ - * / DIV MOD",
                  precKey: "gramOpPrecArith",
                },
                {
                  typeKey: "gramOpRel",
                  ops: "= != < > <= >=",
                  precKey: "gramOpPrecRel",
                },
                {
                  typeKey: "gramOpLog",
                  ops: "AND OR NOT",
                  precKey: "gramOpPrecLog",
                },
              ],
            },
            {
              type: "code",
              code: `resultado <- (a + b) * c;
es_valido <- (x > 0) AND (x < 100);
cociente <- total DIV cantidad;
resto <- total MOD cantidad;`,
            },
          ],
        },
      },
      {
        id: "gramatica-arrays",
        titleKey: "gramaticaArrays",
        descriptionKey: "gramArraysDesc",
        icon: "data_array",
        content: {
          blocks: [
            { type: "paragraph", textKey: "gramArraysDesc" },
            {
              type: "code",
              code: `// Declaración
A[10];              // Array de 10 elementos
matriz[5][5];       // Matriz 5x5

// Acceso
elemento <- A[i];
valor <- matriz[i][j];

// Asignación
A[i] <- valor;
matriz[i][j] <- A[i] + 1;`,
            },
          ],
        },
      },
      {
        id: "gramatica-print",
        titleKey: "gramaticaPrint",
        descriptionKey: "gramPrintDesc",
        icon: "print",
        content: {
          blocks: [
            { type: "paragraph", textKey: "gramPrintDesc" },
            {
              type: "code",
              code: `print("Hola mundo");
print("Total: ", resultado);
print("Valor de n: " + n);
print("Suma: ", a + b);

// Escapar comillas internas
print("Dijo \\"hola\\" y salió");`,
            },
            {
              type: "list",
              items: [
                {
                  icon: "check",
                  titleKey: "gramPrintLiteral",
                  descKey: "gramPrintLiteralDesc",
                },
                {
                  icon: "check",
                  titleKey: "gramPrintMulti",
                  descKey: "gramPrintMultiDesc",
                },
                {
                  icon: "check",
                  titleKey: "gramPrintExpr",
                  descKey: "gramPrintExprDesc",
                },
                {
                  icon: "check",
                  titleKey: "gramPrintEscape",
                  descKey: "gramPrintEscapeDesc",
                },
              ],
            },
            {
              type: "note",
              variant: "info",
              titleKey: "gramPrintNote",
              contentKey: "gramPrintNoteDesc",
            },
          ],
        },
      },
      {
        id: "analisis-editor",
        titleKey: "analisisEditor",
        descriptionKey: "analisisEditorDesc",
        icon: "code",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisEditorDesc" },
            {
              type: "list",
              numbered: true,
              items: [
                { titleKey: "analisisEditor1", descKey: "analisisEditor1b" },
                { titleKey: "analisisEditor2", descKey: "analisisEditor2b" },
                { titleKey: "analisisEditor3", descKey: "analisisEditor3b" },
                { titleKey: "analisisEditor4", descKey: "analisisEditor4b" },
              ],
            },
            {
              type: "note",
              variant: "tip",
              titleKey: "analisisEditorTip",
              contentKey: "analisisEditorTipDesc",
            },
          ],
        },
      },
      {
        id: "analisis-chatbot",
        titleKey: "analisisChatbot",
        descriptionKey: "analisisChatbotDesc",
        icon: "aalie",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisChatbotDesc" },
            {
              type: "list",
              numbered: true,
              items: [
                { titleKey: "analisisChatbot1", descKey: "analisisChatbot1b" },
                { titleKey: "analisisChatbot2", descKey: "analisisChatbot2b" },
                { titleKey: "analisisChatbot3", descKey: "analisisChatbot3b" },
                { titleKey: "analisisChatbot4", descKey: "analisisChatbot4b" },
              ],
            },
            {
              type: "note",
              variant: "advantage",
              titleKey: "analisisChatbotAdv",
              contentKey: "analisisChatbotAdvDesc",
            },
          ],
        },
      },
      {
        id: "analisis-resultados",
        titleKey: "analisisResultados",
        descriptionKey: "analisisResultDesc",
        icon: "insights",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisResultDesc" },
            {
              type: "list",
              items: [
                {
                  icon: "check",
                  titleKey: "analisisResult1",
                  descKey: "analisisResult1b",
                },
                {
                  icon: "check",
                  titleKey: "analisisResult2",
                  descKey: "analisisResult2b",
                },
                {
                  icon: "check",
                  titleKey: "analisisResult3",
                  descKey: "analisisResult3b",
                },
                { icon: "check", textKey: "analisisResult4a" },
                { icon: "check", textKey: "analisisResult4b" },
              ],
            },
            {
              type: "subsection",
              titleKey: "analisisModes",
              icon: "tune",
              blocks: [
                {
                  type: "subsection",
                  titleKey: "bestCase",
                  icon: "trending_up",
                  blocks: [
                    { type: "paragraph", textKey: "bestCaseDesc" },
                    {
                      type: "list",
                      items: [
                        { icon: "bullet", textKey: "bestCase1" },
                        { icon: "bullet", textKey: "bestCase2" },
                        { icon: "bullet", textKey: "bestCase3" },
                      ],
                    },
                    { type: "paragraph", textKey: "bestCaseExDesc" },
                  ],
                },
                {
                  type: "subsection",
                  titleKey: "worstCase",
                  icon: "trending_down",
                  variant: "error",
                  blocks: [
                    { type: "paragraph", textKey: "worstCaseDesc" },
                    {
                      type: "list",
                      items: [
                        { icon: "bullet", textKey: "worstCase1" },
                        { icon: "bullet", textKey: "worstCase2" },
                        { icon: "bullet", textKey: "worstCase3" },
                      ],
                    },
                    {
                      type: "paragraph",
                      titleKey: "worstCaseEx",
                      textKey: "worstCaseExDesc",
                    },
                  ],
                },
                {
                  type: "subsection",
                  titleKey: "avgCase",
                  icon: "show_chart",
                  variant: "info",
                  blocks: [
                    { type: "paragraph", textKey: "avgCaseDesc" },
                    {
                      type: "list",
                      items: [
                        { icon: "bullet", textKey: "avgCase1" },
                        { icon: "bullet", textKey: "avgCase2" },
                        { icon: "bullet", textKey: "avgCase3" },
                        { icon: "bullet", textKey: "avgCase4" },
                      ],
                    },
                    {
                      type: "paragraph",
                      titleKey: "avgCaseEx",
                      textKey: "avgCaseExDesc",
                    },
                  ],
                },
              ],
            },
            {
              type: "note",
              variant: "warning",
              titleKey: "analisisResultNote",
              contentKey: "analisisResultNoteDesc",
            },
          ],
        },
      },
      {
        id: "analisis-llm",
        titleKey: "analisisLlm",
        descriptionKey: "analisisLlmDesc",
        icon: "compare_arrows",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisLlmDesc" },
            {
              type: "list",
              items: [
                { icon: "check", textKey: "analisisLlm1" },
                { icon: "check", textKey: "analisisLlm2" },
                { icon: "check", textKey: "analisisLlm3" },
              ],
            },
            {
              type: "note",
              variant: "info",
              titleKey: "analisisLlmNote",
              contentKey: "analisisLlmNoteDesc",
            },
          ],
        },
      },
      {
        id: "analisis-gpu-cpu",
        titleKey: "analisisGpuCpu",
        descriptionKey: "analisisGpuDesc",
        icon: "memory",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisGpuDesc" },
            {
              type: "subsection",
              titleKey: "analisisGpuMetrics",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuRec",
                      descKey: "analisisGpuRecDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuBranch",
                      descKey: "analisisGpuBranchDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuLoops",
                      descKey: "analisisGpuLoopsDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuArrays",
                      descKey: "analisisGpuArraysDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuOps",
                      descKey: "analisisGpuOpsDesc",
                    },
                  ],
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "analisisGpuRecs",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuGpu",
                      descKey: "analisisGpuGpuDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuCpuLabel",
                      descKey: "analisisGpuCpuDesc",
                    },
                    {
                      icon: "bullet",
                      titleKey: "analisisGpuMix",
                      descKey: "analisisGpuMixDesc",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: "analisis-trace",
        titleKey: "analisisTrace",
        descriptionKey: "analisisTraceDesc",
        icon: "route",
        content: {
          blocks: [
            { type: "paragraph", textKey: "analisisTraceDesc" },
            {
              type: "subsection",
              titleKey: "analisisTraceIter",
              icon: "code",
              blocks: [
                {
                  type: "list",
                  items: [
                    { icon: "bullet", textKey: "analisisTraceIter1" },
                    { icon: "bullet", textKey: "analisisTraceIter2" },
                    { icon: "bullet", textKey: "analisisTraceIter3" },
                    { icon: "bullet", textKey: "analisisTraceIter4" },
                  ],
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "analisisTraceRec",
              icon: "account_tree",
              blocks: [
                {
                  type: "list",
                  items: [
                    { icon: "bullet", textKey: "analisisTraceRec1" },
                    { icon: "bullet", textKey: "analisisTraceRec2" },
                    { icon: "bullet", textKey: "analisisTraceRec3" },
                    { icon: "bullet", textKey: "analisisTraceRec4" },
                  ],
                },
              ],
            },
            {
              type: "note",
              variant: "warning",
              titleKey: "analisisTraceNote",
              contentKey: "analisisTraceNoteDesc",
            },
          ],
        },
      },
      {
        id: "ejemplos",
        titleKey: "ejemplos",
        descriptionKey: "ejemplosDesc",
        icon: "lightbulb",
        content: {
          blocks: [
            { type: "paragraph", textKey: "ejemplosDesc" },
            {
              type: "subsection",
              titleKey: "ejemplo1",
              icon: "calculate",
              blocks: [
                {
                  type: "code",
                  code: `factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END`,
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "ejemplo2",
              icon: "search",
              blocks: [
                {
                  type: "code",
                  code: `busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END`,
                },
              ],
            },
            {
              type: "link",
              titleKey: "ejemplosMore",
              preKey: "ejemplosMoreDescPre",
              linkKey: "ejemplosMoreDescLinkText",
              postKey: "ejemplosMoreDescPost",
              href: "/examples",
            },
          ],
        },
      },
      {
        id: "errores",
        titleKey: "errores",
        descriptionKey: "errorUnexpected",
        icon: "bug_report",
        content: {
          blocks: [
            {
              type: "subsection",
              titleKey: "errorUnexpected",
              icon: "error",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      titleKey: "errorUnexpectedCause",
                      descKey: "errorUnexpectedCauseDesc",
                    },
                    {
                      titleKey: "errorUnexpectedSol",
                      descKey: "errorUnexpectedSolDesc",
                    },
                  ],
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "errorMissingBegin",
              icon: "error",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      titleKey: "errorUnexpectedCause",
                      descKey: "errorMissingBeginCause",
                    },
                    {
                      titleKey: "errorUnexpectedSol",
                      descKey: "errorMissingBeginSol",
                    },
                  ],
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "errorMissingSemicolon",
              icon: "error",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      titleKey: "errorUnexpectedCause",
                      descKey: "errorMissingSemicolonCause",
                    },
                    {
                      titleKey: "errorUnexpectedSol",
                      descKey: "errorMissingSemicolonSol",
                    },
                  ],
                },
              ],
            },
            {
              type: "subsection",
              titleKey: "errorApiUnavailable",
              icon: "warning",
              blocks: [
                {
                  type: "list",
                  items: [
                    {
                      titleKey: "errorUnexpectedCause",
                      descKey: "errorApiCause",
                    },
                    { titleKey: "errorUnexpectedSol", descKey: "errorApiSol" },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    [],
  );
};
