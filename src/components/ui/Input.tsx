import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
  }

const Input = ({ className, type, icon, ...props }: InputProps) => {
  return (
    <div className="relative flex items-center group w-full">
      {icon && (
        <div className="absolute left-3 text-foreground/40 group-focus-within:text-primary transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-surface-dim px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
};

export { Input };
