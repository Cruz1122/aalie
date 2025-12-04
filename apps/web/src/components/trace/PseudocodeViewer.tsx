"use client";

interface PseudocodeViewerProps {
  source: string;
  currentLine?: number;
}

export default function PseudocodeViewer({
  source,
  currentLine,
}: PseudocodeViewerProps) {
  const codeLines = source.split("\n");

  return (
    <div className="flex flex-col border-r border-slate-700 pr-4 overflow-hidden">
      <h3 className="text-sm font-semibold text-slate-300 mb-2 flex-shrink-0">
        Pseudocódigo
      </h3>
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <pre className="text-xs font-mono text-slate-300">
          {codeLines.map((line, idx) => {
            const lineNum = idx + 1;
            const isCurrentLine = currentLine !== undefined && lineNum === currentLine;
            return (
              <div
                key={idx}
                className={`px-2 py-1 ${
                  isCurrentLine
                    ? "bg-blue-500/30 border-l-2 border-blue-400"
                    : ""
                }`}
              >
                <span className="text-slate-500 mr-2">
                  {lineNum.toString().padStart(3, " ")}
                </span>
                <span>{line || " "}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

