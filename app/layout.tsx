import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Next App",
  description: "My App created with Next.js",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Next App",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}