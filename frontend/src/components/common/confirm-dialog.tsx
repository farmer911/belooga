"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading: controlledLoading,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = controlledLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onClose={isLoading ? () => {} : onClose}>
      <DialogOverlay closeOnClick={!isLoading} />
      <DialogContent size="sm" showCloseButton={!isLoading}>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              isDestructive
                ? "bg-red-100 text-red-600"
                : "bg-[#d7ecea] text-[#21655e]"
            )}
          >
            {isDestructive ? (
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Info className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1">
            <DialogHeader className="mb-2 space-y-1">
              <DialogTitle className="text-base font-semibold text-[#252525]">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#737475]">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="mt-6 flex-row justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm text-[#515151]"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "text-sm font-medium",
              !isDestructive && "bg-[#5bbbae] hover:bg-[#497d76] text-white"
            )}
          >
            {isLoading ? (
              <>
                <Spinner size="xs" variant="white" className="mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
