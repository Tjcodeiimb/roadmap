"use client";

import { useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { setTheme } from "@/app/actions/theme";

export function ThemeToggle({ initialTheme }: { initialTheme: "light" | "dark" }) {
  const [theme, setLocalTheme] = useState(initialTheme);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setLocalTheme(next);
    document.documentElement.dataset.theme = next;
    startTransition(() => {
      setTheme(next);
    });
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-paper-2 text-ink transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
