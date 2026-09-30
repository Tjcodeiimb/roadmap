import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
  strokeWidth?: number;
  title?: string;
}

// Every icon in this set is stroke-only geometry on a 24x24 grid, so it
// inherits text color, scales crisply, and can be animated by stroke
// (framer-motion `pathLength`). The explicit `size` prop is deliberate:
// these replaced emoji, which were sized by font-size and would otherwise
// render at 0.
export function IconBase({
  size = 24,
  strokeWidth = 1.5,
  title,
  children,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
