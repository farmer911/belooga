import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  id?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  id,
  error,
  helperText,
  required = false,
  optional = false,
  className,
  children,
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={fieldId}
            className="block text-xs font-semibold uppercase tracking-wider text-typography-heading"
          >
            {label}
            {required && <span className="text-status-danger ml-1" aria-hidden="true">*</span>}
          </label>
          {optional && (
            <span className="text-xs text-typography-muted font-normal">
              (Optional)
            </span>
          )}
        </div>
      )}

      <div>
        {React.isValidElement(children)
          ? React.cloneElement(
              children as React.ReactElement<Record<string, unknown>>,
              {
                id: (children.props as Record<string, unknown>).id || fieldId,
                error:
                  (children.props as Record<string, unknown>).error ??
                  Boolean(error),
                "aria-invalid": Boolean(error),
                "aria-describedby": error
                  ? errorId
                  : helperText
                  ? helperId
                  : (children.props as Record<string, unknown>)[
                      "aria-describedby"
                    ],
              }
            )
          : children}
      </div>

      {error ? (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-xs font-medium text-status-danger mt-1"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-typography-muted mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
