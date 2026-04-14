import * as React from "react";
import { cn } from "../../lib/utils";
import { XCircle, X } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    onClear?: () => void;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, onClear, value, ...props }, ref) => {
    const hasValue = value && value.toString().length > 0;

    return (
      <div className="relative flex items-center group w-full">
        {icon && (
          <div className="absolute left-3 text-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          value={value}
          className={cn(
            "flex h-10 w-full rounded-md border border-border bg-surface-dim px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            icon && "pl-10",
            onClear && hasValue && "pr-10",
            className
          )}
          {...props}
        />
        {onClear && hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-foreground/20 hover:text-foreground/60 hover:bg-surface transition-all animate-fade-in group/clear"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} className="transition-transform group-hover/clear:rotate-90 group-hover/clear:scale-125" />
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
