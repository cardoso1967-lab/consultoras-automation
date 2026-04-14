import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-subtle rounded-md bg-surface-bright/50", className)}
      {...props}
    />
  );
}

export { Skeleton };
