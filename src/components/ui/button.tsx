import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  secondary: "bg-paper-2 text-ink border border-border hover:bg-paper-3",
  ghost: "bg-transparent text-ink hover:bg-paper-2",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2",
};

// Shared with any element that needs to *look* like a button without
// literally being a nested <button> — e.g. a <Link> styled as a button.
// A <button> inside an <a> is invalid HTML, so those cases render this
// className directly on the Link instead of wrapping the Button component.
export function buttonClassName(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return <button ref={ref} className={buttonClassName(variant, size, className)} {...props} />;
  }
);
Button.displayName = "Button";
