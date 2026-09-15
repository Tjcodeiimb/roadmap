import clsx from "clsx";

// Shared border/shadow treatment for a text field's container — mirrors
// buttonClassName's pattern (a className helper, not a wrapping component,
// since call sites need to compose an icon + <input>/<textarea> inside).
// Thick ink border, sharp corner, and the accent focus-visible ring from
// globals.css carries through automatically since it's a real :focus-visible
// selector on the input itself, not something this class needs to redo.
export function inputWrapperClassName(className?: string) {
  return clsx(
    "flex items-center gap-2 rounded-sm border-2 border-ink bg-paper px-3.5 py-2.5 focus-within:shadow-[3px_3px_0_0_var(--brutal-shadow)]",
    className
  );
}

export function inputFieldClassName(className?: string) {
  return clsx("w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-3", className);
}
