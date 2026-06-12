import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "elmatic — Konfigurator",
  description:
    "Konfigurator komputerów przemysłowych elmatic (Panel / Box / Rack PC)",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body
        className={inter.className}
        suppressHydrationWarning
      >
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
      </body>
    </html>
  );
}
