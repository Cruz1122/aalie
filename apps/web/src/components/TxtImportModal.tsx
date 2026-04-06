"use client";

import { createPortal } from "react-dom";

type TxtImportModalProps = {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function TxtImportModal({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Readonly<TxtImportModalProps>) {
  if (!open) {
    return null;
  }
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center glass-modal-overlay glass-modal-overlay-fixed modal-animate-in">
      <div className="glass-modal-container rounded-2xl shadow-xl max-w-2xl w-[92vw] flex flex-col m-4 modal-animate-in">
        <div className="glass-modal-header flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : onConfirm())}
            className="text-slate-400 hover:text-white text-3xl leading-none transition-colors hover:rotate-90 transform duration-200"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-200 leading-relaxed">
            {description}
          </p>
          {details && details.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <ul className="space-y-1 text-xs text-amber-100">
                {details.map((detail, index) => (
                  <li key={`${detail}-${index}`}>- {detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 rounded-b-2xl">
          {cancelLabel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="glass-secondary px-5 py-2.5 text-sm font-semibold text-slate-200 rounded-lg transition-all hover:scale-105"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 bg-gradient-to-br from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-cyan-500/30"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
