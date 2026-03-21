import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. 外部設定のインポート
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 2. 全体的な無視設定（これ単体で1つのオブジェクトにする）
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".vscode/**",
      "out/**",
      "public/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // 3. ルールのカスタマイズ
  {
    files: ["**/*.ts", "**/*.tsx"], // 対象ファイルを明示
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // ここを "error" にすればビルドが止まる
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;