import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* 基本設定 */
  devIndicators: false,

  /* 静的エクスポート設定 (これで out フォルダが作成されます) */
  output: "export",

  /* 画像最適化の無効化 (export時は必須) */
  images: { unoptimized: true },

  /* Turbopack / 実験的機能の設定 */
  experimental: {
    turbo: {
      resolveAlias: {},
      rules: {},
    },
  },
};

export default nextConfig;