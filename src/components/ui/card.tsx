import clsx from "clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "card-shadow rounded-2xl border border-border bg-paper-2 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
