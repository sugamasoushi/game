import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* 基本設定 */
  devIndicators: false,

  /* 静的エクスポート設定 (これで out フォルダが作成されます) */
  //output: "export",

  /* 画像最適化の無効化 (export時は必須) */
  images: { unoptimized: true },

  trailingSlash: true,

  /* Turbopack / 実験的機能の設定 */
  experimental: {
    turbo: {
      resolveAlias: {},
      rules: {},
    },
  },
};

<<<<<<< HEAD
export default withPWA(nextConfig);
=======
export default nextConfig;
>>>>>>> ca62d011e9bf802e4894b924b53abc3ddc5c9e7b
