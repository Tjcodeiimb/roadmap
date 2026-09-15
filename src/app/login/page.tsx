import { cookies } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";
import { FloatingShapes } from "@/components/auth/floating-shapes";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Reveal } from "@/components/ui/reveal";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = cookieTheme === "dark" ? "dark" : "light";

  return (
    <div className="relative flex min-h-screen flex-1 flex-col md:flex-row">
      <div className="fixed right-4 z-20" style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <ThemeToggle initialTheme={theme} />
      </div>

      {/* Brand panel — deliberately theme-independent (--login-bg/--login-ink)
          so this half always reads as the bold brand moment regardless of
          light/dark; the form panel beside it is fully theme-aware. */}
      <div
        className="bg-grid relative flex min-h-[42vh] flex-col overflow-hidden px-6 py-10 md:min-h-screen md:w-1/2 md:px-14 md:py-16"
        style={{ backgroundColor: "var(--login-bg)" }}
      >
        <FloatingShapes />
        <BrandPanel />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-paper px-4 py-12 md:w-1/2">
        <Reveal index={0} className="w-full max-w-sm">
          <div className="mb-6 text-center md:hidden">
            <h2 className="font-display text-xl font-bold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-ink-2">Use the email your admin invited you at.</p>
          </div>
          <div className="card-shadow rounded-md border-2 border-ink bg-paper-2 p-6">
            <LoginForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
