import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ちょっとだけRPG",
  description: "Phaser3+Next.jsで作成したちっちゃいRPG",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ちょっとだけRPG",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ズーム禁止
  viewportFit: "cover", // 全画面表示
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div style={{ fontFamily: 'MyRPGFont', opacity: 0, height: 0, overflow: 'hidden', position: 'absolute', pointerEvents: 'none' }}>.</div>
        {children}
      </body>
    </html>
  );
}