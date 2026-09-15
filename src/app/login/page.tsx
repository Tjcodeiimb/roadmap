import { LoginForm } from "@/components/auth/login-form";
import { FloatingShapes } from "@/components/auth/floating-shapes";

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-16"
      style={{ backgroundColor: "var(--login-bg)" }}
    >
      <FloatingShapes />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-ink bg-accent text-lg font-extrabold text-accent-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]">
            UF
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--login-ink)" }}>
            UpForge Learning
          </h1>
          <p className="mt-2 text-sm font-bold" style={{ color: "var(--login-ink)", opacity: 0.75 }}>
            Sign in with the email your admin invited you at.
          </p>
        </div>
        <div className="card-shadow rounded-md border-2 border-ink bg-paper-2 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
