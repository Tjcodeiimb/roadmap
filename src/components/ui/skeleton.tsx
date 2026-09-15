import clsx from "clsx";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("animate-pulse rounded-md border-2 border-border bg-paper-3", className)} {...props} />;
}
