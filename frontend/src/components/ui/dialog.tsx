"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
  titleId: string;
  descId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog subcomponents must be wrapped within a <Dialog />");
  }
  return context;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnEsc?: boolean;
}

const emptySubscribe = () => () => {};

export function Dialog({
  open,
  onClose,
  children,
  closeOnEsc = true,
}: DialogProps) {
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const titleId = React.useId();
  const descId = React.useId();

  // Handle ESC key listener
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!isClient || !open) return null;

  return createPortal(
    <DialogContext.Provider value={{ open, onClose, titleId, descId }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {children}
      </div>
    </DialogContext.Provider>,
    document.body
  );
}

export interface DialogOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  closeOnClick?: boolean;
}

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, closeOnClick = true, onClick, ...props }, ref) => {
    const { onClose } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnClick) {
        onClose();
      }
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in",
          className
        )}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = "DialogOverlay";

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      size = "md",
      showCloseButton = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const { onClose } = useDialogContext();

    const sizeStyles = {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-[95vw] max-h-[95vh]",
    };

    return (
      <div
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className={cn(
          "relative z-50 w-full rounded-xl bg-white p-6 shadow-xl border border-[#d1d6da] transition-all duration-200 animate-in fade-in zoom-in-95",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-md p-1.5 text-[#737475] hover:text-[#252525] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader";

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2
      id={titleId}
      className={cn(
        "text-lg font-bold text-[#252525] leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}
DialogTitle.displayName = "DialogTitle";

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useDialogContext();
  return (
    <p
      id={descId}
      className={cn("text-sm text-[#737475] mt-1", className)}
      {...props}
    />
  );
}
DialogDescription.displayName = "DialogDescription";

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6",
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";
