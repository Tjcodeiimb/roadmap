import clsx from "clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "card-shadow rounded-lg border-2 border-border bg-paper-2 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
