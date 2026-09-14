import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
