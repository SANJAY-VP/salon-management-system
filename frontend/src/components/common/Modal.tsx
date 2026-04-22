import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, title, children, onClose, footer, size = "md" }: ModalProps) {
  const titleId = useId();
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  }[size];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus the close button when modal opens (keyboard accessibility)
      requestAnimationFrame(() => firstFocusRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md animate-fade-in transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Container */}
        <div
          className={`relative bg-[#161616] border border-white/[0.08] rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.9)] ${maxWidthClass} w-full overflow-hidden animate-fade-up text-left sm:my-8`}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-gold/[0.03] blur-[60px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-white/[0.05]">
            <h2
              id={titleId}
              className="text-xl font-black text-white uppercase tracking-tight"
            >
              {title}
            </h2>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
              aria-label="Close dialog"
            >
              <Icon icon="times" size={16} />
            </button>
          </div>

          {/* Body */}
          <div
            className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide"
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-white/[0.05] p-8 bg-white/[0.01]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="text-white/60 text-base font-medium leading-relaxed mb-10">{message}</p>
      <div className="flex gap-4">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={isDangerous ? "danger" : "primary"} fullWidth onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
