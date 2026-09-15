import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Flat, fully-saturated fills with a thick black/ink outline — no soft
// hover fades. Every variant keeps the same border so the shape reads
// consistently; only fill and text color change.
const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink border-2 border-ink",
  secondary: "bg-paper-2 text-ink border-2 border-ink hover:bg-paper-3",
  ghost: "bg-transparent text-ink border-2 border-transparent hover:border-ink",
  danger: "bg-danger text-white border-2 border-ink",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm font-bold rounded-md gap-1.5",
  md: "h-10 px-4 text-sm font-bold rounded-md gap-2",
  lg: "h-12 px-6 text-base font-extrabold rounded-md gap-2",
};

// Shared with any element that needs to *look* like a button without
// literally being a nested <button> — e.g. a <Link> styled as a button.
// A <button> inside an <a> is invalid HTML, so those cases render this
// className directly on the Link instead of wrapping the Button component.
export function buttonClassName(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "press-sm inline-flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none",
    variant !== "ghost" && "shadow-[4px_4px_0_0_var(--brutal-shadow)]",
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
