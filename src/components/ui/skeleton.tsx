import clsx from "clsx";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("animate-pulse rounded-lg bg-paper-3", className)} {...props} />;
}
