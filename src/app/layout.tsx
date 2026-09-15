import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// A bold, geometric grotesque instead of the ubiquitous "AI product" Inter
// look — variable weight so headings can go heavy (800) while body copy
// stays readable at 400/500. Self-hosted via next/font, no external request.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "UpForge Learning",
  description: "UpForge Consulting — employee development platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  // No explicit choice yet (e.g. first-ever visit, before login) -> omit
  // data-theme entirely so prefers-color-scheme decides. Once someone
  // toggles the theme, we always know light vs dark for them specifically.
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : undefined;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
