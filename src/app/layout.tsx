import type { Metadata } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// A bold, geometric grotesque instead of the ubiquitous "AI product" Inter
// look — variable weight so headings can go heavy (800) while body copy
// stays readable at 400/500. Self-hosted via next/font, no external request.
// No `weight` array: Archivo is a variable font, and listing weights made
// next/font ship six static cuts instead of one file with the full axis.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
});

// The stat numerals (completion %, XP, @usernames) were styled `font-mono`
// with no mono family loaded, so they fell back to whatever the OS supplied —
// SF Mono, Consolas or DejaVu depending on the machine. Space Mono is wide and
// slab-ish, which suits the brutalist numerals.
const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
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
      className={`${archivo.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
