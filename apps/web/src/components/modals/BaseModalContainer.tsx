"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BaseModalContainerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  titleIcon?: string;
  titleIconClassName?: string;
  closeAriaLabel?: string;
  sizeClassName?: string;
  zIndexClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  lockBodyScroll?: boolean;
}

const DEFAULT_SIZE = "w-[min(95vw,1000px)] max-h-[75vh]";

export default function BaseModalContainer({
  open,
  onClose,
  children,
  title,
  titleIcon,
  titleIconClassName = "text-blue-400",
  closeAriaLabel = "Close modal",
  sizeClassName = DEFAULT_SIZE,
  zIndexClassName = "z-50",
  panelClassName = "",
  headerClassName = "",
  contentClassName = "",
  contentProps,
  showHeader = true,
  showCloseButton = true,
  closeOnOverlay = true,
  lockBodyScroll = true,
}: Readonly<BaseModalContainerProps>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    if (lockBodyScroll) {
      document.body.style.overflow = "hidden";
    }

    document.addEventListener("keydown", onKey);

    return () => {
      if (lockBodyScroll) {
        document.body.style.overflow = previousOverflow;
      }
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, lockBodyScroll]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center`}
    >
      <div
        className="absolute inset-0 glass-modal-overlay"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden
      />
      <div
        className={`relative z-10 ${sizeClassName} rounded-2xl glass-modal-container shadow-2xl flex flex-col overflow-hidden mx-4 ${panelClassName}`}
      >
        {showHeader && (
          <div
            className={`flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0 glass-modal-header ${headerClassName}`}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {titleIcon ? (
                <span
                  className={`material-symbols-outlined ${titleIconClassName}`}
                >
                  {titleIcon}
                </span>
              ) : null}
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                aria-label={closeAriaLabel}
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div
          className={`flex-1 overflow-y-auto p-6 scrollbar-custom ${contentClassName}`}
          {...contentProps}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
